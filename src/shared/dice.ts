// Кубы: разбор записи «2d6+5» (и «2к6 + 5») и броски. Только чистые функции, случайность — crypto.

export interface DiceTerm {
  count: number;
  sides: number;
}
export interface DiceExpr {
  dice: DiceTerm[];
  bonus: number;
}

const TERM = /([+\-−]?)\s*(\d*)\s*[dдкk]\s*(\d+)|([+\-−])\s*(\d+)/giu;

// «2d6+5», «1d8 + 1d6 − 1», «2к6+3 рубящий». null — кубов в записи нет.
export function parseDice(text: string): DiceExpr | null {
  const dice: DiceTerm[] = [];
  let bonus = 0;
  for (const m of text.matchAll(TERM)) {
    if (m[3]) {
      if (m[1] === '-' || m[1] === '−') continue; // «−1d4» в уроне не бывает, не гадаем
      dice.push({ count: Math.min(100, Number(m[2] || 1)), sides: Number(m[3]) });
    } else if (dice.length) {
      bonus += (m[4] === '+' ? 1 : -1) * Number(m[5]);
    }
  }
  return dice.length && dice.every((d) => d.count > 0 && d.sides > 0) ? { dice, bonus } : null;
}

// Бонус к броску в начале записи: «+5», «−1», «+3 (СЛ 13)», 4. null — бонуса нет («СЛ 13» — это спасбросок цели).
export function parseBonus(text: string | number): number | null {
  if (typeof text === 'number') return text;
  const m = text.match(/^\s*([+\-−]?)\s*(\d+)/);
  return m ? (m[1] === '-' || m[1] === '−' ? -1 : 1) * Number(m[2]) : null;
}

export const diceText = (e: DiceExpr) =>
  e.dice.map((d) => `${d.count}d${d.sides}`).join(' + ') + (e.bonus ? (e.bonus > 0 ? ` + ${e.bonus}` : ` − ${-e.bonus}`) : '');

export function die(sides: number): number {
  const buf = new Uint32Array(1);
  // Отбрасываем хвост, чтобы все грани были равновероятны.
  const limit = Math.floor(0x100000000 / sides) * sides;
  do crypto.getRandomValues(buf);
  while (buf[0]! >= limit);
  return (buf[0]! % sides) + 1;
}

export type D20Mode = 'normal' | 'advantage' | 'disadvantage';

export interface D20Roll {
  rolls: number[];
  mode: D20Mode;
  natural: number;
  bonus: number;
  total: number;
}

export function rollD20(bonus: number, mode: D20Mode = 'normal'): D20Roll {
  const rolls = mode === 'normal' ? [die(20)] : [die(20), die(20)];
  const natural = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls[0]!;
  return { rolls, mode, natural, bonus, total: natural + bonus };
}

export interface DamageRoll {
  expr: DiceExpr;
  // Выпавшие грани по каждому кубу записи.
  rolls: number[][];
  crit: boolean;
  // A critical hit doubles the whole damage (Pathfinder 2e), not the dice.
  doubled?: boolean;
  total: number;
}

// Критическое попадание: кубов вдвое больше, бонус тот же (D&D) — or, `double: 'total'`, the whole damage twice
// (Pathfinder 2e).
export function rollDamage(expr: DiceExpr, crit = false, double: 'dice' | 'total' = 'dice'): DamageRoll {
  const twice = crit && double === 'total';
  const rolls = expr.dice.map((d) => Array.from({ length: d.count * (crit && !twice ? 2 : 1) }, () => die(d.sides)));
  const sum = Math.max(0, rolls.flat().reduce((a, b) => a + b, 0) + expr.bonus);
  return { expr, rolls, crit, ...(twice ? { doubled: true } : {}), total: twice ? sum * 2 : sum };
}

// Degrees of success (Pathfinder 2e): beat the DC by 10 — a critical success, miss it by 10 — a critical failure;
// a natural 20 is one degree better, a natural 1 one worse.
export type Degree = 'critical' | 'success' | 'failure' | 'fumble';
const DEGREES: Degree[] = ['fumble', 'failure', 'success', 'critical'];
export function degreeOf(total: number, natural: number, dc: number): Degree {
  let i = total >= dc + 10 ? 3 : total >= dc ? 2 : total <= dc - 10 ? 0 : 1;
  if (natural === 20) i = Math.min(3, i + 1);
  if (natural === 1) i = Math.max(0, i - 1);
  return DEGREES[i]!;
}

// Кубы Fate (4dF): у каждого грани −1, 0, +1 (по две). Итог — сумма граней и бонуса (навыка).
export interface FateRoll {
  faces: number[];
  bonus: number;
  total: number;
}

export function rollFate(bonus: number): FateRoll {
  const faces = Array.from({ length: 4 }, () => Math.ceil(die(6) / 2) - 2);
  return { faces, bonus, total: faces.reduce((a, b) => a + b, 0) + bonus };
}

// Roll-under save (Mausritter): d20 ≤ the attribute succeeds. Advantage — the lower of 2d20, disadvantage — the higher.
export interface SaveRoll {
  rolls: number[];
  mode: D20Mode;
  natural: number;
  target: number;
  success: boolean;
}

export function rollSave(target: number, mode: D20Mode = 'normal'): SaveRoll {
  const rolls = mode === 'normal' ? [die(20)] : [die(20), die(20)];
  const natural = mode === 'advantage' ? Math.min(...rolls) : mode === 'disadvantage' ? Math.max(...rolls) : rolls[0]!;
  return { rolls, mode, natural, target, success: natural <= target };
}

// Forged in the Dark: a pool of d6 — the highest counts (6 — full success, 4–5 — partial, 1–3 — bad, two sixes —
// critical). A pool of 0 — two dice, the lowest counts (and no critical).
export type PoolOutcome = 'critical' | 'success' | 'partial' | 'bad';
export interface PoolRoll {
  dice: number[];
  // Zero dots: 2d6, take the lowest.
  zero: boolean;
  result: number;
  outcome: PoolOutcome;
}

export function poolOutcome(dice: number[], zero: boolean): { result: number; outcome: PoolOutcome } {
  const result = zero ? Math.min(...dice) : Math.max(...dice);
  const sixes = dice.filter((d) => d === 6).length;
  const outcome: PoolOutcome = !zero && sixes >= 2 ? 'critical' : result === 6 ? 'success' : result >= 4 ? 'partial' : 'bad';
  return { result, outcome };
}

export function rollPool(n: number): PoolRoll {
  const zero = n <= 0;
  const dice = Array.from({ length: zero ? 2 : Math.min(10, n) }, () => die(6));
  return { dice, zero, ...poolOutcome(dice, zero) };
}

