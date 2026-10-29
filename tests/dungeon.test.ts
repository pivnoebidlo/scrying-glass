import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ATMOSPHERES, BUILDERS, ENTRANCES, FATES, FEATURES, HOOKS, MONSTERS, PLACES, PUZZLES, ROOMS, TRAPS, TWISTS } from '../src/systems/dnd5e/tools/dungeon/content';
import { DUNGEON_TYPES, generateDungeon, generateDungeonPart } from '../src/systems/dnd5e/tools/dungeon/generate';
import { dungeonMarkdown, dungeonName } from '../src/systems/dnd5e/tools/dungeon/text';
import { TIERS } from '../src/systems/dnd5e/tools/treasure/generate';
import { dict } from '../src/systems/dnd5e/stats';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
// Card names of each SRD edition by language.
const editions = ['2014', '2024'].map((ed) => {
  const d = JSON.parse(fs.readFileSync(`content/dnd5e-srd/bestiary/dnd5e-${ed}.json`, 'utf8'));
  const out: Record<string, Set<string>> = { en: new Set(), ru: new Set() };
  for (const c of d.cards ?? d) out[c.lang]?.add(c.name);
  return out;
});

describe('подземелья', () => {
  it('существа есть в обеих редакциях SRD на обоих языках; списки двуязычные', () => {
    for (const [en, ru, cr, types] of MONSTERS) {
      for (const ed of editions) {
        expect(ed['en']!.has(en), en).toBe(true);
        expect(ed['ru']!.has(ru), ru).toBe(true);
      }
      expect(cr).toBeGreaterThan(0);
      for (const t of types.split(' ')) expect(DUNGEON_TYPES, t).toContain(t);
    }
    for (const p of [...Object.values(PLACES).flat(), ...BUILDERS, ...FATES, ...ENTRANCES, ...ATMOSPHERES, ...HOOKS, ...ROOMS, ...FEATURES, ...PUZZLES, ...TWISTS]) {
      expect(p[0] && p[1], p.join('|')).toBeTruthy();
    }
    const abilities = dict('en').abilities;
    for (const t of TRAPS) expect(t[2] in abilities, t[2]).toBe(true);
  });

  it('любой вид и уровень: 5 или 8 комнат по схеме, босс сильнее рядовых, существа не повторяются', () => {
    const r = seeded(9);
    for (const type of DUNGEON_TYPES) {
      for (const tier of TIERS) {
        for (const n of [5, 8]) {
          const d = generateDungeon(type, tier, n, r);
          expect(d.rooms).toHaveLength(n);
          expect(d.rooms[0]!.role).toBe('guardian');
          expect(d.rooms.at(-2)!.role).toBe('climax');
          expect(d.rooms.at(-1)!.role).toBe('reward');
          const boss = MONSTERS[d.rooms.at(-2)!.monster!.index]![2];
          const minions = d.rooms.filter((x) => x.role === 'guardian' || x.role === 'lair').map((x) => MONSTERS[x.monster!.index]![2]);
          expect(boss).toBeGreaterThanOrEqual(Math.max(...minions));
          const ids = d.rooms.flatMap((x) => (x.monster ? [x.monster.index] : []));
          expect(new Set(ids).size).toBe(ids.length);
          expect(new Set(d.rooms.map((x) => x.feature)).size).toBe(n);
          expect(d.hoard.magic.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('название и Markdown; переброс части меняет только её', () => {
    const d = generateDungeon('tomb', 2, 5, seeded(4));
    expect(dungeonName(d, 'ru')).toMatch(/^(Гробница|Склеп|Курган) /);
    const md = dungeonMarkdown(d, 'ru', {
      role: (x) => x, room: (n) => `Комната ${n}`, builder: 'Построили', entrance: 'Вход', hook: 'Зацепка', creatures: 'Существа',
      puzzle: 'Загадка', trap: 'Ловушка', trapRule: () => 'СЛ 13', hoard: 'Клад', hoardLines: ['100 зм'], twist: 'Поворот',
    });
    expect(md).toContain('## Комната 5 — reward');
    expect(md).toMatch(/\*\*Существа:\*\* \[\[[^\]]+\]\]/);
    const next = { ...d, ...generateDungeonPart('hoard', d, seeded(8)) };
    expect(next.rooms).toEqual(d.rooms);
  });
});
