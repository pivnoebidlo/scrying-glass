// Things on a generated map: furniture by what a room is for, rocks and bones in a cave, stalls and carts on a town's
// squares, logs and bushes outdoors. Data of the layout (the picture draws them, draw-props.ts); placed from the
// layout's own seed, so the same layout always has the same things. Nothing stands in a doorway or a room's entry.
import { isWild, seededRandom, type Layout, type LayoutRoom } from './layout';

export const ROOM_THEMES = ['storage', 'barracks', 'hall', 'library', 'shrine', 'crypt', 'armory', 'treasury', 'ruin'] as const;
export type RoomTheme = (typeof ROOM_THEMES)[number];

export const PROP_KINDS = [
  'barrel', 'crate', 'sack', 'bed', 'chest', 'table', 'chair', 'bench', 'shelf', 'desk', 'altar', 'candle', 'rug',
  'sarcophagus', 'rack', 'rubble', 'bones', 'hearth', 'coins', 'stalagmite', 'mushrooms', 'puddle', 'campfire', 'bedroll',
  'stall', 'cart', 'log', 'stump', 'bush', 'flowers', 'reeds',
  // Since 0.104, for the map editor.
  'stairs', 'trapdoor', 'throne', 'statue', 'brazier', 'cauldron', 'anvil', 'cage', 'roundtable', 'wardrobe', 'fountain', 'tent',
  'boat', 'haystack', 'grave', 'well',
  // Since 0.104 too (draw-more.ts).
  'bathtub', 'chandelier', 'counter', 'stool', 'cushion', 'workbench', 'woodpile', 'bucket', 'urn', 'grindstone',
  'circle', 'crystal', 'pedestal', 'obelisk', 'idol', 'chains', 'stocks', 'spikes', 'web', 'lever', 'torch', 'plate',
  'fence', 'signpost', 'lamppost', 'trough', 'gallows', 'menhir', 'cairn', 'totem', 'deadtree', 'fern', 'nest',
  // Since 0.106: not in the palette (a chest becomes one); drawn as a chest.
  'mimic',
  // Since 0.107: a picture of the GM's own (Prop.asset).
  'asset',
  // Since 0.108 (draw-sets.ts): a tavern's kitchen; a ship and a colony.
  'oven', 'spit', 'kegs', 'flour', 'dishes', 'washtub', 'block', 'hams', 'tankards',
  'console', 'locker', 'cargo', 'hatch', 'bunk', 'terminal', 'holo', 'reactor', 'pipes', 'rayguns', 'rover', 'dish', 'solar', 'pod', 'beacon',
  // On walls: they go over the wall cells.
  'window', 'banner', 'painting', 'trophy', 'curtain', 'wallshelf',
  // draw-sets2.ts: the forest and the road, a port, a temple and magic, a prison, a village and a farm.
  'shelter', 'beartrap', 'bridge', 'milestone', 'beehive', 'wayshrine', 'pier', 'bollard', 'nets', 'anchor', 'rope', 'buoy', 'lighthouse', 'lectern', 'font', 'mirror', 'runes', 'orb', 'portal', 'bars', 'torturerack', 'coffin', 'slime', 'skeleton', 'ironmaiden', 'coop', 'scarecrow', 'sheaf', 'churn', 'pumpkins', 'chickens',
  // draw-sets3.ts: a lab, a city of the future, aliens; a manor and its crypt; an office, a bar, a street.
  'medpod', 'labbench', 'tank', 'servers', 'robot', 'forcefield', 'hovercar', 'vending', 'holosign', 'eggs', 'alienplant', 'saucer', 'cocoon', 'xenocrystal', 'goo', 'candelabra', 'organ', 'piano', 'gargoyle', 'bloodpool', 'bats', 'ironfence', 'mausoleum', 'goblet', 'roses', 'tombstone', 'filing', 'typewriter', 'phone', 'jukebox', 'pooltable', 'ceilingfan', 'sedan', 'hydrant', 'newsstand', 'trashcan', 'phonebooth', 'chalk',
  // draw-sets4.ts: jungle and desert, a sailing ship; a home and a street of today; the wasteland.
  'cactus', 'skull', 'vines', 'bigleaf', 'idolhead', 'quicksand', 'joshua', 'mast', 'helm', 'cannon', 'hammock', 'capstan', 'sofa', 'tv', 'fridge', 'stove', 'computer', 'washer', 'bicycle', 'cone', 'toxicbarrel', 'wreck', 'tires', 'barricade', 'burnbarrel', 'radsign', 'shack',
  // draw-sets5.ts: the north; the East; a starship and a hangar; an alchemist, a tailor, a library, a bank.
  'igloo', 'sled', 'iceblock', 'snowdrift', 'runestone', 'icehole', 'pagoda', 'lantern', 'zengarden', 'zenrock', 'bamboo', 'torii', 'tatami', 'lowtable', 'koipond', 'captainchair', 'viewscreen', 'cryopod', 'restraint', 'shuttle', 'fueltank', 'mech', 'landingpad', 'drone', 'alembic', 'potionshelf', 'mannequin', 'loom', 'fabric', 'bookcase', 'globe', 'scrolls', 'safe', 'scales', 'vaultdoor',
  // draw-sets6.ts: crafts; nature; a city's places.
  'windmill', 'watermill', 'breadrack', 'horse', 'hayrack', 'saddle', 'forge', 'quench', 'bathpool', 'waterfall', 'cliff', 'cavecrystals', 'giantmushroom', 'glowshrooms', 'lilypads', 'driftwood', 'produce', 'dummy', 'archery', 'stage', 'seats', 'podium', 'cryptentrance',
  // draw-sets7.ts: under the sea; the sky; a steampunk workshop; a nomads' camp; a pirates' cove.
  'coral', 'kelp', 'giantclam', 'shipwreck', 'anemone', 'bubbles', 'cloud', 'airship', 'mooringmast', 'floatrock', 'balloon', 'gears', 'boiler', 'automaton', 'telescope', 'teslacoil', 'gauges', 'yurt', 'camel', 'tripod', 'hiderack', 'sheep', 'treasurepile', 'jollyroger', 'plank', 'charttable', 'parrot', 'ropebridge',
  // draw-sets8.ts: towers, a watchtower, siege engines, stakes.
  'roundtower', 'squaretower', 'watchtower', 'ballista', 'catapult', 'stakes',
  // draw-sets9.ts: an army's camp; magic places; a festival; a town's own things.
  'commandtent', 'supplywagon', 'drawbridge', 'portcullis', 'armorstand', 'stonecircle', 'observatory', 'necroaltar', 'pentagram', 'floatingbooks', 'carousel', 'maypole', 'garland', 'fairtent', 'foodcart', 'puppetshow', 'balloons', 'clocktower', 'noticeboard', 'guardbooth', 'pillory',
  // draw-sets10.ts: a graveyard; a harbour; a bazaar; a dragon's lair; a mine; an elven wood; the sewers.
  'freshgrave', 'angelstatue', 'gravelantern', 'shovel', 'wreath', 'galleon', 'harborcrane', 'fishbasket', 'rugstall', 'spicesacks', 'hookah', 'brasslamps', 'dragonskull', 'dragoneggs', 'ribcage', 'scorch', 'minecart', 'rails', 'ore', 'minesupport', 'runedoor', 'treehouse', 'moonwell', 'elvenarch', 'glowflowers', 'grate', 'outflow', 'sludge', 'rats', 'manhole',
] as const;
export type PropKind = (typeof PROP_KINDS)[number];

