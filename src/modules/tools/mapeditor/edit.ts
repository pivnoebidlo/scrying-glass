// The map editor's data and moves: a draft is a layout of the map generator (mapgen/layout.ts), kept in a file
// «Name.map.json» in an adventure's maps folder. Pure functions — every move returns a new layout; the picture is
// drawn from it the same way as a generated one.
import { LAYOUT_STYLES, isWild, tonesFor, walkable, type Layout, type LayoutRoom, type LayoutStyle } from '../mapgen/layout';
import { PROP_KINDS, type Facing, type Prop, type PropKind } from '../mapgen/furnish';

export const MAP_DRAFT_SUFFIX = '.map.json';
export const isMapDraft = (path: string) => path.toLowerCase().endsWith(MAP_DRAFT_SUFFIX);

export interface MapDraft {
  scryingGlass: 'map';
  version: 1;
  layout: Layout;
}

export const MIN_SIDE = 6;
export const MAX_SIDE = 120;
const CELLS = /^[.#,PST~RH=WLIMX]*$/;
const side = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= MIN_SIDE && n <= MAX_SIDE;
const int = (n: unknown) => typeof n === 'number' && Number.isInteger(n);

// A draft from a file, which may be anyone's: only what makes sense is kept; none — not a map.
export function parseDraft(x: unknown): MapDraft | null {
  const l = (x as { layout?: Record<string, unknown> } | null)?.layout;
  if ((x as { scryingGlass?: unknown })?.scryingGlass !== 'map' || !l) return null;
  const { w, h } = l as { w: unknown; h: unknown };
  if (!side(w) || !side(h)) return null;
  const W = w as number;
  const H = h as number;
  const cells = Array.isArray(l['cells']) ? (l['cells'] as unknown[]) : [];
  if (cells.length !== H || !cells.every((r) => typeof r === 'string' && r.length === W && CELLS.test(r))) return null;
  const style = LAYOUT_STYLES.includes(l['style'] as LayoutStyle) ? (l['style'] as LayoutStyle) : null;
  if (!style) return null;
  const inside = (a: { x: number; y: number; w?: number; h?: number }) => a.x >= 0 && a.y >= 0 && a.x + (a.w ?? 1) <= W && a.y + (a.h ?? 1) <= H;
  const rects = (v: unknown, max: number): LayoutRoom[] =>
    (Array.isArray(v) ? v : [])
      .filter((a): a is LayoutRoom => !!a && int(a.x) && int(a.y) && int(a.w) && int(a.h) && a.w > 0 && a.h > 0 && inside(a))
      .slice(0, max)
      .map((a) => ({ x: a.x, y: a.y, w: a.w, h: a.h }));
  const points = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : []).filter((p): p is { x: number; y: number } => !!p && int(p.x) && int(p.y) && inside(p)).slice(0, max).map((p) => ({ x: p.x, y: p.y }));
  const doors = (Array.isArray(l['doors']) ? l['doors'] : [])
    .filter((d): d is { x: number; y: number; along: 'x' | 'y' } => !!d && int(d.x) && int(d.y) && (d.along === 'x' || d.along === 'y') && inside(d))
    .slice(0, 2000)
    .map((d) => ({ x: d.x, y: d.y, along: d.along }));
  const props = (Array.isArray(l['props']) ? l['props'] : [])
    .filter((p): p is Prop => !!p && PROP_KINDS.includes(p.kind) && int(p.x) && int(p.y) && int(p.w) && int(p.h) && p.w > 0 && p.h > 0 && p.w <= 12 && p.h <= 12 && inside(p))
    .slice(0, 5000)
    .map((p) => ({ kind: p.kind, x: p.x, y: p.y, w: p.w, h: p.h, ...(p.face === 1 || p.face === 2 || p.face === 3 ? { face: p.face } : {}), ...(typeof p.tint === 'number' && p.tint >= 0 && p.tint <= 1 ? { tint: p.tint } : {}) }));
  const houses = rects(l['houses'], 2000);
  const landmarks = (Array.isArray(l['landmarks']) ? l['landmarks'] : []).filter(
    (m): m is { house: number; kind: 'tavern' | 'temple' | 'shop' | 'hall' | 'smithy' } => !!m && int(m.house) && m.house >= 0 && m.house < houses.length && ['tavern', 'temple', 'shop', 'hall', 'smithy'].includes(m.kind),
  );
  const wallRaw = l['wall'] as { towers?: unknown; gates?: unknown } | undefined;
  const wall = wallRaw
    ? {
        towers: points(wallRaw.towers, 500),
        gates: (Array.isArray(wallRaw.gates) ? wallRaw.gates : [])
          .filter((g): g is { x: number; y: number; along: 'x' | 'y' } => !!g && typeof g.x === 'number' && typeof g.y === 'number' && (g.along === 'x' || g.along === 'y') && g.x >= 0 && g.y >= 0 && g.x < W && g.y < H)
          .slice(0, 100)
          .map((g) => ({ x: g.x, y: g.y, along: g.along })),
      }
    : undefined;
  return {
    scryingGlass: 'map',
    version: 1,
    layout: {
      style,
      seed: int(l['seed']) ? (l['seed'] as number) >>> 0 : 1,
      w: W,
      h: H,
      cells: cells as string[],
      rooms: rects(l['rooms'], 500),
      doors,
      pillars: points(l['pillars'], 2000),
      ...(houses.length ? { houses } : {}),
      ...(landmarks.length ? { landmarks } : {}),
      props,
      ...(wall ? { wall } : {}),
      ...(typeof l['tone'] === 'string' && tonesFor(style).includes(l['tone']) ? { tone: l['tone'] } : {}),
    },
  };
}

