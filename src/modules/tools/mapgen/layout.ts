// A generated map as data: floor cells, rooms and doors. Pure and system-free: the picture is drawn from it (draw.ts),
// and later styles, assets and editing work on the same data. One cell is one square of the map's grid.

import { furnish, type Prop, type RoomTheme } from './furnish';

export const LAYOUT_STYLES = ['building', 'cave', 'town', 'forest', 'meadow', 'shore', 'swamp'] as const;
export type LayoutStyle = (typeof LAYOUT_STYLES)[number];
// Under the open sky: places are clearings joined by paths, not rooms.
export const WILD_STYLES = ['forest', 'meadow', 'shore', 'swamp'] as const;
export type WildStyle = (typeof WILD_STYLES)[number];
export const isWild = (style: LayoutStyle): style is WildStyle => (WILD_STYLES as readonly string[]).includes(style);
// No walls round a place: it is a clearing, a square or a crossroads, not a room.
export const isOpenAir = (style: LayoutStyle) => style === 'town' || isWild(style);

export interface LayoutRoom {
  // In cells, the whole room (a cave's chamber lies inside it).
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface LayoutDoor {
  x: number;
  y: number;
  // The way one walks through it.
  along: 'x' | 'y';
}
export interface Layout {
  style: LayoutStyle;
  // For the picture's texture: the same layout always looks the same.
  seed: number;
  w: number;
  h: number;
  // Rows of h strings of w characters. Walkable: '.' floor or grass, ',' path or street, 'P' paved square, 'S' sand,
  // '=' a ford, 'I' ice, 'M' mud, 'F' the floor of a building put up outdoors; not: '#' rock, 'T' tree, 'R' boulder,
  // '~' water, 'H' a house, 'L' lava, 'X' a pit, 'B' the wall of such a building.
  // Since 0.108, outdoors: 'C' cobbles, 'K' a road of stone slabs, 'V' a ploughed field (walkable); 'O' the sea, 'A' mountains,
  // 'N' a fir, 'J' a palm, 'Q' a dead tree (not).
  // The generator makes none of I, M, L, X, F, B and those: only the map editor paints them.
  cells: string[];
  rooms: LayoutRoom[];
  doors: LayoutDoor[];
  pillars: { x: number; y: number }[];
  // A town's houses, for their roofs; their cells are 'H'.
  houses?: LayoutRoom[];
  // Which of the houses are more than houses, each by the place it stands at.
  landmarks?: Landmark[];
  // Things standing about (furnish.ts); none in a layout made before 0.103.
  props?: Prop[];
  // A town's wall round the quarter: its cells are 'W'; towers stand on it, gates where the roads go out.
  wall?: TownWall;
  // The ground's colour (TONES): autumn grass, a wooden floor; none — the usual one.
  tone?: string;
  // Buildings put up of walls and floor ('B', 'F') that have a roof: a cell of each (the roof covers all of it).
  roofs?: { x: number; y: number }[];
  // The time of day (LIGHTS); none — day.
  light?: Light;
  // The world the map is of (GENRES): what the palette offers; none — fantasy.
  genre?: Genre;
}
// Worlds of maps: the palette shows the things and grounds of the map's world and those of any world.
export const GENRES = ['fantasy', 'scifi'] as const;
export type Genre = (typeof GENRES)[number];
export const genreOf = (l: Pick<Layout, 'genre'>): Genre => l.genre ?? 'fantasy';
export const LIGHTS = ['dawn', 'dusk', 'night'] as const;
export type Light = (typeof LIGHTS)[number];
// Ground colours by kind of map: outdoors and in a town the grass, in a building and a cave the floor.
export const TONES = {
  outdoor: ['spring', 'autumn', 'winter', 'dry', 'ash', 'mars', 'moon'],
  building: ['wood', 'marble', 'dark', 'sandstone', 'metal', 'grating'],
  cave: ['dark', 'sandstone', 'frost'],
} as const;
export const tonesFor = (style: LayoutStyle): readonly string[] => (style === 'building' ? TONES.building : style === 'cave' ? TONES.cave : TONES.outdoor);
// The grounds of one world only (the rest are of any).
export const TONE_GENRE: Record<string, Genre> = { mars: 'scifi', moon: 'scifi', metal: 'scifi', grating: 'scifi' };
export const tonesIn = (style: LayoutStyle, genre: Genre) => tonesFor(style).filter((t) => (TONE_GENRE[t] ?? genre) === genre);
export interface TownWall {
  towers: { x: number; y: number }[];
  // The middle of a gate (between the two cells of the road) and the way through it.
  gates: { x: number; y: number; along: 'x' | 'y' }[];
}
export const LANDMARKS = ['tavern', 'temple', 'shop', 'hall', 'smithy'] as const;
export type LandmarkKind = (typeof LANDMARKS)[number];
export interface Landmark {
  // In `houses`.
  house: number;
  kind: LandmarkKind;
}
export interface LayoutOptions {
  rooms: number;
  // Rooms connect in order, one after another (a dungeon's story); else with branches and a loop.
  chain?: boolean;
  // Rooms made larger (the final fight).
  big?: number[];
  // What each room is for, by its index (the things in it); none — chosen at random.
  themes?: (RoomTheme | undefined)[];
  // A town quarter inside its walls.
  walls?: boolean;
}

// How many rooms a generated map can have.
export const MIN_ROOMS = 3;
export const MAX_ROOMS = 30;
export const roomCount = (n: unknown) => Math.min(MAX_ROOMS, Math.max(MIN_ROOMS, Math.round(Number(n)) || MIN_ROOMS));

type Random = () => number;
const MARGIN = 3;
const GAP = 2;
const index = (n: number, r: Random) => Math.floor(r() * n);
const overlaps = (a: LayoutRoom, b: LayoutRoom, gap: number) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
const inside = (a: LayoutRoom, x: number, y: number) => x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h;
const centre = (a: LayoutRoom) => ({ x: a.x + (a.w >> 1), y: a.y + (a.h >> 1) });

interface Placed {
  rooms: LayoutRoom[];
  // [from, to]: room numbers.
  links: [number, number][];
}

// Each room next to its parent, on a random side; `line` — a plain row, which cannot fail.
function place(o: LayoutOptions, cave: boolean, r: Random, line: boolean): Placed | null {
  const size = (i: number) => {
    const extra = (o.big?.includes(i) ? 3 : 0) + (cave ? 3 : 0);
    return { w: 5 + index(5, r) + extra, h: 5 + index(4, r) + extra };
  };
  const rooms: LayoutRoom[] = [{ x: 0, y: 0, ...size(0) }];
  const links: [number, number][] = [];
  for (let i = 1; i < o.rooms; i++) {
    const parent = o.chain || i < 2 || r() < 0.65 ? i - 1 : index(i, r);
    const p = rooms[parent]!;
    let room: LayoutRoom | null = null;
    for (let t = 0; t < 40 && !room; t++) {
      const s = size(i);
      const gap = GAP + 2 + index(4, r);
      const side = line ? 0 : index(4, r);
      const across = (n: number) => index(n * 2 + 1, r) - n;
      const at =
        side === 0 ? { x: p.x + p.w + gap, y: p.y + (line ? 0 : across(3)) } : side === 1 ? { x: p.x - s.w - gap, y: p.y + across(3) } : side === 2 ? { x: p.x + across(3), y: p.y + p.h + gap } : { x: p.x + across(3), y: p.y - s.h - gap };
      const next = { ...at, ...s };
      if (!rooms.some((a) => overlaps(a, next, GAP))) room = next;
    }
    if (!room) return null;
    rooms.push(room);
    links.push([parent, i]);
  }
  return { rooms, links };
}

// An L from one room to another that does not go through a third; null — none found.
function corridor(a: LayoutRoom, b: LayoutRoom, others: LayoutRoom[], r: Random): { x: number; y: number }[] | null {
  for (let t = 0; t < 40; t++) {
    const from = { x: a.x + 1 + index(a.w - 2, r), y: a.y + 1 + index(a.h - 2, r) };
    const to = { x: b.x + 1 + index(b.w - 2, r), y: b.y + 1 + index(b.h - 2, r) };
    const path: { x: number; y: number }[] = [];
    let { x, y } = from;
    const walk = (dx: number, dy: number, until: () => boolean) => {
      while (!until()) {
        path.push({ x, y });
        x += dx;
        y += dy;
      }
    };
    const stepX = () => walk(Math.sign(to.x - x), 0, () => x === to.x);
    const stepY = () => walk(0, Math.sign(to.y - y), () => y === to.y);
    if (t % 2) {
      stepX();
      stepY();
    } else {
      stepY();
      stepX();
    }
    path.push({ x, y });
    const cells = path.map((c) => ({ ...c, w: 1, h: 1 }));
    const out = cells.filter((c) => !inside(a, c.x, c.y) && !inside(b, c.x, c.y));
    // A corridor leaves a room straight away: one cell at each wall, not a run along it.
    const touching = (room: LayoutRoom) => out.filter((c) => overlaps(room, c, 1)).length;
    if (touching(a) <= 1 && touching(b) <= 1 && !cells.some((c) => others.some((o) => overlaps(o, c, 1)))) return path;
  }
  return null;
}

// Floors and walls of any material, on any map (0.108): 'F' planks, 's' stone flags, 't' tiles, 'c' a carpet, 'd' earth,
// 'm' marble; 'B' a wooden wall, 'k' a stone wall, 'r' a brick wall.
export const FLOORS = 'Fstcdm';
export const WALLS = 'Bkr';
export const isFloor = (c: string | undefined) => !!c && FLOORS.includes(c);
export const isWall = (c: string | undefined) => !!c && WALLS.includes(c);
export const walkable = (c: string | undefined) =>
  c === '.' || c === ',' || c === 'P' || c === 'S' || c === '=' || c === 'I' || c === 'M' || c === 'C' || c === 'K' || c === 'V' || isFloor(c);
// A building put up of floors and walls.
export const isBuilt = (c: string | undefined) => isFloor(c) || isWall(c);
// The cells of the building a cell belongs to (its walls and floor joined side by side); none — not a building.
export function buildingAt(l: Layout, x: number, y: number): { x: number; y: number }[] {
  if (!isBuilt(l.cells[y]?.[x])) return [];
  const seen = new Set([`${x},${y}`]);
  const out = [{ x, y }];
  for (let i = 0; i < out.length; i++) {
    const p = out[i]!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const q = { x: p.x + dx, y: p.y + dy };
      const k = `${q.x},${q.y}`;
      if (!seen.has(k) && isBuilt(l.cells[q.y]?.[q.x])) {
        seen.add(k);
        out.push(q);
      }
    }
  }
  return out;
}

