import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { BuiltinBook } from '../src/shared/compendium';
import initiative from '../src/modules/initiative/main';
import { defeated, down, refreshed, woundOf } from '../src/modules/initiative/order';
import type { Combatant, InitiativeState } from '../src/modules/initiative/types';
import { rollSave } from '../src/shared/dice';
import { familyOf, systemOf } from '../src/systems';
import { fromFields } from '../src/systems/tracker';
import { blankStats, fieldMap, rollPack, sectionsFor, slotGroups, validatePack, type SystemPack } from '../src/shared/syspack';
import { registerPacks } from '../src/systems/packs';
import { die } from '../src/shared/dice';
import { run } from './helpers';

// Mausritter is a system pack now (samples/systems/mausritter.json, published in the Community).
const pack = validatePack(JSON.parse(readFileSync('samples/systems/mausritter.json', 'utf8'))) as SystemPack;
registerPacks([pack]);
const sys = () => systemOf('mausritter');

const S0 = initiative.initialState;
const act = (s: InitiativeState, a: string, p?: unknown) => run(initiative, s, a, p);
const only = (s: InitiativeState) => s.combatants[0]!;

type Stats = Record<string, unknown> & { attacks: { name: string; dice: string }[] };
const all = JSON.parse(readFileSync('resources/srd/mausritter.json', 'utf8')) as { id: string; name: string; lang: string; system: string; stats: Stats; origin?: { id: string } }[];
const CROW = all.find((c) => c.id === 'maus-crow')!.stats;

describe('Mausritter: card', () => {
  it('the pack: family, saves under the attribute, damage from the attack row', () => {
    expect(familyOf('mausritter')).toBe('mausritter');
    expect(fieldMap(pack).get('str')!.roll).toEqual({ type: 'under', sides: 20, target: 'str' });
    const hit = fieldMap(pack).get('attacks')!.roll!;
    const r = rollPack(hit, () => 0, 'en', { success: '', failure: '', successes: () => '', critical: '' }, die, 'normal', { name: 'peck', dice: 'd8' });
    expect(r.note).toBe('1d8');
    expect(r.total).toBeGreaterThanOrEqual(1);
    expect(r.total).toBeLessThanOrEqual(8);
  });

  it('a player mouse has the sheet: ten slots in paws, body and pack; a creature has none', () => {
    const inv = fieldMap(pack).get('inventory')!;
    expect(slotGroups(inv, []).map((g) => g.cells.length)).toEqual([2, 2, 6]);
    expect(sectionsFor(pack, 'character').map((x) => x.id)).toContain('mouse');
    expect(sectionsFor(pack, 'monster').map((x) => x.id)).not.toContain('mouse');
    expect(blankStats(pack, 'character')).toMatchObject({ level: 1, str: 10, inventory: [] });
  });

  it('combat numbers from the card: HP, STR, DEX, WIL; the line under the name — the stat line', () => {
    const combat = sys().combat(CROW);
    expect(combat).toMatchObject({ hp: 12 });
    expect(sys().tracker.fromCard(combat).attrs).toEqual([
      { id: 'str', value: 12, max: 12 },
      { id: 'dex', value: 15, max: 15 },
      { id: 'wil', value: 15, max: 15 },
    ]);
    expect(sys().subtitle(CROW, 'en')).toBe('12 HP · STR 12 · DEX 15 · WIL 15');
    expect(sys().subtitle(CROW, 'ru')).toBe('Защ. 12 · СИЛ 12 · ЛОВ 15 · ВОЛ 15');
  });
});

describe('Mausritter: saves', () => {
  it('d20 ≤ the attribute; advantage — the lower die', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollSave(10, 'advantage');
      expect(r.natural).toBe(Math.min(...r.rolls));
      expect(r.success).toBe(r.natural <= 10);
      const d = rollSave(10, 'disadvantage');
      expect(d.natural).toBe(Math.max(...d.rolls));
    }
  });
});

