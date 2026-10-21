import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { BuiltinBook } from '../src/shared/compendium';
import initiative from '../src/modules/initiative/main';
import { defeated, down, refreshed, woundOf } from '../src/modules/initiative/order';
import type { Combatant, InitiativeState } from '../src/modules/initiative/types';
import { rollSave } from '../src/shared/dice';
import { familyOf, systemOf } from '../src/systems';
import { fromFields } from '../src/systems/tracker';
import { mausTracker, ORDER } from '../src/systems/mausritter/tracker';
import { blankStats, parseAttacks, encumbered, gritFor, isMaus, levelFor, parseStatBlock, SLOT_COUNT, statLine, xpFor } from '../src/systems/mausritter/stats';
import { run } from './helpers';

const S0 = initiative.initialState;
const act = (s: InitiativeState, a: string, p?: unknown) => run(initiative, s, a, p);
const only = (s: InitiativeState) => s.combatants[0]!;

const CROW = `12hp, STR 12, DEX 15, WIL 15, Armour 1
Attacks: d8 peck
Flies 3x normal speed, knows two songs`;

describe('Mausritter: card', () => {
  it('parses an SRD stat block', () => {
    const s = parseStatBlock(CROW);
    expect(s).toMatchObject({ hp: 12, str: 12, dex: 15, wil: 15, armour: 1, attacks: [{ dice: 'd8', name: 'peck' }] });
    expect(s.abilities).toEqual(['Flies 3x normal speed, knows two songs']);
    expect(statLine(s)).toBe('12 HP, STR 12, DEX 15, WIL 15, Armour 1');
  });

  it('warband scale, several attacks, critical damage', () => {
    const cat = parseStatBlock('**Warband scale**  \n15hp, STR 15, DEX 15, WIL 10, Armour 1  \nAttacks: d6 swipe, d8 bite');
    expect(cat.warband).toBe(true);
    expect(cat.attacks.map((a) => a.dice)).toEqual(['d6', 'd8']);
    const centipede = parseStatBlock('8hp, STR 10, DEX 12, WIL 8, Armour 1\nAttacks: d6 venomous bite (damages DEX instead of STR)\nCritical damage: Venom takes effect, d12 damage to STR');
    expect(centipede.attacks[0]!.name).toBe('venomous bite (damages DEX instead of STR)');
    expect(centipede.critical).toBe('Venom takes effect, d12 damage to STR');
  });

  it('a player mouse has a sheet with ten slots; more — encumbered', () => {
    const s = blankStats('character');
    expect(isMaus(s)).toBe(true);
    expect(s.sheet!.slots).toHaveLength(SLOT_COUNT);
    expect(encumbered(s.sheet!)).toBe(false);
    s.sheet!.slots.push({ name: 'Exhausted', condition: true });
    expect(encumbered(s.sheet!)).toBe(true);
    expect(blankStats('monster').sheet).toBeUndefined();
  });

  it('levels: XP, Grit', () => {
    expect([1, 2, 3, 4, 5, 6].map(xpFor)).toEqual([0, 1000, 3000, 6000, 11000, 16000]);
    expect([0, 999, 1000, 5999, 6000, 11000].map(levelFor)).toEqual([1, 1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 7].map(gritFor)).toEqual([0, 1, 2, 2, 3]);
  });

  it('the system: family, combat numbers from the card', () => {
    const sys = systemOf('mausritter');
    expect(familyOf('mausritter')).toBe('mausritter');
    const combat = sys.combat(parseStatBlock(CROW));
    expect(combat).toMatchObject({ hp: 12, ac: 1, initiative: 15 });
    expect(mausTracker.fromCard(combat).attrs).toEqual([
      { id: 'str', value: 12, max: 12 },
      { id: 'dex', value: 15, max: 15 },
      { id: 'wil', value: 15, max: 15 },
    ]);
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
  const crow = () => act(S0, 'add', { c: { name: 'Crow', ...mausTracker.fromCard(systemOf('mausritter').combat(parseStatBlock(CROW))) } });

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

  it('fields: attributes and DEX as the tie-break; the opponents get the middle order', () => {
    const numbers = fromFields(mausTracker.fields, { hp: 4, dex: 13 });
    expect(numbers).toMatchObject({ maxHp: 4, hp: 4, bonus: 13 });
    expect(numbers.attrs!.map((a) => [a.id, a.max])).toEqual([['str', 10], ['dex', 13], ['wil', 10]]);
    expect(mausTracker.roll.value(13)).toBe(ORDER.foes);
    const s = act(crow(), 'rollNpcs', { system: 'mausritter' });
    expect(only(s).init).toBe(1);
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
  const cards = JSON.parse(readFileSync('resources/srd/mausritter.json', 'utf8')) as { name: string; system: string; stats: unknown }[];
  const book = JSON.parse(readFileSync('resources/compendium/mausritter.en.json', 'utf8')) as BuiltinBook;

  it('eleven creatures, each a Mausritter stat block the app reads', () => {
    expect(cards.map((c) => c.name)).toEqual(['Cat', 'Centipede', 'Crow', 'Faerie', 'Frog', 'Ghost', 'Mouse', 'Owl', 'Rat', 'Snake', 'Spider']);
    for (const c of cards) {
      expect(c.system).toBe('mausritter');
      expect(isMaus(c.stats)).toBe(true);
    }
    const ghost = cards.find((c) => c.name === 'Ghost')!.stats as ReturnType<typeof parseStatBlock>;
    expect(ghost.attacks).toEqual([{ dice: '', name: 'ghostly power' }, { dice: 'd8', name: 'chilling touch (damages WIL)' }]);
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

  it('the app parses attacks like the build script', () => {
    expect(parseAttacks('d10 spear or d6 tongue').map((a) => a.dice)).toEqual(['d10', 'd6']);
  });
});
