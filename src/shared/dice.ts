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
  total: number;
}

// Критическое попадание: кубов вдвое больше, бонус тот же.
export function rollDamage(expr: DiceExpr, crit = false): DamageRoll {
  const rolls = expr.dice.map((d) => Array.from({ length: d.count * (crit ? 2 : 1) }, () => die(d.sides)));
  const total = Math.max(0, rolls.flat().reduce((a, b) => a + b, 0) + expr.bonus);
  return { expr, rolls, crit, total };
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
