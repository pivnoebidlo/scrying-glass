// The pure logic of the puzzles: ciphers, the order puzzle with one solution, the caskets with one solution.
import type { CipherKind, ClueType, InscriptionType } from './types';

export type Rand = () => number;
const pick = <T>(list: readonly T[], rand: Rand): T => list[Math.floor(rand() * list.length)]!;
export function shuffle<T>(list: readonly T[], rand: Rand): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// --- Ciphers -----------------------------------------------------------------------------------------------------

/** The text in the cipher's alphabet: upper case, Ё → Е, other signs dropped, single spaces. */
export function plainText(text: string, alphabet: string): string {
  return text.toUpperCase().replace(/Ё/g, 'Е').split('').filter((c) => c === ' ' || alphabet.includes(c)).join('').replace(/\s+/g, ' ').trim();
}

export function encipher(text: string, kind: CipherKind, alphabet: string, shift = 3): string {
  const plain = plainText(text, alphabet);
  const n = alphabet.length;
  const map = (f: (i: number) => number) => plain.split('').map((c) => (c === ' ' ? ' ' : alphabet[f(alphabet.indexOf(c))])).join('');
  switch (kind) {
    case 'reverse':
      return plain.split('').reverse().join('');
    case 'numbers':
      return plain.split(' ').map((w) => w.split('').map((c) => alphabet.indexOf(c) + 1).join('-')).join(' / ');
    case 'caesar':
      return map((i) => (i + shift) % n);
    case 'atbash':
      return map((i) => n - 1 - i);
  }
}

export function decipher(text: string, kind: CipherKind, alphabet: string, shift = 3): string {
  const n = alphabet.length;
  switch (kind) {
    case 'reverse':
      return text.split('').reverse().join('');
    case 'numbers':
      return text.split(' / ').map((w) => w.split('-').map((x) => alphabet[Number(x) - 1]).join('')).join(' ');
    case 'caesar':
      return text.split('').map((c) => (c === ' ' ? ' ' : alphabet[(alphabet.indexOf(c) - shift + n) % n])).join('');
    case 'atbash':
      return encipher(text, 'atbash', alphabet);
  }
}

// --- Order ---------------------------------------------------------------------------------------------------------

// A clue about an order: items by index, `k` — a place (0-based).
export interface Clue {
  type: ClueType;
  a: number;
  b?: number;
  k?: number;
}

/** Whether `order` (order[place] = item) fits the clue. */
export function fits(order: number[], c: Clue): boolean {
  const pos = (x: number) => order.indexOf(x);
  const pa = pos(c.a);
  const pb = c.b === undefined ? -1 : pos(c.b);
  const last = order.length - 1;
  switch (c.type) {
    case 'before':
      return pa < pb;
    case 'right':
      return pb === pa + 1;
    case 'adjacent':
      return Math.abs(pa - pb) === 1;
    case 'apart':
      return Math.abs(pa - pb) > 1;
    case 'at':
      return pa === c.k;
    case 'notAt':
      return pa !== c.k;
    case 'edge':
      return pa === 0 || pa === last;
    case 'inside':
      return pa !== 0 && pa !== last;
  }
}

export function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  return permutations(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}

/** The orders that fit every clue. */
export const solutions = (n: number, clues: Clue[]) => permutations(n).filter((o) => clues.every((c) => fits(o, c)));

// Every true clue about the order; `at` only on a hard level's last resort.
function trueClues(order: number[]): Clue[] {
  const n = order.length;
  const out: Clue[] = [];
  for (let a = 0; a < n; a++) {
    out.push({ type: fits(order, { type: 'edge', a }) ? 'edge' : 'inside', a });
    for (let k = 0; k < n; k++) out.push({ type: order[k] === a ? 'at' : 'notAt', a, k });
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      if (fits(order, { type: 'before', a, b })) out.push({ type: 'before', a, b });
      if (fits(order, { type: 'right', a, b })) out.push({ type: 'right', a, b });
      if (a < b) out.push({ type: fits(order, { type: 'adjacent', a, b }) ? 'adjacent' : 'apart', a, b });
    }
  }
  return out;
}