interface Margins {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const AROUND: Margins = { left: MARGIN, top: MARGIN, right: MARGIN, bottom: MARGIN };

function shifted({ rooms, links }: Placed, m: Margins = AROUND) {
  const x0 = Math.min(...rooms.map((a) => a.x)) - m.left;
  const y0 = Math.min(...rooms.map((a) => a.y)) - m.top;
  const moved = rooms.map((a) => ({ ...a, x: a.x - x0, y: a.y - y0 }));
  const w = Math.max(...moved.map((a) => a.x + a.w)) + m.right;
  const h = Math.max(...moved.map((a) => a.y + a.h)) + m.bottom;
  return { rooms: moved, links, w, h };
}
const toRows = (grid: boolean[][]) => grid.map((row) => row.map((c) => (c ? '.' : '#')).join(''));
const emptyGrid = (w: number, h: number) => Array.from({ length: h }, () => Array.from({ length: w }, () => false));

function building(placed: Placed, o: LayoutOptions, r: Random, seed: number): Layout | null {
  const { rooms, links, w, h } = shifted(placed);
  const grid = emptyGrid(w, h);
  for (const a of rooms) for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) grid[y]![x] = true;
  const inRoom = (x: number, y: number) => rooms.some((a) => inside(a, x, y));
  const doors = new Map<string, LayoutDoor>();
  const all = [...links];
  // One way round: a loop makes a place more than a line of rooms.
  if (!o.chain && rooms.length > 4) {
    const a = index(rooms.length - 3, r);
    all.push([a, a + 2 + index(rooms.length - a - 2, r)]);
  }
  for (const [from, to] of all) {
    const a = rooms[from]!;
    const b = rooms[to]!;
    const path = corridor(a, b, rooms.filter((c) => c !== a && c !== b), r);
    if (!path) {
      // Only the extra loop may be left out.
      if (links.some((l) => l[0] === from && l[1] === to)) return null;
      continue;
    }
    path.forEach((c, i) => {
      grid[c.y]![c.x] = true;
      const prev = path[i - 1];
      const next = path[i + 1];
      if (inRoom(c.x, c.y)) return;
      const edge = (p?: { x: number; y: number }) => p && inRoom(p.x, p.y);
      if (edge(prev) || edge(next)) {
        const by = edge(prev) ? prev! : next!;
        doors.set(`${c.x},${c.y}`, { x: c.x, y: c.y, along: by.x !== c.x ? 'x' : 'y' });
      }
    });
  }
  // Where corridors meet there is nothing to hang a door on.
  const open = (x: number, y: number) => grid[y]?.[x] === true;
  const hung = [...doors.values()].filter((d) => (d.along === 'x' ? !open(d.x, d.y - 1) && !open(d.x, d.y + 1) : !open(d.x - 1, d.y) && !open(d.x + 1, d.y)));
  const pillars = rooms.flatMap((a) =>
    a.w >= 8 && a.h >= 7 && r() < 0.5
      ? [
          { x: a.x + 2, y: a.y + 2 },
          { x: a.x + a.w - 3, y: a.y + 2 },
          { x: a.x + 2, y: a.y + a.h - 3 },
          { x: a.x + a.w - 3, y: a.y + a.h - 3 },
        ]
      : [],
  );
  return { style: 'building', seed, w, h, cells: toRows(grid), rooms, doors: hung, pillars };
}

