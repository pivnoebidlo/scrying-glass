// Riddle and puzzle generator: what the content of one language holds (content/<lang>.ts) and what a puzzle is.
import type { MosaicGrid } from './mosaic';

export const KINDS = ['riddle', 'cipher', 'order', 'caskets', 'mosaic', 'path', 'switches'] as const;
// Kinds drawn as a grid of tiles (mosaic.ts).
export const TILE_KINDS: readonly Kind[] = ['mosaic', 'path', 'switches'];
export type Kind = (typeof KINDS)[number];
export const LEVELS = ['easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export const CIPHERS = ['reverse', 'numbers', 'caesar', 'atbash'] as const;
export type CipherKind = (typeof CIPHERS)[number];

export interface Riddle {
  // The riddle as read aloud, lines with «\n».
  text: string;
  answer: string;
  hints: [string, string];
  level: 1 | 2 | 3;
}

// A word in the forms the clue templates need: n — as is, g — after «left of» / «after» (the genitive in Russian).
export interface Word {
  n: string;
  g: string;
}

// A set of things to put in order: statues in niches (space — left to right) or levers to pull (time — one after
// another).
export interface OrderSet {
  axis: 'space' | 'time';
  // Read aloud: «{count}» — how many there are, «{items}» — all of them (a clue may leave one unnamed).
  scene: string;
  items: Word[];
}

// Clue templates by axis: {a}, {b} — Word.n, {a:g}, {b:g} — Word.g, {k} — the place (1-based).
export type ClueType = 'before' | 'right' | 'adjacent' | 'apart' | 'at' | 'notAt' | 'edge' | 'inside';
export type ClueTexts = Record<ClueType, string>;

// Chests (doors, urns) with inscriptions; p — «in the golden chest», n — «the golden chest».
export interface Casket {
  n: string;
  p: string;
}
export type InscriptionType = 'here' | 'notHere' | 'there' | 'notThere' | 'lies' | 'true';

export interface PuzzleContent {
  riddles: Riddle[];
  // The cipher's text: the letters of `alphabet` and spaces.
  alphabet: string;
  phrases: string[];
  // How the key shows in the world: «{n}» — the shift.
  cipherKeys: Record<CipherKind, string[]>;
  cipherHints: Record<CipherKind, string>;
  // The second hint: «{word}» — the first word.
  firstWord: string;
  orderSets: OrderSet[];
  clues: Record<OrderSet['axis'], ClueTexts>;
  casketSets: { scene: string; items: Casket[] }[];
  // {other} — Casket.p of another one; {other.n} — its n.
  inscriptions: Record<InscriptionType, string>;
  // The rule of the caskets, by how many inscriptions are true: «{count}».
  // Quotes around an inscription.
  quotes: [string, string];
  casketRules: { oneTrue: string; oneFalse: string };
  // Hints: how to go about it; which inscription is true (false) — «{list}».
  casketHints: { try: string; trueOne: string; falseOne: string };
  // Tile puzzles: the signs' names (mosaic.ts SIGNS order), a cell — «{r}», «{c}».
  tiles: {
    signs: string[];
    cell: string;
    mosaic: { scenes: string[]; rule: string; hints: [string, string] };
    // {seq} — the signs in order; hints and answer: {c} — the first tile, {steps} — the length.
    path: { scenes: string[]; hints: [string, string]; answer: string };
    // {cell}, {list}.
    switches: { scenes: string[]; hints: [string, string]; answer: string };
  };
  places: string[];
  failures: string[];
  rewards: string[];
}

export interface Puzzle {
  kind: Kind;
  level: Level;
  place: string;
  failure: string;
  reward: string;
  // Read aloud before the lines.
  intro: string;
  // What the players see: the riddle's lines, the cipher, the clues, the inscriptions.
  lines: string[];
  hints: string[];
  answer: string;
  // How it is solved (for the GM).
  solution?: string;
  cipher?: CipherKind;
  grid?: MosaicGrid;
}