export const draftOf = (layout: Layout): MapDraft => ({ scryingGlass: 'map', version: 1, layout });

// Ground everywhere: rock indoors (the editor cuts rooms out of it), grass outdoors.
export const groundOf = (style: LayoutStyle) => (style === 'building' || style === 'cave' ? '#' : '.');

export function blankLayout(style: LayoutStyle, w: number, h: number, seed: number): Layout {
  const W = Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(w)));
  const H = Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(h)));
  return { style, seed: seed >>> 0, w: W, h: H, cells: Array.from({ length: H }, () => groundOf(style).repeat(W)), rooms: [], doors: [], pillars: [], props: [] };
}

// ---- Brushes ----
export type BrushId = 'floor' | 'wall' | 'room' | 'door' | 'pillar' | 'grass' | 'road' | 'square' | 'house' | 'sand' | 'water' | 'ford' | 'tree' | 'boulder' | 'townWall' | 'tower' | 'lava' | 'ice' | 'mud' | 'pit' | 'erase';
export interface Brush {
  id: BrushId;
  // A cell's letter it paints; none — a tool of its own (a rectangle, a toggle).
  cell?: string;
  rect?: boolean;
  toggle?: boolean;
}
const B = (id: BrushId, more: Omit<Brush, 'id'> = {}): Brush => ({ id, ...more });
export function brushesFor(style: LayoutStyle): Brush[] {
  const lava = B('lava', { cell: 'L' });
  const ice = B('ice', { cell: 'I' });
  const mud = B('mud', { cell: 'M' });
  const pit = B('pit', { cell: 'X' });
  if (style === 'building')
    return [B('floor', { cell: '.' }), B('wall', { cell: '#' }), B('room', { rect: true }), B('door', { toggle: true }), B('pillar', { toggle: true }), B('water', { cell: '~' }), lava, ice, pit, B('erase', { cell: '#' })];
  if (style === 'cave') return [B('floor', { cell: '.' }), B('wall', { cell: '#' }), B('room', { rect: true }), B('water', { cell: '~' }), lava, ice, mud, pit, B('erase', { cell: '#' })];
  if (style === 'town')
    return [B('grass', { cell: '.' }), B('road', { cell: ',' }), B('square', { cell: 'P' }), B('house', { rect: true }), B('tree', { cell: 'T' }), B('water', { cell: '~' }), mud, ice, B('pillar', { toggle: true }), B('townWall', { cell: 'W' }), B('tower', { toggle: true }), B('erase', { cell: '.' })];
  return [B('grass', { cell: '.' }), B('road', { cell: ',' }), B('sand', { cell: 'S' }), B('water', { cell: '~' }), B('ford', { cell: '=' }), mud, ice, lava, pit, B('tree', { cell: 'T' }), B('boulder', { cell: 'R' }), B('room', { rect: true }), B('erase', { cell: '.' })];
}