// Where the prop's front looks: 0 up, 1 right, 2 down, 3 left (a bed's head and a shelf's back are on the other side).
export type Facing = 0 | 1 | 2 | 3;
export interface Prop {
  kind: PropKind;
  // In cells: the footprint on the map, after turning.
  x: number;
  y: number;
  w: number;
  h: number;
  face?: Facing;
  // A colour or variant, 0…1, for things that differ (a stall's awning, a rug).
  tint?: number;
  // An 'asset': its picture, the path inside <library>/assets/ (shared/mapassets.ts).
  asset?: string;
}

type Random = () => number;
const pick = <T>(list: readonly T[], r: Random) => list[Math.floor(r() * list.length)]!;
const key = (x: number, y: number) => `${x},${y}`;

class Ground {
  private taken = new Set<string>();
  props: Prop[] = [];
  constructor(private ok: (x: number, y: number) => boolean) {}
  free(x: number, y: number, w = 1, h = 1) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (!this.ok(x + dx, y + dy) || this.taken.has(key(x + dx, y + dy))) return false;
    return true;
  }
  block(x: number, y: number) {
    this.taken.add(key(x, y));
  }
  // Lies on the floor under other things (a rug): takes no room, drawn first.
  // A doorway's free cells do not matter to it: it lies on the floor.
  under(p: Prop) {
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) if (!this.ok(p.x + dx, p.y + dy)) return;
    this.props.unshift(p);
  }
  put(p: Prop): boolean {
    if (!this.free(p.x, p.y, p.w, p.h)) return false;
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) this.taken.add(key(p.x + dx, p.y + dy));
    this.props.push(p);
    return true;
  }
}

