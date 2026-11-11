// The map editor's data and moves: a draft is a layout of the map generator (mapgen/layout.ts), kept in a file
// «Name.map.json» in an adventure's maps folder. Pure functions — every move returns a new layout; the picture is
// drawn from it the same way as a generated one.
import { EDGE_KINDS, edgeInMap, edgeKey, GENRES, NOTHING, LAYOUT_STYLES, LIGHTS, buildingAt, isBuilt, isFloor, isWall, WALLS, isWild, tonesFor, walkable, type Genre, type Layout, type Light, type LayoutEdge, type LayoutRoom, type LayoutStyle } from '../mapgen/layout';
import { PROP_KINDS, type Facing, type Prop, type PropKind } from '../mapgen/furnish';
import { MAX_ASSET_SIDE, safeAssetPath } from '../../../shared/mapassets';

export const MAP_DRAFT_SUFFIX = '.map.json';
export const isMapDraft = (path: string) => path.toLowerCase().endsWith(MAP_DRAFT_SUFFIX);

export interface MapDraft {
  scryingGlass: 'map';
  version: 1;
  layout: Layout;
}

export const MIN_SIDE = 6;
export const MAX_SIDE = 120;
const CELLS = /^[.#,PST~RH=WLIMXFBCKVOANJQstcdmkrwpgzyhfleibn_]*$/;
// The most storeys over a map.
export const MAX_LEVELS = 8;
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
    .filter((p): p is Prop => !!p && PROP_KINDS.includes(p.kind) && int(p.x) && int(p.y) && int(p.w) && int(p.h) && p.w > 0 && p.h > 0 && p.w <= 12 && p.h <= 12 && inside(p) && (p.kind !== 'asset' || safeAssetPath(p.asset)))
    .slice(0, 5000)
    .map((p) => ({ kind: p.kind, x: p.x, y: p.y, w: p.w, h: p.h, ...(p.face === 1 || p.face === 2 || p.face === 3 ? { face: p.face } : {}), ...(typeof p.tint === 'number' && p.tint >= 0 && p.tint <= 1 ? { tint: p.tint } : {}), ...(p.kind === 'asset' ? { asset: p.asset } : {}) }));
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
  // Storeys: drafts of the same size and kind, with no storeys of their own.
  const levels = (Array.isArray(l['levels']) && !(x as { level?: true }).level ? l['levels'] : [])
    .slice(0, MAX_LEVELS)
    .flatMap((v) => {
      const d = parseDraft({ scryingGlass: 'map', level: true, layout: { ...(v as object), w: W, h: H, style } });
      return d ? [d.layout] : [];
    });
  const seen = new Set<string>();
  const edges = (Array.isArray(l['edges']) ? l['edges'] : [])
    .filter((e): e is LayoutEdge => !!e && int(e.x) && int(e.y) && (e.side === 'top' || e.side === 'left') && typeof e.kind === 'string' && e.kind.length === 1 && EDGE_KINDS.includes(e.kind) && edgeInMap({ w: W, h: H }, e))
    .filter((e) => !seen.has(edgeKey(e)) && !!seen.add(edgeKey(e)))
    .slice(0, 20000)
    .map((e) => ({ x: e.x, y: e.y, side: e.side, kind: e.kind, ...(e.door === true ? { door: true as const } : {}) }));
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
      ...(points(l['roofs'], 2000).length ? { roofs: points(l['roofs'], 2000) } : {}),
      ...(LIGHTS.includes(l['light'] as Light) ? { light: l['light'] as Light } : {}),
      ...(GENRES.includes(l['genre'] as Genre) && l['genre'] !== 'fantasy' ? { genre: l['genre'] as Genre } : {}),
      ...(edges.length ? { edges } : {}),
      ...(levels.length ? { levels } : {}),
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
export type BrushId =
  | 'floor' | 'wall' | 'room' | 'door' | 'pillar' | 'grass' | 'road' | 'square' | 'house' | 'sand' | 'water' | 'ford' | 'tree' | 'boulder' | 'townWall' | 'tower'
  | 'lava' | 'ice' | 'mud' | 'pit' | 'planks' | 'timber' | 'build' | 'roof' | 'erase'
  | 'cobbles' | 'flags' | 'field' | 'sea' | 'mountain' | 'pine' | 'palm' | 'snag'
  | 'flagstone' | 'tiles' | 'carpet' | 'earth' | 'marble' | 'stonewall' | 'brick'
  | 'palisade' | 'rampart' | 'blockade' | 'hedge' | 'ditch'
  | 'picket' | 'wattle' | 'drystone' | 'railing' | 'barbed' | 'chainlink';
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
  // Outdoors anywhere: ground, the sea, mountains, trees of other kinds.
  const outdoors = [B('cobbles', { cell: 'C' }), B('flags', { cell: 'K' }), B('field', { cell: 'V' }), B('sea', { cell: 'O' }), B('mountain', { cell: 'A' }), B('pine', { cell: 'N' }), B('palm', { cell: 'J' }), B('snag', { cell: 'Q' })];
  // A building of its own outdoors: walls round a floor, a wall or a floor cell by cell, doors in the walls, a roof on or off.
  // Floors and walls of any material.
  const materials = [
    B('planks', { cell: 'F' }), B('flagstone', { cell: 's' }), B('tiles', { cell: 't' }), B('carpet', { cell: 'c' }), B('earth', { cell: 'd' }), B('marble', { cell: 'm' }),
    B('timber', { cell: 'B' }), B('stonewall', { cell: 'k' }), B('brick', { cell: 'r' }),
    // Fortifications: a castle wall three wide (or two with a gap) gets its walk on top by itself.
    B('palisade', { cell: 'p' }), B('rampart', { cell: 'g' }), B('blockade', { cell: 'z' }), B('hedge', { cell: 'y' }), B('ditch', { cell: 'h' }),
    // Fences, drawn along the way they run (corners and crossings too).
    B('picket', { cell: 'f' }), B('wattle', { cell: 'l' }), B('drystone', { cell: 'e' }), B('railing', { cell: 'i' }), B('barbed', { cell: 'b' }), B('chainlink', { cell: 'n' }),
  ];
  const built = [B('build', { rect: true }), ...materials, B('door', { toggle: true }), B('roof', { toggle: true })];
  if (style === 'building')
    return [B('floor', { cell: '.' }), B('wall', { cell: '#' }), B('room', { rect: true }), B('door', { toggle: true }), B('pillar', { toggle: true }), ...materials, B('water', { cell: '~' }), lava, ice, mud, pit, B('erase', { cell: '#' })];
  if (style === 'cave') return [B('floor', { cell: '.' }), B('wall', { cell: '#' }), B('room', { rect: true }), B('water', { cell: '~' }), lava, ice, mud, pit, B('erase', { cell: '#' })];
  if (style === 'town')
    return [B('grass', { cell: '.' }), B('road', { cell: ',' }), B('square', { cell: 'P' }), B('house', { rect: true }), ...built, B('tree', { cell: 'T' }), ...outdoors, B('water', { cell: '~' }), mud, ice, lava, pit, B('pillar', { toggle: true }), B('townWall', { cell: 'W' }), B('tower', { toggle: true }), B('erase', { cell: '.' })];
  return [B('grass', { cell: '.' }), B('road', { cell: ',' }), B('sand', { cell: 'S' }), B('water', { cell: '~' }), B('ford', { cell: '=' }), mud, ice, lava, pit, B('tree', { cell: 'T' }), ...outdoors, B('boulder', { cell: 'R' }), B('room', { rect: true }), B('house', { rect: true }), ...built, B('erase', { cell: '.' })];
}

