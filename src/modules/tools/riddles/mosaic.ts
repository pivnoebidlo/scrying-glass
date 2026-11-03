// Tile puzzles: a mosaic with fallen tiles (each sign once in every row and column), a path over signed tiles (the
// signs in a set order), switches (a slab turns over with its neighbours). Each has exactly one solution (switches —
// the fewest presses). Drawn as a canvas (shared/sketch.ts): the same picture for the GM and as a handout.
import { NOTE_SHAPES } from '../../../shared/notes';
import { newSketch, type Sketch, type SketchItem } from '../../../shared/sketch';
import { shuffle, type Rand } from './logic';

// The signs: a shape with its own colour — told apart by either.
export const SIGNS = ['circle', 'ring', 'square', 'frame', 'cross', 'diamond'] as const;
export type Sign = number;
const SIGN_COLOR = ['#c62828', '#1565c0', '#2e7d32', '#6a1b9a', '#1b1b1b', '#ef6c00'];
// The signs as text (the journal).
export const SIGN_GLYPH = ['●', '◯', '■', '□', '✕', '◆'];

export type MosaicKind = 'mosaic' | 'path' | 'switches';

export interface MosaicGrid {
  kind: MosaicKind;
  w: number;
  h: number;
  // Sign per cell, row by row; -1 — a hole (mosaic). Switches: 1 — light, 0 — dark.
  cells: number[];
  // Mosaic: the loose tiles; the full picture.
  loose?: Sign[];
  solution?: number[];
  // Path: the order of signs (repeats), the cells of the way from the near (bottom) row to the far (top) one.
  sequence?: Sign[];
  path?: number[];
  // Switches: the slabs to press.
  presses?: number[];
}

// --- Mosaic: a Latin square with holes ----------------------------------------------------------------------------

/** How many ways the holes (-1) fill so that every row and column has each sign once; stops at `cap`. */
export function latinCompletions(cells: number[], n: number, cap = 2): number {
  const g = [...cells];
  const holes = g.map((v, i) => (v < 0 ? i : -1)).filter((i) => i >= 0);
  let count = 0;
  const fits = (i: number, v: number) => {
    const r = Math.floor(i / n);
    const c = i % n;
    for (let k = 0; k < n; k++) if (g[r * n + k] === v || g[k * n + c] === v) return false;
    return true;
  };
  const go = (h: number) => {
    if (count >= cap) return;
    if (h === holes.length) return void count++;
    const i = holes[h]!;
    for (let v = 0; v < n; v++) {
      if (!fits(i, v)) continue;
      g[i] = v;
      go(h + 1);
      g[i] = -1;
    }
  };
  go(0);
  return count;
}

export function makeMosaic(n: number, holes: number, decoys: number, rand: Rand): MosaicGrid {
  // A cyclic square with its rows, columns and signs shuffled — still Latin.
  const rows = shuffle([...Array(n).keys()], rand);
  const cols = shuffle([...Array(n).keys()], rand);
  const signs = shuffle([...SIGNS.keys()], rand).slice(0, n);
  const solution = Array.from({ length: n * n }, (_, i) => signs[(rows[Math.floor(i / n)]! + cols[i % n]!) % n]!);
  const cells = [...solution];
  // Take tiles out while the picture still fills one way only.
  const sign = (v: number) => signs.indexOf(v);
  for (const i of shuffle([...cells.keys()], rand)) {
    if (cells.filter((v) => v < 0).length >= holes) break;
    const keep = cells[i]!;
    cells[i] = -1;
    if (latinCompletions(cells.map((v) => (v < 0 ? -1 : sign(v))), n) !== 1) cells[i] = keep;
  }
  const out = cells.map((v, i) => (v < 0 ? solution[i]! : -1)).filter((v) => v >= 0);
  const others = [...SIGNS.keys()].filter((s) => !signs.includes(s));
  const extra = Array.from({ length: decoys }, () => (others.length && rand() < 0.5 ? others[Math.floor(rand() * others.length)]! : signs[Math.floor(rand() * n)]!));
  return { kind: 'mosaic', w: n, h: n, cells, loose: shuffle([...out, ...extra], rand), solution };
}

// --- Path ---------------------------------------------------------------------------------------------------------