describe('Mausritter: tracker', () => {
  const crow = () => act(S0, 'add', { c: { name: 'Crow', ...sys().tracker.fromCard(sys().combat(CROW)) } });

  it('damage past HP goes to STR; STR 0 — out', () => {
    let s = crow();
    s = act(s, 'changeHp', { id: only(s).id, amount: -5 });
    expect(only(s).hp).toBe(7);
    expect(only(s).attrs![0]!.value).toBe(12);
    s = act(s, 'changeHp', { id: only(s).id, amount: -10 });
    expect(only(s).hp).toBe(0);
    expect(only(s).attrs![0]!.value).toBe(9);
    // 0 HP is not out yet.
    expect(down(only(s))).toBe(false);
    expect(woundOf(only(s))).toBeCloseTo(15 / 24);
    s = act(s, 'changeHp', { id: only(s).id, amount: -20 });
    expect(only(s).attrs![0]!.value).toBe(0);
    expect(defeated(only(s))).toBe(true);
    // Healing restores only HP.
    s = act(s, 'changeHp', { id: only(s).id, amount: 3 });
    expect(only(s).hp).toBe(3);
    expect(only(s).attrs![0]!.value).toBe(0);
  });

  it('setAttr stays within 0…max; a new fight restores attributes', () => {
    let s = crow();
    s = act(s, 'setAttr', { id: only(s).id, attr: 'wil', value: 99 });
    expect(only(s).attrs![2]!.value).toBe(15);
    s = act(s, 'setAttr', { id: only(s).id, attr: 'wil', value: 4 });
    expect(only(s).attrs![2]!.value).toBe(4);
    expect(refreshed(only(s)).attrs![2]!.value).toBe(15);
  });

  it('fields: HP and the attributes; no initiative roll (mice act before or after the opponents by a DEX save)', () => {
    const numbers = fromFields(sys().tracker.fields, { hp: 4, str: 8, dex: 13, wil: 9 });
    expect(numbers).toMatchObject({ maxHp: 4, hp: 4 });
    expect(numbers.attrs!.map((a) => [a.id, a.max])).toEqual([['str', 8], ['dex', 13], ['wil', 9]]);
    expect(sys().tracker.roll.none).toBe(true);
  });

  it('D&D combatants are not affected', () => {
    let s = act(S0, 'add', { c: { name: 'Goblin', maxHp: 7 } });
    s = act(s, 'changeHp', { id: only(s).id, amount: -10 });
    expect(only(s).hp).toBe(0);
    expect(only(s).attrs).toBeUndefined();
    expect(defeated(only(s) as Combatant)).toBe(true);
  });
});

describe('Mausritter: built-in content', () => {
  const cards = all.filter((c) => c.lang === 'en');
  const book = JSON.parse(readFileSync('resources/compendium/mausritter.en.json', 'utf8')) as BuiltinBook;
  const ruBook = JSON.parse(readFileSync('resources/compendium/mausritter.ru.json', 'utf8')) as BuiltinBook;

  it('the Russian translation: a card for each creature with the same numbers, a paired entry for each entry', () => {
    const ru = all.filter((c) => c.lang === 'ru');
    expect(ru).toHaveLength(11);
    for (const r of ru) {
      const [a, b] = [r.stats, cards.find((c) => c.id === r.origin?.id)!.stats];
      const nums = (x: Stats) => [x['hp'], x['str'], x['dex'], x['wil'], x['armour'], x.attacks.map((y) => y.dice)];
      expect(nums(a)).toEqual(nums(b));
    }
    expect(ru.find((c) => c.id === 'maus-owl.ru')!.name).toBe('Сова');
    expect(ruBook.entries).toHaveLength(book.entries.length);
    expect(ruBook.entries.find((e) => e.en === 'Conditions')!.title).toBe('Состояния');
    expect(ruBook.entries.filter((e) => e.type === 'mspell').map((e) => e.title)).toContain('Огненный шар');
  });

  it('eleven creatures, each with the fields of the Mausritter pack', () => {
    expect(cards.map((c) => c.name)).toEqual(['Cat', 'Centipede', 'Crow', 'Faerie', 'Frog', 'Ghost', 'Mouse', 'Owl', 'Rat', 'Snake', 'Spider']);
    const keys = fieldMap(pack);
    for (const c of all) {
      expect(c.system).toBe('mausritter');
      for (const k of Object.keys(c.stats)) expect(keys.has(k), `${c.name}: ${k}`).toBe(true);
    }
    const ghost = cards.find((c) => c.name === 'Ghost')!.stats;
    expect(ghost.attacks).toEqual([{ name: 'ghostly power', dice: '' }, { name: 'chilling touch (damages WIL)', dice: 'd8' }]);
    expect(cards.find((c) => c.name === 'Cat')!.stats['warband']).toBe(0);
  });

  it('the book: spells with their recharge, links lead to entries or creatures, no licence chapter', () => {
    const spells = book.entries.filter((e) => e.type === 'mspell');
    expect(spells).toHaveLength(15);
    expect(spells.find((e) => e.title === 'Fireball')!.fields['recharge']).toMatch(/raging fire/);
    const names = new Set([...book.entries.map((e) => e.title.toLowerCase()), ...cards.map((c) => c.name.toLowerCase())]);
    for (const e of book.entries) for (const m of e.body.matchAll(/\[\[([^\]|#]+)/g)) expect(names.has(m[1]!.toLowerCase())).toBe(true);
    expect(book.entries.some((e) => /Terms of use|Third Party/i.test(e.title))).toBe(false);
    expect(book.entries.some((e) => e.title === 'Conditions')).toBe(true);
  });
});
