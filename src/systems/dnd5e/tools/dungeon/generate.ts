// Dungeon generation, a «five-room dungeon»: a guarded entrance, a puzzle, a trap, the climax and the reward (more
// rooms add lairs, empty rooms and more puzzles and traps). Everything is indexes into the content lists (content.ts), so
// the dungeon shows in the interface language; the hoard is the treasure generator's.
import { generateTreasure, type Tier, type Treasure } from '../treasure/generate';
import { SIZES } from '../treasure/content';
import { ATMOSPHERES, BUILDERS, ENTRANCES, FATES, FEATURES, HOOKS, MONSTERS, PLACES, PUZZLES, ROOMS, TWISTS } from './content';
import { OWNERS } from '../relic/content';
import { generateTrap, type Trap } from '../trap/generate';
import { generateLayout, groupCells, roomCells, seededRandom, trapCell, type Cell, type Layout, type LayoutStyle } from '../../../../modules/tools/mapgen/layout';
import type { RoomTheme } from '../../../../modules/tools/mapgen/furnish';

export const DUNGEON_TYPES = ['tomb', 'cave', 'mine', 'temple', 'fortress', 'tower', 'sewer', 'ruins'] as const;
export type DungeonType = (typeof DUNGEON_TYPES)[number];
export const ROLES = ['guardian', 'puzzle', 'lair', 'empty', 'trap', 'climax', 'reward'] as const;
export type Role = (typeof ROLES)[number];

export interface Room {
  role: Role;
  room: number;
  feature: number;
  // Creatures: an index into MONSTERS and how many.
  monster?: { index: number; count: number };
  puzzle?: number;
  // The trap generator's trap, dangerous for the dungeon's level.
  trap?: Trap;
  twist?: number;
}
export interface Dungeon {
  type: DungeonType;
  tier: Tier;
  // Name: a place of the type and an owner (relic generator's list).
  place: number;
  owner: number;
  builder: number;
  fate: number;
  entrance: number;
  atmosphere: number;
  hook: number;
  rooms: Room[];
  // The plan: rooms in the order of `rooms`, one after another.
  map: Layout;
  hoard: Treasure;
}
export const DUNGEON_PARTS = ['name', 'overview', 'rooms', 'map', 'hoard'] as const;
export type DungeonPart = (typeof DUNGEON_PARTS)[number];

type Random = () => number;
const index = (n: number, r: Random) => Math.floor(r() * n);
function some(n: number, size: number, r: Random): number[] {
  const all = Array.from({ length: size }, (_, i) => i);
  const out: number[] = [];
  while (out.length < Math.min(n, size)) out.push(all.splice(index(all.length, r), 1)[0]!);
  return out;
}

// Challenge ratings by tier: the rank and file and the boss.
const MINION_CR: Record<Tier, [number, number]> = { 1: [0.125, 1], 2: [1, 4], 3: [3, 8], 4: [5, 12] };
const BOSS_CR: Record<Tier, [number, number]> = { 1: [2, 3], 2: [4, 8], 3: [9, 14], 4: [15, 30] };
// A group's total challenge, to tell how many of a creature come together.
const GROUP_CR: Record<Tier, number> = { 1: 1, 2: 5, 3: 12, 4: 30 };
export function pickMonster(type: DungeonType, [lo, hi]: [number, number], r: Random, not: number[] = []): number {
  const ok = (i: number) => MONSTERS[i]![2] >= lo && MONSTERS[i]![2] <= hi && !not.includes(i);
  const fresh = MONSTERS.map((_, i) => i).filter(ok);
  // A long dungeon runs out of creatures of the level: they may repeat then.
  const all = fresh.length ? fresh : MONSTERS.map((_, i) => i).filter((i) => MONSTERS[i]![2] >= lo && MONSTERS[i]![2] <= hi);
  const fit = all.filter((i) => MONSTERS[i]![3].split(' ').includes(type));
  const list = fit.length ? fit : all;
  return list[index(list.length, r)] ?? 0;
}
const groupOf = (i: number, tier: Tier, r: Random) =>
  Math.max(1, Math.min(8, Math.round((GROUP_CR[tier] / Math.max(MONSTERS[i]![2], 0.125)) * (0.7 + r() * 0.6))));

