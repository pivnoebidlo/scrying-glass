import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { degreeOf, parseDice, rollDamage } from '../src/shared/dice';
import { conditionValue } from '../src/systems/tracker';
import { budgetOf, creatureXp, threatOf } from '../src/systems/pf2e/budget';
import { mapOf, type Pf2eStats } from '../src/systems/pf2e/stats';
import { systemOf, familyOf } from '../src/systems';
import { CONDITIONS, VALUED } from '../src/systems/pf2e/tracker';
import type { BuiltinBook } from '../src/shared/compendium';

describe('Pathfinder 2e: rules', () => {
  it('degrees of success: by 10, and a natural 20 / 1 shift one degree', () => {
    expect(degreeOf(30, 12, 20)).toBe('critical');
    expect(degreeOf(20, 12, 20)).toBe('success');
    expect(degreeOf(19, 12, 20)).toBe('failure');
    expect(degreeOf(10, 3, 20)).toBe('fumble');
    expect(degreeOf(19, 20, 20)).toBe('success');
    expect(degreeOf(25, 1, 20)).toBe('failure');
    expect(degreeOf(5, 1, 20)).toBe('fumble');
  });

  it('a critical hit doubles the whole damage, not the dice', () => {
    const d = rollDamage(parseDice('1d6+3')!, true, 'total');
    expect(d.rolls[0]).toHaveLength(1);
    expect(d.total).toBe((d.rolls[0]![0]! + 3) * 2);
    expect(rollDamage(parseDice('1d6+3')!, true).rolls[0]).toHaveLength(2);
  });

  it('the multiple attack penalty, agile weapons less', () => {
    const s = { name: 'Jaws', ranged: false, bonus: 10, traits: [], damage: '', effects: [] };
    expect([1, 2, 3].map((n) => mapOf(s, n as 1))).toEqual([0, -5, -10]);
    expect([1, 2, 3].map((n) => mapOf({ ...s, traits: ['agile'] }, n as 1))).toEqual([0, -4, -8]);
  });

  it('the XP budget: creatures by level against the party, budgets by its size', () => {
    expect(creatureXp(3, 3)).toBe(40);
    expect(creatureXp(-2, 3)).toBe(0);
    expect(creatureXp(8, 3)).toBeNull();
    expect(budgetOf('moderate', 4)).toBe(80);
    expect(budgetOf('severe', 5)).toBe(150);
    expect(threatOf([3, 3], { size: 4, level: 3 })).toMatchObject({ xp: 80, threat: 'moderate', next: 120 });
    expect(threatOf([1, 1], { size: 4, level: 3 }).threat).toBe('trivial');
    expect(threatOf([9], { size: 4, level: 3 }).threat).toBe('beyond');
    expect(threatOf([null, 3], { size: 4, level: 3 })).toMatchObject({ xp: 40, unknown: 1 });
  });

  it('a valued condition: the name and its number', () => {
    expect(conditionValue('Frightened 2')).toEqual({ name: 'Frightened', value: 2 });
    expect(conditionValue('Off-Guard')).toEqual({ name: 'Off-Guard', value: null });
    expect(VALUED.every((v) => CONDITIONS.includes(v))).toBe(true);
  });

  it('the system: a plugin of its own family', () => {
    expect(familyOf('pf2e')).toBe('pf2e');
    expect(systemOf('pf2e').combat({ hp: 20, ac: 18, perception: 7 } as Pf2eStats)).toEqual({ hp: 20, ac: 18, initiative: 7 });
  });
});

describe('Pathfinder 2e: the data (content/pf2e-core)', () => {
  const cards = JSON.parse(fs.readFileSync('content/pf2e-core/bestiary/pf2e.json', 'utf8')) as { id: string; name: string; system: string; stats: Pf2eStats }[];
  const book = JSON.parse(fs.readFileSync('content/pf2e-core/compendium/pf2e.en.json', 'utf8')) as BuiltinBook;
  const titles = new Set(book.entries.map((e) => e.title));

  it('Monster Core creatures with sane numbers, unique ids', () => {
    expect(cards.length).toBeGreaterThan(400);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const c of cards) {
      expect(c.system).toBe('pf2e');
      expect(c.stats.level, c.name).toBeGreaterThanOrEqual(-1);
      expect(c.stats.hp, c.name).toBeGreaterThan(0);
      expect(c.stats.ac, c.name).toBeGreaterThan(5);
    }
  });

  it('the conditions of the tracker are in the compendium', () => {
    for (const c of CONDITIONS) expect(titles.has(c), c).toBe(true);
  });

  it('every [[link]] leads to an entry of the book; no markup of Foundry is left', () => {
    const texts = [...book.entries.map((e) => e.body), ...cards.flatMap((c) => [...c.stats.interaction, ...c.stats.defensive, ...c.stats.offensive].map((f) => f.text))];
    for (const t of texts) {
      for (const m of t.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) expect(titles.has(m[1]!), m[1]).toBe(true);
      expect(t).not.toMatch(/@\w+\[|\[\[\/|<[a-z]+[ >]/);
    }
  });
});