const near = (i: number, w: number, h: number) => {
  const r = Math.floor(i / w);
  const c = i % w;
  return [r > 0 ? i - w : -1, r < h - 1 ? i + w : -1, c > 0 ? i - 1 : -1, c < w - 1 ? i + 1 : -1].filter((x) => x >= 0);
};

/** The ways from the near row to the far one stepping on the signs in order; stops at `cap`. */
export function pathWays(g: MosaicGrid, cap = 2): number[][] {
  const { w, h, cells } = g;
  const seq = g.sequence!;
  const found: number[][] = [];
  const way: number[] = [];
  const seen = new Set<number>();
  const go = (i: number) => {
    if (found.length >= cap) return;
    way.push(i);
    seen.add(i);
    if (i < w) found.push([...way]);
    else for (const j of near(i, w, h)) if (!seen.has(j) && cells[j] === seq[way.length % seq.length]) go(j);
    way.pop();
    seen.delete(i);
  };
  for (let c = 0; c < w; c++) if (cells[(h - 1) * w + c] === seq[0]) go((h - 1) * w + c);
  return found;
}

// A winding way up: sideways runs between steps up, never back on itself.
function walk(w: number, h: number, rand: Rand): number[] {
  let c = Math.floor(rand() * w);
  const out = [(h - 1) * w + c];
  for (let r = h - 1; r > 0; r--) {
    const run = Math.floor(rand() * w);
    const dir = rand() < 0.5 ? -1 : 1;
    for (let k = 0; k < run; k++) {
      // Not along the row just left: that would touch the way and give a shortcut.
      if (c + dir < 0 || c + dir >= w) break;
      c += dir;
      out.push(r * w + c);
    }
    out.push((r - 1) * w + c);
  }
  return out;
}

export function makePath(w: number, h: number, length: number, decoys: number, careful: boolean, rand: Rand): MosaicGrid {
  const signs = shuffle([...SIGNS.keys()], rand);
  const sequence = signs.slice(0, length);
  const pool = signs.slice(0, length + decoys);
  for (let tries = 0; tries < 400; tries++) {
    const path = walk(w, h, rand);
    const cells: number[] = Array(w * h).fill(-1);
    path.forEach((i, k) => (cells[i] = sequence[k % length]!));
    const on = new Map(path.map((i, k) => [i, k]));
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]! >= 0) continue;
      // Careful: no sign a step off the way would want, no start in the near row.
      const bad = new Set<number>();
      if (careful || tries > 200) {
        for (const j of near(i, w, h)) if (on.has(j)) bad.add(sequence[(on.get(j)! + 1) % length]!);
        if (i >= (h - 1) * w) bad.add(sequence[0]!);
      }
      const ok = pool.filter((s) => !bad.has(s));
      const from = ok.length ? ok : pool;
      cells[i] = from[Math.floor(rand() * from.length)]!;
    }
    const g: MosaicGrid = { kind: 'path', w, h, cells, sequence, path };
    const ways = pathWays(g);
    if (ways.length === 1 && ways[0]!.join() === path.join()) return g;
  }
  // Practically never: a straight way up.
  const path = Array.from({ length: h }, (_, r) => (h - 1 - r) * w);
  const cells = Array.from({ length: w * h }, (_, i) => (i % w === 0 ? sequence[(h - 1 - Math.floor(i / w)) % length]! : pool[length] ?? sequence[1]!));
  return { kind: 'path', w, h, cells, sequence, path };
}

// --- Switches -----------------------------------------------------------------------------------------------------

/** Pressing slab `i`: it and its four neighbours turn over. */
export function press(cells: number[], n: number, i: number): number[] {
  const out = [...cells];
  for (const j of [i, ...near(i, n, n)]) out[j] = 1 - out[j]!;
  return out;
}

