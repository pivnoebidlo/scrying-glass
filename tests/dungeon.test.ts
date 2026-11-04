import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ATMOSPHERES, BUILDERS, ENTRANCES, FATES, FEATURES, HOOKS, MONSTERS, PLACES, PUZZLES, ROOMS, TWISTS } from '../src/systems/dnd5e/tools/dungeon/content';
import { DUNGEON_TYPES, dungeonSpots, dungeonTrap, generateDungeon, generateDungeonPart, rolesFor, upgradeDungeon } from '../src/systems/dnd5e/tools/dungeon/generate';
import { dungeonMarkdown, dungeonName } from '../src/systems/dnd5e/tools/dungeon/text';
import { TIERS } from '../src/systems/dnd5e/tools/treasure/generate';
import { mechanismOf, trapLabels, trapName } from '../src/systems/dnd5e/tools/trap/text';
import { TRAP_DAMAGE } from '../src/systems/dnd5e/tools/trap/generate';

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
      puzzle: 'Загадка', trap: 'Ловушка', trapLabels: trapLabels('ru'), hoard: 'Клад', hoardLines: ['100 зм'], twist: 'Поворот',
    });
    expect(md).toContain('## Комната 5 — reward');
    expect(md).toMatch(/\*\*Существа:\*\* \[\[[^\]]+\]\]/);
    const next = { ...d, ...generateDungeonPart('hoard', d, seeded(8)) };
    expect(next.rooms).toEqual(d.rooms);
  });

  it('ловушка комнаты — из генератора: опасная, по уровню; переброс даёт другой механизм', () => {
    const r = seeded(21);
    for (let i = 0; i < 40; i++) {
      const traps = generateDungeon('cave', 3, i % 2 ? 8 : 5, r).rooms.flatMap((x) => (x.trap ? [x.trap] : []));
      expect(traps.length).toBeGreaterThan(0);
      expect([traps[0]!.tier, traps[0]!.severity]).toEqual([3, 'dangerous']);
      expect(dungeonTrap(3, r, [traps[0]!.mechanism]).mechanism).not.toBe(traps[0]!.mechanism);
    }
  });

  it('в журнал кубы ловушки идут с броском, без правил (не D&D) — только описание', () => {
    const d = generateDungeon('tomb', 2, 5, seeded(4));
    const trap = d.rooms.find((x) => x.trap)!.trap!;
    const l = (rules: boolean) => ({
      role: (x: string) => x, room: (n: number) => `R${n}`, builder: 'B', entrance: 'E', hook: 'H', creatures: 'C', puzzle: 'P', trap: 'Trap',
      trapLabels: trapLabels('en', rules), hoard: 'H', hoardLines: [], twist: 'T',
    });
    const dice = TRAP_DAMAGE.dangerous[2];
    const journal = dungeonMarkdown(d, 'en', l(true), false, true);
    expect(journal).toContain(`**Trap: ${trapName(trap, 'en')}**`);
    if (mechanismOf(trap)?.damage) expect(journal).toContain(`{${dice}}`);
    expect(dungeonMarkdown(d, 'en', l(true))).not.toContain(`{${dice}}`);
    const plain = dungeonMarkdown(d, 'en', l(false));
    expect(plain).not.toMatch(/\bDC \d/);
    expect(plain).not.toContain(dice);
  });

  it('подземелье, запомненное до 0.78: старые ловушки заменяются', () => {
    const d = generateDungeon('tomb', 2, 5, seeded(4));
    const old = { ...d, rooms: d.rooms.map((x) => (x.trap ? { ...x, trap: { index: 3, dc: 13 } } : x)) } as unknown as typeof d;
    const next = upgradeDungeon(old, seeded(5));
    expect(next.rooms.find((x) => x.trap)!.trap!.tier).toBe(2);
    expect(upgradeDungeon(d, seeded(5))).toEqual(d);
  });

  it('у подземелья есть план: комнат столько же, вид по месту, финальная комната больше', () => {
    const r = seeded(31);
    expect(generateDungeon('cave', 1, 8, r).map).toMatchObject({ style: 'cave' });
    const d = generateDungeon('tomb', 1, 5, r);
    expect(d.map.style).toBe('building');
    expect(d.map.rooms).toHaveLength(5);
    expect(d.map.rooms[3]!.w).toBeGreaterThanOrEqual(8);
    const { map: _gone, ...old } = d;
    expect(upgradeDungeon(old as typeof d, r).map.rooms).toHaveLength(5);
  });

  it('любое число комнат: начало и конец на месте, в середине всё по кругу; существа могут повториться только в длинном', () => {
    const r = seeded(41);
    expect(rolesFor(3, r)).toEqual(['guardian', 'climax', 'reward']);
    expect(rolesFor(5, r)).toEqual(['guardian', 'puzzle', 'trap', 'climax', 'reward']);
    for (const n of [3, 4, 6, 7, 11, 20, 30]) {
      const d = generateDungeon('fortress', 2, n, r);
      expect(d.rooms).toHaveLength(n);
      expect(d.map.rooms).toHaveLength(n);
      expect(d.rooms[0]!.role).toBe('guardian');
      expect(d.rooms.at(-1)!.role).toBe('reward');
      expect(Math.max(d.map.w, d.map.h)).toBeLessThanOrEqual(200);
    }
    const many = generateDungeon('cave', 1, 30, r).rooms.flatMap((x) => (x.trap ? [x.trap.mechanism] : []));
    expect(new Set(many).size).toBe(many.length);
    const long = generateDungeon('cave', 1, 30, r).rooms.map((x) => x.role);
    for (const role of ['puzzle', 'trap', 'lair', 'empty']) expect(long.filter((x) => x === role).length, role).toBeGreaterThan(2);
  });

  it('на плане всё стоит на полу: существ — сколько их в комнате, у ловушки своё место, клад в награде; без случайностей', () => {
    const r = seeded(43);
    for (const type of ['tomb', 'cave'] as const) {
      for (let i = 0; i < 40; i++) {
        const d = generateDungeon(type, 1, 12, r);
        const spots = dungeonSpots(d);
        for (const c of spots) {
          for (let y = 0; y < c.size; y++) for (let x = 0; x < c.size; x++) expect(d.map.cells[c.y + y]![c.x + x], `${c.kind} ${c.x},${c.y} ×${c.size}`).toBe('.');
        }
        d.rooms.forEach((x, room) => {
          const here = spots.filter((c) => c.room === room);
          expect(here.filter((c) => c.kind === 'creature')).toHaveLength(x.monster?.count ?? 0);
          expect(here.filter((c) => c.kind === 'trap')).toHaveLength(x.trap ? 1 : 0);
          const cells = here.filter((c) => c.kind === 'creature').map((c) => `${c.x},${c.y}`);
          expect(new Set(cells).size).toBe(cells.length);
        });
        expect(spots.filter((c) => c.kind === 'hoard')).toHaveLength(1);
        expect(dungeonSpots(d)).toEqual(spots);
      }
    }
  });

  it('размер существа совпадает с карточкой SRD 2024: жетон по клеткам сетки', () => {
    const cards = JSON.parse(fs.readFileSync('content/dnd5e-srd/bestiary/dnd5e-2024.json', 'utf8'));
    const CELLS: Record<string, number> = { tiny: 1, small: 1, medium: 1, large: 2, huge: 3, gargantuan: 4 };
    const size = new Map((cards.cards ?? cards).filter((c: { lang: string }) => c.lang === 'en').map((c: { name: string; stats: { size: string[] } }) => [c.name, Math.max(...c.stats.size.map((x) => CELLS[x]!))]));
    for (const [en, , , , cells] of MONSTERS) expect(cells ?? 1, en).toBe(size.get(en));
    const r = seeded(47);
    const d = generateDungeon('fortress', 4, 8, r);
    const boss = d.rooms.findIndex((x) => x.role === 'climax');
    const spots = dungeonSpots(d).filter((c) => c.room === boss && c.kind === 'creature');
    expect(spots[0]!.size).toBe(MONSTERS[d.rooms[boss]!.monster!.index]![4] ?? 1);
  });
});