// Neighbours of a cell that are floor, itself included.
const around = (g: boolean[][], x: number, y: number) => {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g[y + dy]?.[x + dx]) n++;
  return n;
};
const smooth = (g: boolean[][]) => g.map((row, y) => row.map((_, x) => around(g, x, y) >= 5));

function cave(placed: Placed, r: Random, seed: number): Layout {
  const { rooms, links, w, h } = shifted(placed);
  let grid = emptyGrid(w, h);
  // A chamber: an ellipse with a broken edge, smoothed into a blob.
  for (const a of rooms) {
    const c = { x: a.x + a.w / 2 - 0.5, y: a.y + a.h / 2 - 0.5 };
    for (let y = a.y; y < a.y + a.h; y++) {
      for (let x = a.x; x < a.x + a.w; x++) {
        const d = ((x - c.x) / (a.w / 2)) ** 2 + ((y - c.y) / (a.h / 2)) ** 2;
        if (d < 0.6 || (d < 1.05 && r() < 0.55)) grid[y]![x] = true;
      }
    }
  }
  grid = smooth(smooth(grid));
  const carve = (x: number, y: number) => {
    if (x >= 1 && y >= 1 && x < w - 1 && y < h - 1) grid[y]![x] = true;
  };
  for (const a of rooms) {
    const c = centre(a);
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) carve(c.x + x, c.y + y);
  }
  // A winding tunnel two cells wide, from middle to middle.
  for (const [from, to] of links) {
    let { x, y } = centre(rooms[from]!);
    const end = centre(rooms[to]!);
    for (let t = 0; t < 4000 && (x !== end.x || y !== end.y); t++) {
      const toward = r() < 0.6;
      if (toward ? r() < Math.abs(end.x - x) / (Math.abs(end.x - x) + Math.abs(end.y - y)) : r() < 0.5) x += toward ? Math.sign(end.x - x) : r() < 0.5 ? 1 : -1;
      else y += toward ? Math.sign(end.y - y) : r() < 0.5 ? 1 : -1;
      x = Math.max(2, Math.min(w - 3, x));
      y = Math.max(2, Math.min(h - 3, y));
      carve(x, y);
      carve(x + 1, y);
      carve(x, y + 1);
      carve(x + 1, y + 1);
    }
  }
  // Pockets the tunnels did not reach are not part of the cave.
  const seen = emptyGrid(w, h);
  const start = centre(rooms[0]!);
  const stack = [start];
  seen[start.y]![start.x] = true;
  while (stack.length) {
    const c = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = c.x + dx;
      const y = c.y + dy;
      if (grid[y]?.[x] && !seen[y]![x]) {
        seen[y]![x] = true;
        stack.push({ x, y });
      }
    }
  }
  return { style: 'cave', seed, w, h, cells: toRows(seen), rooms, doors: [], pillars: [] };
}

