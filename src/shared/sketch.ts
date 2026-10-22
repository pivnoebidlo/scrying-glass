// A canvas: a handout drawn in the app — on a sheet of paper (as the notes'), a plain colour or a picture of the
// vault. A file «….sketch.json» in a handouts folder, like the notes. Everything is in fractions of the canvas
// (x of its width, y of its height, widths and text sizes of its width), so a tile and the player screen look alike.
import { NOTE_EDGES, NOTE_FONTS, NOTE_PAPERS, NOTE_SHAPES, strokePath, type NoteEdge, type NoteFont, type NotePaper, type NoteShape } from './notes';

export const SKETCH_SUFFIX = '.sketch.json';
export const isSketchPath = (path: string) => path.toLowerCase().endsWith(SKETCH_SUFFIX);
export const sketchTitle = (path: string) => {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return name.slice(0, name.length - SKETCH_SUFFIX.length);
};

// What the drawing lies on. A picture keeps its own proportions (`aspect` of the canvas).
export type SketchBase =
  | { kind: 'paper'; paper: NotePaper; edge: NoteEdge; shape: NoteShape }
  | { kind: 'color'; color: string }
  | { kind: 'image'; path: string };

// The proportions of a canvas on a colour (width / height).
export const SKETCH_FRAMES = { landscape: 4 / 3, portrait: 3 / 4, wide: 16 / 9, square: 1 } as const;
export type SketchFrame = keyof typeof SKETCH_FRAMES;

export const SKETCH_COLORS = ['#1b1b1b', '#f4f1ea', '#c62828', '#ef6c00', '#f2c41b', '#2e7d32', '#1565c0', '#6a1b9a', '#6d4c41', '#8a8a8a'] as const;
export const SKETCH_BACKS = ['#f4f1ea', '#1d2a22', '#14161c', '#2b3a55', '#e9dcc0', '#ffffff'] as const;

export const SKETCH_WIDTHS = { thin: 0.003, medium: 0.007, thick: 0.016 } as const;
export type SketchWidth = keyof typeof SKETCH_WIDTHS;
// The marker: wide and see-through, to pick out a part of a picture.
export const MARKER_WIDTH = 0.035;
export const TEXT_SIZES = { small: 0.03, medium: 0.05, large: 0.08 } as const;
export type TextSize = keyof typeof TEXT_SIZES;

// Fill of a rectangle or an ellipse: none, see-through (an area: a swamp, a territory) or solid.
export type SketchFill = 'none' | 'tint' | 'solid';
export const TINT_ALPHA = 0.35;

export type SketchShapeKind = 'line' | 'arrow' | 'rect' | 'ellipse';
export type SketchItem =
  | { t: 'pen'; color: string; width: number; points: number[]; marker?: boolean }
  // fillColor — the fill's own colour (the bucket recoloured it); none — the outline's.
  | { t: SketchShapeKind; color: string; width: number; x1: number; y1: number; x2: number; y2: number; fill: SketchFill; fillColor?: string }
  // A filled area: drawn by hand (smooth) or found by the bucket (`bucket`: a polygon under the lines, lying below all
  // the drawing). fill — see-through (the default) or solid.
  // `holes` — the bucket's islands left unfilled (rooms inside a filled background).
  | { t: 'area'; color: string; points: number[]; fill?: 'tint' | 'solid'; bucket?: boolean; holes?: number[][] }
  | { t: 'text'; color: string; x: number; y: number; size: number; font: NoteFont; text: string };

export interface Sketch {
  scryingGlass: 'sketch';
  version: 1;
  base: SketchBase;
  // Width / height: of the picture, of the colour's frame; on paper — of the sheet's shape.
  aspect: number;
  seed: number;
  // In the order drawn: the last one on top.
  items: SketchItem[];
}

export const MAX_ITEMS = 1500;
const MAX_POINTS = 4000;
export const TEXT_MAX = 200;