// ---- Moves ----
const at = (l: Layout, x: number, y: number) => l.cells[y]?.[x];
const inMap = (l: Layout, x: number, y: number) => x >= 0 && y >= 0 && x < l.w && y < l.h;
const covers = (a: { x: number; y: number; w: number; h: number }, x: number, y: number) => x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h;
// Where a thing can stand.
// Things that go anywhere: a picture of the GM's own, and what hangs on walls (a window, a banner).
export const WALL_DECOR: readonly PropKind[] = ['window', 'banner', 'painting', 'trophy', 'curtain', 'wallshelf'];
// …and what goes over water or a wall: a bridge, a pier, a buoy, iron bars.
const FREE = new Set<PropKind>(['asset', ...WALL_DECOR, 'bridge', 'pier', 'buoy', 'bars', 'forcefield', 'holosign', 'bats', 'ceilingfan', 'vines', 'quicksand', 'viewscreen', 'vaultdoor', 'drone', 'waterfall', 'cliff', 'lilypads', 'watermill',
  'bubbles', 'cloud', 'airship', 'balloon', 'floatrock', 'gauges', 'plank', 'ropebridge', 'jollyroger', 'kelp', 'coral',
  'roundtower', 'squaretower', 'watchtower', 'drawbridge', 'portcullis', 'garland', 'balloons', 'floatingbooks',
  'galleon', 'minesupport', 'runedoor', 'outflow', 'treehouse', 'brasslamps', 'wisps', 'vinewall', 'icicles', 'herbs', 'airlock', 'starwindow', 'corkboard', 'blastdoor',
  'hieroglyphs', 'graffiti', 'cables', 'switchboard', 'lightbox', 'mugshot', 'curtainscreen',
  'feathers', 'tightrope', 'viewport', 'blackboard', 'canopy', 'quarantine', 'cyberlimbs', 'departures', 'cinemascreen', 'teleportcircle',
  'trollbridge', 'tollsign', 'potrack', 'paddedwall', 'scaffold', 'towercrane', 'gantrycrane', 'coaster', 'ferriswheel',
  'spikedgate', 'slotdoor', 'anchorchain', 'barnacles', 'sunkenhull',
  'pneumatictubes', 'gearwall', 'morguedrawers', 'ornithopter', 'smokestack',
  'saloondoors', 'wantedboard', 'bankvault', 'pressuregauges', 'gunrack', 'mooringtower']);
// …and on a tree's crown or a boulder (a nest, a lookout, a raven), over them on the picture.
export const standable = (c: string | undefined) => walkable(c) || (!!c && 'TRNJQA'.includes(c));

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
    if (p.kind === 'rug' || FREE.has(p.kind)) return true;
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) if (!standable(at(l, x, y))) return false;
    return true;
  });
  const hasWall = l.cells.some((r) => r.includes('W'));
  const out: Layout = {
    ...l,
    rooms,
    doors: l.doors.filter((d) => at(l, d.x, d.y) === '.' || isFloor(at(l, d.x, d.y))),
    // A roof stays on its building; one roof to a building.
    roofs: roofsOf(l),
    pillars: l.pillars.filter((p) => at(l, p.x, p.y) === (l.style === 'town' ? 'P' : '.') || (l.style !== 'town' && isFloor(at(l, p.x, p.y)))),
    props,
    ...(houses.length ? { houses: houses.map(({ a }) => a) } : { houses: undefined }),
    ...(landmarks.length ? { landmarks } : { landmarks: undefined }),
    wall: hasWall ? { towers: (l.wall?.towers ?? []).filter((t) => at(l, t.x, t.y) === 'W'), gates: l.wall?.gates ?? [] } : undefined,
  };
  for (const k of ['houses', 'landmarks', 'wall', 'roofs'] as const) if (out[k] === undefined) delete out[k];
  return out;
}