// A room's trap: dangerous for the level, with another mechanism than the dungeon's other traps.
export function dungeonTrap(tier: Tier, r: Random = Math.random, not: number[] = []): Trap {
  const make = () => generateTrap({ tier, severity: 'dangerous', kind: 'random', place: 'random' }, r);
  let x = make();
  for (let i = 0; i < 100 && not.includes(x.mechanism); i++) x = make();
  return x;
}

// A dungeon remembered from an older version: traps were one line ({ index, dc }), there was no plan.
export function upgradeDungeon(d: Dungeon, r: Random = Math.random): Dungeon {
  const rooms = d.rooms.map((x) => (x.trap && !('mechanism' in x.trap) ? { ...x, trap: dungeonTrap(d.tier, r) } : x));
  return { ...d, rooms, map: d.map ?? planOf({ type: d.type, rooms }, r) };
}

function roomFor(role: Role, d: Pick<Dungeon, 'type' | 'tier'>, r: Random, used: number[], traps: number[]): Room {
  const base: Room = { role, room: index(ROOMS.length, r), feature: index(FEATURES.length, r) };
  switch (role) {
    case 'guardian':
    case 'lair': {
      const i = pickMonster(d.type, MINION_CR[d.tier], r, used);
      used.push(i);
      return { ...base, monster: { index: i, count: groupOf(i, d.tier, r) } };
    }
    case 'climax': {
      const i = pickMonster(d.type, BOSS_CR[d.tier], r, used);
      used.push(i);
      return { ...base, monster: { index: i, count: 1 } };
    }
    case 'puzzle':
      return { ...base, puzzle: index(PUZZLES.length, r) };
    case 'trap': {
      const trap = dungeonTrap(d.tier, r, traps);
      traps.push(trap.mechanism);
      return { ...base, trap };
    }
    case 'reward':
      return { ...base, twist: r() < 0.5 ? index(TWISTS.length, r) : undefined };
    default:
      return base;
  }
}

// Between the entrance and the end: first what a five-room dungeon has, then more of everything, in a mixed order.
const MIDDLE: Role[] = ['puzzle', 'trap', 'lair', 'empty', 'lair', 'trap', 'puzzle', 'empty'];
export function rolesFor(count: number, r: Random): Role[] {
  const middle = Array.from({ length: Math.max(0, count - 3) }, (_, i) => MIDDLE[i % MIDDLE.length]!);
  if (count > 5) for (let i = middle.length - 1; i > 0; i--) {
    const j = index(i + 1, r);
    [middle[i], middle[j]] = [middle[j]!, middle[i]!];
  }
  return ['guardian', ...middle, 'climax', 'reward'];
}

export function generateRooms(d: Pick<Dungeon, 'type' | 'tier'>, count: number, r: Random = Math.random): Room[] {
  const roles = rolesFor(count, r);
  const used: number[] = [];
  const traps: number[] = [];
  const rooms = roles.map((role) => roomFor(role, d, r, used, traps));
  // Rooms of one dungeon do not repeat their description or feature.
  const kinds = some(rooms.length, ROOMS.length, r);
  const features = some(rooms.length, FEATURES.length, r);
  return rooms.map((room, i) => ({ ...room, room: kinds[i] ?? room.room, feature: features[i] ?? room.feature }));
}

// Natural or dug places are caves on the map, the rest are built.
const MAP_STYLE: Record<DungeonType, LayoutStyle> = { tomb: 'building', cave: 'cave', mine: 'cave', temple: 'building', fortress: 'building', tower: 'building', sewer: 'cave', ruins: 'building' };