export function newSketch(base: SketchBase = { kind: 'paper', paper: 'parchment', edge: 'straight', shape: 'landscape' }, aspect?: number): Sketch {
  return { scryingGlass: 'sketch', version: 1, base, aspect: aspectOf(base, aspect ?? SKETCH_FRAMES.landscape), seed: Math.floor(Math.random() * 1e9), items: [] };
}

// The canvas's proportions: on paper — the sheet's, otherwise the given ones (within reason).
export function aspectOf(base: SketchBase, aspect: number): number {
  if (base.kind === 'paper') return NOTE_SHAPES[base.shape].aspect;
  return isFinite(aspect) && aspect > 0 ? Math.min(4, Math.max(0.25, aspect)) : SKETCH_FRAMES.landscape;
}

const HEX = /^#[0-9a-f]{6}$/i;
const color = (v: unknown, def: string) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : def);
const num = (v: unknown, def: number, min: number, max: number) => (typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
const pick = <T extends string>(v: unknown, of: Record<string, unknown>, def: T): T => (typeof v === 'string' && v in of ? (v as T) : def);
const points = (v: unknown) => {
  const p = Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number' && isFinite(x)).slice(0, MAX_POINTS) : [];
  return p.slice(0, p.length - (p.length % 2));
};

function parseBase(raw: unknown): SketchBase {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (b['kind'] === 'color') return { kind: 'color', color: color(b['color'], SKETCH_BACKS[0]) };
  if (b['kind'] === 'image' && typeof b['path'] === 'string' && b['path']) return { kind: 'image', path: b['path'] };
  return { kind: 'paper', paper: pick(b['paper'], NOTE_PAPERS, 'parchment'), edge: pick(b['edge'], NOTE_EDGES, 'straight'), shape: pick(b['shape'], NOTE_SHAPES, 'landscape') };
}

function parseItem(raw: unknown): SketchItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  const c = color(r['color'], SKETCH_COLORS[0]);
  const width = num(r['width'], SKETCH_WIDTHS.medium, 0.001, 0.08);
  switch (r['t']) {
    case 'pen': {
      const p = points(r['points']);
      return p.length < 2 ? [] : [{ t: 'pen', color: c, width, points: p, ...(r['marker'] === true ? { marker: true } : {}) }];
    }
    case 'area': {
      const p = points(r['points']);
      if (p.length < 6) return [];
      const holes = Array.isArray(r['holes']) ? r['holes'].map(points).filter((h) => h.length >= 6).slice(0, 200) : [];
      return [{
        t: 'area', color: c, points: p,
        ...(r['fill'] === 'solid' ? { fill: 'solid' as const } : {}),
        ...(r['bucket'] === true ? { bucket: true } : {}),
        ...(holes.length ? { holes } : {}),
      }];
    }
    case 'line':
    case 'arrow':
    case 'rect':
    case 'ellipse': {
      const at = (k: string) => num(r[k], 0.5, -0.5, 1.5);
      const fill = r['fill'] === 'tint' || r['fill'] === 'solid' ? r['fill'] : 'none';
      const fc = typeof r['fillColor'] === 'string' && HEX.test(r['fillColor']) ? { fillColor: r['fillColor'].toLowerCase() } : {};
      return [{ t: r['t'], color: c, width, x1: at('x1'), y1: at('y1'), x2: at('x2'), y2: at('y2'), fill, ...fc }];
    }
    case 'text': {
      const text = typeof r['text'] === 'string' ? r['text'].slice(0, TEXT_MAX) : '';
      if (!text.trim()) return [];
      return [{ t: 'text', color: c, x: num(r['x'], 0.5, -0.5, 1.5), y: num(r['y'], 0.5, -0.5, 1.5), size: num(r['size'], TEXT_SIZES.medium, 0.01, 0.2), font: pick(r['font'], NOTE_FONTS, 'marck'), text }];
    }
  }
  return [];
}