// Smooth noise 0..1: random heights on a coarse lattice, blended between its points.
function smoothNoise(w: number, h: number, step: number, r: Random) {
  const cols = Math.ceil(w / step) + 2;
  const heights = Array.from({ length: (Math.ceil(h / step) + 2) * cols }, () => r());
  const at = (x: number, y: number) => heights[y * cols + x]!;
  const ease = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = Math.floor(x / step);
    const gy = Math.floor(y / step);
    const fx = ease(x / step - gx);
    const fy = ease(y / step - gy);
    const top = at(gx, gy) + (at(gx + 1, gy) - at(gx, gy)) * fx;
    const low = at(gx, gy + 1) + (at(gx + 1, gy + 1) - at(gx, gy + 1)) * fx;
    return top + (low - top) * fy;
  };
}

// How much of what grows in a place: trees and boulders per cell, and whether a river may run through it.
const BIOMES: Record<WildStyle, { trees: number; boulders: number; river: number; ponds: boolean; sea: boolean }> = {
  forest: { trees: 0.62, boulders: 0.02, river: 0.4, ponds: false, sea: false },
  meadow: { trees: 0.07, boulders: 0.02, river: 0.6, ponds: false, sea: false },
  shore: { trees: 0.16, boulders: 0.05, river: 0, ponds: false, sea: true },
  swamp: { trees: 0.2, boulders: 0, river: 0, ponds: true, sea: false },
};
const SEA = 15;

function wild(placed: Placed, style: WildStyle, r: Random, seed: number): Layout {
  const biome = BIOMES[style];
  const side = index(4, r);
  const sides: (keyof Margins)[] = ['left', 'top', 'right', 'bottom'];
  const margins: Margins = { left: 6, top: 6, right: 6, bottom: 6 };
  if (biome.sea) margins[sides[side]!] = SEA;
  const { rooms, links, w, h } = shifted(placed, margins);
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  const big = smoothNoise(w, h, 9, r);
  const fine = smoothNoise(w, h, 4, r);

  if (biome.sea) {
    const wave = smoothNoise(w, h, 7, r);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const depth = [x, y, w - 1 - x, h - 1 - y][side]!;
        const coast = 5 + wave(x, y) * 6;
        if (depth < coast) grid[y]![x] = '~';
        else if (depth < coast + 2.5) grid[y]![x] = 'S';
      }
    }
  }
  if (biome.ponds) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (big(x, y) * 0.55 + fine(x, y) * 0.45 > 0.6) grid[y]![x] = '~';
  }
  if (r() < biome.river) {
    // Bank to bank, drifting sideways.
    const across = r() < 0.5;
    const length = across ? w : h;
    const span = across ? h : w;
    let at = span * (0.25 + r() * 0.5);
    for (let t = 0; t < length; t++) {
      at = Math.max(2, Math.min(span - 3, at + (r() - 0.5) * 1.8));
      for (let n = -1; n <= 1; n++) {
        const x = across ? t : Math.round(at) + n;
        const y = across ? Math.round(at) + n : t;
        grid[y]![x] = '~';
      }
    }
  }
  // Thickets rather than an even scatter.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y]![x] !== '.') continue;
      const chance = r();
      if (chance < biome.boulders) grid[y]![x] = 'R';
      else if (r() < biome.trees * (0.3 + big(x, y) * 1.4)) grid[y]![x] = 'T';
    }
  }
  // Keep off the water; a ford where a way has to cross it.
  const clear = (x: number, y: number, ground: string, firm = false) => {
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return;
    const was = grid[y]![x]!;
    grid[y]![x] = !firm && (was === '~' || was === '=') ? '=' : ground;
  };
  for (const a of rooms) {
    const c = { x: a.x + a.w / 2 - 0.5, y: a.y + a.h / 2 - 0.5 };
    for (let y = a.y; y < a.y + a.h; y++) {
      for (let x = a.x; x < a.x + a.w; x++) {
        if (((x - c.x) / (a.w / 2)) ** 2 + ((y - c.y) / (a.h / 2)) ** 2 < 0.8 + fine(x, y) * 0.35) clear(x, y, '.', biome.ponds);
      }
    }
  }
  for (const [from, to] of links) {
    let { x, y } = centre(rooms[from]!);
    const end = centre(rooms[to]!);
    for (let t = 0; t < 4000 && (x !== end.x || y !== end.y); t++) {
      const toward = r() < 0.7;
      if (toward ? r() < Math.abs(end.x - x) / (Math.abs(end.x - x) + Math.abs(end.y - y)) : r() < 0.5) x += toward ? Math.sign(end.x - x) : r() < 0.5 ? 1 : -1;
      else y += toward ? Math.sign(end.y - y) : r() < 0.5 ? 1 : -1;
      x = Math.max(2, Math.min(w - 3, x));
      y = Math.max(2, Math.min(h - 3, y));
      clear(x, y, ',');
      clear(x + 1, y, ',');
    }
  }
  return { style, seed, w, h, cells: grid.map((row) => row.join('')), rooms, doors: [], pillars: [] };
}