// How much a clue type is wanted: the relations are the puzzle, a place given outright is a crutch.
const WEIGHT: Record<ClueType, number> = { before: 3, right: 2, adjacent: 2, apart: 2, edge: 1.5, inside: 1.5, notAt: 1, at: 0.4 };

/** Clues that leave exactly one order — `order`; none of them is needless. */
export function orderClues(order: number[], rand: Rand, maxAt = 1): Clue[] {
  const n = order.length;
  const pool = trueClues(order)
    .map((c) => ({ c, w: -Math.log(rand() || 1e-9) / WEIGHT[c.type] }))
    .sort((x, y) => x.w - y.w)
    .map((x) => x.c);
  const clues: Clue[] = [];
  let left = permutations(n);
  for (const c of pool) {
    if (left.length === 1) break;
    if (c.type === 'at' && clues.filter((x) => x.type === 'at').length >= maxAt) continue;
    const next = left.filter((o) => fits(o, c));
    if (next.length < left.length) {
      clues.push(c);
      left = next;
    }
  }
  // Drop what the others already say.
  for (const c of shuffle(clues, rand)) {
    const rest = clues.filter((x) => x !== c);
    if (solutions(n, rest).length === 1) clues.splice(clues.indexOf(c), 1);
  }
  return shuffle(clues, rand);
}

// --- Caskets -------------------------------------------------------------------------------------------------------

// An inscription on casket `on` about casket `other`.
export interface Inscription {
  type: InscriptionType;
  on: number;
  other?: number;
}

// The truth of an inscription when the treasure is in `t` and `truth` says which inscriptions are true.
function says(s: Inscription, t: number, truth: boolean[]): boolean {
  switch (s.type) {
    case 'here':
      return t === s.on;
    case 'notHere':
      return t !== s.on;
    case 'there':
      return t === s.other;
    case 'notThere':
      return t !== s.other;
    case 'lies':
      return !truth[s.other!];
    case 'true':
      return truth[s.other!]!;
  }
}

/** Where the treasure can be, with which inscriptions true, when exactly `trueCount` of them are true. */
export function casketSolutions(list: Inscription[], trueCount: number): { t: number; truth: boolean[] }[] {
  const n = list.length;
  const out: { t: number; truth: boolean[] }[] = [];
  for (let t = 0; t < n; t++) {
    for (let mask = 0; mask < 1 << n; mask++) {
      const truth = list.map((_, i) => Boolean(mask & (1 << i)));
      if (truth.filter(Boolean).length !== trueCount) continue;
      if (list.every((s, i) => says(s, t, truth) === truth[i])) out.push({ t, truth });
    }
  }
  return out;
}

/** Inscriptions on `n` caskets that put the treasure in one place only. */
export function casketPuzzle(n: number, trueCount: number, rand: Rand, selfRef: boolean): { list: Inscription[]; t: number; truth: boolean[] } {
  const types: InscriptionType[] = ['here', 'notHere', 'there', 'notThere', ...(selfRef ? (['lies', 'true'] as const) : [])];
  for (let tries = 0; tries < 2000; tries++) {
    const list = Array.from({ length: n }, (_, on): Inscription => {
      const type = pick(types, rand);
      if (type === 'here' || type === 'notHere') return { type, on };
      const other = (on + 1 + Math.floor(rand() * (n - 1))) % n;
      return { type, on, other };
    });
    // Two caskets saying the same about a third read as a mistake.
    const said = list.filter((s) => s.other !== undefined).map((s) => `${s.type}:${s.other}`);
    if (new Set(said).size < said.length) continue;
    const found = casketSolutions(list, trueCount);
    const places = new Set(found.map((s) => s.t));
    if (places.size === 1) return { list, ...found[0]! };
  }
  // Never reached in practice: the classic one (the treasure is in the second).
  const list: Inscription[] = [{ type: 'here', on: 0 }, { type: 'notHere', on: 1 }, { type: 'notThere', on: 2, other: 0 }];
  return { list, ...casketSolutions(list, 1)[0]! };
}