// The roofs that still stand on a building, one to each.
function roofsOf(l: Layout): Layout['roofs'] {
  // Floor is a building's own; walls between two are shared.
  const taken = new Set<string>();
  const out: { x: number; y: number }[] = [];
  for (const r of l.roofs ?? []) {
    const floor = buildingAt(l, r.x, r.y).filter((p) => !isWall(at(l, p.x, p.y)));
    if (!floor.length || floor.some((p) => taken.has(`${p.x},${p.y}`))) continue;
    for (const p of floor) taken.add(`${p.x},${p.y}`);
    out.push({ x: r.x, y: r.y });
  }
  return out.length ? out : undefined;
}

// Two buildings joined by a door are one: one roof is left of theirs.
function reroof(l: Layout): Layout {
  if (!l.roofs) return l;
  const out: Layout = { ...l, roofs: roofsOf(l) };
  if (!out.roofs) delete out.roofs;
  return out;
}

// The walk along a castle wall: the middle of a wall three wide, or the gap of one between two walls; where the walls
// no longer hold it on both sides, it is wall again.
function walkways(rows: string[][]) {
  const at = (x: number, y: number) => rows[y]?.[x];
  const wallish = (c: string | undefined) => c === 'g' || c === 'w';
  const four = (x: number, y: number) => [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y]!.length; x++) {
      const c = rows[y]![x];
      if (c === 'g' && four(x, y).every(wallish)) rows[y]![x] = 'w';
      else if ((c === '.' || c === ',') && ((at(x - 1, y) === 'g' && at(x + 1, y) === 'g') || (at(x, y - 1) === 'g' && at(x, y + 1) === 'g'))) rows[y]![x] = 'w';
    }
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y]!.length; x++) {
      if (rows[y]![x] !== 'w') continue;
      const across = (wallish(at(x - 1, y)) && wallish(at(x + 1, y))) || (wallish(at(x, y - 1)) && wallish(at(x, y + 1)));
      if (!across) rows[y]![x] = 'g';
    }
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
  if (changed && (ch === 'g' || l.cells.some((r) => r.includes('g')))) walkways(rows);
  return changed ? tidy({ ...l, cells: rows.map((r) => r.join('')) }) : l;
}

