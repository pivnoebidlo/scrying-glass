import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { poolOutcome, rollPool } from '../src/shared/dice';
import { entryFamily, TYPES, type BuiltinBook } from '../src/shared/compendium';
import { setLang } from '../src/shared/i18n';
import { evalFormula, fieldMap, loc, packCombat, packSubtitle, rollPack, validatePack, type RollWords, type SystemPack } from '../src/shared/syspack';
import { upgradeCard } from '../src/shared/oldcards';
import type { Card } from '../src/shared/cards';

// Forged in the Dark is a pack since 0.64 (samples/systems/fitd.json, published in the official repository).
const pack = validatePack(JSON.parse(readFileSync(new URL('../samples/systems/fitd.json', import.meta.url), 'utf8'))) as SystemPack;
const fields = fieldMap(pack);
const ACTIONS = ['hunt', 'study', 'survey', 'tinker', 'finesse', 'prowl', 'skirmish', 'wreck', 'attune', 'command', 'consort', 'sway'];
const ATTRIBUTES = ['insight', 'prowess', 'resolve'];
const words: RollWords = { success: 'S', failure: 'F', successes: (n) => `${n}`, critical: 'Crit', full: 'Full', partial: 'Partial', bad: 'Bad', stress: (n) => `Stress ${n}` };
// Dice that fall as given.
const dice = (...faces: number[]) => {
  let i = 0;
  return () => faces[i++] ?? 1;
};

describe('Forged in the Dark: dice pools (the crew uses them too)', () => {
  it('the highest die decides; two sixes — a critical; zero dots — two dice, the lowest', () => {
    expect(poolOutcome([2, 6, 3], false)).toEqual({ result: 6, outcome: 'success' });
    expect(poolOutcome([6, 6], false)).toEqual({ result: 6, outcome: 'critical' });
    expect(poolOutcome([5, 1], false)).toEqual({ result: 5, outcome: 'partial' });
    expect(poolOutcome([6, 2], true)).toEqual({ result: 2, outcome: 'bad' });
    expect(rollPool(0).dice).toHaveLength(2);
  });
});

describe('Forged in the Dark: the pack', () => {
  const stats = { hunt: 2, survey: 1, skirmish: 3, playbook: 'Cutter', heritage: 'Iruvia' };
  const value = (f: string) => evalFormula(pack, stats, f);

  it('an action rolls its dots: the best die, words for the outcome; no dots — two dice, the lower', () => {
    const roll = fields.get('hunt')!.roll!;
    expect(rollPack(roll, value, 'en', words, dice(3, 6), 'normal')).toMatchObject({ total: 6, outcome: 'Full', tone: 'good' });
    expect(rollPack(roll, value, 'en', words, dice(6, 6), 'normal')).toMatchObject({ outcome: 'Crit' });
    expect(rollPack(roll, value, 'en', words, dice(4, 2), 'normal')).toMatchObject({ outcome: 'Partial' });
    const none = rollPack(fields.get('sway')!.roll!, value, 'en', words, dice(6, 2), 'normal');
    expect(none).toMatchObject({ total: 2, outcome: 'Bad' });
    expect(none.dice[0]).toHaveLength(2);
  });

  it('an attribute counts its actions with dots and rolls resistance: stress = 6 − the best', () => {
    expect([value('insight'), value('prowess'), value('resolve')]).toEqual([2, 1, 0]);
    const roll = fields.get('insight')!.roll!;
    expect(rollPack(roll, value, 'en', words, dice(4, 2), 'normal')).toMatchObject({ outcome: 'Stress 2' });
    expect(rollPack(roll, value, 'en', words, dice(6, 6), 'normal')).toMatchObject({ outcome: 'Stress -1' });
  });

  it('subtitle, the tracker: 9 stress boxes and five harm lines', () => {
    expect(packSubtitle(pack, stats, 'en')).toBe('Cutter · Iruvia');
    expect(packSubtitle(pack, { playbook: 'Cutter' }, 'en')).toBe('Cutter');
    const c = packCombat(pack, { ...stats, stress: 3 });
    expect(c.stress).toEqual([{ id: 'stress', boxes: 9 }]);
    expect(pack.tracker.cells).toEqual(['stress', 'harm1', 'harm2', 'harm3', 'harm4', 'harm5']);
  });

  it('a card of the code system (before 0.64) is read into the pack shape', () => {
    const old = {
      format: 1, id: 'x', kind: 'character', system: 'fitd', lang: 'ru', name: 'Базсо', portraits: [], tags: [], notes: '',
      stats: {
        playbook: 'Головорез', heritage: 'Ирувия', background: '', vice: 'Азарт', actions: { hunt: 2, skirmish: 3, sway: 0 }, stress: 4,
        traumas: ['cold', 'reckless'], harm: ['Синяк', '', 'Сломана рука', '', ''], armor: true, abilities: [{ name: 'Бой', text: '+1d' }],
        items: ['Нож'], tier: 0, coin: 2, stash: 10, xp: 3,
      },
    } as Card;
    const s = upgradeCard(old).stats as Record<string, unknown>;
    expect(s).toMatchObject({ playbook: 'Головорез', hunt: 2, skirmish: 3, stress: 4, armor: 1, traumas: ['Холодный', 'Безрассудный'], harm1: 'Синяк', harm3: 'Сломана рука', abilities: [{ name: 'Бой', text: '+1d' }], items: ['Нож'], coin: 2, stash: 10, xp: 3 });
    expect(s['actions']).toBeUndefined();
    // Every key it got is a field of the pack.
    for (const k of Object.keys(s)) expect(fields.has(k), k).toBe(true);
    // A card of the pack shape, and other systems, stay as they are.
    expect(upgradeCard({ ...old, stats: s })).toEqual({ ...old, stats: s });
    expect(upgradeCard({ ...old, system: 'dnd5e-2024' })).toEqual({ ...old, system: 'dnd5e-2024' });
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
      for (const a of [...ACTIONS, ...ATTRIBUTES]) expect(titles, a).toContain(loc(fields.get(a)!.title, lang));
      const trauma = book.entries.find((e) => e.en === 'Trauma' || e.title === 'Trauma')!;
      for (const t of loc(fields.get('traumas')!.hint, lang).split(', ')) expect(trauma.fields['aliases'], t).toContain(t);
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
