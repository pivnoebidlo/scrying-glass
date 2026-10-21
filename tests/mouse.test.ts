import { describe, expect, it } from 'vitest';
import { bestAttribute, extraFor, generateMouse, swap, type Mouse } from '../src/modules/tools/mouse/generate';
import { mouseCard, mouseSlots, mouseView } from '../src/modules/tools/mouse/text';
import { TABLES } from '../src/modules/tools/mouse/tables';
import { NAMES, WEAPONS } from '../src/modules/tools/mouse/content';
import { isMaus, SLOT_COUNT } from '../src/systems/mausritter/stats';

// Rolls in a fixed order (then 1 forever).
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++] ?? 1;
};

const base: Mouse = {
  str: 10, dex: 8, wil: 6, rolls: [[5, 5, 1], [4, 4, 2], [3, 3, 1]], hp: 1, pips: 1, background: 0, extra: null,
  weapon: 3, sign: 0, color: 0, pattern: 0, detail: 0, name: 0,
};

describe('mouse generator', () => {
  it('tables: English and Russian rows match', () => {
    for (const k of ['backgrounds', 'birthsigns', 'colors', 'patterns', 'details'] as const) expect(TABLES.ru[k]).toHaveLength(TABLES.en[k].length);
    expect(TABLES.en.backgrounds).toHaveLength(36);
    expect(NAMES.ru).toHaveLength(NAMES.en.length);
    expect(WEAPONS.ru.map((w) => w.dice)).toEqual(WEAPONS.en.map((w) => w.dice));
  });

  it('attributes: 3d6, the two highest; HP and pips pick the background', () => {
    // STR 6 5 1 → 11, DEX 2 2 2 → 4, WIL 6 6 6 → 12, HP 3, pips 4.
    const m = generateMouse(seq(6, 5, 1, 2, 2, 2, 6, 6, 6, 3, 4));
    expect([m.str, m.dex, m.wil]).toEqual([11, 4, 12]);
    expect(m.rolls[0]).toEqual([6, 5, 1]);
    expect(m.background).toBe(2 * 6 + 3);
    expect(TABLES.en.backgrounds[m.background]!.name).toBe('Trash collector');
    expect(m.extra).toBeNull();
  });

  it('a weak mouse: 9 or less — one item of another background, 7 or less — both', () => {
    expect(extraFor(10)).toBeNull();
    expect(extraFor(9, seq(5, 2))).toEqual({ background: 4, take: 'b' });
    expect(extraFor(7, seq(5))).toEqual({ background: 4, take: 'both' });
    expect(bestAttribute(base)).toBe(10);
  });

  it('swapping two attributes moves their dice too', () => {
    const s = swap(base, 'str', 'wil');
    expect([s.str, s.wil]).toEqual([6, 10]);
    expect(s.rolls[0]).toEqual([3, 3, 1]);
  });

  it('the card: heavy armour on the body, the background spell in the pack, a sheet the app reads', () => {
    // Test subject: Spell: Magic missile, Lead coat (Heavy armour); a sword in the main paw.
    const card = mouseCard(base, 'en');
    expect(isMaus(card.stats)).toBe(true);
    expect(card.stats.armour).toBe(1);
    const slots = card.stats.sheet!.slots;
    expect(slots).toHaveLength(SLOT_COUNT);
    expect(slots.slice(0, 4).map((x) => x.name)).toEqual(['Sword (d6/d8)', '', 'Lead coat (Heavy armour)', 'Lead coat (Heavy armour)']);
    expect(slots.slice(4).map((x) => x.name).filter(Boolean)).toEqual(['Torches', 'Rations', 'Spell: Magic missile']);
    expect(card.stats.attacks).toEqual([{ dice: 'd6/d8', name: 'sword' }]);
  });

  it('a two-paw weapon fills both paws; a background weapon is an attack; a hireling goes to the notes', () => {
    // Street tough (hp 1, pips 6): Dagger (Light, d6), Flask of coffee; Beetleherd (index 7): Hireling: Loyal beetle.
    const m: Mouse = { ...base, background: 5, weapon: 6, extra: { background: 7, take: 'a' } };
    const slots = mouseSlots(m, 'ru');
    expect(slots[0]!.name).toBe('Копьё (к10)');
    expect(slots[1]!.name).toBe('Копьё (к10)');
    const card = mouseCard(m, 'en');
    expect(card.stats.attacks.map((a) => a.dice)).toEqual(['d10', 'd6']);
    expect(card.notes).toBe('Hireling: Loyal beetle');
    expect(mouseView(m, 'ru').weak).toBe('one');
  });
});