/** The fewest presses that make every slab light (every set of presses as a bit mask: up to 4 × 4). */
export function solveSwitches(cells: number[], n: number): number[] | null {
  const size = n * n;
  const toggle = [...Array(size).keys()].map((i) => [i, ...near(i, n, n)].reduce((m, j) => m | (1 << j), 0));
  const dark = cells.reduce((m, v, i) => (v ? m : m | (1 << i)), 0);
  const eff = new Uint32Array(1 << size);
  let best = -1;
  let bestCount = Infinity;
  for (let mask = 1; mask < 1 << size; mask++) {
    const low = mask & -mask;
    eff[mask] = eff[mask & (mask - 1)]! ^ toggle[31 - Math.clz32(low)]!;
    if (eff[mask] !== dark) continue;
    const count = [...Array(size).keys()].filter((i) => mask & (1 << i)).length;
    if (count < bestCount) (best = mask), (bestCount = count);
  }
  if (dark === 0) return [];
  return best < 0 ? null : [...Array(size).keys()].filter((i) => best & (1 << i));
}

export function makeSwitches(n: number, presses: number, rand: Rand): MosaicGrid {
  for (let tries = 0; tries < 50; tries++) {
    const picked = shuffle([...Array(n * n).keys()], rand).slice(0, presses);
    const cells = picked.reduce((g, i) => press(g, n, i), Array(n * n).fill(1) as number[]);
    const best = solveSwitches(cells, n);
    if (best && best.length >= Math.max(2, presses - 1)) return { kind: 'switches', w: n, h: n, cells, presses: best };
  }
  const cells = press(press(Array(n * n).fill(1) as number[], n, 0), n, n * n - 1);
  return { kind: 'switches', w: n, h: n, cells, presses: [0, n * n - 1] };
}

// --- At the table: what the players did --------------------------------------------------------------------------

// Switches — the slabs as they are now; mosaic — the tiles put into holes (cell → sign); path — the tiles stepped on.
export interface Play {
  cells?: number[];
  placed?: Record<number, Sign>;
  steps?: number[];
}

/** A hole clicked: the next of the fallen signs, after the last — empty again. */
export function placeNext(g: MosaicGrid, placed: Record<number, Sign>, i: number): Record<number, Sign> {
  if (g.cells[i] !== -1 || !g.loose) return placed;
  const options = [...new Set(g.loose)].sort((a, b) => a - b);
  const now = placed[i];
  const k = now === undefined ? 0 : options.indexOf(now) + 1;
  const out = { ...placed };
  if (k < options.length) out[i] = options[k]!;
  else delete out[i];
  return out;
}

export function mosaicStatus(g: MosaicGrid, placed: Record<number, Sign>): 'partial' | 'wrong' | 'solved' {
  const holes = g.cells.map((v, i) => (v < 0 ? i : -1)).filter((i) => i >= 0);
  if (holes.some((i) => placed[i] === undefined)) return 'partial';
  return holes.every((i) => placed[i] === g.solution![i]) ? 'solved' : 'wrong';
}

/** A tile clicked on the path: a step from the last one (the first — in the near row); the last one again — back. */
export function stepOn(g: MosaicGrid, steps: number[], i: number): number[] {
  if (steps.at(-1) === i) return steps.slice(0, -1);
  if (steps.includes(i)) return steps;
  if (!steps.length) return i >= (g.h - 1) * g.w ? [i] : steps;
  return near(steps.at(-1)!, g.w, g.h).includes(i) ? [...steps, i] : steps;
}

export function pathStatus(g: MosaicGrid, steps: number[]): 'none' | 'going' | 'wrong' | 'done' {
  if (!steps.length) return 'none';
  const seq = g.sequence!;
  if (steps.some((i, k) => g.cells[i] !== seq[k % seq.length])) return 'wrong';
  return steps.at(-1)! < g.w ? 'done' : 'going';
}

// --- Drawing ----------------------------------------------------------------------------------------------------

const SHAPE = 'landscape';
const ASPECT = NOTE_SHAPES[SHAPE].aspect;
const TILE = '#e9dcc0';
const EDGE = '#6d4c41';
const LIGHT = '#f2c41b';
const DARK = '#2b3a55';
const MARK = '#c62828';

// Where the grid lies: x, y of the top left corner (fractions of width and height), a cell's side (of width).
export function layout(g: MosaicGrid) {
  const below = g.kind === 'mosaic' ? 1.6 : g.kind === 'path' ? 1.2 : 0;
  const above = g.kind === 'path' ? 1.6 : 0;
  const cell = Math.min(0.7 / g.w, 0.82 / ((g.h + below + above) * ASPECT));
  const x = (1 - cell * g.w) / 2;
  const y = (1 - cell * ASPECT * (g.h + below + above)) / 2 + above * cell * ASPECT;
  return { x, y, cell, aspect: ASPECT };
}