// The eraser: everything on the cells goes — things standing on them (a rug under a table too), doors, pillars,
// wells, towers — and the ground becomes the map's own (`ground`: rock indoors, grass outdoors).
export function wipe(l: Layout, cells: { x: number; y: number }[], ground: string): Layout {
  const hit = new Set(cells.filter((p) => inMap(l, p.x, p.y)).map((p) => `${p.x},${p.y}`));
  if (!hit.size) return l;
  const on = (p: { x: number; y: number }) => hit.has(`${p.x},${p.y}`);
  const touches = (p: Prop) => cells.some((q) => covers(p, q.x, q.y));
  const props = (l.props ?? []).filter((p) => !touches(p));
  const doors = l.doors.filter((d) => !on(d));
  const pillars = l.pillars.filter((p) => !on(p));
  const towers = l.wall?.towers.filter((t) => !on(t));
  // Thin walls round the cells too.
  const edges = l.edges?.filter((e) => !on(e) && !on(e.side === 'top' ? { x: e.x, y: e.y - 1 } : { x: e.x - 1, y: e.y }));
  const gone =
    props.length !== (l.props ?? []).length || doors.length !== l.doors.length || pillars.length !== l.pillars.length || towers?.length !== l.wall?.towers.length || edges?.length !== l.edges?.length;
  const cleared: Layout = gone ? { ...l, props, doors, pillars, ...(l.wall ? { wall: { ...l.wall, towers: towers! } } : {}), ...(l.edges ? { edges: edges! } : {}) } : l;
  if (cleared.edges && !cleared.edges.length) delete cleared.edges;
  const painted = paint(cleared, cells, ground);
  return painted === cleared && gone ? tidy(cleared) : painted;
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
  const cells: { x: number; y: number }[] = [];
  // Outdoors a room is a clearing; a room of a building put up there keeps its floor and walls.
  const keep = (x: number, y: number) => isOutdoor(l.style) && (walkable(at(l, x, y)) || isBuilt(at(l, x, y)) || at(l, x, y) === 'H');
  for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (!keep(x, y)) cells.push({ x, y });
  let painted = paint(l, cells, '.');
  // On a storey indoors: rock round the room where the storey had nothing, so it has walls.
  if (!isOutdoor(l.style)) {
    const ring: { x: number; y: number }[] = [];
    for (let y = a.y - 1; y <= a.y + a.h; y++) for (let x = a.x - 1; x <= a.x + a.w; x++) if (at(painted, x, y) === NOTHING) ring.push({ x, y });
    if (ring.length) painted = paint(painted, ring, '#');
  }
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

// A building put up outdoors: walls round the rectangle, floor inside (an open building, without a roof). Walls it meets
// are shared: a room built onto another has one wall between them.
export function addBuilding(l: Layout, r: LayoutRoom): Layout {
  const a = clip(l, r);
  if (!a || a.w < 3 || a.h < 3) return l;
  const rows = l.cells.map((row) => row.split(''));
  for (let y = a.y; y < a.y + a.h; y++)
    for (let x = a.x; x < a.x + a.w; x++) {
      if (rows[y]![x] === 'H') continue;
      const edge = x === a.x || y === a.y || x === a.x + a.w - 1 || y === a.y + a.h - 1;
      rows[y]![x] = edge ? (rows[y]![x] === 'F' && l.doors.some((d) => d.x === x && d.y === y) ? 'F' : 'B') : 'F';
    }
  return tidy({ ...l, cells: rows.map((row) => row.join('')) });
}

// A roof over the building under the cell, or away.
export function toggleRoof(l: Layout, x: number, y: number): Layout {
  const cells = buildingAt(l, x, y);
  if (!cells.length) return l;
  // The roofs of this building: those whose building has the same floor (a shared wall is not enough).
  const floorOf = (c: { x: number; y: number }[]) => c.filter((p) => !isWall(at(l, p.x, p.y))).map((p) => `${p.x},${p.y}`);
  const mine = new Set(floorOf(cells));
  const roofs = l.roofs ?? [];
  const kept = roofs.filter((r) => !floorOf(buildingAt(l, r.x, r.y)).some((k) => mine.has(k)));
  const next = kept.length === roofs.length ? [...roofs, { x, y }] : kept;
  const out: Layout = { ...l, roofs: next };
  if (!next.length) delete out.roofs;
  return out;
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
  // A door goes into a wall of any material: the cell becomes the floor beside it; taken away, the wall closes again.
  const near = [at(l, x - 1, y), at(l, x + 1, y), at(l, x, y - 1), at(l, x, y + 1)];
  const was = l.doors.some((d) => d.x === x && d.y === y);
  if (!was && isWall(at(l, x, y))) {
    const rows = l.cells.map((row) => row.split(''));
    rows[y]![x] = near.find(isFloor) ?? (isOutdoor(l.style) ? 'F' : '.');
    const wall = (dx: number, dy: number) => isWall(at(l, x + dx, y + dy));
    // The door lies along the wall it is in.
    const along: 'x' | 'y' = wall(-1, 0) || wall(1, 0) ? 'y' : 'x';
    return reroof({ ...l, cells: rows.map((row) => row.join('')), doors: [...l.doors, { x, y, along }] });
  }
  if (was) {
    const doors = l.doors.filter((d) => d.x !== x || d.y !== y);
    // In a wall of its own: the wall of the most of its neighbours comes back.
    const walls = near.filter(isWall);
    if (walls.length < 2) return { ...l, doors };
    const most = [...WALLS].sort((a, b) => walls.filter((w) => w === b).length - walls.filter((w) => w === a).length)[0]!;
    const rows = l.cells.map((row) => row.split(''));
    rows[y]![x] = most;
    return { ...l, cells: rows.map((row) => row.join('')), doors };
  }
  if (isOutdoor(l.style)) return l;
  if (at(l, x, y) !== '.' && !isFloor(at(l, x, y))) return l;
  const open = (dx: number, dy: number) => walkable(at(l, x + dx, y + dy));
  const along: 'x' | 'y' = open(0, -1) || open(0, 1) ? (open(-1, 0) && open(1, 0) && !(open(0, -1) && open(0, 1)) ? 'x' : 'y') : 'x';
  return { ...l, doors: [...l.doors, { x, y, along }] };
}

// A pillar indoors, a well on a town's square.
export function togglePillar(l: Layout, x: number, y: number): Layout {
  if (l.pillars.some((p) => p.x === x && p.y === y)) return { ...l, pillars: l.pillars.filter((p) => p.x !== x || p.y !== y) };
  return at(l, x, y) === (l.style === 'town' ? 'P' : '.') || (l.style !== 'town' && isFloor(at(l, x, y))) ? { ...l, pillars: [...l.pillars, { x, y }] } : l;
}

export function toggleTower(l: Layout, x: number, y: number): Layout {
  const towers = l.wall?.towers ?? [];
  if (towers.some((t) => t.x === x && t.y === y)) return { ...l, wall: { gates: l.wall?.gates ?? [], towers: towers.filter((t) => t.x !== x || t.y !== y) } };
  return at(l, x, y) === 'W' ? { ...l, wall: { gates: l.wall?.gates ?? [], towers: [...towers, { x, y }] } } : l;
}

// ---- Thin walls ----
type Corner = { x: number; y: number };
type Side = Pick<LayoutEdge, 'x' | 'y' | 'side'>;
// The sides of cells from corner a to corner b, a step at a time along the way that is longer still.
export function edgePath(a: Corner, b: Corner): Side[] {
  const out: Side[] = [];
  let { x, y } = a;
  while (x !== b.x || y !== b.y) {
    const dx = b.x - x;
    const dy = b.y - y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const nx = x + Math.sign(dx);
      out.push({ x: Math.min(x, nx), y, side: 'top' });
      x = nx;
    } else {
      const ny = y + Math.sign(dy);
      out.push({ x, y: Math.min(y, ny), side: 'left' });
      y = ny;
    }
  }
  return out;
}

// Thin walls of a kind along the sides (a door in one stays); `kind` null — they go.
export function setEdges(l: Layout, sides: Side[], kind: string | null): Layout {
  const map = new Map((l.edges ?? []).map((e) => [edgeKey(e), e]));
  let changed = false;
  for (const s of sides) {
    if (!edgeInMap(l, s)) continue;
    const k = edgeKey(s);
    const was = map.get(k);
    if (kind === null) {
      if (was) (map.delete(k), (changed = true));
    } else if (!was || was.kind !== kind) {
      map.set(k, { x: s.x, y: s.y, side: s.side, kind, ...(was?.door ? { door: true as const } : {}) });
      changed = true;
    }
  }
  if (!changed) return l;
  const out: Layout = { ...l, edges: [...map.values()] };
  if (!out.edges!.length) delete out.edges;
  return out;
}

