// A new mouse by the Mausritter SRD: STR, DEX, WIL — 3d6, the two highest; HP and pips — d6 each, together they give
// the background and its two items; a weak mouse (best attribute 9 or less) rolls another background and takes item
// A or B, 7 or less — both. Plus torches, rations, a weapon, birthsign, coat and a physical detail.
// Pure functions: a mouse is indices into the tables, the text comes in the interface language (text.ts).
import { die } from '../../../shared/dice';
import { NAMES, WEAPONS } from './content';

export type Attr = 'str' | 'dex' | 'wil';

export interface Mouse {
  str: number;
  dex: number;
  wil: number;
  // The 3d6 rolled for each attribute (in the order str, dex, wil) — shown next to the score.
  rolls: [number[], number[], number[]];
  hp: number;
  pips: number;
  // Index of the background: (hp − 1) × 6 + (pips − 1).
  background: number;
  // A weak mouse's second background roll and what it takes from it.
  extra: { background: number; take: 'a' | 'b' | 'both' } | null;
  weapon: number;
  sign: number;
  color: number;
  pattern: number;
  // d66 as an index 0…35.
  detail: number;
  name: number;
}

type Roll = (sides: number) => number;
const pick = (n: number, roll: Roll) => roll(n) - 1;

// 3d6, keep the two highest.
function attribute(roll: Roll): { score: number; dice: number[] } {
  const dice = [roll(6), roll(6), roll(6)];
  const [a, b] = [...dice].sort((x, y) => y - x);
  return { score: a! + b!, dice };
}

export const bestAttribute = (m: Pick<Mouse, Attr>) => Math.max(m.str, m.dex, m.wil);

// Extra items for a weak mouse: 9 or less — one of the two, 7 or less — both.
export function extraFor(best: number, roll: Roll = die): Mouse['extra'] {
  if (best > 9) return null;
  const background = pick(36, roll);
  return { background, take: best <= 7 ? 'both' : roll(2) === 1 ? 'a' : 'b' };
}

export function generateMouse(roll: Roll = die): Mouse {
  const [s, d, w] = [attribute(roll), attribute(roll), attribute(roll)];
  const hp = roll(6);
  const pips = roll(6);
  const m: Mouse = {
    str: s.score,
    dex: d.score,
    wil: w.score,
    rolls: [s.dice, d.dice, w.dice],
    hp,
    pips,
    background: (hp - 1) * 6 + (pips - 1),
    extra: null,
    weapon: pick(WEAPONS.en.length, roll),
    sign: pick(6, roll),
    color: pick(6, roll),
    pattern: pick(6, roll),
    detail: pick(36, roll),
    name: pick(NAMES.en.length, roll),
  };
  m.extra = extraFor(bestAttribute(m), roll);
  return m;
}

// «You may then swap any two attributes» — the rolls move along; the extra items follow the best score (unchanged).
export function swap(m: Mouse, a: Attr, b: Attr): Mouse {
  const order: Attr[] = ['str', 'dex', 'wil'];
  const rolls = [...m.rolls] as Mouse['rolls'];
  const [i, j] = [order.indexOf(a), order.indexOf(b)];
  [rolls[i], rolls[j]] = [rolls[j]!, rolls[i]!];
  return { ...m, [a]: m[b], [b]: m[a], rolls };
}

export const rerollName = (m: Mouse, roll: Roll = die): Mouse => ({ ...m, name: pick(NAMES.en.length, roll) });
