import { describe, expect, it } from 'vitest';
import { en } from '../src/modules/tools/settlement/content/en';
import { ru } from '../src/modules/tools/settlement/content/ru';
import { fitsSuffix, generateSettlement, generateSettlementPart, troubleText } from '../src/modules/tools/settlement/generate';
import { settlementMarkdown } from '../src/modules/tools/settlement/text';
import { SIZES } from '../src/modules/tools/settlement/types';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const helpers = {
  tavernName: () => 'Golden Goose',
  person: (race: string) => ({ name: `Ann ${race}`, race, gender: 'female' as const, occupation: 'smith', trait: 'never forgets a face' }),
};

describe('поселения', () => {
  it('у обоих языков одинаковые списки по размерам', () => {
    for (const k of ['governments', 'defenses', 'impressions'] as const) {
      for (const size of SIZES) expect(ru[k][size].length, `${k} ${size}`).toBe(en[k][size].length);
    }
    for (const k of ['knownFor', 'troubles', 'smallPlaces', 'bigPlaces'] as const) expect(ru[k].length, k).toBe(en[k].length);
  });

  it('население по размеру, народов больше в городе, мест и жителей — по размеру', () => {
    const r = seeded(11);
    for (let i = 0; i < 50; i++) {
      const h = generateSettlement('hamlet', en, helpers, r);
      const c = generateSettlement('city', en, helpers, r);
      expect(h.population).toBeLessThanOrEqual(80);
      expect(c.population).toBeGreaterThanOrEqual(8000);
      expect(h.races.length).toBeLessThanOrEqual(2);
      expect(c.races.length).toBeGreaterThanOrEqual(3);
      expect(new Set(c.races).size).toBe(c.races.length);
      expect(c.places.length).toBeGreaterThan(h.places.length);
      expect(c.people.length).toBeGreaterThan(h.people.length);
    }
  });

  it('беда подставляет имя первого жителя; переброс части меняет только её', () => {
    const s = { ...generateSettlement('village', en, helpers, seeded(2)), trouble: '{person} has gone missing.' };
    expect(troubleText(s)).toBe(`${s.people[0]!.name} has gone missing.`);
    const next = { ...s, ...generateSettlementPart('name', s, en, helpers, seeded(5)) };
    expect(next.places).toEqual(s.places);
    expect(settlementMarkdown(next, { size: 'Village', population: '300 inhabitants', peoples: 'Peoples', peoplesLine: 'mostly humans', ruled: 'Ruled by', defense: 'Defence', knownFor: 'Known for', places: 'Places', people: 'People', trouble: 'Trouble', tavern: 'the Golden Goose tavern' })).toContain('## Trouble');
  });

  it('русские названия: без стыков согласных перед суффиксом-согласной', () => {
    expect(fitsSuffix('Сосн', 'ск')).toBe(false);
    expect(fitsSuffix('Камен', 'ск')).toBe(true);
    expect(fitsSuffix('Сосн', 'овка')).toBe(true);
    const r = seeded(4);
    for (let i = 0; i < 200; i++) expect(ru.name(r)).toMatch(/^[А-ЯЁ][а-яё]+( [А-ЯЁ][а-яё]+)?$/);
  });
});