// The side of a cell nearest to a point (in cells), if the point is no further than `reach` from it.
export function nearestSide(l: Pick<Layout, 'w' | 'h'>, px: number, py: number, reach = 0.3): Side | null {
  const options: [Side, number][] = [
    [{ x: Math.floor(px), y: Math.round(py), side: 'top' }, Math.abs(py - Math.round(py))],
    [{ x: Math.round(px), y: Math.floor(py), side: 'left' }, Math.abs(px - Math.round(px))],
  ];
  const best = options.filter(([s]) => edgeInMap(l, s)).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] <= reach ? best[0] : null;
}

export const edgeAt = (l: Layout, s: Side) => l.edges?.find((e) => edgeKey(e) === edgeKey(s));

// A door in a thin wall, or the wall again.
export function toggleEdgeDoor(l: Layout, s: Side): Layout {
  const k = edgeKey(s);
  if (!edgeAt(l, s)) return l;
  return reroof({ ...l, edges: l.edges!.map((e) => (edgeKey(e) !== k ? e : e.door ? { x: e.x, y: e.y, side: e.side, kind: e.kind } : { ...e, door: true as const })) });
}

// ---- Things ----
// The footprint of a thing turned to its facing: long things lie across when they face left or right.
const LONG: Partial<Record<PropKind, [number, number]>> = {
  table: [2, 1], bench: [2, 1], bed: [1, 2], sarcophagus: [1, 2], rug: [2, 2], stall: [2, 1], cart: [1, 2], log: [2, 1], bedroll: [1, 2],
  stairs: [1, 2], roundtable: [2, 2], wardrobe: [2, 1], fountain: [2, 2], tent: [2, 2], boat: [1, 2],
  bathtub: [1, 2], counter: [2, 1], workbench: [2, 1], circle: [2, 2], fence: [2, 1],
  oven: [2, 2], spit: [2, 1], kegs: [2, 1], dishes: [2, 1], hams: [2, 1], console: [2, 1], bunk: [1, 2], holo: [2, 2], reactor: [2, 2],
  pipes: [2, 1], rayguns: [2, 1], rover: [2, 3], solar: [2, 1], pod: [1, 2],
  shelter: [2, 2], bridge: [1, 3], pier: [1, 3], nets: [2, 1], lighthouse: [2, 2], portal: [2, 2], torturerack: [1, 2], coffin: [1, 2], coop: [2, 2],
  medpod: [1, 2], labbench: [2, 1], forcefield: [2, 1], hovercar: [2, 3], holosign: [2, 1], saucer: [3, 3], cocoon: [1, 2],
  organ: [2, 1], piano: [2, 2], ironfence: [2, 1], mausoleum: [2, 2], pooltable: [2, 3], sedan: [2, 4], newsstand: [2, 1],
  idolhead: [2, 2], cannon: [1, 2], hammock: [1, 2], sofa: [2, 1], computer: [2, 1], wreck: [2, 4], shack: [2, 2],
  igloo: [2, 2], sled: [1, 2], pagoda: [3, 3], torii: [3, 1], koipond: [2, 2], viewscreen: [3, 1], cryopod: [1, 2], shuttle: [3, 4],
  mech: [2, 2], potionshelf: [2, 1], loom: [2, 1], bookcase: [2, 1], vaultdoor: [2, 2],
  windmill: [3, 3], watermill: [1, 3], breadrack: [2, 1], horse: [1, 2], hayrack: [2, 1], forge: [2, 2], bathpool: [3, 3], waterfall: [2, 2],
  cliff: [3, 1], cavecrystals: [2, 2], giantmushroom: [2, 2], stage: [3, 2], cryptentrance: [2, 2],
  shipwreck: [3, 4], giantclam: [2, 2], airship: [3, 6], balloon: [2, 2], floatrock: [3, 3], boiler: [2, 2], telescope: [1, 2], gauges: [1, 1],
  yurt: [3, 3], camel: [1, 2], hiderack: [2, 1], treasurepile: [2, 2], plank: [1, 3], charttable: [2, 1], ropebridge: [1, 4],
  roundtower: [3, 3], squaretower: [3, 3], watchtower: [2, 2], ballista: [1, 2], catapult: [2, 3], stakes: [2, 1],
  commandtent: [3, 3], supplywagon: [2, 3], drawbridge: [2, 3], portcullis: [2, 1], stonecircle: [3, 3], observatory: [3, 3], necroaltar: [2, 1],
  pentagram: [2, 2], carousel: [3, 3], garland: [3, 1], fairtent: [2, 2], foodcart: [1, 2], puppetshow: [2, 1], clocktower: [2, 2], noticeboard: [2, 1],
  freshgrave: [1, 2], galleon: [3, 8], harborcrane: [2, 2], rugstall: [2, 2], dragonskull: [3, 3], dragoneggs: [2, 2], ribcage: [3, 2], minecart: [1, 2],
  rails: [1, 3], runedoor: [2, 1], treehouse: [3, 3], moonwell: [2, 2], elvenarch: [2, 1], outflow: [1, 2],
  witchhut: [2, 2], fairyring: [2, 2], pyramid: [4, 4], lavaforge: [2, 2], giantanvil: [2, 1],
  airlock: [2, 2], hydroponics: [2, 1], starwindow: [2, 1], habdome: [3, 3], rocket: [2, 2], corkboard: [2, 1], roulette: [2, 3], cardtable: [2, 2],
  cubicle: [2, 2], subwaycar: [2, 6], blastdoor: [2, 1], purifier: [2, 2], generator: [2, 1],
  bigbell: [2, 2], spiralstair: [2, 2], runecarpet: [2, 3], gobtent: [2, 2], trollnest: [3, 2], goldsarcophagus: [1, 2],
  noodlestand: [2, 1], hoverbike: [1, 2], cyberchair: [1, 1], broodmother: [3, 3], operatingtable: [1, 2], switchboard: [2, 1], specimenshelf: [2, 1],
  hospitalbed: [1, 2], curtainscreen: [3, 1], policecar: [2, 4], mugshot: [2, 1], barrier: [3, 1],
  bigtop: [4, 4], circusring: [3, 3], beastcage: [2, 1], tightrope: [4, 1], harpynest: [2, 2], ballfloor: [4, 4], bloodfountain: [2, 2], vampcoffin: [1, 2],
  helmconsole: [3, 1], starmap: [2, 2], viewport: [4, 1], blackboard: [3, 1], lockers: [3, 1], aisleshelf: [4, 1], checkout: [2, 1], freezer: [2, 1], canopy: [4, 3],
  dwarfstatue: [2, 2], runeforge: [2, 2], goldhoard: [2, 2], stonetable: [3, 2], teleportcircle: [3, 3], plaguecart: [2, 2],
  orecrusher: [2, 2], dockclamp: [3, 3], cyberlimbs: [2, 1], surgerybot: [2, 2], djbooth: [3, 1], velvetrope: [3, 1], neonbar: [4, 2],
  jetliner: [8, 8], baggagebelt: [4, 2], airportseats: [3, 1], departures: [3, 1], cinemascreen: [5, 1], cinemaseats: [4, 1],
  trollbridge: [5, 2], tiltrail: [6, 1], pavilion: [3, 3], lancerack: [2, 1], roastspit: [3, 1], greatoven: [2, 2], kitchentable: [3, 1], potrack: [2, 1],
  gardenarch: [2, 1], asylumbed: [1, 2], paddedwall: [3, 1], mechgantry: [3, 4], mechwreck: [3, 3], mecharm: [3, 1], towercrane: [2, 2], scaffold: [4, 1],
  container: [1, 3], gantrycrane: [4, 3], ferriswheel: [4, 4], coaster: [5, 1], bumpercars: [4, 3],
  silvertree: [3, 3], elvenfountain: [3, 3], wargpen: [3, 2], spikedgate: [2, 1], sunkenhull: [4, 5], anchorchain: [3, 1], yetibed: [3, 2], mammothtusk: [3, 1], frozencarcass: [3, 2], cultaltar: [2, 1], bloodcircle: [3, 3], sacrificeslab: [1, 2], terraformer: [4, 4], atmoplant: [3, 2], soilbeds: [3, 3], hiddenbar: [3, 2], pokertable: [2, 2], treadmill: [1, 2], weightbench: [1, 2], boxingring: [4, 4], readingtable: [3, 1], cardcatalog: [2, 1], printpress: [3, 2], newsdesk: [2, 1],
  diffengine: [3, 2], pneumatictubes: [3, 1], gearwall: [2, 1], dynamo: [2, 1], steamcar: [2, 3], steamtram: [1, 4], ornithopter: [3, 3], smokestack: [2, 2], gryphonnest: [3, 3], cryocell: [1, 2], prisonbunk: [1, 2], drillrig: [2, 2], icecore: [3, 1], diningtable: [2, 2], winerack: [2, 1], chefstove: [3, 1], morguedrawers: [3, 1], autopsy: [1, 2], sandbags: [3, 1], battletank: [3, 4], radar: [2, 2], bunker: [3, 3], domtent: [2, 2], sleepingbag: [1, 2], camper: [2, 4],
  mooringtower: [3, 3], passengerdeck: [4, 2], steamhammer: [2, 2], conveyor: [4, 1], furnace: [2, 2], pressuregauges: [2, 1], coalpile: [2, 2], saloondoors: [2, 1], saloonbar: [4, 1], faro: [2, 2], wantedboard: [2, 1], bankcounter: [4, 1], bankvault: [2, 2], jailcell: [2, 2], sheriffdesk: [2, 1], gunrack: [2, 1], locomotive: [1, 4], railcar: [1, 3], watertower: [2, 2], stationplatform: [4, 2], coveredwagon: [1, 3], hitchpost: [2, 1], windpump: [2, 2],
};
// Things that stretch over several cells: a long table, a big puddle, a carpet runner, a wide stair.
export const STRETCH: readonly PropKind[] = ['rug', 'table', 'bench', 'shelf', 'rack', 'puddle', 'stall', 'altar', 'bed', 'log', 'rubble', 'flowers', 'reeds', 'stairs', 'bones', 'coins', 'mushrooms', 'roundtable', 'fountain', 'tent', 'wardrobe',
  'counter', 'workbench', 'circle', 'spikes', 'web', 'fence', 'woodpile', 'fern', 'chains', 'plate',
  'kegs', 'dishes', 'hams', 'flour', 'tankards', 'console', 'pipes', 'solar', 'cargo', 'window', 'curtain', 'wallshelf',
  'bridge', 'pier', 'nets', 'runes', 'slime', 'bars', 'sheaf', 'pumpkins', 'chickens',
  'labbench', 'forcefield', 'holosign', 'eggs', 'goo', 'xenocrystal', 'bloodpool', 'bats', 'roses', 'ironfence',
  'vines', 'bigleaf', 'quicksand', 'sofa', 'tires', 'barricade',
  'iceblock', 'snowdrift', 'bamboo', 'zengarden', 'tatami', 'fabric', 'scrolls', 'landingpad', 'viewscreen', 'potionshelf', 'bookcase',
  'bathpool', 'waterfall', 'cliff', 'glowshrooms', 'lilypads', 'produce', 'stage', 'seats', 'breadrack',
  'coral', 'kelp', 'bubbles', 'cloud', 'gears', 'sheep', 'plank', 'ropebridge', 'hiderack', 'treasurepile', 'floatrock',
  'roundtower', 'squaretower', 'watchtower', 'stakes',
  'drawbridge', 'portcullis', 'garland', 'balloons', 'floatingbooks', 'pentagram', 'commandtent', 'fairtent',
  'fishbasket', 'spicesacks', 'brasslamps', 'scorch', 'ore', 'glowflowers', 'sludge', 'rats', 'rails', 'elvenarch', 'runedoor',
  'herbs', 'wisps', 'traptiles', 'vinewall', 'icicles', 'obsidian', 'fairyring', 'pyramid',
  'oxygen', 'cans', 'hydroponics', 'starwindow', 'corkboard', 'subwaycar', 'blastdoor',
  'herbbed', 'bookpile', 'runecarpet', 'junkpile', 'boulderpile', 'canopic', 'hieroglyphs', 'cables', 'graffiti', 'hivewall', 'spines', 'nestpods',
  'specimenshelf', 'curtainscreen', 'mugshot', 'barrier', 'switchboard',
  'feathers', 'tightrope', 'ballfloor', 'beastcage', 'helmconsole', 'viewport', 'blackboard', 'lockers', 'aisleshelf', 'freezer', 'tirestack', 'oilcans', 'canopy',
  'alecask', 'koboldtrap', 'goldhoard', 'corpsepile', 'stonetable', 'teleportcircle', 'discofloor', 'velvetrope', 'neonbar', 'baggagebelt', 'airportseats',
  'departures', 'cinemascreen', 'cinemaseats', 'cyberlimbs', 'djbooth',
  'trollbridge', 'tiltrail', 'lancerack', 'roastspit', 'kitchentable', 'potrack', 'mandrake', 'herbspiral', 'gardenarch', 'paddedwall', 'scaffold',
  'trafficcones', 'rebar', 'container', 'gantrycrane', 'coaster', 'bumpercars', 'mecharm',
  'skullpile', 'barnacles', 'icechunks', 'cultrobes', 'anchorchain', 'wargpen', 'spikedgate', 'yetibed', 'bloodcircle', 'soilbeds', 'hiddenbar', 'boxingring', 'readingtable', 'cardcatalog', 'dumbbells', 'newspapers', 'moonshine', 'atmoplant',
  'pneumatictubes', 'gearwall', 'diffengine', 'steamtram', 'prisonbunk', 'icecore', 'winerack', 'chefstove', 'morguedrawers', 'sandbags', 'bunker', 'leechjars',
  'passengerdeck', 'conveyor', 'pressuregauges', 'coalpile', 'saloonbar', 'wantedboard', 'bankcounter', 'jailcell', 'gunrack', 'locomotive', 'railcar', 'stationplatform', 'hitchpost', 'moneybags', 'tumbleweed'];
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