export function parseSketch(raw: unknown): Sketch | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r['scryingGlass'] !== 'sketch') return null;
  const base = parseBase(r['base']);
  return {
    scryingGlass: 'sketch',
    version: 1,
    base,
    aspect: aspectOf(base, typeof r['aspect'] === 'number' ? r['aspect'] : NaN),
    seed: num(r['seed'], 1, 0, 1e9),
    items: (Array.isArray(r['items']) ? r['items'] : []).flatMap(parseItem).slice(0, MAX_ITEMS),
  };
}

// ---- Drawing (SVG in a w × h box) ----

export { strokePath };

// An arrow: the line and its head (two short strokes back from the tip).
export function arrowPath(x1: number, y1: number, x2: number, y2: number, width: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const head = Math.min(len * 0.45, Math.max(width * 4, 14));
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const side = (s: number) => {
    const a = Math.atan2(uy, ux) + Math.PI + s * 0.45;
    return `M${(x2 + Math.cos(a) * head).toFixed(1)} ${(y2 + Math.sin(a) * head).toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}${side(1)}${side(-1)}`;
}

// A closed area through the points: smooth, like a stroke; the bucket's — a polygon as found.
export const areaPath = (pts: number[], w: number, h: number) => strokePath(pts, w, h) + 'Z';
// The bucket's area with its islands (drawn with fill-rule evenodd).
export const bucketPath = (it: { points: number[]; holes?: number[][] }, w: number, h: number) =>
  [it.points, ...(it.holes ?? [])].map((p) => polygonPath(p, w, h)).join('');
export function polygonPath(pts: number[], w: number, h: number): string {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) d += (i ? 'L' : 'M') + (pts[i]! * w).toFixed(1) + ' ' + (pts[i + 1]! * h).toFixed(1);
  return d + 'Z';
}

// ---- The bucket ----
// The window draws the lines into a grid of w × h cells (`walls`: 1 — a line); the fill spreads from the clicked cell
// to the lines and the canvas's edge, and its outline becomes an area under the drawing.

// The cells reached from (x, y) without crossing a wall (4 neighbours); null — the click is on a line.
export function floodFill(walls: Uint8Array, w: number, h: number, x: number, y: number): Uint8Array | null {
  const start = y * w + x;
  if (x < 0 || y < 0 || x >= w || y >= h || walls[start]) return null;
  const out = new Uint8Array(w * h);
  const stack = [start];
  out[start] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const cx = i % w;
    const next = [cx > 0 ? i - 1 : -1, cx < w - 1 ? i + 1 : -1, i - w, i + w];
    for (const n of next) {
      if (n >= 0 && n < w * h && !out[n] && !walls[n]) {
        out[n] = 1;
        stack.push(n);
      }
    }
  }
  return out;
}

// Grow the region by r cells into the walls: the fill goes under the lines, without a gap at their edge.
export function grow(mask: Uint8Array, walls: Uint8Array, w: number, h: number, r: number): Uint8Array {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const next = cur.slice();
    for (let i = 0; i < w * h; i++) {
      if (cur[i] || !walls[i]) continue;
      const x = i % w;
      if ((x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) || (i >= w && cur[i - w]) || (i < w * (h - 1) && cur[i + w])) next[i] = 1;
    }
    cur = next;
  }
  return cur;
}