// A town quarter: paved squares at the places, streets two cells wide between them, roads out of town, and houses in
// rows along the streets. Houses never touch, even at a corner, so the alleys between them all join up.
function town(placed: Placed, o: LayoutOptions, r: Random, seed: number): Layout {
  const { rooms, links, w, h } = shifted(placed, { left: 6, top: 6, right: 6, bottom: 6 });
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  // Every third place is a square; the rest are crossroads, a little wider than the streets that meet there.
  rooms.forEach((a, i) => {
    const c = centre(a);
    const small = i % 3 !== 0 && !o.big?.includes(i);
    const part = small ? { x: c.x - 2, y: c.y - 2, w: 6, h: 6 } : a;
    for (let y = part.y; y < part.y + part.h; y++) for (let x = part.x; x < part.x + part.w; x++) grid[y]![x] = 'P';
  });
  const pave = (x: number, y: number) => {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (grid[y + dy]?.[x + dx] === '.') grid[y + dy]![x + dx] = ',';
  };
  const street = (from: Cell, to: Cell) => {
    const bend = r() < 0.5 ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
    for (const [a, b] of [[from, bend], [bend, to]] as const) {
      let { x, y } = a;
      for (;;) {
        pave(x, y);
        if (x === b.x && y === b.y) break;
        x += Math.sign(b.x - x);
        y += Math.sign(b.y - y);
      }
    }
  };
  const ways = [...links];
  // One way round: a town is not a single street.
  if (!o.chain && rooms.length > 3) {
    const a = index(rooms.length - 2, r);
    ways.push([a, a + 2 + index(rooms.length - a - 2, r)]);
  }
  for (const [from, to] of ways) street(centre(rooms[from]!), centre(rooms[to]!));
  // Roads out of town, to the nearest edge.
  for (const a of [rooms[0]!, rooms[rooms.length - 1]!]) {
    const c = centre(a);
    const edges = [{ x: 0, y: c.y }, { x: w - 2, y: c.y }, { x: c.x, y: 0 }, { x: c.x, y: h - 2 }];
    const far = (e: Cell) => Math.abs(e.x - c.x) + Math.abs(e.y - c.y);
    street(c, [...edges].sort((p, q) => far(p) - far(q))[0]!);
  }

  const houses: LayoutRoom[] = [];
  // The cells of the houses and those next to them.
  const close = emptyGrid(w, h);
  const paved = (c: string | undefined) => c === ',' || c === 'P';
  const fits = (a: LayoutRoom) => {
    if (a.x < 2 || a.y < 2 || a.x + a.w > w - 2 || a.y + a.h > h - 2) return false;
    for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (grid[y]![x] !== '.' || close[y]![x]) return false;
    return true;
  };
  // Does a house look onto the street with a whole side?
  const onStreet = (a: LayoutRoom) => {
    const along = (n: number, f: (i: number) => string | undefined) => Array.from({ length: n }, (_, i) => f(i)).every(paved);
    return along(a.w, (i) => grid[a.y - 1]?.[a.x + i]) || along(a.w, (i) => grid[a.y + a.h]?.[a.x + i]) || along(a.h, (i) => grid[a.y + i]?.[a.x - 1]) || along(a.h, (i) => grid[a.y + i]?.[a.x + a.w]);
  };
  const spots: Cell[] = [];
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (grid[y]![x] === '.') spots.push({ x, y });
  const mixed = spots.map((c) => ({ c, k: r() })).sort((a, b) => a.k - b.k).map((a) => a.c);
  // First the fronts of the streets, then what fits behind them.
  for (const front of [true, false]) {
    for (const c of mixed) {
      for (let t = 0; t < 6; t++) {
        const a = { ...c, w: 3 + index(4, r), h: 3 + index(3, r) };
        if (fits(a) && (front ? onStreet(a) : r() < 0.35)) {
          houses.push(a);
          for (let y = a.y - 1; y <= a.y + a.h; y++) for (let x = a.x - 1; x <= a.x + a.w; x++) close[y]![x] = true;
          break;
        }
      }
    }
  }
  for (const a of houses) for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) grid[y]![x] = 'H';
  // Trees in the yards, away from the walls; alone, so that nothing gets shut in.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let clear = grid[y]![x] === '.';
      for (let dy = -1; dy <= 1 && clear; dy++) for (let dx = -1; dx <= 1; dx++) if (grid[y + dy]![x + dx] === 'H' || grid[y + dy]![x + dx] === 'T') clear = false;
      if (clear && r() < 0.14) grid[y]![x] = 'T';
    }
  }
  // The buildings a quarter is known by: each next to a place, the temple and the hall among the larger ones.
  const order: LandmarkKind[] = ['tavern', 'temple', 'shop', 'hall', 'smithy', 'shop', 'tavern', 'shop'];
  const landmarks: Landmark[] = [];
  order.slice(0, Math.max(2, Math.min(order.length, Math.ceil(rooms.length * 0.8)))).forEach((kind, i) => {
    const place = centre(rooms[i % rooms.length]!);
    const score = (a: LayoutRoom) => Math.hypot(a.x + a.w / 2 - place.x, a.y + a.h / 2 - place.y) - (kind === 'temple' || kind === 'hall' ? a.w * a.h * 0.4 : 0);
    const free = houses.map((a, house) => ({ a, house })).filter(({ house }) => !landmarks.some((m) => m.house === house));
    const best = free.sort((p, q) => score(p.a) - score(q.a))[0];
    if (best) landmarks.push({ house: best.house, kind });
  });
  // A well on a large square, off its middle.
  const pillars = rooms.flatMap((a, i) => (i % 3 === 0 && a.w >= 9 && a.h >= 9 && r() < 0.7 ? [{ x: a.x + (a.w >> 1) - 3, y: a.y + (a.h >> 1) - 2 }] : []));
  return { style: 'town', seed, w, h, cells: grid.map((row) => row.join('')), rooms, doors: [], pillars, houses, landmarks };
}