// Why a thing does not fit where it is (null — it does): past the edge, in a doorway, or on ground nothing stands on.
export type Misfit = 'edge' | 'door' | 'rock' | 'water' | 'wall' | 'house' | 'ground' | 'air';
export function misfit(l: Layout, p: Pick<Prop, 'kind' | 'x' | 'y' | 'w' | 'h'>): Misfit | null {
  const anywhere = p.kind === 'rug' || FREE.has(p.kind);
  for (let y = p.y; y < p.y + p.h; y++)
    for (let x = p.x; x < p.x + p.w; x++) {
      if (!inMap(l, x, y)) return 'edge';
      // Things may stand on things (a chest on a rug, a candle on a table): the later one is drawn on top.
      // A picture of the GM's own goes anywhere (a bridge on water, a beam over a wall).
      if (anywhere) continue;
      const c = at(l, x, y);
      if (!standable(c)) return c === NOTHING ? 'air' : c === '#' ? 'rock' : c === '~' || c === 'O' ? 'water' : isWall(c) || c === 'W' ? 'wall' : c === 'H' ? 'house' : 'ground';
      if (l.doors.some((d) => d.x === x && d.y === y)) return 'door';
    }
  return null;
}
const fits = (l: Layout, p: Prop, _except = -1) => !misfit(l, p);