// The outer outline of the region (Moore neighbour tracing), in cells: [x, y, x, y…].
export function traceOutline(mask: Uint8Array, w: number, h: number): number[] {
  const first = mask.indexOf(1);
  if (first < 0) return [];
  const D = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]] as const;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const sx = first % w;
  const sy = Math.floor(first / w);
  const out = [sx, sy];
  let cx = sx;
  let cy = sy;
  let back = 0;
  // The first step from the start: going round, back at the start and about to take it again — the outline is closed.
  let firstStep = -1;
  for (let step = 0; step < (w + h) * 8 + 16; step++) {
    let found = -1;
    for (let k = 1; k <= 8; k++) {
      const d = (back + k) % 8;
      if (on(cx + D[d]![0], cy + D[d]![1])) {
        found = d;
        break;
      }
    }
    if (found < 0) break;
    if (cx === sx && cy === sy) {
      if (firstStep < 0) firstStep = found;
      else if (found === firstStep) break;
    }
    const prev = (found + 7) % 8;
    const bx = cx + D[prev]![0];
    const by = cy + D[prev]![1];
    cx += D[found]![0];
    cy += D[found]![1];
    back = D.findIndex(([dx, dy]) => dx === bx - cx && dy === by - cy);
    if (cx !== sx || cy !== sy) out.push(cx, cy);
  }
  return out;
}

// Fewer points, the same shape (Ramer–Douglas–Peucker, within eps).
export function simplify(pts: number[], eps: number): number[] {
  const n = pts.length / 2;
  if (n < 3) return pts;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let far = -1;
    let dist = eps;
    for (let i = a + 1; i < b; i++) {
      const d = toSegment(pts[i * 2]!, pts[i * 2 + 1]!, pts[a * 2]!, pts[a * 2 + 1]!, pts[b * 2]!, pts[b * 2 + 1]!);
      if (d > dist) {
        dist = d;
        far = i;
      }
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i >> 1]);
}

// The islands inside the region: parts of the rest not reaching the grid's edge (rooms inside a filled background).
export function holesOf(region: Uint8Array, w: number, h: number): Uint8Array[] {
  const seen = new Uint8Array(w * h);
  const out: Uint8Array[] = [];
  for (let s = 0; s < w * h; s++) {
    if (region[s] || seen[s]) continue;
    const cells = [s];
    seen[s] = 1;
    let edge = false;
    for (let k = 0; k < cells.length; k++) {
      const i = cells[k]!;
      const x = i % w;
      if (x === 0 || x === w - 1 || i < w || i >= w * (h - 1)) edge = true;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n >= 0 && n < w * h && !region[n] && !seen[n]) {
          seen[n] = 1;
          cells.push(n);
        }
      }
    }
    // Specks inside a thick line are not islands.
    if (edge || cells.length < 30) continue;
    const m = new Uint8Array(w * h);
    for (const i of cells) m[i] = 1;
    out.push(m);
  }
  return out;
}

// The bucket at (x, y) (fractions): the area's outline and its islands in fractions of the canvas, or null (a click
// on a line).
export function bucketArea(walls: Uint8Array, w: number, h: number, x: number, y: number): { points: number[]; holes: number[][] } | null {
  const gx = Math.min(w - 1, Math.max(0, Math.floor(x * w)));
  const gy = Math.min(h - 1, Math.max(0, Math.floor(y * h)));
  const found = floodFill(walls, w, h, gx, gy);
  if (!found) return null;
  const region = grow(found, walls, w, h, 2);
  // The edge cells cover the canvas to its very edge.
  const frac = (pts: number[]) =>
    pts.map((v, i) => {
      const size = i % 2 ? h : w;
      return +(v === 0 ? 0 : v === size - 1 ? 1 : (v + 0.5) / size).toFixed(4);
    });
  const points = simplify(traceOutline(region, w, h), 0.7);
  if (points.length < 6) return null;
  const holes = holesOf(region, w, h)
    .map((m) => simplify(traceOutline(m, w, h), 0.7))
    .filter((p) => p.length >= 6)
    .map(frac);
  return { points: frac(points), holes };
}

// Inside an area: within its outline and not on one of its islands.
export function inArea(it: Extract<SketchItem, { t: 'area' }>, x: number, y: number): boolean {
  const poly = (p: number[]) => Array.from({ length: p.length / 2 }, (_, k) => [p[k * 2]!, p[k * 2 + 1]!] as [number, number]);
  return inside(x, y, poly(it.points)) && !(it.holes ?? []).some((h) => inside(x, y, poly(h)));
}