// The quarter inside its wall: a band of field round it, the wall in that band with towers at the corners and along it;
// the roads that left the quarter go on through gates to the edge of the map.
const BAND = 5;
const WALL_AT = 2;
function walled(l: Layout): Layout {
  const w = l.w + BAND * 2;
  const h = l.h + BAND * 2;
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) grid[y + BAND]![x + BAND] = l.cells[y]![x]!;
  const lo = WALL_AT;
  const hiX = w - 1 - WALL_AT;
  const hiY = h - 1 - WALL_AT;
  const onWall = (x: number, y: number) => ((x === lo || x === hiX) && y >= lo && y <= hiY) || ((y === lo || y === hiY) && x >= lo && x <= hiX);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (onWall(x, y)) grid[y]![x] = 'W';
  // Roads out: a street cell on the quarter's edge goes on straight to the map's edge.
  const gateCells: { x: number; y: number; along: 'x' | 'y' }[] = [];
  const out = (x: number, y: number, dx: number, dy: number) => {
    for (let cx = x + dx, cy = y + dy; cx >= 0 && cy >= 0 && cx < w && cy < h; cx += dx, cy += dy) {
      if (grid[cy]![cx] === 'W') gateCells.push({ x: cx, y: cy, along: dx ? 'x' : 'y' });
      grid[cy]![cx] = ',';
    }
  };
  for (let x = 0; x < l.w; x++) {
    if (l.cells[0]![x] === ',') out(x + BAND, BAND, 0, -1);
    if (l.cells[l.h - 1]![x] === ',') out(x + BAND, BAND + l.h - 1, 0, 1);
  }
  for (let y = 0; y < l.h; y++) {
    if (l.cells[y]![0] === ',') out(BAND, y + BAND, -1, 0);
    if (l.cells[y]![l.w - 1] === ',') out(BAND + l.w - 1, y + BAND, 1, 0);
  }
  // A gate is two cells of road through the wall: its middle, once.
  const gates: TownWall['gates'] = [];
  for (const g of gateCells) {
    const pair = gateCells.find((o) => o !== g && o.along === g.along && (g.along === 'y' ? o.y === g.y && o.x === g.x + 1 : o.x === g.x && o.y === g.y + 1));
    if (pair) gates.push({ x: g.along === 'y' ? g.x + 0.5 : g.x, y: g.along === 'y' ? g.y : g.y + 0.5, along: g.along });
    else if (!gateCells.some((o) => o !== g && o.along === g.along && (g.along === 'y' ? o.y === g.y && o.x === g.x - 1 : o.x === g.x && o.y === g.y - 1))) gates.push({ ...g });
  }
  // Towers: at the corners, on both sides of a gate, and every eight cells or so where nothing is near.
  const towers: TownWall['towers'] = [];
  const add = (x: number, y: number) => {
    if (grid[y]?.[x] === 'W' && !towers.some((t) => Math.abs(t.x - x) + Math.abs(t.y - y) < 4)) towers.push({ x, y });
  };
  for (const g of gates) {
    if (g.along === 'y') (add(Math.floor(g.x) - 1, g.y), add(Math.ceil(g.x) + 1, g.y));
    else (add(g.x, Math.floor(g.y) - 1), add(g.x, Math.ceil(g.y) + 1));
  }
  for (const [x, y] of [[lo, lo], [hiX, lo], [lo, hiY], [hiX, hiY]] as const) add(x, y);
  for (let x = lo + 8; x < hiX - 4; x += 8) (add(x, lo), add(x, hiY));
  for (let y = lo + 8; y < hiY - 4; y += 8) (add(lo, y), add(hiX, y));
  const move = <T extends { x: number; y: number }>(a: T): T => ({ ...a, x: a.x + BAND, y: a.y + BAND });
  return {
    ...l,
    w,
    h,
    cells: grid.map((row) => row.join('')),
    rooms: l.rooms.map(move),
    pillars: l.pillars.map(move),
    houses: l.houses?.map(move),
    wall: { towers, gates },
  };
}

