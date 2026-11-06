import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { genCell, lineLabel, lineNames, lineNote, lineWords, plainText, rerollLine, runGenerator, validateGenerators, type GeneratorFile } from '../src/shared/generators';

const file = validateGenerators(JSON.parse(fs.readFileSync('content/dnd5e-srd/generators/events.json', 'utf8'))) as GeneratorFile;
const seeded = (seed: number) => (sides: number) => 1 + Math.floor(((seed = (seed * 16807) % 2147483647) / 2147483647) * sides);
const rows = (lang: string) => file.tables[lang]!['events']!.rows;
const TERRAINS = ['forest', 'plains', 'city', 'coast', 'mountains', 'swamp', 'jungle', 'desert', 'arctic', 'underground'];
const fits = (r: string[], terrain: string, time: string, danger: number) => (!r[1] || r[1].split(',').includes(terrain)) && (!r[2] || r[2] === time) && Number(r[3]) <= danger;

// Names of the SRD cards of both editions, by language.
const cardNames = (() => {
  const out: Record<string, Set<string>> = { en: new Set(), ru: new Set() };
  for (const ed of ['2014', '2024']) for (const c of JSON.parse(fs.readFileSync(`content/dnd5e-srd/bestiary/dnd5e-${ed}.json`, 'utf8'))) out[c.lang]?.add(c.name);
  return out;
})();

describe('случайные события', () => {
  it('у каждой местности, времени и опасности есть события', () => {
    for (const terrain of TERRAINS) for (const time of ['day', 'night']) for (const danger of [0, 1, 2]) {
      expect(rows('en').filter((r) => r[0] !== 'rumor' && fits(r, terrain, time, danger)).length, `${terrain} ${time} ${danger}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('таблицы языков совпадают по меткам, ссылки ведут на карточки SRD своего языка', () => {
    expect(rows('ru').length).toBe(rows('en').length);
    rows('en').forEach((r, i) => expect(rows('ru')[i]!.slice(0, 4)).toEqual(r.slice(0, 4)));
    for (const lang of ['en', 'ru']) for (const r of rows(lang)) for (const name of lineNames(r[5]!)) expect(cardNames[lang]!.has(name), `${lang}: ${name}`).toBe(true);
  });

  it('приложение без `pick` пропускает файл, а не бросает первую строку', () => {
    const step = JSON.parse(fs.readFileSync('content/dnd5e-srd/generators/events.json', 'utf8')).generators[0].steps[0].steps[0];
    expect(step.pick).toBeTruthy();
    expect(Array.isArray(step.group)).toBe(false);
    expect(step.group).toBeDefined();
  });

  it('бросок: столько событий, сколько просили, без повторов, подходящие; слухов под землёй нет', () => {
    for (let seed = 1; seed < 200; seed++) {
      const terrain = TERRAINS[seed % TERRAINS.length]!;
      const o = { terrain, time: seed % 2 ? 'day' : 'night', danger: String(seed % 3), count: 6 };
      const r = runGenerator(file, 'events', o, seeded(seed * 7 + 3));
      expect(r.lines.length).toBe(6);
      const at = r.lines.map((l) => l.cells[0]!.row);
      expect(new Set(at).size).toBe(6);
      for (const i of at) expect(fits(rows('en')[i]!, terrain, o.time, seed % 3), `${seed} ${i}`).toBe(true);
      if (terrain === 'underground') for (const i of at) expect(rows('en')[i]![0]).not.toBe('rumor');
    }
  });

  it('опасность меняет виды: на опасной дороге бои чаще, чем на спокойной', () => {
    const share = (danger: string) => {
      let fights = 0;
      for (let seed = 1; seed < 400; seed++) fights += runGenerator(file, 'events', { terrain: 'forest', time: 'day', danger, count: 1 }, seeded(seed * 7654321 + 89)).lines.filter((l) => l.fight).length;
      return fights;
    };
    expect(share('2')).toBeGreaterThan(share('0') * 2);
  });

  it('строка: подпись и проверка на языке, бой из ссылок, переброс меняет только её', () => {
    const o = { terrain: 'forest', time: 'day', danger: '2', count: 3 };
    let r = runGenerator(file, 'events', o, seeded(5));
    const before = r.lines.map((l) => l.cells[0]!.row);
    const line = r.lines[0]!;
    expect(lineLabel(file, line, 'ru')).toBe(genCell(file, { table: 'events', row: before[0]!, col: 4 }, 'ru'));
    r = rerollLine(file, r, 1, o, seeded(9));
    expect(r.lines[0]!.cells[0]!.row).toBe(before[0]);
    expect(r.lines[2]!.cells[0]!.row).toBe(before[2]);
    expect(before).not.toContain(r.lines[1]!.cells[0]!.row);
    const checked = rows('ru').findIndex((x) => x[6]);
    expect(lineNote(file, { label: '', cells: [], noteCell: { table: 'events', row: checked, col: 6 } }, 'ru')).toMatch(/СЛ \d+/);
    const fight = rows('en').find((x) => x[0] === 'encounter' && /\[\[/.test(x[5]!))!;
    expect(lineNames(fight[5]!).length).toBeGreaterThan(0);
    expect(plainText('A [[Wolf|wolf]] and an [[Ogre]], **fast**')).toBe('A wolf and an Ogre, fast');
    expect(lineWords(file, line, 'ru')).toBe(rows('ru')[before[0]!]![5]);
  });
});