// A cell along a wall of a room, with the way into the room from it.
interface WallCell {
  x: number;
  y: number;
  face: Facing;
}

function wallCells(a: LayoutRoom): WallCell[] {
  const out: WallCell[] = [];
  for (let x = a.x; x < a.x + a.w; x++) out.push({ x, y: a.y, face: 2 }, { x, y: a.y + a.h - 1, face: 0 });
  for (let y = a.y + 1; y < a.y + a.h - 1; y++) out.push({ x: a.x, y, face: 1 }, { x: a.x + a.w - 1, y, face: 3 });
  return out;
}

// A thing of length 2 along a wall, its back to the wall (a bed, a sarcophagus): its footprint from a wall cell.
function deep(c: WallCell, len: number) {
  if (c.face === 2) return { x: c.x, y: c.y, w: 1, h: len };
  if (c.face === 0) return { x: c.x, y: c.y - len + 1, w: 1, h: len };
  if (c.face === 1) return { x: c.x, y: c.y, w: len, h: 1 };
  return { x: c.x - len + 1, y: c.y, w: len, h: 1 };
}

function furnishRoom(g: Ground, a: LayoutRoom, theme: RoomTheme, r: Random) {
  const walls = wallCells(a).sort(() => r() - 0.5);
  const inner = { x: a.x + 1, y: a.y + 1, w: a.w - 2, h: a.h - 2 };
  const along = (kind: PropKind, share: number, tint = false) => {
    for (const c of walls) if (r() < share) g.put({ kind, x: c.x, y: c.y, w: 1, h: 1, face: c.face, ...(tint ? { tint: r() } : {}) });
  };
  const centreTable = (benches: boolean) => {
    const wide = inner.w >= inner.h;
    const len = Math.max(1, Math.min(wide ? inner.w - 2 : inner.h - 2, 5));
    const tx = wide ? a.x + Math.floor((a.w - len) / 2) : a.x + Math.floor(a.w / 2);
    const ty = wide ? a.y + Math.floor(a.h / 2) : a.y + Math.floor((a.h - len) / 2);
    const table = { kind: 'table' as const, x: tx, y: ty, w: wide ? len : 1, h: wide ? 1 : len };
    if (!g.put(table)) return;
    if (benches) {
      const side = (dx: number, dy: number, face: Facing) => g.put({ kind: 'bench', x: tx + dx, y: ty + dy, w: table.w, h: table.h, face });
      if (wide) (side(0, -1, 2), side(0, 1, 0));
      else (side(-1, 0, 1), side(1, 0, 3));
    }
  };
  switch (theme) {
    case 'storage':
      for (const c of walls) if (r() < 0.45) g.put({ kind: pick(['barrel', 'barrel', 'crate', 'crate', 'sack'] as const, r), x: c.x, y: c.y, w: 1, h: 1 });
      break;
    case 'barracks':
      for (const c of walls) if (r() < 0.5) {
        const f = deep(c, 2);
        if (g.put({ kind: 'bed', ...f, face: c.face, tint: r() })) {
          const foot = c.face === 2 ? { x: f.x, y: f.y + 2 } : c.face === 0 ? { x: f.x, y: f.y - 1 } : c.face === 1 ? { x: f.x + 2, y: f.y } : { x: f.x - 1, y: f.y };
          if (r() < 0.5) g.put({ kind: 'chest', ...foot, w: 1, h: 1, face: c.face });
        }
      }
      break;
    case 'hall':
      if (inner.w >= 3 && inner.h >= 3) g.under({ kind: 'rug', x: inner.x, y: inner.y, w: inner.w, h: inner.h, tint: r() });
      centreTable(true);
      if (walls[0]) g.put({ kind: 'hearth', x: walls[0].x, y: walls[0].y, w: 1, h: 1, face: walls[0].face });
      along('barrel', 0.08);
      break;
    case 'library': {
      along('shelf', 0.85);
      const cx = a.x + Math.floor(a.w / 2);
      const cy = a.y + Math.floor(a.h / 2);
      if (inner.w >= 3 && inner.h >= 3) g.under({ kind: 'rug', x: cx - 1, y: cy - 1, w: 3, h: 3, tint: r() });
      if (inner.w >= 4 && inner.h >= 4) centreTable(false);
      else if (g.put({ kind: 'desk', x: cx, y: cy, w: 1, h: 1, face: 2 })) g.put({ kind: 'chair', x: cx, y: cy - 1, w: 1, h: 1, face: 2 });
      break;
    }
    case 'shrine': {
      // The altar in the middle of a wall, candles by it, pews in rows facing it with an aisle down the middle.
      const cx = a.x + Math.floor(a.w / 2);
      const cy = a.y + Math.floor(a.h / 2);
      const spots: WallCell[] = [
        { x: cx, y: a.y, face: 2 },
        { x: cx, y: a.y + a.h - 1, face: 0 },
        { x: a.x, y: cy, face: 1 },
        { x: a.x + a.w - 1, y: cy, face: 3 },
      ].sort(() => r() - 0.5) as WallCell[];
      const far = spots.find((c) => g.free(c.x, c.y));
      if (!far) break;
      g.put({ kind: 'altar', x: far.x, y: far.y, w: 1, h: 1, face: far.face });
      const across = far.face === 0 || far.face === 2;
      for (const d of [-2, 2]) g.put({ kind: 'candle', x: far.x + (across ? d : 0), y: far.y + (across ? 0 : d), w: 1, h: 1 });
      const step = far.face === 2 || far.face === 1 ? 1 : -1;
      const toward = ((far.face + 2) % 4) as Facing;
      for (let d = 2; d < (across ? a.h : a.w) - 1; d += 2) {
        if (across) {
          const y = far.y + step * d;
          g.put({ kind: 'bench', x: a.x + 1, y, w: cx - a.x - 1, h: 1, face: toward });
          g.put({ kind: 'bench', x: cx + 1, y, w: a.x + a.w - 2 - cx, h: 1, face: toward });
        } else {
          const x = far.x + step * d;
          g.put({ kind: 'bench', x, y: a.y + 1, w: 1, h: cy - a.y - 1, face: toward });
          g.put({ kind: 'bench', x, y: cy + 1, w: 1, h: a.y + a.h - 2 - cy, face: toward });
        }
      }
      break;
    }
    case 'crypt':
      for (let y = a.y + 1; y + 1 < a.y + a.h - 1; y += 3)
        for (let x = a.x + 1; x < a.x + a.w - 1; x += 2) if (r() < 0.75) g.put({ kind: 'sarcophagus', x, y, w: 1, h: 2, face: 2 });
      along('candle', 0.1);
      break;
    case 'armory':
      along('rack', 0.45);
      if (inner.w >= 2 && inner.h >= 2) centreTable(false);
      break;
    case 'treasury':
      for (const c of walls) if (r() < 0.3) g.put({ kind: 'chest', x: c.x, y: c.y, w: 1, h: 1, face: c.face });
      for (let i = 0; i < 3; i++) g.put({ kind: 'coins', x: inner.x + Math.floor(r() * Math.max(1, inner.w)), y: inner.y + Math.floor(r() * Math.max(1, inner.h)), w: 1, h: 1 });
      break;
    case 'ruin':
      for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (r() < 0.2) g.put({ kind: pick(['rubble', 'rubble', 'rubble', 'bones', 'crate', 'barrel'] as const, r), x, y, w: 1, h: 1, tint: r() });
      break;
  }
}