/** The cell under a point of the canvas (fractions), or -1. */
export function cellAt(g: MosaicGrid, fx: number, fy: number): number {
  const { x, y, cell, aspect } = layout(g);
  const c = Math.floor((fx - x) / cell);
  const r = Math.floor((fy - y) / (cell * aspect));
  return c >= 0 && c < g.w && r >= 0 && r < g.h ? r * g.w + c : -1;
}

function signItems(s: Sign, cx: number, cy: number, size: number, faint = false): SketchItem[] {
  const color = faint ? '#8a8a8a' : SIGN_COLOR[s]!;
  const r = size * 0.3;
  const ry = r * ASPECT;
  const width = size * 0.09;
  const box = { x1: cx - r, y1: cy - ry, x2: cx + r, y2: cy + ry };
  switch (SIGNS[s]) {
    case 'circle':
      return [{ t: 'ellipse', color, width, ...box, fill: 'solid' }];
    case 'ring':
      return [{ t: 'ellipse', color, width, ...box, fill: 'none' }];
    case 'square':
      return [{ t: 'rect', color, width, ...box, fill: 'solid' }];
    case 'frame':
      return [{ t: 'rect', color, width, ...box, fill: 'none' }];
    case 'cross':
      return [
        { t: 'line', color, width, x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2, fill: 'none' },
        { t: 'line', color, width, x1: box.x1, y1: box.y2, x2: box.x2, y2: box.y1, fill: 'none' },
      ];
    default: {
      const p = [[cx, cy - ry], [cx + r, cy], [cx, cy + ry], [cx - r, cy]] as const;
      return p.map(([x1, y1], i) => ({ t: 'line' as const, color, width, x1, y1, x2: p[(i + 1) % 4]![0], y2: p[(i + 1) % 4]![1], fill: 'none' as const }));
    }
  }
}

function tile(x: number, y: number, size: number, fill = TILE): SketchItem {
  const pad = size * 0.04;
  return { t: 'rect', color: EDGE, width: size * 0.03, x1: x + pad, y1: y + pad * ASPECT, x2: x + size - pad, y2: y + (size - pad) * ASPECT, fill: 'solid', fillColor: fill };
}

