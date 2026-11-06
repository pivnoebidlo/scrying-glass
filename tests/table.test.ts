import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { afterReset, checkAction } from '../src/shared/players';
import { evalFormula, liveLimit, fieldMap, packCombat, packResources, validatePack, type SystemPack } from '../src/shared/syspack';
import { down, refreshed, woundOf } from '../src/modules/initiative/order';
import { atTable, syncTable, tableKeys, withTable } from '../src/modules/initiative/table';
import type { Combatant, InitiativeState } from '../src/modules/initiative/types';

const read = (file: string) => validatePack(JSON.parse(readFileSync(file, 'utf8'))) as SystemPack;
const horror = read('samples/systems/d100-horror.json');
const maus = read('content/mausritter/system/mausritter.json');

const hero = (more: Partial<Combatant> = {}): Combatant =>
  ({ id: 'h', name: 'Hero', side: 'party', hp: 12, maxHp: 12, init: null, bonus: 0, ac: null, portrait: null, hidden: false, conditions: [], card: { scope: 'library', id: 'hero' }, ...more }) as Combatant;
const fight = (combatants: Combatant[]) => ({ combatants, encounters: [], turn: null, round: 0 }) as unknown as InitiativeState;

describe('percentile horror: a whole game without code', () => {
  const stats = { str: 60, con: 50, siz: 70, pow: 55, san: 40, luck: 30 };

  it('hit and magic points are worked out, and marked at the table up to that', () => {
    const sheet = packResources(horror, stats, 'character');
    expect(sheet.limits).toEqual({ hp_max: 12, mp: 11, san: 99, luck: 99 });
    expect(sheet.resets).toEqual({ day: ['mp'] });
    expect(liveLimit(horror, stats, fieldMap(horror).get('hp_max')!)).toBe(12);
    expect(evalFormula(horror, { ...stats, hp_max: 5 }, 'hp_max')).toBe(5);
    expect(checkAction({ type: 'use', key: 'hp_max', used: 13 }, sheet)).toBeNull();
    expect(checkAction({ type: 'use', key: 'mp', used: 4 }, sheet)).toEqual({ type: 'use', key: 'mp', used: 4 });
  });

  it('build follows the table of the game by a formula', () => {
    const build = (sum: number) => evalFormula(horror, { str: sum, siz: 0 }, 'build');
    expect([64, 65, 84, 85, 124, 125, 164, 165, 204, 205].map(build)).toEqual([-2, -1, -1, 0, 0, 1, 1, 2, 2, 3]);
  });

  it('the tracker takes hit points and sanity from the table', () => {
    const keys = tableKeys(horror);
    expect(keys).toEqual({ hp: 'hp_max', cells: [{ key: 'san', track: false }, { key: 'luck', track: false }] });
    const c = hero({ attrs: [{ id: 'san', value: 40, max: 40 }, { id: 'luck', value: 30, max: 30 }] });
    const wounded = withTable(c, keys, { hp_max: 5, san: 33 });
    expect(wounded.hp).toBe(5);
    expect(wounded.attrs![0]!.value).toBe(33);
    expect(wounded.attrs![1]!.value).toBe(30);
    expect(packCombat(horror, stats).hp).toBe(12);
  });
});

describe('the table and the tracker are one value', () => {
  const keys = tableKeys(maus);
  const mouse = () => hero({ hp: 6, maxHp: 6, overflow: 'str', attrs: [{ id: 'str', value: 10, max: 10 }, { id: 'dex', value: 9, max: 9 }, { id: 'wil', value: 8, max: 8 }] });

  it('a value marked on a phone reaches the tracker; nothing to do — the same state', () => {
    const s = fight([mouse()]);
    const next = syncTable(s, maus, { hero: { hp: 2, str: 7 } });
    expect(next.combatants[0]!.hp).toBe(2);
    expect(next.combatants[0]!.attrs![0]!.value).toBe(7);
    expect(syncTable(next, maus, { hero: { hp: 2, str: 7 } })).toBe(next);
    expect(syncTable(s, maus, undefined)).toBe(s);
  });

  it('a new fight does not heal what the table remembers, but clears the rest', () => {
    const used = { hero: { str: 3 } };
    const hurt = syncTable(fight([mouse()]), maus, used);
    const again = syncTable(fight([refreshed(hurt.combatants[0]!)]), maus, used);
    expect(again.combatants[0]!.attrs![0]!.value).toBe(3);
  });

  it('a reset gives back the sheet\'s value', () => {
    const used = { str: 3, hp: 1 };
    const hurt = withTable(mouse(), keys, used);
    const rested = withTable(hurt, keys, afterReset(used, ['hp', 'str']));
    expect(rested.hp).toBe(6);
    expect(rested.attrs![0]!.value).toBe(10);
  });

  it('two creatures of one card, and foes, share nothing', () => {
    const a = hero({ id: 'a', side: 'enemy' });
    const b = hero({ id: 'b', side: 'party' });
    const c = hero({ id: 'c', side: 'party' });
    expect(atTable(a, [a])).toBe(false);
    expect(atTable(b, [b, c])).toBe(false);
    expect(atTable(b, [b])).toBe(true);
  });

  it('a track counts marked boxes and an unmarked one is empty', () => {
    const fate = read('content/fate-core/system/fate-core.json');
    const k = tableKeys(fate);
    const c = hero({ stress: [{ id: 'physical', boxes: [false, false, false] }] });
    expect(withTable(c, k, { physical: 2 }).stress![0]!.boxes).toEqual([true, true, false]);
    expect(withTable(withTable(c, k, { physical: 2 }), k, {}).stress![0]!.boxes).toEqual([false, false, false]);
  });

  it('damage past health is a setting of the system, not a name in the core', () => {
    const c = hero({ overflow: 'grit', attrs: [{ id: 'grit', value: 0, max: 5 }] });
    expect(down(c)).toBe(true);
    expect(down({ ...c, overflow: undefined })).toBe(false);
    expect(woundOf({ ...c, attrs: [{ id: 'grit', value: 5, max: 5 }], hp: 0, maxHp: 5 })).toBeCloseTo(0.5);
    expect(maus.tracker.overflow).toBe('str');
    expect((validatePack({ ...JSON.parse(readFileSync('content/mausritter/system/mausritter.json', 'utf8')), format: undefined, tracker: { hp: 'hp', cells: ['str'] } }) as SystemPack).tracker.overflow).toBe('str');
  });
});
