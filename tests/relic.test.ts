import { describe, expect, it } from 'vitest';
import { CREATORS, CURSES, DETAILS, HISTORIES, MATERIALS, OBJECTS, OWNERS, PROPERTIES, QUIRKS } from '../src/systems/dnd5e/tools/relic/content';
import { generateRelic, generateRelicPart, pickBase, POWERS, RELIC_KINDS } from '../src/systems/dnd5e/tools/relic/generate';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const items = [
  { title: 'Flame Tongue', rarity: 'rare' as const, category: 'Weapon (Any Melee Weapon)' },
  { title: 'Ring of Protection', rarity: 'rare' as const, category: 'Ring' },
  { title: 'Cloak of Elvenkind', rarity: 'uncommon' as const, category: 'Wondrous Item' },
  { title: 'Кольцо плавания', rarity: 'uncommon' as const, category: 'Кольцо' },
];

describe('магические предметы', () => {
  it('у каждого вида есть предметы; все строки на двух языках', () => {
    for (const k of RELIC_KINDS) expect(OBJECTS[k].length).toBeGreaterThan(3);
    for (const p of [...Object.values(OBJECTS).flat(), ...OWNERS, ...MATERIALS, ...DETAILS, ...PROPERTIES, ...CREATORS, ...HISTORIES, ...QUIRKS, ...CURSES]) {
      expect(p[0] && p[1], p.join('|')).toBeTruthy();
    }
  });

  it('основа — предмет нужной редкости, по возможности своего вида; у диковинки основы нет', () => {
    expect(pickBase('weapon', 'major', items, seeded(1))?.title).toBe('Flame Tongue');
    expect(pickBase('jewelry', 'major', items, seeded(1))?.title).toBe('Ring of Protection');
    expect(pickBase('jewelry', 'minor', items, seeded(1))?.title).toBe('Кольцо плавания');
    expect(pickBase('armor', 'major', items, seeded(1))?.rarity).toBe('rare');
    expect(pickBase('weapon', 'curio', items, seeded(1))).toBeUndefined();
    expect(pickBase('weapon', 'legendary', items, seeded(1))).toBeUndefined();
  });

  it('предмет собирается целиком, переброс части меняет только её', () => {
    const r = seeded(7);
    for (const power of POWERS) {
      const x = generateRelic('weapon', power, 'ru', items, r);
      expect(x.name && x.look && x.property && x.creator && x.history && x.quirk).toBeTruthy();
      const y = { ...x, ...generateRelicPart('history', x, items, r) };
      expect(y.name).toBe(x.name);
    }
    expect(generateRelic('jewelry', 'major', 'en', null, r).base).toBeUndefined();
  });
});
