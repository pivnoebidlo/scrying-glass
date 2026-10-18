// Dungeon generation, a «five-room dungeon»: a guarded entrance, a puzzle, a trap, the climax and the reward (eight
// rooms add a lair, an empty room and another trap). Everything is indexes into the content lists (content.ts), so
// the dungeon shows in the interface language; the hoard is the treasure generator's.
import { generateTreasure, type Tier, type Treasure } from '../treasure/generate';
import { SIZES } from '../treasure/content';
import { ATMOSPHERES, BUILDERS, ENTRANCES, FATES, FEATURES, HOOKS, MONSTERS, PLACES, PUZZLES, ROOMS, TRAPS, TWISTS } from './content';
import { OWNERS } from '../relic/content';

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
  trap?: { index: number; dc: number };
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
  hoard: Treasure;
}
export const DUNGEON_PARTS = ['name', 'overview', 'rooms', 'hoard'] as const;
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
// Trap damage (SRD «damage severity by level», dangerous).
export const TRAP_DICE: Record<Tier, string> = { 1: '2d10', 2: '4d10', 3: '10d10', 4: '18d10' };

export function pickMonster(type: DungeonType, [lo, hi]: [number, number], r: Random, not: number[] = []): number {
  const ok = (i: number) => MONSTERS[i]![2] >= lo && MONSTERS[i]![2] <= hi && !not.includes(i);
  const all = MONSTERS.map((_, i) => i).filter(ok);
  const fit = all.filter((i) => MONSTERS[i]![3].split(' ').includes(type));
  const list = fit.length ? fit : all;
  return list[index(list.length, r)] ?? 0;
}
const groupOf = (i: number, tier: Tier, r: Random) =>
  Math.max(1, Math.min(8, Math.round((GROUP_CR[tier] / Math.max(MONSTERS[i]![2], 0.125)) * (0.7 + r() * 0.6))));

function roomFor(role: Role, d: Pick<Dungeon, 'type' | 'tier'>, r: Random, used: number[]): Room {
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
    case 'trap':
      return { ...base, trap: { index: index(TRAPS.length, r), dc: 12 + index(4, r) } };
    case 'reward':
      return { ...base, twist: r() < 0.5 ? index(TWISTS.length, r) : undefined };
    default:
      return base;
  }
}

export function generateRooms(d: Pick<Dungeon, 'type' | 'tier'>, count: number, r: Random = Math.random): Room[] {
  const roles: Role[] = count > 5 ? ['guardian', 'puzzle', 'lair', 'empty', 'trap', 'lair', 'climax', 'reward'] : ['guardian', 'puzzle', 'trap', 'climax', 'reward'];
  const used: number[] = [];
  const rooms = roles.map((role) => roomFor(role, d, r, used));
  // Rooms of one dungeon do not repeat their description or feature.
  const kinds = some(rooms.length, ROOMS.length, r);
  const features = some(rooms.length, FEATURES.length, r);
  return rooms.map((room, i) => ({ ...room, room: kinds[i] ?? room.room, feature: features[i] ?? room.feature }));
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
    case 'hoard':
      return { hoard: generateTreasure('hoard', d.tier, SIZES, r) };
  }
}

export function generateDungeon(type: DungeonType, tier: Tier, rooms: number, r: Random = Math.random): Dungeon {
  let d = { type, tier, rooms: Array.from({ length: rooms }) } as unknown as Dungeon;
  for (const part of DUNGEON_PARTS) d = { ...d, ...generateDungeonPart(part, d, r) };
  return d;
}