// ---- Moves ----
const at = (l: Layout, x: number, y: number) => l.cells[y]?.[x];
const inMap = (l: Layout, x: number, y: number) => x >= 0 && y >= 0 && x < l.w && y < l.h;
const covers = (a: { x: number; y: number; w: number; h: number }, x: number, y: number) => x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h;
// Where a thing can stand.
export const standable = (c: string | undefined) => walkable(c);

// What no longer fits after the ground changed: houses not all house, rooms without floor, doors and pillars off the
// floor, things standing on rock or water, towers off the wall.
export function tidy(l: Layout): Layout {
  const floorish = (x: number, y: number) => walkable(at(l, x, y));
  const houses = (l.houses ?? []).map((a, i) => ({ a, i })).filter(({ a }) => {
    for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (at(l, x, y) !== 'H') return false;
    return true;
  });
  const kept = new Map(houses.map(({ i }, n) => [i, n]));
  const landmarks = (l.landmarks ?? []).flatMap((m) => (kept.has(m.house) ? [{ ...m, house: kept.get(m.house)! }] : []));
  const rooms = l.rooms.filter((a) => {
    for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (floorish(x, y)) return true;
    return false;
  });
  const props = (l.props ?? []).filter((p) => {
    if (p.kind === 'rug') return true;
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) if (!standable(at(l, x, y))) return false;
    return true;
  });
  const hasWall = l.cells.some((r) => r.includes('W'));
  const out: Layout = {
    ...l,
    rooms,
    doors: l.doors.filter((d) => at(l, d.x, d.y) === '.'),
    pillars: l.pillars.filter((p) => at(l, p.x, p.y) === (l.style === 'town' ? 'P' : '.')),
    props,
    ...(houses.length ? { houses: houses.map(({ a }) => a) } : { houses: undefined }),
    ...(landmarks.length ? { landmarks } : { landmarks: undefined }),
    wall: hasWall ? { towers: (l.wall?.towers ?? []).filter((t) => at(l, t.x, t.y) === 'W'), gates: l.wall?.gates ?? [] } : undefined,
  };
  for (const k of ['houses', 'landmarks', 'wall'] as const) if (out[k] === undefined) delete out[k];
  return out;
}

export function paint(l: Layout, cells: { x: number; y: number }[], ch: string): Layout {
  if (!CELLS.test(ch) || ch.length !== 1) return l;
  const rows = l.cells.map((r) => r.split(''));
  let changed = false;
  for (const { x, y } of cells) {
    if (!inMap(l, x, y) || rows[y]![x] === ch) continue;
    // A house is a rectangle of its own: the brush does not cut into one.
    if (rows[y]![x] === 'H' && ch !== '.') continue;
    rows[y]![x] = ch;
    changed = true;
  }
  return changed ? tidy({ ...l, cells: rows.map((r) => r.join('')) }) : l;
}

// The cells of a brush of some thickness round a cell (1 — the cell itself).
export function brushCells(x: number, y: number, size: number) {
  const out: { x: number; y: number }[] = [];
  const lo = -Math.floor((size - 1) / 2);
  for (let dy = lo; dy < lo + size; dy++) for (let dx = lo; dx < lo + size; dx++) out.push({ x: x + dx, y: y + dy });
  return out;
}

