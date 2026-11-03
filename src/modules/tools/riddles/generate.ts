// Puzzles of every kind from the content of one language; all the text is made here, so a puzzle is shown as made.
import { casketPuzzle, encipher, orderClues, plainText, shuffle, type Clue, type Inscription, type Rand } from './logic';
import { makeMosaic, makePath, makeSwitches } from './mosaic';
import { KINDS, type CipherKind, type Kind, type Level, type Puzzle, type PuzzleContent, type Word } from './types';

const pick = <T>(list: readonly T[], rand: Rand): T => list[Math.floor(rand() * list.length)]!;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{([\w.:]+)\}/g, (m, k: string) => String(v[k] ?? m));
const LEVEL_N: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };

export function generatePuzzle(kind: Kind | 'random', level: Level, c: PuzzleContent, rand: Rand = Math.random): Puzzle {
  const k = kind === 'random' ? pick(KINDS, rand) : kind;
  const frame = { kind: k, level, place: pick(c.places, rand), failure: pick(c.failures, rand), reward: pick(c.rewards, rand) };
  switch (k) {
    case 'riddle':
      return { ...frame, ...riddle(level, c, rand) };
    case 'cipher':
      return { ...frame, ...cipher(level, c, rand) };
    case 'order':
      return { ...frame, ...order(level, c, rand) };
    case 'caskets':
      return { ...frame, ...caskets(level, c, rand) };
    case 'mosaic':
      return { ...frame, ...mosaic(level, c, rand) };
    case 'path':
      return { ...frame, ...path(level, c, rand) };
    case 'switches':
      return { ...frame, ...switches(level, c, rand) };
  }
}

type Body = Omit<Puzzle, 'kind' | 'level' | 'place' | 'failure' | 'reward'>;

function riddle(level: Level, c: PuzzleContent, rand: Rand): Body {
  const fit = c.riddles.filter((r) => r.level === LEVEL_N[level]);
  const r = pick(fit.length ? fit : c.riddles, rand);
  return { intro: '', lines: r.text.split('\n'), hints: [...r.hints], answer: r.answer };
}

const CIPHERS_AT: Record<Level, CipherKind[]> = { easy: ['reverse', 'numbers'], medium: ['caesar', 'numbers', 'atbash'], hard: ['caesar', 'atbash'] };

function cipher(level: Level, c: PuzzleContent, rand: Rand): Body {
  const kind = pick(CIPHERS_AT[level], rand);
  const shift = level === 'hard' ? 4 + Math.floor(rand() * 6) : 1 + Math.floor(rand() * 3);
  const phrase = pick(c.phrases, rand);
  const text = encipher(phrase, kind, c.alphabet, shift);
  const plain = plainText(phrase, c.alphabet);
  const key = fill(pick(c.cipherKeys[kind], rand), { n: shift });
  // A hard cipher hides the word breaks (not the numbers: they would read as nothing).
  const shown = level === 'hard' && kind !== 'numbers' ? text.replace(/ /g, '') : text;
  return {
    intro: key,
    lines: [shown],
    hints: [fill(c.cipherHints[kind], { n: shift }), fill(c.firstWord, { word: plain.split(' ')[0]! })],
    answer: plain,
    cipher: kind,
  };
}

