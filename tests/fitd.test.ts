import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { poolOutcome, resistStress, rollPool } from '../src/shared/dice';
import { ACTION_TITLES, ALL_ACTIONS, ATTRIBUTE_TITLES, ATTRIBUTES, TRAUMA_TITLES, TRAUMAS, attributeRating, blankStats, combatStats, isFitd, rank, subtitle } from '../src/systems/fitd/stats';
import { entryFamily, TYPES, type BuiltinBook } from '../src/shared/compendium';
import { setLang } from '../src/shared/i18n';
import { fitdTracker, harmLines, stressOf, withStress } from '../src/systems/fitd/tracker';
import { familyOf, systemOf } from '../src/systems';
import { woundOf } from '../src/modules/initiative/order';
import type { Combatant } from '../src/modules/initiative/types';

describe('Forged in the Dark: dice pools', () => {
  it('the highest die decides; two sixes — a critical', () => {
    expect(poolOutcome([2, 6, 3], false)).toEqual({ result: 6, outcome: 'success' });
    expect(poolOutcome([6, 6], false)).toEqual({ result: 6, outcome: 'critical' });
    expect(poolOutcome([5, 1], false)).toEqual({ result: 5, outcome: 'partial' });
    expect(poolOutcome([3, 2, 1], false)).toEqual({ result: 3, outcome: 'bad' });
  });
  it('zero dots: two dice, the lowest, no critical', () => {
    expect(poolOutcome([6, 6], true)).toEqual({ result: 6, outcome: 'success' });
    expect(poolOutcome([6, 2], true)).toEqual({ result: 2, outcome: 'bad' });
    const r = rollPool(0);
    expect(r.zero).toBe(true);
    expect(r.dice).toHaveLength(2);
    expect(rollPool(3).dice).toHaveLength(3);
  });
  it('resistance: stress = 6 − the result, a critical clears one', () => {
    expect(resistStress({ dice: [4, 2], zero: false, result: 4, outcome: 'partial' })).toBe(2);
    expect(resistStress({ dice: [6, 6], zero: false, result: 6, outcome: 'critical' })).toBe(-1);
  });
});

describe('Forged in the Dark: the card', () => {
  it('attributes count the actions with dots', () => {
    const s = blankStats('character');
    s.actions['hunt'] = 2;
    s.actions['survey'] = 1;
    s.actions['skirmish'] = 3;
    s.playbook = 'Cutter';
    s.heritage = 'Iruvia';
    expect(attributeRating(s, 'insight')).toBe(2);
    expect(attributeRating(s, 'prowess')).toBe(1);
    expect(attributeRating(s, 'resolve')).toBe(0);
    expect(subtitle(s)).toBe('Cutter, Iruvia');
    expect(rank(s)).toBe(6);
    expect(isFitd(s)).toBe(true);
    expect(isFitd({ skills: [], aspects: [] })).toBe(false);
  });
  it('is a system of its own family', () => {
    expect(systemOf('fitd').title).toBe('Forged in the Dark');
    expect(familyOf('fitd')).toBe('fitd');
  });
});

describe('Forged in the Dark: the tracker', () => {
  const c = { id: 'a', name: 'Bazso', ...fitdTracker.fromCard(combatStats(blankStats())) } as Combatant;
  it('a card brings 9 stress boxes and five harm lines', () => {
    expect(c.stress![0]!.boxes).toHaveLength(9);
    expect(c.consequences!.map((h) => h.shift)).toEqual([1, 1, 2, 2, 3]);
  });
  it('stress fills up to a box; wounds count stress and harm', () => {
    const s3 = { ...c, stress: withStress(c, 3) };
    expect(stressOf(s3)).toBe(3);
    expect(stressOf({ ...c, stress: withStress(c, 20) })).toBe(9);
    const hurt = { ...s3, consequences: harmLines(c.consequences).map((h, i) => (i === 4 ? { ...h, text: 'Stabbed' } : h)) };
    expect(woundOf(hurt)).toBeGreaterThan(woundOf(s3));
  });
});

describe('Forged in the Dark: the built-in compendium', () => {
  const read = (lang: string) => JSON.parse(readFileSync(new URL(`../resources/compendium/fitd.${lang}.json`, import.meta.url), 'utf8')) as BuiltinBook;
  const ru = read('ru');
  const en = read('en');
  afterAll(() => setLang('en'));

  it('actions, attributes and traumas are named as on the card, in both languages', () => {
    for (const [lang, book] of [['ru', ru], ['en', en]] as const) {
      setLang(lang);
      const titles = new Set(book.entries.map((e) => e.title));
      for (const a of ALL_ACTIONS) expect(titles, a).toContain(ACTION_TITLES[a]);
      for (const a of ATTRIBUTES) expect(titles, a).toContain(ATTRIBUTE_TITLES[a]);
      const trauma = book.entries.find((e) => e.en === 'Trauma' || e.title === 'Trauma')!;
      for (const t of TRAUMAS) expect(trauma.fields['aliases'], t).toContain(TRAUMA_TITLES[t]);
    }
  });
  it('known types of the FitD family or any; every English entry has a Russian pair', () => {
    expect(ru.system).toBe('fitd');
    for (const e of ru.entries) {
      expect(TYPES[e.type], e.title).toBeDefined();
      expect([null, 'fitd']).toContain(entryFamily(e));
    }
    expect(en.entries.length).toBe(ru.entries.length);
    for (const e of en.entries) expect(e.ru, e.title).toBeTruthy();
    expect(ru.entries.filter((e) => e.type === 'fability').length).toBeGreaterThan(50);
  });
});
