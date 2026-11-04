import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inReveal, roomCells, roomReveal, routeBetween, walkable, WILD_STYLES } from '../src/modules/tools/mapgen/layout';
import { partyBudget, rate } from '../src/systems/dnd5e/difficulty';
import { BEAST_MOTIVES, complicationsOf, GROUND, SCENES, TALKING_MOTIVES, WILD_FOES } from '../src/systems/dnd5e/tools/skirmish/content';
import { DIFFICULTIES, foesXp, generateSkirmish, generateSkirmishPart, pickFoes, skirmishSpots, xpOf } from '../src/systems/dnd5e/tools/skirmish/generate';
import { skirmishMarkdown, skirmishTexts } from '../src/systems/dnd5e/tools/skirmish/text';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const load = (ed: string) => {
  const d = JSON.parse(fs.readFileSync(`content/dnd5e-srd/bestiary/dnd5e-${ed}.json`, 'utf8'));
  return (d.cards ?? d) as { lang: string; name: string; stats: { cr: number; size: string[]; xp?: number } }[];
};

describe('встреча на местности', () => {
  it('существа есть в обеих редакциях на обоих языках, ПО и размер — по SRD 2024', () => {
    const CELLS: Record<string, number> = { tiny: 1, small: 1, medium: 1, large: 2, huge: 3, gargantuan: 4 };
    const cards = load('2024');
    const old = load('2014');
    for (const [en, ru, cr, terrains, cells] of WILD_FOES) {
      const card = cards.find((c) => c.lang === 'en' && c.name === en);
      expect(card, en).toBeTruthy();
      expect(cards.some((c) => c.lang === 'ru' && c.name === ru), ru).toBe(true);
      expect(old.some((c) => c.lang === 'en' && c.name === en), en).toBe(true);
      expect(old.some((c) => c.lang === 'ru' && c.name === ru), ru).toBe(true);
      expect(card!.stats.cr, en).toBe(cr);
      expect(Math.max(...card!.stats.size.map((s) => CELLS[s]!)), en).toBe(cells);
      expect(xpOf(cr), en).toBeGreaterThan(0);
      for (const t of terrains.split(' ')) expect(WILD_STYLES as readonly string[], en).toContain(t);
    }
    for (const t of WILD_STYLES) for (const p of [...complicationsOf(t), GROUND[t]]) expect(p[0] && p[1]).toBeTruthy();
    for (const p of [...TALKING_MOTIVES, ...BEAST_MOTIVES, ...SCENES.flatMap((s) => [s.title, s.text, s.start])]) expect(p[0] && p[1]).toBeTruthy();
  });

  it('враги подходят под сложность партии на обычных уровнях', () => {
    const r = seeded(5);
    let exact = 0;
    let all = 0;
    for (const terrain of WILD_STYLES) {
      for (const difficulty of DIFFICULTIES) {
        for (const level of [1, 2, 3, 5, 8, 11, 15, 20]) {
          for (const heroes of [3, 4, 6]) {
            const foes = pickFoes({ terrain, level, heroes, difficulty }, false, r);
            const budget = partyBudget(Array.from({ length: heroes }, () => level));
            const xp = foesXp(foes);
            all++;
            if (rate(xp, budget) === difficulty) exact++;
            expect(xp).toBeLessThanOrEqual(budget[difficulty] * 1.0001);
            expect(foes.reduce((n, f) => n + f.count, 0)).toBeLessThanOrEqual(8);
            for (const f of foes) expect(WILD_FOES[f.index]![3]).toContain(terrain);
          }
        }
      }
    }
    expect(exact / all).toBeGreaterThan(0.9);
  });

  it('сцена с разговором — только с теми, кто говорит; выбранная сцена сохраняется', () => {
    const r = seeded(7);
    for (let i = 0; i < 200; i++) {
      const x = generateSkirmish({ terrain: WILD_STYLES[i % 4]!, level: 1 + (i % 20), heroes: 4, difficulty: 'moderate' }, null, r);
      if (SCENES[x.scene]!.talks) expect(WILD_FOES[x.foes[0]!.index]![5]).toBe(true);
    }
    const parley = SCENES.findIndex((s) => s.id === 'parley');
    expect(generateSkirmish({ terrain: 'forest', level: 3, heroes: 4, difficulty: 'moderate' }, parley, r).scene).toBe(parley);
    const beasts = generateSkirmish({ terrain: 'forest', level: 3, heroes: 4, difficulty: 'moderate' }, null, r);
    const x = { ...beasts, ...generateSkirmishPart('foes', beasts, r) };
    if (SCENES[x.scene]!.talks) expect(WILD_FOES[x.foes[0]!.index]![5]).toBe(true);
  });

  it('все стоят на земле, не друг на друге; герои на своём месте, враги в тумане; расстановка постоянна', () => {
    const r = seeded(11);
    for (let i = 0; i < 300; i++) {
      const x = generateSkirmish({ terrain: WILD_STYLES[i % 4]!, level: 1 + (i % 20), heroes: 1 + (i % 8), difficulty: DIFFICULTIES[i % 3]! }, i % SCENES.length, r);
      const s = SCENES[x.scene]!;
      expect(x.map.rooms).toHaveLength(3);
      expect(routeBetween(x.map, 0, 1).length).toBeGreaterThan(0);
      expect(routeBetween(x.map, 1, 2).length).toBeGreaterThan(0);
      const spots = skirmishSpots(x);
      expect(skirmishSpots(x)).toEqual(spots);
      expect(spots.filter((c) => c.kind === 'party')).toHaveLength(x.heroes);
      expect(spots.filter((c) => c.kind === 'creature')).toHaveLength(x.foes.reduce((n, f) => n + f.count, 0));
      const sight = roomReveal(x.map, s.heroes);
      const seen = new Set<string>();
      const home = new Set(roomCells(x.map, s.heroes).map((c) => `${c.x},${c.y}`));
      for (const c of spots) {
        for (let a = 0; a < c.size; a++) {
          for (let b = 0; b < c.size; b++) {
            const k = `${c.x + a},${c.y + b}`;
            expect(walkable(x.map.cells[c.y + b]?.[c.x + a]), k).toBe(true);
            expect(seen.has(k), k).toBe(false);
            seen.add(k);
            if (c.kind === 'creature') expect(inReveal(x.map, sight, { x: c.x + a, y: c.y + b }), k).toBe(false);
          }
        }
        if (c.kind === 'party') expect(home.has(`${c.x},${c.y}`)).toBe(true);
      }
    }
  });

  it('текст и Markdown на обоих языках', () => {
    const x = generateSkirmish({ terrain: 'swamp', level: 5, heroes: 4, difficulty: 'high' }, 0, seeded(3));
    const md = skirmishMarkdown(x, 'ru', { place: 'Болото', foes: 'Враги', worth: '1000 опыта', start: 'С чего начинается', motive: 'Чего они хотят', complication: 'Осложнение', ground: 'Местность' });
    expect(md).toContain('# Засада (Болото)');
    expect(md).toMatch(/\*\*Враги:\*\* \[\[/);
    expect(skirmishTexts(x, 'en').title).toBe('Ambush');
  });
});