// A small deterministic random (mulberry32): from a layout's seed, the same picture and the same places every time.
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Cell {
  x: number;
  y: number;
}
// Free ground of a room or a clearing: not a pillar, not a door.
export function roomCells(l: Layout, i: number): Cell[] {
  const a = l.rooms[i]!;
  const taken = new Set([...l.pillars, ...l.doors].map((c) => `${c.x},${c.y}`));
  const out: Cell[] = [];
  for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (walkable(l.cells[y]?.[x]) && !taken.has(`${x},${y}`)) out.push({ x, y });
  return out;
}
// A group of creatures `size` cells wide, together and away from the room's number: the corners of their squares.
// When they cannot all fit they stand over each other: every creature is on the map.
export function groupCells(l: Layout, i: number, count: number, r: Random, size = 1): Cell[] {
  const a = l.rooms[i]!;
  const c = { x: a.x + a.w / 2 - 0.5, y: a.y + a.h / 2 - 0.5 };
  const floor = roomCells(l, i);
  const free = new Set(floor.map((p) => `${p.x},${p.y}`));
  const square = (p: Cell) => Array.from({ length: size * size }, (_, n) => `${p.x + (n % size)},${p.y + Math.floor(n / size)}`);
  const fit = floor.filter((p) => square(p).every((k) => free.has(k)));
  const wide = fit.length ? fit : floor;
  const clear = wide.filter((p) => Math.abs(p.x + (size - 1) / 2 - c.x) >= 1.5 + (size - 1) / 2 || Math.abs(p.y + (size - 1) / 2 - c.y) >= 1.5 + (size - 1) / 2);
  const cells = clear.length >= count ? clear : wide;
  const anchor = cells[index(cells.length, r)]!;
  const far = (p: Cell) => (p.x - anchor.x) ** 2 + (p.y - anchor.y) ** 2;
  const near = [...cells].sort((p, q) => far(p) - far(q));
  const taken = new Set<string>();
  const out: Cell[] = [];
  for (const p of near) {
    if (out.length === count) break;
    if (square(p).some((k) => taken.has(k))) continue;
    square(p).forEach((k) => taken.add(k));
    out.push(p);
  }
  for (let n = 0; out.length < count; n++) out.push(near[n % near.length]!);
  return out;
}
// Where a trap of this place stands: in a doorway of the room, in the passage next to it, or inside.
export function trapCell(l: Layout, i: number, place: 'corridor' | 'door' | 'room' | 'treasure', r: Random): Cell {
  const a = l.rooms[i]!;
  const near = (c: Cell, gap: number) => overlaps(a, { ...c, w: 1, h: 1 }, gap);
  const pick = (list: Cell[]) => list[index(list.length, r)];
  const doors = l.doors.filter((d) => near(d, 1));
  const passage: Cell[] = [];
  for (let y = a.y - 4; y < a.y + a.h + 4; y++) {
    for (let x = a.x - 4; x < a.x + a.w + 4; x++) {
      if (l.cells[y]?.[x] === '.' && !l.rooms.some((b) => inside(b, x, y))) passage.push({ x, y });
    }
  }
  if (place === 'door' && doors.length) return pick(doors)!;
  if ((place === 'corridor' || place === 'door') && passage.length) return pick(passage)!;
  return groupCells(l, i, 1, r)[0]!;
}
// The middle of a square `size` cells wide, as a share of the map.
export const cellCentre = (l: Layout, c: Cell, size = 1) => ({ x: (c.x + size / 2) / l.w, y: (c.y + size / 2) / l.h });

// What opening a room shows: its floor and doors, and the rock next to them. Passages stay in the dark, so a cave's
// tunnel is not given away. Rows of cells as [x, y, w, h, …], shares of the map (a fog op).
export function roomReveal(l: Layout, i: number): number[] {
  const a = l.rooms[i]!;
  if (isOpenAir(l.style)) {
    // No walls outdoors: an open circle of sight round the clearing.
    const c = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const rx = a.w / 2 + 2;
    const ry = a.h / 2 + 2;
    const rows: number[] = [];
    for (let y = Math.max(0, Math.floor(c.y - ry)); y < Math.min(l.h, Math.ceil(c.y + ry)); y++) {
      const half = rx * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - c.y) / ry) ** 2));
      const x0 = Math.max(0, Math.round(c.x - half));
      const x1 = Math.min(l.w, Math.round(c.x + half));
      if (x1 > x0) rows.push(x0 / l.w, y / l.h, (x1 - x0) / l.w, 1 / l.h);
    }
    // A house the circle reaches shows whole, not cut across its roof.
    const near = (b: LayoutRoom) => {
      const dx = Math.max(b.x - c.x, 0, c.x - b.x - b.w) / rx;
      const dy = Math.max(b.y - c.y, 0, c.y - b.y - b.h) / ry;
      return dx * dx + dy * dy < 1;
    };
    for (const b of l.houses ?? []) if (near(b)) rows.push(b.x / l.w, b.y / l.h, b.w / l.w, b.h / l.h);
    return rows;
  }
  const key = (x: number, y: number) => `${x},${y}`;
  const start = roomCells(l, i)[0];
  const floor = new Set<string>();
  // One chamber: the floor of the room's rectangle that joins its middle (another tunnel may cross a corner).
  const c = centre(a);
  const stack = [l.cells[c.y]?.[c.x] === '.' ? c : start!];
  floor.add(key(stack[0]!.x, stack[0]!.y));
  while (stack.length) {
    const p = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (inside(a, x, y) && l.cells[y]?.[x] === '.' && !floor.has(key(x, y))) {
        floor.add(key(x, y));
        stack.push({ x, y });
      }
    }
  }
  for (const d of l.doors) if (overlaps(a, { ...d, w: 1, h: 1 }, 1)) floor.add(key(d.x, d.y));
  const seen = new Set(floor);
  for (const k of floor) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (l.cells[y + dy]?.[x + dx] === '#') seen.add(key(x + dx, y + dy));
  }
  const out: number[] = [];
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (!seen.has(key(x, y)) || seen.has(key(x - 1, y))) continue;
      let w = 1;
      while (seen.has(key(x + w, y))) w++;
      out.push(x / l.w, y / l.h, w / l.w, 1 / l.h);
    }
  }
  return out;
}