// The cells of a room through which one comes in, and those around them: kept free.
function entries(l: Layout, a: LayoutRoom): [number, number][] {
  const floor = (x: number, y: number) => l.cells[y]?.[x] === '.';
  const inRoom = (x: number, y: number) => x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h;
  const out: [number, number][] = [];
  for (let y = a.y; y < a.y + a.h; y++)
    for (let x = a.x; x < a.x + a.w; x++)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
        if (floor(x + dx, y + dy) && !inRoom(x + dx, y + dy) && floor(x, y)) for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) out.push([x + ex, y + ey]);
  return out;
}

export function furnish(l: Layout, themes: (RoomTheme | undefined)[] = []): Prop[] {
  const r = seededRandom(l.seed ^ 0x5bd1e995);
  const cell = (x: number, y: number) => l.cells[y]?.[x];
  const pillar = new Set(l.pillars.map((p) => key(p.x, p.y)));

  if (l.style === 'building') {
    const g = new Ground((x, y) => cell(x, y) === '.' && !pillar.has(key(x, y)));
    for (const d of l.doors) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) g.block(d.x + dx, d.y + dy);
    l.rooms.forEach((a) => entries(l, a).forEach(([x, y]) => g.block(x, y)));
    l.rooms.forEach((a, i) => furnishRoom(g, a, themes[i] ?? pick(ROOM_THEMES, r), r));
    return g.props;
  }

  if (l.style === 'cave') {
    const g = new Ground((x, y) => cell(x, y) === '.');
    l.rooms.forEach((a) => entries(l, a).forEach(([x, y]) => g.block(x, y)));
    const camp = Math.floor(r() * l.rooms.length);
    l.rooms.forEach((a, i) => {
      if (themes[i] === 'treasury') furnishRoom(g, a, 'treasury', r);
      if (i === camp && !themes[i]) {
        const cx = a.x + Math.floor(a.w / 2);
        const cy = a.y + Math.floor(a.h / 2);
        if (g.put({ kind: 'campfire', x: cx, y: cy, w: 1, h: 1 })) {
          g.put({ kind: 'bedroll', x: cx - 1, y: cy - 1, w: 1, h: 2, face: 1, tint: r() });
          g.put({ kind: 'bedroll', x: cx + 1, y: cy, w: 1, h: 2, face: 3, tint: r() });
        }
      }
      for (let y = a.y; y < a.y + a.h; y++)
        for (let x = a.x; x < a.x + a.w; x++) {
          const n = r();
          if (n < 0.05) g.put({ kind: 'stalagmite', x, y, w: 1, h: 1, tint: r() });
          else if (n < 0.08) g.put({ kind: themes[i] === 'crypt' || themes[i] === 'ruin' ? 'bones' : 'mushrooms', x, y, w: 1, h: 1, tint: r() });
          else if (n < 0.1) g.put({ kind: 'puddle', x, y, w: 1, h: 1, tint: r() });
          else if (n < 0.115) g.put({ kind: 'bones', x, y, w: 1, h: 1, tint: r() });
        }
    });
    return g.props;
  }

  if (l.style === 'town') {
    const g = new Ground((x, y) => cell(x, y) === 'P' && !pillar.has(key(x, y)));
    for (const p of l.pillars) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) g.block(p.x + dx, p.y + dy);
    for (const a of l.rooms) {
      const stalls = 1 + Math.floor(r() * 3);
      for (let t = 0, made = 0; t < 30 && made < stalls; t++) {
        const x = a.x + Math.floor(r() * a.w);
        const y = a.y + Math.floor(r() * a.h);
        const wide = r() < 0.5;
        if (g.put({ kind: 'stall', x, y, w: wide ? 2 : 1, h: wide ? 1 : 2, face: wide ? 2 : 1, tint: r() })) {
          made++;
          g.put({ kind: pick(['crate', 'barrel', 'sack'] as const, r), x: wide ? x + 2 : x + 1, y: wide ? y : y + 1, w: 1, h: 1 });
        }
      }
      if (r() < 0.6)
        for (let t = 0; t < 20; t++) {
          const x = a.x + Math.floor(r() * a.w);
          const y = a.y + Math.floor(r() * a.h);
          if (g.put({ kind: 'cart', x, y, w: 2, h: 1, face: r() < 0.5 ? 1 : 3, tint: r() })) break;
        }
    }
    // By the houses along the streets, now and then.
    const street = new Ground((x, y) => cell(x, y) === ',');
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++)
        if (cell(x, y) === ',' && r() < 0.02 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cell(x + dx!, y + dy!) === 'H'))
          street.put({ kind: pick(['barrel', 'crate'] as const, r), x, y, w: 1, h: 1 });
    return [...g.props, ...street.props];
  }

  if (isWild(l.style)) {
    // The places themselves stay clear: that is where the fight is.
    const g = new Ground((x, y) => cell(x, y) === '.' && !l.rooms.some((a) => x >= a.x - 1 && y >= a.y - 1 && x <= a.x + a.w && y <= a.y + a.h));
    const extra: PropKind = l.style === 'meadow' ? 'flowers' : l.style === 'swamp' ? 'reeds' : l.style === 'forest' ? 'mushrooms' : 'bush';
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++) {
        const n = r();
        if (n < 0.012) {
          const across = r() < 0.5;
          g.put({ kind: 'log', x, y, w: across ? 2 : 1, h: across ? 1 : 2, face: across ? 0 : 1, tint: r() });
        }
        else if (n < 0.022) g.put({ kind: 'stump', x, y, w: 1, h: 1, tint: r() });
        else if (n < 0.045) g.put({ kind: 'bush', x, y, w: 1, h: 1, tint: r() });
        else if (n < 0.07) g.put({ kind: extra, x, y, w: 1, h: 1, tint: r() });
      }
    return g.props;
  }
  return [];
}
