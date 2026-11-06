import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { genText, lineWords, rangeOf, resultMarkdown, rollWords, runGenerator, validateGenerators, type GeneratorFile, type GenLine, type GenOptions } from '../src/shared/generators';

const file = validateGenerators(JSON.parse(readFileSync('content/mausritter/generators/mausritter.json', 'utf8'))) as GeneratorFile;
// Rolls in a fixed order (then 1 forever).
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++] ?? 1;
};
const run = (id: string, roll: (sides: number) => number, opts: GenOptions = {}) => runGenerator(file, id, opts, roll);
const label = (l: GenLine) => genText(l.label, 'en', l.params);
const labels = (lines: GenLine[]) => lines.map(label);
const lucky = (seed: number) => (sides: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), (seed % sides) + 1);

describe('generators', () => {
  it('the file of the package is valid, and every generator runs in both languages', () => {
    expect(typeof file).toBe('object');
    for (const g of file.generators) {
      for (let s = 1; s <= 60; s++) {
        const r = run(g.id, lucky(s), { rooms: 8, former: true, magical: true, season: ['Spring', 'Summer', 'Autumn', 'Winter'][s % 4]!, hireling: s % 5, paid: s % 2 === 0, wil: 9 });
        expect(r.lines.length).toBeGreaterThan(0);
        const walk = (l: GenLine) => {
          for (const lang of ['en', 'ru'] as const) {
            if (l.cells.length) expect(lineWords(file, l, lang), `${g.id}: ${label(l)}`).not.toBe('');
          }
          l.sub?.forEach(walk);
        };
        r.lines.forEach(walk);
        for (const lang of ['en', 'ru'] as const) expect(resultMarkdown(file, r, lang)).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('the tables have the same rows in both languages', () => {
    for (const id of Object.keys(file.tables['en']!)) expect(file.tables['ru']![id]!.rows.length, id).toBe(file.tables['en']![id]!.rows.length);
  });

  it('a stranger\'s file: only known steps, no code', () => {
    expect(validateGenerators({ scryingGlass: 'other' })).toBe('not-generators');
    const bad = (steps: unknown[]) => ({ scryingGlass: 'generators', version: 1, system: 'x', tables: {}, generators: [{ id: 'a', title: 'A', steps }] });
    expect(validateGenerators(bad([{ eval: 'process.exit()' }]))).toBe('steps:a');
    expect(validateGenerators(bad([{ let: 'x', formula: 'process.exit()' }]))).toBe('steps:a');
    expect(typeof validateGenerators(bad([{ let: 'x', formula: 'd(6) + 1' }]))).toBe('object');
  });

  it('endless nesting is cut by the budget and the depth', () => {
    let deep: unknown = { let: 'x', formula: '1' };
    for (let i = 0; i < 20; i++) deep = { repeat: '40', steps: [deep] };
    expect(typeof validateGenerators({ scryingGlass: 'generators', version: 1, system: 'x', tables: {}, generators: [{ id: 'a', title: 'A', steps: [deep] }] })).toBe('string');
  });

  it('ranges', () => {
    expect([rangeOf('3-5'), rangeOf('3–5'), rangeOf('5+'), rangeOf('11'), rangeOf('')]).toEqual([[3, 5], [3, 5], [5, Infinity], [11, 11], null]);
    expect(rollWords('2d6↓: 3, 5 → 3, d20: 7', 'ru')).toBe('2к6↓: 3, 5 → 3, к20: 7');
  });
});

describe('Mausritter tables as data', () => {
  it('settlement: size is the lower of 2d6; cities get two features, towns two trades; hamlets and up — a tavern', () => {
    const city = run('settlement', seq(6, 6));
    expect(city.lines[0]!.cells[0]!.row).toBe(5);
    expect(city.lines[0]!.roll).toBe('2d6↓: 6, 6 → 6');
    expect(labels(city.lines).filter((l) => l === 'Notable feature')).toHaveLength(2);
    expect(labels(city.lines).filter((l) => l === 'Industry')).toHaveLength(2);
    expect(labels(city.lines)).toContain('Tavern');
    const farm = run('settlement', seq(1, 6));
    expect(labels(farm.lines).filter((l) => l === 'Notable feature')).toHaveLength(1);
    expect(labels(farm.lines)).not.toContain('Tavern');
  });

  it('hex: the landmark column follows the hex type; landmark details by d6 and d8', () => {
    const river = run('hex', seq(5, 3));
    expect(river.lines[1]!.cells[0]!.col).toBe(3);
    expect(lineWords(file, river.lines[1]!, 'en')).toBe('Draping willow');
    const detail = (a: number, b: number) => run('hex', seq(1, 1, a, b)).lines[2]!.cells[0]!.row;
    expect(detail(1, 7)).toBe(0);
    expect(detail(2, 1)).toBe(1);
    expect(detail(6, 8)).toBe(40);
  });

  it('rooms: a lair (d6 6) with a creature on 1–5 and treasure on 1–4', () => {
    const start = [1, 1, 1, 1, 1];
    const lair = run('site', seq(...start, 6, 5, 4, 2), { rooms: 1 }).lines[5]!;
    expect(genText(lair.notes![0]!.text, 'en')).toBe('a creature and treasure');
    expect(label(lair)).toBe('Room 1');
    const empty = run('site', seq(...start, 1, 4, 2, 1), { rooms: 1 }).lines[5]!;
    expect(genText(empty.notes![0]!.text, 'en')).toBe('no creature, no treasure');
  });

  it('treasure: two d20 and one more per «yes»; a magic sword may be cursed; pips are counted', () => {
    expect(run('treasure', lucky(3), { former: true, guarded: true }).lines).toHaveLength(4);
    // d20 1 — a sword: cursed (d6 1), class d6 2, sword d10 3, curse d6 4.
    const sword = run('treasure', seq(1, 1, 2, 3, 4)).lines[0]!;
    expect(genText(sword.notes![0]!.text, 'en')).toBe('cursed');
    expect(lineWords(file, sword.sub![1]!, 'en')).toBe('Rusty nail — Critical damage: Give a Frightened Condition');
    const box = run('treasure', seq(11, 3, 20, 1));
    expect(genText(box.lines[0]!.notes![0]!.text, 'en', box.lines[0]!.params)).toBe('300 pips');
    expect(genText(box.footer, 'ru', box.params)).toContain('всего');
  });

  it('weather: bold weather is poor for travel; the table follows the season', () => {
    const r = run('weather', seq(1, 1, 3), { season: 'Winter' });
    expect(r.lines[0]!.cells[0]!.table).toBe('weatherWinter');
    expect(r.lines[0]!.notes?.[0]?.warn).toBe(true);
  });

  it('hirelings: a failed WIL save — nobody; paid — Number of them with SRD numbers and a card', () => {
    const none = run('hirelings', seq(20), { wil: 9, hireling: 0 });
    expect(none.lines).toHaveLength(1);
    expect(none.lines[0]!.notes![0]!.warn).toBe(true);
    // Torchbearer: d6 → 2; each: name, HP, STR 2d6, DEX 2d6, WIL 2d6.
    const paid = run('hirelings', seq(2, 1, 3, 1, 1, 2, 2, 3, 3), { paid: true, hireling: 0 });
    expect(paid.lines).toHaveLength(3);
    const h = paid.lines[1]!;
    expect(lineWords(file, h, 'en')).toBe('Bramble (torchbearer) — HP 3, STR 2, DEX 4, WIL 6');
    expect(h.card?.kind).toBe('npc');
    expect(h.card?.stats).toMatchObject({ armour: 0, hp: expect.any(Number), wil: expect.any(Number) });
    expect(lineWords(file, h, 'ru')).toContain('ВОЛ');
  });
});
