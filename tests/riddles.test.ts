import { describe, expect, it } from 'vitest';
import { casketPuzzle, casketSolutions, decipher, encipher, orderClues, plainText, solutions } from '../src/modules/tools/riddles/logic';
import { generatePuzzle } from '../src/modules/tools/riddles/generate';
import { en } from '../src/modules/tools/riddles/content/en';
import { ru } from '../src/modules/tools/riddles/content/ru';
import { CIPHERS, KINDS, LEVELS } from '../src/modules/tools/riddles/types';
import { latinCompletions, makeMosaic, makePath, makeSwitches, mosaicSketch, pathWays, press, SIGNS, solveSwitches } from '../src/modules/tools/riddles/mosaic';
import { parseSketch } from '../src/shared/sketch';

// A seeded random, so a failure can be repeated.
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

describe('ciphers', () => {
  for (const [lang, c] of [['en', en], ['ru', ru]] as const)
    for (const kind of CIPHERS)
      it(`${kind} in ${lang} deciphers back`, () => {
        for (const p of c.phrases) {
          for (const shift of [1, 3, 9]) expect(decipher(encipher(p, kind, c.alphabet, shift), kind, c.alphabet, shift)).toBe(plainText(p, c.alphabet));
        }
      });
  it('atbash mirrors', () => expect(encipher('абв', 'atbash', ru.alphabet)).toBe('ЯЮЭ'));
  it('caesar wraps', () => expect(encipher('xyz', 'caesar', en.alphabet, 3)).toBe('ABC'));
});

describe('order puzzle', () => {
  it('always has exactly one solution — the order', () => {
    const rand = seeded(7);
    for (let i = 0; i < 300; i++) {
      const n = 3 + (i % 3);
      const order = [...Array(n).keys()].sort(() => rand() - 0.5);
      const clues = orderClues(order, rand, i % 2);
      const found = solutions(n, clues);
      expect(found).toEqual([order]);
      expect(clues.filter((c) => c.type === 'at').length).toBeLessThanOrEqual(i % 2);
      // No clue is needless.
      for (const c of clues) expect(solutions(n, clues.filter((x) => x !== c)).length).toBeGreaterThan(1);
    }
  });
});

describe('caskets', () => {
  it('the treasure can be in one place only', () => {
    const rand = seeded(11);
    for (let i = 0; i < 300; i++) {
      const n = 3 + (i % 2);
      const k = i % 3 === 0 ? n - 1 : 1;
      const { list, t } = casketPuzzle(n, k, rand, i % 2 === 0);
      const found = casketSolutions(list, k);
      expect(found.length).toBeGreaterThan(0);
      expect(new Set(found.map((s) => s.t))).toEqual(new Set([t]));
    }
  });
});

describe('puzzles', () => {
  for (const [lang, c] of [['en', en], ['ru', ru]] as const) {
    it(`${lang}: every kind and level is made with no placeholders left`, () => {
      const rand = seeded(3);
      for (const kind of KINDS)
        for (const level of LEVELS)
          for (let i = 0; i < 20; i++) {
            const p = generatePuzzle(kind, level, c, rand);
            const text = [p.intro, ...p.lines, ...p.hints, p.answer, p.place, p.failure, p.reward].join('\n');
            expect(text).not.toMatch(/[{}]|undefined/);
            if (!p.grid) expect(p.lines.length).toBeGreaterThan(0);
            expect(p.answer).not.toBe('');
            // Every item of an order puzzle is named to the players.
            if (p.kind === 'order') for (const name of p.answer.split(' → ')) expect(p.intro).toContain(name);
          }
    });
    it(`${lang}: riddles of every level, sets big enough`, () => {
      for (const l of [1, 2, 3]) expect(c.riddles.filter((r) => r.level === l).length).toBeGreaterThanOrEqual(5);
      for (const s of c.orderSets) expect(s.items.length).toBeGreaterThanOrEqual(5);
      for (const s of c.casketSets) expect(s.items.length).toBeGreaterThanOrEqual(4);
    });
  }
  it('both languages have the same sets', () => {
    expect(en.orderSets.map((s) => [s.axis, s.items.length])).toEqual(ru.orderSets.map((s) => [s.axis, s.items.length]));
    expect(en.casketSets.length).toBe(ru.casketSets.length);
  });
});

describe('tile puzzles', () => {
  it('a mosaic fills one way only and the loose tiles cover the holes', () => {
    const rand = seeded(5);
    for (const [n, holes, decoys] of [[3, 2, 0], [4, 5, 1], [5, 8, 2]] as const)
      for (let i = 0; i < 40; i++) {
        const g = makeMosaic(n, holes, decoys, rand);
        const signs = [...new Set(g.solution)];
        expect(latinCompletions(g.cells.map((v) => (v < 0 ? -1 : signs.indexOf(v))), n)).toBe(1);
        expect(g.cells.filter((v) => v < 0).length).toBeGreaterThanOrEqual(Math.min(holes, 2));
        const need = g.cells.map((v, i) => (v < 0 ? g.solution![i]! : -1)).filter((v) => v >= 0).sort();
        const have = [...g.loose!];
        for (const v of need) have.splice(have.indexOf(v), 1);
        expect(have.length).toBe(g.loose!.length - need.length);
      }
  });
  it('a path has exactly one way, from the near row to the far one', () => {
    const rand = seeded(9);
    for (const [w, h, len, decoys, careful] of [[4, 4, 2, 2, true], [5, 5, 3, 1, true], [6, 6, 3, 1, false]] as const)
      for (let i = 0; i < 40; i++) {
        const g = makePath(w, h, len, decoys, careful, rand);
        expect(pathWays(g)).toEqual([g.path]);
        expect(g.path![0]!).toBeGreaterThanOrEqual((h - 1) * w);
        expect(g.path!.at(-1)!).toBeLessThan(w);
      }
  });
  it('switches: the presses light every slab, and none fewer would', () => {
    const rand = seeded(13);
    for (const [n, k] of [[3, 2], [3, 4], [4, 5]] as const)
      for (let i = 0; i < 15; i++) {
        const g = makeSwitches(n, k, rand);
        expect(g.presses!.reduce((c, j) => press(c, n, j), g.cells).every((v) => v === 1)).toBe(true);
        expect(solveSwitches(g.cells, n)!.length).toBe(g.presses!.length);
        expect(g.presses!.length).toBeGreaterThanOrEqual(2);
      }
  });
  it('the picture is a valid canvas', () => {
    const rand = seeded(17);
    for (const g of [makeMosaic(4, 5, 1, rand), makePath(5, 5, 3, 1, true, rand), makeSwitches(3, 3, rand)])
      for (const answer of [false, true]) {
        const sk = mosaicSketch(g, answer);
        expect(parseSketch(JSON.parse(JSON.stringify(sk)))!.items.length).toBe(sk.items.length);
      }
  });
  it('both languages name every sign', () => {
    expect(en.tiles.signs.length).toBe(SIGNS.length);
    expect(ru.tiles.signs.length).toBe(SIGNS.length);
  });
});