// A thing put down with its top-left corner at the cell; the index of the new one, or -1 — it does not fit.
export function placeProp(l: Layout, kind: PropKind, x: number, y: number, face: Facing = 0, tint?: number): { layout: Layout; index: number } {
  const p: Prop = { kind, x, y, ...footprint(kind, face), ...(face ? { face } : {}), ...(tint === undefined ? {} : { tint }) };
  if (!fits(l, p)) return { layout: l, index: -1 };
  // Rugs lie under the rest.
  const props = kind === 'rug' ? [p, ...(l.props ?? [])] : [...(l.props ?? []), p];
  return { layout: { ...l, props }, index: kind === 'rug' ? 0 : props.length - 1 };
}

// A picture of the GM's own: its size in cells is the picture's (turned with it).
export function placeAsset(l: Layout, a: { path: string; w: number; h: number }, x: number, y: number, face: Facing = 0): { layout: Layout; index: number } {
  const [w, h] = face % 2 ? [a.h, a.w] : [a.w, a.h];
  const p: Prop = { kind: 'asset', asset: a.path, x, y, w: Math.min(MAX_ASSET_SIDE, w), h: Math.min(MAX_ASSET_SIDE, h), ...(face ? { face } : {}) };
  if (!fits(l, p)) return { layout: l, index: -1 };
  const props = [...(l.props ?? []), p];
  return { layout: { ...l, props }, index: props.length - 1 };
}

