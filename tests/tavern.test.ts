import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addList, parseList, parseListName, type NameBook } from '../src/shared/names';
import { en } from '../src/modules/tools/tavern/content/en';
import { ru } from '../src/modules/tools/tavern/content/ru';
import { coins, generatePart, generateTavern, rerollTavern, withPeople } from '../src/modules/tools/tavern/generate';
import { tavernMarkdown } from '../src/modules/tools/tavern/markdown';
import { TAVERN_TYPES, WEALTH, type TavernContent, type TavernOptions } from '../src/modules/tools/tavern/types';

const names = (lang: string): NameBook => {
  const dir = path.join(__dirname, '../src/modules/tools/names/builtin', lang);
  const book: NameBook = {};
  for (const f of fs.readdirSync(dir)) addList(book, parseListName(f)!, parseList(fs.readFileSync(path.join(dir, f), 'utf8')));
  return book;
};
const opts: TavernOptions = { type: 'inn', wealth: 'modest', crowd: 'usual', lodging: 'auto', wonders: 'often' };
// A fixed sequence instead of Math.random: results repeat.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('генератор таверн', () => {
  it('цены: медь, серебро и золото, крупные — округлены', () => {
    expect(coins(4, en.coins)).toBe('4 cp');
    expect(coins(15, en.coins)).toBe('1 sp 5 cp');
    expect(coins(52, en.coins)).toBe('5 sp');
    expect(coins(1234, ru.coins)).toBe('12 зм');
  });

  for (const [lang, c] of [['en', en], ['ru', ru]] as [string, TavernContent][]) {
    it(`${lang}: в содержимом есть всё для каждого типа, достатка и людности`, () => {
      for (const t of TAVERN_TYPES) expect(c.exterior[t].length, t).toBeGreaterThanOrEqual(3);
      for (const w of WEALTH) {
        expect(c.rooms[w]).toBeTruthy();
        // Even the poorest place has at least three drinks and three dishes.
        expect(c.drinks.filter((d) => WEALTH.indexOf(d.from) <= WEALTH.indexOf(w)).length).toBeGreaterThanOrEqual(3);
        expect(c.food.filter((d) => WEALTH.indexOf(d.from) <= WEALTH.indexOf(w)).length).toBeGreaterThanOrEqual(3);
      }
      expect(c.occupations.length).toBeGreaterThanOrEqual(6);
      expect(c.doings.length).toBeGreaterThanOrEqual(6);
      expect(c.patronSecrets.length).toBeGreaterThanOrEqual(6);
      for (const a of c.adjectives) expect(a.m && a.f && a.n).toBeTruthy();
    });

    it(`${lang}: таверна целиком, без незаменённых {…}, и в Markdown для журнала`, () => {
      const book = names(lang);
      for (let i = 1; i < 30; i++) {
        const tv = generateTavern(c, book, { ...opts, type: TAVERN_TYPES[i % TAVERN_TYPES.length]!, crowd: i % 2 ? 'packed' : 'quiet' }, seeded(i));
        expect(tv.name).toBeTruthy();
        expect(tv.owner.name).not.toBe('?');
        expect(tv.menu.length).toBeGreaterThanOrEqual(6);
        expect(tv.rumors).toHaveLength(3);
        expect(tv.wonder).toBeTruthy();
        const md = tavernMarkdown(tv, c, {
          type: 'T', wealth: 'W', wealthLabel: 'WL', sign: 'S', people: 'P', patrons: 'Pa', says: 'Sa', secret: 'Se', menu: 'M', item: 'I', price: 'Pr',
          rooms: 'R', services: 'Sv', event: 'E', rumors: 'Ru', request: 'Rq', tavernSecret: 'TS', race: (r) => r,
        });
        expect(md, md).not.toMatch(/\{[a-z0-9]+\}|undefined/i);
        expect(md).toContain('- [ ] ');
        expect(md).toContain(`> ${tv.intro}`);
      }
    });
  }

  it('переброска: закреплённое остаётся, остальное меняется; ночлег по типу', () => {
    const book = names('en');
    const tv = generateTavern(en, book, opts, seeded(7));
    const next = rerollTavern(tv, ['name', 'owner'], en, book, opts, seeded(99));
    expect(next.name).toBe(tv.name);
    expect(next.owner).toEqual(tv.owner);
    expect(next.intro).not.toBe(tv.intro);
    expect(generatePart('rooms', tv, en, book, { ...opts, type: 'den' }, seeded(3)).rooms).toEqual([]);
    expect(generatePart('rooms', tv, en, book, { ...opts, type: 'inn', wealth: 'squalid' }, seeded(3)).rooms).toHaveLength(2);
    expect(withPeople('{owner} and {patron2}', { ...tv, patrons: [] })).toBe(`${tv.owner.name} and ${tv.staff[0]?.name ?? tv.owner.name}`);
  });
});
