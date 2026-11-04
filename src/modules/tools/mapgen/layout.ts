// A generated map as data: floor cells, rooms and doors. Pure and system-free: the picture is drawn from it (draw.ts),
// and later styles, assets and editing work on the same data. One cell is one square of the map's grid.

export const LAYOUT_STYLES = ['building', 'cave'] as const;
export type LayoutStyle = (typeof LAYOUT_STYLES)[number];

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
  // Rows of h strings of w characters: '.' floor, '#' rock.
  cells: string[];
  rooms: LayoutRoom[];
  doors: LayoutDoor[];
  pillars: { x: number; y: number }[];
}
export interface LayoutOptions {
  rooms: number;
  // Rooms connect in order, one after another (a dungeon's story); else with branches and a loop.
  chain?: boolean;
  // Rooms made larger (the final fight).
  big?: number[];
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

function shifted({ rooms, links }: Placed) {
  const x0 = Math.min(...rooms.map((a) => a.x)) - MARGIN;
  const y0 = Math.min(...rooms.map((a) => a.y)) - MARGIN;
  const moved = rooms.map((a) => ({ ...a, x: a.x - x0, y: a.y - y0 }));
  const w = Math.max(...moved.map((a) => a.x + a.w)) + MARGIN;
  const h = Math.max(...moved.map((a) => a.y + a.h)) + MARGIN;
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
// Free floor of a room: not a pillar, not a door.
export function roomCells(l: Layout, i: number): Cell[] {
  const a = l.rooms[i]!;
  const taken = new Set([...l.pillars, ...l.doors].map((c) => `${c.x},${c.y}`));
  const out: Cell[] = [];
  for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (l.cells[y]?.[x] === '.' && !taken.has(`${x},${y}`)) out.push({ x, y });
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

export function generateLayout(style: LayoutStyle, o: LayoutOptions, r: Random = Math.random): Layout {
  const seed = index(2 ** 31, r);
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