/** The picture; `answer` — with the solution marked (for the GM), `play` — what the players did. */
export function mosaicSketch(grid: MosaicGrid, answer = false, play: Play = {}): Sketch {
  const g = grid.kind === 'switches' && play.cells ? { ...grid, cells: play.cells } : grid;
  const placed = play.placed ?? {};
  const sk = newSketch({ kind: 'paper', paper: 'parchment', edge: 'straight', shape: SHAPE });
  const { x, y, cell } = layout(g);
  const items: SketchItem[] = [];
  const at = (i: number) => ({ cx: x + (i % g.w + 0.5) * cell, cy: y + (Math.floor(i / g.w) + 0.5) * cell * ASPECT, x: x + (i % g.w) * cell, y: y + Math.floor(i / g.w) * cell * ASPECT });

  g.cells.forEach((v, i) => {
    const p = at(i);
    if (g.kind === 'switches') {
      items.push(tile(p.x, p.y, cell, v ? LIGHT : DARK));
      return;
    }
    if (v < 0 && placed[i] !== undefined) {
      items.push(tile(p.x, p.y, cell), ...signItems(placed[i]!, p.cx, p.cy, cell));
      return;
    }
    if (v < 0) {
      // A hole: the bare wall behind.
      items.push({ t: 'rect', color: EDGE, width: cell * 0.02, x1: p.x + cell * 0.08, y1: p.y + cell * 0.08 * ASPECT, x2: p.x + cell * 0.92, y2: p.y + cell * 0.92 * ASPECT, fill: 'tint', fillColor: '#6d4c41' });
      if (answer && g.solution) items.push(...signItems(g.solution[i]!, p.cx, p.cy, cell * 0.8));
      return;
    }
    items.push(tile(p.x, p.y, cell), ...signItems(v, p.cx, p.cy, cell));
  });

  if (g.kind === 'mosaic' && g.loose) {
    // The fallen tiles in a row below, a little smaller.
    const s = Math.min(cell * 0.8, 0.9 / g.loose.length);
    const ly = y + (g.h + 0.5) * cell * ASPECT;
    // The tiles put in are no longer on the floor.
    const left = [...g.loose];
    for (const v of Object.values(placed)) if (left.includes(v)) left.splice(left.indexOf(v), 1);
    const lx = (1 - s * left.length) / 2;
    left.forEach((v, k) => items.push(tile(lx + k * s, ly, s * 0.92), ...signItems(v, lx + k * s + s * 0.46, ly + s * 0.46 * ASPECT, s * 0.92)));
  }
  if (g.kind === 'path' && g.sequence) {
    // The order above the grid, the way in below and out above.
    const s = cell * 0.8;
    const n = g.sequence.length + 1;
    const sx = (1 - s * (n * 1.5 - 0.5)) / 2;
    const sy = y - 1.4 * cell * ASPECT;
    [...g.sequence, g.sequence[0]!].forEach((v, k) => {
      const px = sx + k * s * 1.5;
      items.push(tile(px, sy, s, k === n - 1 ? '#d8cfbd' : TILE), ...signItems(v, px + s / 2, sy + (s / 2) * ASPECT, s, k === n - 1));
      if (k < n - 1) items.push({ t: 'arrow', color: EDGE, width: s * 0.05, x1: px + s * 1.05, y1: sy + (s / 2) * ASPECT, x2: px + s * 1.45, y2: sy + (s / 2) * ASPECT, fill: 'none' });
    });
    const mid = x + (g.w * cell) / 2;
    const bottom = y + g.h * cell * ASPECT;
    items.push({ t: 'arrow', color: EDGE, width: cell * 0.05, x1: mid, y1: bottom + cell * 1.0 * ASPECT, x2: mid, y2: bottom + cell * 0.25 * ASPECT, fill: 'none' });
  }
  if (g.kind === 'path' && play.steps?.length) {
    // Footprints on the tiles stepped on; a wrong one — red.
    const seq = g.sequence!;
    play.steps.forEach((i, k) => {
      const p = at(i);
      const wrong = g.cells[i] !== seq[k % seq.length];
      items.push({ t: 'rect', color: wrong ? MARK : '#5d4037', width: cell * 0.06, x1: p.x + cell * 0.1, y1: p.y + cell * 0.1 * ASPECT, x2: p.x + cell * 0.9, y2: p.y + cell * 0.9 * ASPECT, fill: 'tint', fillColor: wrong ? MARK : '#8d6e63' });
    });
  }
  if (answer && g.kind === 'path' && g.path) {
    const pts = g.path.flatMap((i) => [at(i).cx, at(i).cy]);
    items.push({ t: 'pen', color: MARK, width: cell * 0.25, points: pts, marker: true });
  }
  if (answer && g.kind === 'switches' && g.presses) {
    for (const i of g.presses) {
      const p = at(i);
      items.push({ t: 'ellipse', color: MARK, width: cell * 0.07, x1: p.x + cell * 0.2, y1: p.y + cell * 0.2 * ASPECT, x2: p.x + cell * 0.8, y2: p.y + cell * 0.8 * ASPECT, fill: 'none' });
    }
  }
  return { ...sk, items };
}

/** The grid as a Markdown table (the journal); `answer` — the solution filled in. */
export function mosaicTable(g: MosaicGrid, answer = false): string {
  const glyph = (v: number, i: number) => {
    if (g.kind === 'switches') return answer && g.presses?.includes(i) ? (v ? '◉' : '◎') : v ? '○' : '●';
    if (v < 0) return answer && g.solution ? `(${SIGN_GLYPH[g.solution[i]!]})` : '·';
    return answer && g.path?.includes(i) ? `**${SIGN_GLYPH[v]}**` : SIGN_GLYPH[v]!;
  };
  const rows: string[] = [];
  for (let r = 0; r < g.h; r++) rows.push(`| ${g.cells.slice(r * g.w, r * g.w + g.w).map((v, c) => glyph(v, r * g.w + c)).join(' | ')} |`);
  return [`| ${Array(g.w).fill(' ').join(' | ')} |`, `|${Array(g.w).fill('---').join('|')}|`, ...rows].join('\n');
}