// What a room is for on the map, by its part in the story and the kind of the dungeon (the things in it).
const BUILT: Record<'tomb' | 'temple' | 'fortress' | 'tower' | 'ruins', Record<Role, RoomTheme>> = {
  tomb: { guardian: 'crypt', puzzle: 'shrine', lair: 'crypt', empty: 'ruin', trap: 'crypt', climax: 'shrine', reward: 'treasury' },
  temple: { guardian: 'barracks', puzzle: 'library', lair: 'ruin', empty: 'storage', trap: 'shrine', climax: 'shrine', reward: 'treasury' },
  fortress: { guardian: 'barracks', puzzle: 'library', lair: 'ruin', empty: 'storage', trap: 'armory', climax: 'hall', reward: 'treasury' },
  tower: { guardian: 'armory', puzzle: 'library', lair: 'ruin', empty: 'storage', trap: 'library', climax: 'hall', reward: 'treasury' },
  ruins: { guardian: 'ruin', puzzle: 'shrine', lair: 'ruin', empty: 'ruin', trap: 'ruin', climax: 'hall', reward: 'treasury' },
};
export function themeOf(type: DungeonType, role: Role | undefined): RoomTheme | undefined {
  if (!role) return undefined;
  if (type in BUILT) return BUILT[type as keyof typeof BUILT][role];
  return role === 'reward' ? 'treasury' : role === 'lair' ? 'ruin' : undefined;
}

const planOf = (d: Pick<Dungeon, 'type' | 'rooms'>, r: Random) => {
  const climax = d.rooms.findIndex((x) => x?.role === 'climax');
  return generateLayout(MAP_STYLE[d.type], { rooms: d.rooms.length, chain: true, big: climax < 0 ? [] : [climax], themes: d.rooms.map((x) => themeOf(d.type, x?.role)) }, r);
};

// What stands where on the plan, the same every time: creatures in a group, a trap at its place, the hoard.
export interface DungeonSpot extends Cell {
  room: number;
  kind: 'creature' | 'trap' | 'hoard';
  size: number;
}
export function dungeonSpots(d: Pick<Dungeon, 'rooms' | 'map'>): DungeonSpot[] {
  const r = seededRandom(d.map.seed);
  const spot = (c: Cell, room: number, kind: DungeonSpot['kind'], size = 1): DungeonSpot => ({ ...c, room, kind, size });
  return d.rooms.flatMap((x, room) => {
    const size = x.monster ? (MONSTERS[x.monster.index]?.[4] ?? 1) : 1;
    return [
      ...(x.monster ? groupCells(d.map, room, x.monster.count, r, size).map((c) => spot(c, room, 'creature', size)) : []),
      ...(x.trap ? [spot(trapCell(d.map, room, x.trap.place, r), room, 'trap')] : []),
      ...(x.role === 'reward' ? [spot(groupCells(d.map, room, 1, r)[0] ?? roomCells(d.map, room)[0]!, room, 'hoard')] : []),
    ];
  });
}

export function generateDungeonPart(part: DungeonPart, d: Dungeon, r: Random = Math.random): Partial<Dungeon> {
  switch (part) {
    case 'name':
      return { place: index(PLACES[d.type].length, r), owner: index(OWNERS.length, r) };
    case 'overview':
      return {
        builder: index(BUILDERS.length, r),
        fate: index(FATES.length, r),
        entrance: index(ENTRANCES.length, r),
        atmosphere: index(ATMOSPHERES.length, r),
        hook: index(HOOKS.length, r),
      };
    case 'rooms':
      return { rooms: generateRooms(d, d.rooms?.length ?? 5, r) };
    case 'map':
      return { map: planOf(d, r) };
    case 'hoard':
      return { hoard: generateTreasure('hoard', d.tier, SIZES, r) };
  }
}

export function generateDungeon(type: DungeonType, tier: Tier, rooms: number, r: Random = Math.random): Dungeon {
  let d = { type, tier, rooms: Array.from({ length: rooms }) } as unknown as Dungeon;
  for (const part of DUNGEON_PARTS) d = { ...d, ...generateDungeonPart(part, d, r) };
  return d;
}