function clueText(cl: Clue, items: Word[], texts: Record<string, string>): string {
  const a = items[cl.a]!;
  const b = cl.b === undefined ? undefined : items[cl.b];
  const s = fill(texts[cl.type]!, { a: a.n, 'a:g': a.g, b: b?.n ?? '', 'b:g': b?.g ?? '', k: (cl.k ?? 0) + 1 });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function order(level: Level, c: PuzzleContent, rand: Rand): Body {
  const set = pick(c.orderSets, rand);
  const n = { easy: 3, medium: 4, hard: 5 }[level];
  const items = shuffle(set.items, rand).slice(0, n);
  const solved = shuffle(items.map((_, i) => i), rand);
  const clues = orderClues(solved, rand, level === 'hard' ? 0 : 1);
  const texts = c.clues[set.axis];
  const names = solved.map((i) => items[i]!.n);
  return {
    intro: fill(set.scene, { count: n, items: items.map((x) => x.n).join(', ') }),
    lines: clues.map((cl) => clueText(cl, items, texts)),
    hints: [clueText({ type: 'at', a: solved[0]!, k: 0 }, items, texts), clueText({ type: 'at', a: solved[n - 1]!, k: n - 1 }, items, texts)],
    answer: names.join(' → '),
  };
}

function inscriptionText(s: Inscription, items: { n: string; p: string }[], c: PuzzleContent): string {
  const o = s.other === undefined ? undefined : items[s.other];
  const t = fill(c.inscriptions[s.type], { other: o?.p ?? '', 'other.n': o?.n ?? '' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function caskets(level: Level, c: PuzzleContent, rand: Rand): Body {
  const set = pick(c.casketSets, rand);
  const n = level === 'easy' ? 3 : Math.min(set.items.length, level === 'medium' ? 3 : 4);
  const items = set.items.slice(0, n);
  const oneFalse = level === 'hard' && rand() < 0.5;
  const trueCount = oneFalse ? n - 1 : 1;
  const { list, t, truth } = casketPuzzle(n, trueCount, rand, level !== 'easy');
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return {
    intro: `${fill(set.scene, { count: n })} ${oneFalse ? c.casketRules.oneFalse : c.casketRules.oneTrue}`,
    lines: list.map((s, i) => `${cap(items[i]!.n)}: ${c.quotes[0]}${inscriptionText(s, items, c)}${c.quotes[1]}`),
    hints: [c.casketHints.try, fill(oneFalse ? c.casketHints.falseOne : c.casketHints.trueOne, { list: items.filter((_, i) => truth[i] === !oneFalse).map((x) => x.n).join(', ') })],
    answer: cap(items[t]!.p),
  };
}

const cellName = (i: number, w: number, c: PuzzleContent) => fill(c.tiles.cell, { r: Math.floor(i / w) + 1, c: (i % w) + 1 });

function mosaic(level: Level, c: PuzzleContent, rand: Rand): Body {
  const [n, holes, decoys] = ({ easy: [3, 2, 0], medium: [4, 5, 1], hard: [5, 8, 2] } as const)[level];
  const grid = makeMosaic(n, holes, decoys, rand);
  const t = c.tiles;
  const answer = grid.cells
    .map((v, i) => (v < 0 ? `${cellName(i, n, c)} — ${t.signs[grid.solution![i]!]}` : ''))
    .filter(Boolean)
    .join('; ');
  return {
    intro: pick(t.mosaic.scenes, rand),
    lines: level === 'hard' ? [] : [t.mosaic.rule],
    hints: [...t.mosaic.hints],
    answer,
    grid,
  };
}

function path(level: Level, c: PuzzleContent, rand: Rand): Body {
  const [w, h, length, decoys, careful] = ({ easy: [4, 4, 2, 2, true], medium: [5, 5, 3, 1, true], hard: [6, 6, 3, 1, false] } as const)[level];
  const grid = makePath(w, h, length, decoys, careful, rand);
  const t = c.tiles;
  const seq = grid.sequence!.map((s) => t.signs[s]!).join(' → ');
  const first = (grid.path![0]! % w) + 1;
  return {
    intro: fill(pick(t.path.scenes, rand), { seq: seq.charAt(0).toUpperCase() + seq.slice(1) }),
    lines: [],
    hints: [t.path.hints[0], fill(t.path.hints[1], { c: first })],
    answer: fill(t.path.answer, { c: first, steps: grid.path!.length }),
    grid,
  };
}

function switches(level: Level, c: PuzzleContent, rand: Rand): Body {
  const [n, presses] = ({ easy: [3, 2], medium: [3, 4], hard: [4, 5] } as const)[level];
  const grid = makeSwitches(n, presses, rand);
  const t = c.tiles;
  const list = grid.presses!.map((i) => cellName(i, n, c));
  return {
    intro: pick(t.switches.scenes, rand),
    lines: [],
    hints: [t.switches.hints[0], fill(t.switches.hints[1], { cell: list[Math.floor(rand() * list.length)]! })],
    answer: fill(t.switches.answer, { list: list.join('; ') }),
    grid,
  };
}