export const roomCentre = (l: Layout, i: number) => {
  const a = l.rooms[i]!;
  return { x: (a.x + a.w / 2) / l.w, y: (a.y + a.h / 2) / l.h };
};
// The same in cells: the cell at the middle of a room.
export const middleCell = (l: Layout, i: number): Cell => centre(l.rooms[i]!);

// The shortest way on foot from the middle of one room to the middle of another; empty when there is none.
export function routeBetween(l: Layout, from: number, to: number): Cell[] {
  const start = middleCell(l, from);
  const end = middleCell(l, to);
  const key = (c: Cell) => `${c.x},${c.y}`;
  const came = new Map<string, Cell | null>([[key(start), null]]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i]!;
    if (c.x === end.x && c.y === end.y) {
      const way: Cell[] = [];
      for (let at: Cell | null = c; at; at = came.get(key(at)) ?? null) way.unshift(at);
      return way;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const next = { x: c.x + dx, y: c.y + dy };
      if (walkable(l.cells[next.y]?.[next.x]) && !came.has(key(next))) {
        came.set(key(next), c);
        queue.push(next);
      }
    }
  }
  return [];
}

// Is this cell inside what a room's reveal shows (roomReveal)?
export function inReveal(l: Layout, rects: number[], c: Cell): boolean {
  const x = (c.x + 0.5) / l.w;
  const y = (c.y + 0.5) / l.h;
  for (let i = 0; i + 3 < rects.length; i += 4) {
    if (x >= rects[i]! && y >= rects[i + 1]! && x < rects[i]! + rects[i + 2]! && y < rects[i + 1]! + rects[i + 3]!) return true;
  }
  return false;
}

// Free squares `size` cells wide, scattered near..far cells from a point, the corners of the squares. On plain ground
// when there is room, and farther out when `count` does not fit; every creature gets a square, or stands over another.
export interface Ring {
  near: number;
  far: number;
  size?: number;
  free?: (c: Cell) => boolean;
}
export function ringCells(l: Layout, at: Cell, count: number, r: Random, { near, far, size = 1, free = () => true }: Ring): Cell[] {
  const square = (p: Cell) => Array.from({ length: size * size }, (_, n) => ({ x: p.x + (n % size), y: p.y + Math.floor(n / size) }));
  const open = (c: Cell) => walkable(l.cells[c.y]?.[c.x]) && free(c);
  const all: Cell[] = [];
  for (let y = 0; y < l.h - size + 1; y++) for (let x = 0; x < l.w - size + 1; x++) if (square({ x, y }).every(open)) all.push({ x, y });
  const off = (p: Cell) => Math.hypot(p.x + (size - 1) / 2 - at.x, p.y + (size - 1) / 2 - at.y);
  const shuffled = all.map((p) => ({ p, k: r() + (l.cells[p.y]?.[p.x] === '.' ? 0 : 1) })).sort((a, b) => a.k - b.k).map((a) => a.p);
  const taken = new Set(l.pillars.map((c) => `${c.x},${c.y}`));
  const out: Cell[] = [];
  for (let reach = far; out.length < count && reach <= far + Math.max(l.w, l.h); reach += 2) {
    for (const p of shuffled) {
      if (out.length === count) break;
      if (off(p) < near || off(p) > reach || square(p).some((c) => taken.has(`${c.x},${c.y}`))) continue;
      square(p).forEach((c) => taken.add(`${c.x},${c.y}`));
      out.push(p);
    }
  }
  const spare = out[0] ?? at;
  while (out.length < count) out.push(spare);
  return out;
}

export function generateLayout(style: LayoutStyle, o: LayoutOptions, r: Random = Math.random): Layout {
  const l = bareLayout(style, o, r);
  return { ...l, props: furnish(l, o.themes) };
}

function bareLayout(style: LayoutStyle, o: LayoutOptions, r: Random): Layout {
  const seed = index(2 ** 31, r);
  if (style === 'town' || isWild(style)) {
    const make = (placed: Placed) => (style === 'town' ? (o.walls ? walled(town(placed, o, r, seed)) : town(placed, o, r, seed)) : wild(placed, style, r, seed));
    for (let t = 0; t < 60; t++) {
      const placed = place(o, true, r, false);
      if (placed) return make(placed);
    }
    return make(place({ ...o, chain: true }, true, r, true)!);
  }
  const cavey = style === 'cave';
  for (let t = 0; t < 60; t++) {
    const placed = place(o, cavey, r, false);
    if (!placed) continue;
    const l = cavey ? cave(placed, r, seed) : building(placed, o, r, seed);
    if (l) return l;
  }
  // A row of rooms always fits and always connects.
  const placed = place({ ...o, chain: true }, cavey, r, true)!;
  return cavey ? cave(placed, r, seed) : building(placed, { ...o, chain: true }, r, seed)!;
}