// What the bucket recolours instead of filling: the topmost filled shape or hand-drawn area, or the bucket's own area,
// under the point. -1 — none (fill anew).
export function fillTargetAt(items: SketchItem[], x: number, y: number): number {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]!;
    if (it.t === 'area') {
      if (inArea(it, x, y)) return i;
    } else if ((it.t === 'rect' || it.t === 'ellipse') && it.fill !== 'none') {
      const [l, r, t, b] = [Math.min(it.x1, it.x2), Math.max(it.x1, it.x2), Math.min(it.y1, it.y2), Math.max(it.y1, it.y2)];
      if (it.t === 'rect' ? x >= l && x <= r && y >= t && y <= b : Math.hypot((x - (l + r) / 2) / ((r - l) / 2 || 1), (y - (t + b) / 2) / ((b - t) / 2 || 1)) <= 1) return i;
    }
  }
  return -1;
}

// ---- The eraser ----

// Distance from a point to a segment.
function toSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l = dx * dx + dy * dy;
  const k = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - (ax + k * dx), py - (ay + k * dy));
}

// Is the point inside the polygon (even–odd)?
function inside(px: number, py: number, pts: [number, number][]): boolean {
  let yes = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}

// The topmost item under the point (x, y in fractions); w × h — the canvas on screen in pixels, so the reach is the
// same at any size. -1 — none.
export function itemAt(items: SketchItem[], x: number, y: number, w: number, h: number): number {
  const px = x * w;
  const py = y * h;
  const xy = (p: number[], i: number) => [p[i * 2]! * w, p[i * 2 + 1]! * h] as [number, number];
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]!;
    const reach = 'width' in it ? Math.max(6, (it.width * w) / 2 + 4) : 6;
    if (it.t === 'pen' || it.t === 'area') {
      const n = it.points.length / 2;
      const poly = Array.from({ length: n }, (_, k) => xy(it.points, k));
      if (it.t === 'area' && inArea(it, x, y)) return i;
      for (let k = 0; k < n; k++) {
        const [ax, ay] = poly[k]!;
        const [bx, by] = poly[Math.min(n - 1, k + 1)]!;
        if (toSegment(px, py, ax, ay, bx, by) < reach) return i;
      }
    } else if (it.t === 'text') {
      // The text's box: centred on (x, y), roughly half an em per letter.
      const em = it.size * w;
      const lines = it.text.split('\n');
      const half = (Math.max(...lines.map((l) => l.length)) * em * 0.55) / 2 + 4;
      if (Math.abs(px - it.x * w) < half && Math.abs(py - it.y * h) < (lines.length * em * 1.2) / 2 + 4) return i;
    } else {
      const [x1, y1, x2, y2] = [it.x1 * w, it.y1 * h, it.x2 * w, it.y2 * h];
      if (it.t === 'line' || it.t === 'arrow') {
        if (toSegment(px, py, x1, y1, x2, y2) < reach) return i;
      } else if (it.t === 'rect') {
        const [l, r, t, b] = [Math.min(x1, x2), Math.max(x1, x2), Math.min(y1, y2), Math.max(y1, y2)];
        const edges: [number, number, number, number][] = [[l, t, r, t], [r, t, r, b], [r, b, l, b], [l, b, l, t]];
        if (it.fill !== 'none' && px >= l && px <= r && py >= t && py <= b) return i;
        if (edges.some(([a, b2, c, d]) => toSegment(px, py, a, b2, c, d) < reach)) return i;
      } else {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2 || 1;
        const ry = Math.abs(y2 - y1) / 2 || 1;
        const d = Math.hypot((px - cx) / rx, (py - cy) / ry);
        if (it.fill !== 'none' && d <= 1) return i;
        if (Math.abs(d - 1) * Math.min(rx, ry) < reach) return i;
      }
    }
  }
  return -1;
}
