// Grid geometry of a map: squares or hexes (pointy-top — rows, flat-top — columns). Pure functions, shared by the
// editor and the player screen (render.ts) and by token snapping (tokens.ts).
//
// The step is the distance between neighbouring cells: a square's side, for hexes — the distance between the centres
// of neighbours (flat to flat). «Cells across the map» = map width / step. The offset (ox, oy) is a fraction of the
// pattern's period: for squares the period is one step both ways; a hex pattern repeats after two rows (pointy) or two
// columns (flat), which is √3 steps along that axis.
import type { Grid } from './types';

export type GridShape = 'square' | 'hex-pointy' | 'hex-flat';
export const GRID_SHAPES: GridShape[] = ['square', 'hex-pointy', 'hex-flat'];
export const shapeOf = (g: Pick<Grid, 'shape'>): GridShape => g.shape ?? 'square';

const SQRT3 = Math.sqrt(3);

export const stepOf = (g: Pick<Grid, 'cells'>, imgW: number) => imgW / g.cells;

// The period of the pattern in pixels of the image.
export function periodOf(g: Pick<Grid, 'cells' | 'shape'>, imgW: number): { px: number; py: number } {
  const s = stepOf(g, imgW);
  const shape = shapeOf(g);
  if (shape === 'hex-pointy') return { px: s, py: s * SQRT3 };
  if (shape === 'hex-flat') return { px: s * SQRT3, py: s };
  return { px: s, py: s };
}

interface Img {
  w: number;
  h: number;
}

// The centre of the hex (row, col): pointy-top — rows step √3/2, odd rows shifted by half a step; flat-top — columns.
function hexCenter(g: Grid, img: Img, a: number, b: number): { x: number; y: number } {
  const s = stepOf(g, img.w);
  const { px, py } = periodOf(g, img.w);
  const x0 = (g.ox ?? 0) * px;
  const y0 = (g.oy ?? 0) * py;
  const odd = (n: number) => ((n % 2) + 2) % 2 === 1;
  if (shapeOf(g) === 'hex-pointy') return { x: x0 + b * s + (odd(a) ? s / 2 : 0), y: y0 + (a * s * SQRT3) / 2 };
  return { x: x0 + (a * s * SQRT3) / 2, y: y0 + b * s + (odd(a) ? s / 2 : 0) };
}

// The hexes that touch the image (a margin of one each side): [row/col of the stagger, the other index].
function hexRange(g: Grid, img: Img): { a: [number, number]; b: [number, number] } {
  const s = stepOf(g, img.w);
  const { px, py } = periodOf(g, img.w);
  const lane = (s * SQRT3) / 2;
  const pointy = shapeOf(g) === 'hex-pointy';
  // a — along the staggered axis (rows for pointy, columns for flat), b — along the other one.
  const [aLen, aOff, bLen, bOff] = pointy ? [img.h, (g.oy ?? 0) * py, img.w, (g.ox ?? 0) * px] : [img.w, (g.ox ?? 0) * px, img.h, (g.oy ?? 0) * py];
  return {
    a: [Math.floor(-aOff / lane) - 1, Math.ceil((aLen - aOff) / lane) + 1],
    b: [Math.floor(-bOff / s) - 2, Math.ceil((bLen - bOff) / s) + 1],
  };
}

export function hexCenters(g: Grid, img: Img): { x: number; y: number }[] {
  const { a, b } = hexRange(g, img);
  const out: { x: number; y: number }[] = [];
  for (let i = a[0]; i <= a[1]; i++) for (let j = b[0]; j <= b[1]; j++) out.push(hexCenter(g, img, i, j));
  return out;
}

// The six corners of a hex around its centre.
export function hexCorners(c: { x: number; y: number }, g: Grid, imgW: number): { x: number; y: number }[] {
  const r = stepOf(g, imgW) / SQRT3;
  const start = shapeOf(g) === 'hex-pointy' ? -30 : 0;
  return Array.from({ length: 6 }, (_, k) => {
    const a = ((start + 60 * k) * Math.PI) / 180;
    return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
  });
}

// The centre of the hex under a point (pixels of the image).
export function nearestHex(x: number, y: number, g: Grid, img: Img): { x: number; y: number } {
  const s = stepOf(g, img.w);
  const { px, py } = periodOf(g, img.w);
  const lane = (s * SQRT3) / 2;
  const pointy = shapeOf(g) === 'hex-pointy';
  const a0 = Math.round((pointy ? y - (g.oy ?? 0) * py : x - (g.ox ?? 0) * px) / lane);
  const b0 = Math.round((pointy ? x - (g.ox ?? 0) * px : y - (g.oy ?? 0) * py) / s);
  let best = hexCenter(g, img, a0, b0);
  let dist = Infinity;
  for (let a = a0 - 1; a <= a0 + 1; a++) {
    for (let b = b0 - 1; b <= b0 + 1; b++) {
      const c = hexCenter(g, img, a, b);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < dist) [best, dist] = [c, d];
    }
  }
  return best;
}

// The grid lines as one path (one stroke: the shared edges of hexes are not drawn darker).
export function gridPath(ctx: CanvasRenderingContext2D, g: Grid, img: Img) {
  ctx.beginPath();
  if (shapeOf(g) === 'square') {
    const s = stepOf(g, img.w);
    // The first line — at the offset (not at the very edge).
    const x0 = (g.ox ?? 0) * s || s;
    const y0 = (g.oy ?? 0) * s || s;
    for (let x = x0; x < img.w; x += s) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, img.h);
    }
    for (let y = y0; y < img.h; y += s) {
      ctx.moveTo(0, y);
      ctx.lineTo(img.w, y);
    }
    return;
  }
  for (const c of hexCenters(g, img)) {
    const p = hexCorners(c, g, img.w);
    ctx.moveTo(p[0]!.x, p[0]!.y);
    for (let k = 1; k < 6; k++) ctx.lineTo(p[k]!.x, p[k]!.y);
    ctx.closePath();
  }
}