// The cells on a straight line between two cells (Shift + click).
export function lineCells(a: { x: number; y: number }, b: { x: number; y: number }) {
  const out: { x: number; y: number }[] = [];
  const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  for (let i = 0; i <= n; i++) out.push({ x: Math.round(a.x + ((b.x - a.x) * i) / (n || 1)), y: Math.round(a.y + ((b.y - a.y) * i) / (n || 1)) });
  return out;
}

export const normRect = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x) + 1, h: Math.abs(b.y - a.y) + 1 });

// A room: the rectangle becomes floor (indoors) or a clearing (outdoors) and is numbered — a pin on the map.
export function addRoom(l: Layout, r: LayoutRoom): Layout {
  const a = clip(l, r);
  if (!a) return l;
  const ch = l.style === 'building' || l.style === 'cave' ? '.' : '.';
  const cells: { x: number; y: number }[] = [];
  for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) cells.push({ x, y });
  const painted = paint(l, cells, ch);
  return { ...painted, rooms: [...painted.rooms.filter((o) => !(o.x === a.x && o.y === a.y && o.w === a.w && o.h === a.h)), a] };
}

// A house of a town: a rectangle of roof, not on another house.
export function addHouse(l: Layout, r: LayoutRoom): Layout {
  const a = clip(l, r);
  if (!a || a.w < 2 || a.h < 2) return l;
  const rows = l.cells.map((row) => row.split(''));
  for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (rows[y]![x] === 'H') return l;
  for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) rows[y]![x] = 'H';
  return tidy({ ...l, cells: rows.map((row) => row.join('')), houses: [...(l.houses ?? []), a] });
}