// Another variant of a picture where it stands (its size may differ).
export function setAssetVariant(l: Layout, i: number, a: { path: string; w: number; h: number }): Layout {
  const p = l.props?.[i];
  if (!p || p.kind !== 'asset' || p.asset === a.path) return l;
  const [w, h] = (p.face ?? 0) % 2 ? [a.h, a.w] : [a.w, a.h];
  const next: Prop = { ...p, asset: a.path, w, h };
  return fits(l, next, i) ? { ...l, props: l.props!.map((o, n) => (n === i ? next : o)) } : l;
}

export function removeProp(l: Layout, i: number): Layout {
  return i < 0 ? l : { ...l, props: (l.props ?? []).filter((_, n) => n !== i) };
}

export function rotateProp(l: Layout, i: number): Layout {
  const p = l.props?.[i];
  if (!p) return l;
  const face = (((p.face ?? 0) + 1) % 4) as Facing;
  // A picture keeps its own size: across, then along.
  const next: Prop = { ...p, ...(p.kind === 'asset' ? { w: p.h, h: p.w } : footprint(p.kind, face)), face };
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
// x, y: a new top-left corner (pulled by the left or top side); none — it stays.
export function stretchProp(l: Layout, i: number, w: number, h: number, x?: number, y?: number): Layout {
  const p = l.props?.[i];
  if (!p || !STRETCH.includes(p.kind)) return l;
  const W = Math.min(MAX_STRETCH, Math.max(1, Math.round(w)));
  const H = Math.min(MAX_STRETCH, Math.max(1, Math.round(h)));
  const X = x ?? p.x;
  const Y = y ?? p.y;
  if (W === p.w && H === p.h && X === p.x && Y === p.y) return l;
  const next = { ...p, x: X, y: Y, w: W, h: H };
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
export function resize(l: Layout, w: number, h: number, g = groundOf(l.style)): Layout {
  const W = Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(w)));
  const H = Math.min(MAX_SIDE, Math.max(MIN_SIDE, Math.round(h)));
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
    roofs: l.roofs?.filter(keep),
    ...(l.edges ? { edges: l.edges.filter((e) => edgeInMap({ w: W, h: H }, e)) } : {}),
    ...(l.levels ? { levels: l.levels.map((v) => resize(v, W, H, NOTHING)) } : {}),
  });
}

// ---- Storeys ----
// A storey with nothing on it yet, over the map `l`.
export const blankLevel = (l: Layout, n: number): Layout => ({
  style: l.style,
  seed: (l.seed + Math.imul(n + 1, 7919)) >>> 0,
  w: l.w,
  h: l.h,
  cells: Array.from({ length: l.h }, () => NOTHING.repeat(l.w)),
  rooms: [],
  doors: [],
  pillars: [],
  props: [],
});
// One storey more, on top.
export function addLevel(l: Layout): Layout {
  const levels = l.levels ?? [];
  return levels.length >= MAX_LEVELS ? l : { ...l, levels: [...levels, blankLevel(l, levels.length + 1)] };
}
// Storey `n` (1 — the first over the map) gone, those over it go down one.
export function removeLevel(l: Layout, n: number): Layout {
  const levels = (l.levels ?? []).filter((_, i) => i !== n - 1);
  const out: Layout = { ...l, levels };
  if (!levels.length) delete out.levels;
  return out;
}
// The map with storey `n` (0 — the map itself) changed.
export const withLevel = (l: Layout, n: number, next: Layout): Layout =>
  n === 0 ? { ...next, ...(l.levels ? { levels: l.levels } : {}) } : { ...l, levels: (l.levels ?? []).map((v, i) => (i === n - 1 ? next : v)) };
// Storey `n` of the map (0 — the map).
export const levelOf = (l: Layout, n: number): Layout => (n === 0 ? l : (l.levels?.[n - 1] ?? l));

// The world of the map (fantasy is no field at all: old maps are fantasy).
export function setGenre(l: Layout, genre: Genre): Layout {
  if ((l.genre ?? 'fantasy') === genre) return l;
  const out: Layout = { ...l, genre };
  if (genre === 'fantasy') delete out.genre;
  return out;
}

// The time of day: dawn, dusk, night; null — day.
export function setLight(l: Layout, light: Light | null): Layout {
  if ((l.light ?? null) === light) return l;
  const out: Layout = { ...l, light: light ?? undefined };
  if (!light) delete out.light;
  return out;
}

// A thing of one kind becomes another where it stands (a chest and the mimic it really is).
export function swapKind(l: Layout, i: number, kind: PropKind): Layout {
  const p = l.props?.[i];
  if (!p || p.kind === kind) return l;
  return { ...l, props: l.props!.map((q, n) => (n === i ? { ...q, kind } : q)) };
}

export const isOutdoor = (style: LayoutStyle) => style === 'town' || isWild(style);
