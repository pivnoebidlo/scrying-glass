// A wilderness encounter: a scene on a small map of three places, foes picked by the 2024 budget of the party. Text is
// indexes into content.ts, so it shows in the interface language. What stands where comes from the map's seed.
import { seededRandom, generateLayout, inReveal, ringCells, middleCell, roomReveal, routeBetween, type Cell, type Layout } from '../../../../modules/tools/mapgen/layout';
import { partyBudget, rate, type Budget, type Rating } from '../../difficulty';
import { BEAST_MOTIVES, complicationsOf, SCENES, TALKING_MOTIVES, TERRAINS, WILD_FOES, type Terrain } from './content';

export const DIFFICULTIES = ['low', 'moderate', 'high'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export interface Foe {
  // In WILD_FOES.
  index: number;
  count: number;
}
export interface SkirmishOptions {
  terrain: Terrain;
  level: number;
  heroes: number;
  difficulty: Difficulty;
}
export interface Skirmish extends SkirmishOptions {
  scene: number;
  motive: number;
  complication: number;
  // The first group leads.
  foes: Foe[];
  map: Layout;
}
export const SKIRMISH_PARTS = ['scene', 'foes', 'map'] as const;
export type SkirmishPart = (typeof SKIRMISH_PARTS)[number];

type Random = () => number;
const index = (n: number, r: Random) => Math.floor(r() * n);
const clamp = (n: unknown, lo: number, hi: number, fallback: number) => Math.min(hi, Math.max(lo, Math.round(Number(n)) || fallback));
export const heroLevel = (n: unknown) => clamp(n, 1, 20, 1);
export const heroCount = (n: unknown) => clamp(n, 1, 8, 4);

const XP: Record<number, number> = { 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000 };
export const xpOf = (cr: number) => XP[cr] ?? 0;
export const foesXp = (foes: Foe[]) => foes.reduce((sum, f) => sum + xpOf(WILD_FOES[f.index]![2]) * f.count, 0);
const budgetOf = (o: SkirmishOptions): Budget => partyBudget(Array.from({ length: o.heroes }, () => o.level));
export const foesRating = (x: Pick<Skirmish, 'foes' | 'level' | 'heroes'>): Rating => rate(foesXp(x.foes), budgetOf({ terrain: 'forest', difficulty: 'low', ...x }));
const talks = (foes: Foe[]) => WILD_FOES[foes[0]?.index ?? -1]?.[5] ?? false;

const MAX_GROUP = 8;
// Every group of the place that comes out at the difficulty: one kind of creature, or a leader with others below it.
function groups(o: SkirmishOptions, speaking: boolean): { single: Foe[][]; led: Foe[][]; nearest: Foe[][] } {
  const list = WILD_FOES.map((f, i) => ({ f, i })).filter(({ f }) => f[3].split(' ').includes(o.terrain) && f[2] <= o.level + 3);
  const budget = budgetOf(o);
  const fits = (foes: Foe[]) => rate(foesXp(foes), budget) === o.difficulty;
  const single: Foe[][] = [];
  const led: Foe[][] = [];
  const near: Foe[][] = [];
  for (const { f, i } of list) {
    for (let count = 1; count <= MAX_GROUP; count++) {
      const foes = [{ index: i, count }];
      if (foesXp(foes) <= budget[o.difficulty]) near.push(foes);
      if (fits(foes) && (!speaking || f[5])) single.push(foes);
    }
    if (speaking && !f[5]) continue;
    for (const { f: g, i: j } of list) {
      if (g[2] * 2 > f[2]) continue;
      for (let count = 2; count <= MAX_GROUP - 1; count++) {
        const foes = [{ index: i, count: 1 }, { index: j, count }];
        if (fits(foes)) led.push(foes);
      }
    }
  }
  const nearest = [...near].sort((a, b) => foesXp(b) - foesXp(a)).slice(0, 3);
  return { single, led, nearest };
}
const pick = <T>(list: T[], r: Random) => list[index(list.length, r)]!;
export function pickFoes(o: SkirmishOptions, speaking: boolean, r: Random = Math.random): Foe[] {
  for (const say of speaking ? [true, false] : [false]) {
    const { single, led } = groups(o, say);
    if (led.length && (!single.length || r() < 0.4)) return pick(led, r);
    if (single.length) return pick(single, r);
  }
  // A very small party or a very strong one: the nearest under the budget, else the weakest there is.
  const { nearest } = groups(o, false);
  if (nearest.length) return pick(nearest, r);
  const weakest = WILD_FOES.map((f, i) => ({ f, i })).filter(({ f }) => f[3].split(' ').includes(o.terrain)).sort((a, b) => a.f[2] - b.f[2])[0]!;
  return [{ index: weakest.i, count: 1 }];
}

const sceneFor = (foes: Foe[], r: Random) => {
  const fit = SCENES.map((s, i) => ({ s, i })).filter(({ s }) => !s.talks || talks(foes));
  return pick(fit, r).i;
};
const motiveFor = (foes: Foe[], r: Random) => index((talks(foes) ? TALKING_MOTIVES : BEAST_MOTIVES).length, r);
export const motives = (foes: Foe[]) => (talks(foes) ? TALKING_MOTIVES : BEAST_MOTIVES);

export function generateSkirmishPart(part: SkirmishPart, x: Skirmish, r: Random = Math.random): Partial<Skirmish> {
  switch (part) {
    case 'scene':
      return { scene: sceneFor(x.foes, r), motive: motiveFor(x.foes, r), complication: index(complicationsOf(x.terrain).length, r) };
    case 'foes': {
      const foes = pickFoes(x, SCENES[x.scene]!.talks, r);
      return { foes, motive: motiveFor(foes, r), scene: SCENES[x.scene]!.talks && !talks(foes) ? sceneFor(foes, r) : x.scene };
    }
    case 'map':
      return { map: generateLayout(x.terrain, { rooms: 3, chain: true, big: [1] }, r) };
  }
}

export function generateSkirmish(o: SkirmishOptions, scene: number | null = null, r: Random = Math.random): Skirmish {
  const foes = pickFoes(o, scene !== null && SCENES[scene]!.talks, r);
  const chosen = scene !== null && (!SCENES[scene]!.talks || talks(foes)) ? scene : sceneFor(foes, r);
  const base: Skirmish = { ...o, foes, scene: chosen, motive: motiveFor(foes, r), complication: index(complicationsOf(o.terrain).length, r), map: null as unknown as Layout };
  return { ...base, ...generateSkirmishPart('map', base, r) };
}
export const randomTerrain = (r: Random = Math.random) => TERRAINS[index(TERRAINS.length, r)]!;

// What stands where, the same every time: the heroes' `party` tokens on their place, each group of foes.
export interface SkirmishSpot extends Cell {
  kind: 'party' | 'creature';
  size: number;
  // The group of foes, in `foes`.
  group: number;
}
export function skirmishSpots(x: Pick<Skirmish, 'foes' | 'scene' | 'map' | 'heroes'>, party = x.heroes): SkirmishSpot[] {
  const r = seededRandom(x.map.seed);
  const l = x.map;
  const s = SCENES[x.scene]!;
  const home = s.heroes;
  const sight = roomReveal(l, home);
  const taken = new Set<string>();
  const put = (cells: Cell[], size: number) => cells.forEach((c) => { for (let y = 0; y < size; y++) for (let a = 0; a < size; a++) taken.add(`${c.x + a},${c.y + y}`); });
  const heroes = ringCells(l, middleCell(l, home), party, r, { near: 0, far: 3 });
  put(heroes, 1);
  const free = (c: Cell) => !taken.has(`${c.x},${c.y}`) && !inReveal(l, sight, c);
  const out: SkirmishSpot[] = heroes.map((c) => ({ ...c, kind: 'party', size: 1, group: -1 }));
  const room = (i: number) => ({ at: middleCell(l, i), near: 0, far: Math.min(l.rooms[i]!.w, l.rooms[i]!.h) / 2 });
  x.foes.forEach((f, group) => {
    const size = WILD_FOES[f.index]?.[4] ?? 1;
    const way = routeBetween(l, 0, 1);
    const a = l.rooms[home]!;
    const where =
      s.at === 'ahead' ? room(home + 1)
      : s.at === 'behind' ? room(home - 1)
      : s.at === 'flanks' ? { at: way[Math.floor(way.length * 0.6)] ?? middleCell(l, 1), near: 2, far: 5 }
      : { at: middleCell(l, home), near: Math.max(a.w, a.h) / 2 + 2, far: Math.max(a.w, a.h) / 2 + 7 };
    const cells = ringCells(l, where.at, f.count, r, { near: where.near, far: where.far, size, free });
    put(cells, size);
    out.push(...cells.map((c): SkirmishSpot => ({ ...c, kind: 'creature', size, group })));
  });
  return out;
}