function clip(l: Layout, a: LayoutRoom): LayoutRoom | null {
  const x = Math.max(0, a.x);
  const y = Math.max(0, a.y);
  const w = Math.min(l.w, a.x + a.w) - x;
  const h = Math.min(l.h, a.y + a.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

// A door on a floor cell, the way through it from its neighbours; again — away.
export function toggleDoor(l: Layout, x: number, y: number): Layout {
  if (l.doors.some((d) => d.x === x && d.y === y)) return { ...l, doors: l.doors.filter((d) => d.x !== x || d.y !== y) };
  if (at(l, x, y) !== '.') return l;
  const open = (dx: number, dy: number) => walkable(at(l, x + dx, y + dy));
  const along: 'x' | 'y' = open(0, -1) || open(0, 1) ? (open(-1, 0) && open(1, 0) && !(open(0, -1) && open(0, 1)) ? 'x' : 'y') : 'x';
  return { ...l, doors: [...l.doors, { x, y, along }] };
}

// A pillar indoors, a well on a town's square.
export function togglePillar(l: Layout, x: number, y: number): Layout {
  if (l.pillars.some((p) => p.x === x && p.y === y)) return { ...l, pillars: l.pillars.filter((p) => p.x !== x || p.y !== y) };
  return at(l, x, y) === (l.style === 'town' ? 'P' : '.') ? { ...l, pillars: [...l.pillars, { x, y }] } : l;
}

export function toggleTower(l: Layout, x: number, y: number): Layout {
  const towers = l.wall?.towers ?? [];
  if (towers.some((t) => t.x === x && t.y === y)) return { ...l, wall: { gates: l.wall?.gates ?? [], towers: towers.filter((t) => t.x !== x || t.y !== y) } };
  return at(l, x, y) === 'W' ? { ...l, wall: { gates: l.wall?.gates ?? [], towers: [...towers, { x, y }] } } : l;
}

// ---- Things ----
// The footprint of a thing turned to its facing: long things lie across when they face left or right.
const LONG: Partial<Record<PropKind, [number, number]>> = {
  table: [2, 1], bench: [2, 1], bed: [1, 2], sarcophagus: [1, 2], rug: [2, 2], stall: [2, 1], cart: [1, 2], log: [2, 1], bedroll: [1, 2],
  stairs: [1, 2], roundtable: [2, 2], wardrobe: [2, 1], fountain: [2, 2], tent: [2, 2], boat: [1, 2],
  bathtub: [1, 2], counter: [2, 1], workbench: [2, 1], circle: [2, 2], fence: [2, 1],
};
// Things that stretch over several cells: a long table, a big puddle, a carpet runner, a wide stair.
export const STRETCH: readonly PropKind[] = ['rug', 'table', 'bench', 'shelf', 'rack', 'puddle', 'stall', 'altar', 'bed', 'log', 'rubble', 'flowers', 'reeds', 'stairs', 'bones', 'coins', 'mushrooms', 'roundtable', 'fountain', 'tent', 'wardrobe',
  'counter', 'workbench', 'circle', 'spikes', 'web', 'fence', 'woodpile', 'fern', 'chains', 'plate'];
export const MAX_STRETCH = 12;
export function footprint(kind: PropKind, face: Facing): { w: number; h: number } {
  const [w, h] = LONG[kind] ?? [1, 1];
  return face % 2 === 1 ? { w: h, h: w } : { w, h };
}

export const propAt = (l: Layout, x: number, y: number): number => {
  const props = l.props ?? [];
  // The topmost: a rug lies under everything, whenever it was put down.
  for (let i = props.length - 1; i >= 0; i--) if (props[i]!.kind !== 'rug' && covers(props[i]!, x, y)) return i;
  for (let i = props.length - 1; i >= 0; i--) if (covers(props[i]!, x, y)) return i;
  return -1;
};

function fits(l: Layout, p: Prop, _except = -1) {
  for (let y = p.y; y < p.y + p.h; y++)
    for (let x = p.x; x < p.x + p.w; x++) {
      if (!inMap(l, x, y)) return false;
      // Things may stand on things (a chest on a rug, a candle on a table): the later one is drawn on top.
      if (p.kind !== 'rug' && !standable(at(l, x, y))) return false;
      if (p.kind !== 'rug' && l.doors.some((d) => d.x === x && d.y === y)) return false;
    }
  return true;
}

// A thing put down with its top-left corner at the cell; the index of the new one, or -1 — it does not fit.
export function placeProp(l: Layout, kind: PropKind, x: number, y: number, face: Facing = 0, tint?: number): { layout: Layout; index: number } {
  const p: Prop = { kind, x, y, ...footprint(kind, face), ...(face ? { face } : {}), ...(tint === undefined ? {} : { tint }) };
  if (!fits(l, p)) return { layout: l, index: -1 };
  // Rugs lie under the rest.
  const props = kind === 'rug' ? [p, ...(l.props ?? [])] : [...(l.props ?? []), p];
  return { layout: { ...l, props }, index: kind === 'rug' ? 0 : props.length - 1 };
}

export function removeProp(l: Layout, i: number): Layout {
  return i < 0 ? l : { ...l, props: (l.props ?? []).filter((_, n) => n !== i) };
}

export function rotateProp(l: Layout, i: number): Layout {
  const p = l.props?.[i];
  if (!p) return l;
  const face = (((p.face ?? 0) + 1) % 4) as Facing;
  const next: Prop = { ...p, ...footprint(p.kind, face), face };
  if (!next.face) delete next.face;
  return fits(l, next, i) ? { ...l, props: l.props!.map((o, n) => (n === i ? next : o)) } : l;
}

// Several things at once: taken away, moved by a step (all or none), those in a rectangle.
export function removeProps(l: Layout, idx: readonly number[]): Layout {
  if (!idx.length) return l;
  const gone = new Set(idx);
  return { ...l, props: (l.props ?? []).filter((_, i) => !gone.has(i)) };
}
export function moveProps(l: Layout, idx: readonly number[], dx: number, dy: number): Layout {
  if (!idx.length || (!dx && !dy)) return l;
  const moving = new Set(idx);
  const props = (l.props ?? []).map((p, i) => (moving.has(i) ? { ...p, x: p.x + dx, y: p.y + dy } : p));
  for (const i of idx) {
    const p = props[i];
    if (!p || p.x < 0 || p.y < 0 || p.x + p.w > l.w || p.y + p.h > l.h || !fits(l, p, i)) return l;
  }
  return { ...l, props };
}
export function propsIn(l: Layout, r: { x: number; y: number; w: number; h: number }): number[] {
  return (l.props ?? []).flatMap((p, i) => (p.x < r.x + r.w && p.x + p.w > r.x && p.y < r.y + r.h && p.y + p.h > r.y ? [i] : []));
}
// The ground's colour, or none for the usual one.
export const setTone = (l: Layout, tone: string | null): Layout =>
  (tone ?? undefined) === l.tone ? l : tone && tonesFor(l.style).includes(tone) ? { ...l, tone } : (({ tone: _, ...rest }) => rest)(l);

// A thing made larger or smaller (only those that stretch), from its top-left corner.
export function stretchProp(l: Layout, i: number, w: number, h: number): Layout {
  const p = l.props?.[i];
  if (!p || !STRETCH.includes(p.kind)) return l;
  const W = Math.min(MAX_STRETCH, Math.max(1, Math.round(w)));
  const H = Math.min(MAX_STRETCH, Math.max(1, Math.round(h)));
  if (W === p.w && H === p.h) return l;
  const next = { ...p, w: W, h: H };
  return fits(l, next, i) ? { ...l, props: l.props!.map((o, n) => (n === i ? next : o)) } : l;
}

// A thing's colour or pattern (TINTS in draw-props.ts).
export function tintProp(l: Layout, i: number, tint: number): Layout {
  const p = l.props?.[i];
  return p && p.tint !== tint ? { ...l, props: l.props!.map((o, n) => (n === i ? { ...o, tint } : o)) } : l;
}

export function moveProp(l: Layout, i: number, x: number, y: number): Layout {
  const p = l.props?.[i];
  if (!p || (p.x === x && p.y === y)) return l;
  const next = { ...p, x, y };
  return fits(l, next, i) ? { ...l, props: l.props!.map((o, n) => (n === i ? next : o)) } : l;
}

// The map larger or smaller: from the top-left corner; new cells are the style's ground.
export function resize(l: Layout, w: number, h: number): Layout {
  const W = Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(w)));
  const H = Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(h)));
  const g = groundOf(l.style);
  const cells = Array.from({ length: H }, (_, y) => (l.cells[y] ?? '').slice(0, W).padEnd(W, g));
  const keep = <T extends { x: number; y: number; w?: number; h?: number }>(a: T) => a.x + (a.w ?? 1) <= W && a.y + (a.h ?? 1) <= H;
  const houses = (l.houses ?? []).map((a, i) => ({ a, i })).filter(({ a }) => keep(a));
  const index = new Map(houses.map(({ i }, n) => [i, n]));
  const landmarks = (l.landmarks ?? []).flatMap((m) => (index.has(m.house) ? [{ ...m, house: index.get(m.house)! }] : []));
  return tidy({
    ...l,
    w: W,
    h: H,
    cells,
    rooms: l.rooms.filter(keep),
    doors: l.doors.filter(keep),
    pillars: l.pillars.filter(keep),
    props: (l.props ?? []).filter(keep),
    houses: houses.map(({ a }) => a),
    landmarks,
    wall: l.wall && { towers: l.wall.towers.filter(keep), gates: l.wall.gates.filter((g2) => g2.x < W && g2.y < H) },
  });
}

export const isOutdoor = (style: LayoutStyle) => style === 'town' || isWild(style);
