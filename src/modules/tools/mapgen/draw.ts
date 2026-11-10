// Draws a layout on a canvas, by the app, so that no assets are needed: dark rock with hatching round the walls and a
// pale floor; outdoors grass, water, paths, trees and boulders. The picture holds nothing secret: it goes to the players; room numbers are the preview's only.
import { drawProps } from './draw-props';
import { isWild, seededRandom as noise, type Cell, type Layout, type LandmarkKind, type LayoutRoom, type WildStyle } from './layout';

export const CELL = 40;
// The texture of one cell: its own randomness from the layout's seed and its place, so that changing a cell (the map
// editor) changes only what is drawn there, not the whole picture.
const cellNoise = (l: Layout, x: number, y: number, salt = 0) => noise((l.seed ^ Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ Math.imul(salt + 1, 83492791)) >>> 0);
const ROCK = '#26221d';
const HATCH = '#4b443a';
const WALL = '#120f0b';
const FLOOR = { building: ['#d9cfb8', '#d3c8af', '#ddd3bd'], cave: ['#b9ad96', '#b2a58d', '#bfb39d'] };
interface Look {
  grass: string;
  tuft: string;
  tree: string[];
}
const TOWN: Look = { grass: '#7f9558', tuft: '#6d8349', tree: ['#3f6a35', '#4a7a3c', '#35592e'] };
// Lit slope, shaded slope, ridge.
const ROOFS = [['#a9583c', '#8e4830', '#6f3724'], ['#8f4f3a', '#77412f', '#5b3123'], ['#6a6d78', '#565963', '#42454d'], ['#b59a5e', '#99814d', '#7a673c']] as const;
const SPECIAL_ROOFS: Partial<Record<LandmarkKind, readonly [string, string, string]>> = {
  temple: ['#d6d0bf', '#bcb5a2', '#8d8674'],
  hall: ['#5c7388', '#4a5e70', '#384856'],
  smithy: ['#4d4a48', '#3e3b39', '#2c2a28'],
};
const GROUND: Record<WildStyle, Look> = {
  forest: { grass: '#5f7a43', tuft: '#4f6a37', tree: ['#2f5230', '#376036', '#29492c'] },
  meadow: { grass: '#8aa356', tuft: '#769148', tree: ['#3f6a35', '#4a7a3c', '#35592e'] },
  shore: { grass: '#92a35e', tuft: '#7d9050', tree: ['#46733e', '#3c6636', '#528045'] },
  swamp: { grass: '#646b43', tuft: '#535a38', tree: ['#3c4a2c', '#465430', '#333f26'] },
};
const LINE = 'rgba(70, 58, 42, 0.22)';

// What the preview shows over the picture; the map gets tokens and hidden pins instead.
export interface LayoutMark extends Cell {
  kind: 'creature' | 'party' | 'trap' | 'hoard';
  // The side in cells: a large creature's mark is as wide as its token.
  size?: number;
}
export interface Overlay {
  labels?: (i: number) => string;
  marks?: LayoutMark[];
}

// An outline round a set of cells, by marching squares over the cell centres: cut corners, its points shifted a little
// to look natural. A point is shared by neighbouring squares, so the shift comes from its position.
function contour(l: Layout, c: number, inSet: (x: number, y: number) => boolean) {
  const shift = (hx: number, hy: number) => {
    const h = noise(l.seed ^ Math.imul(hx + 1, 73856093) ^ Math.imul(hy + 1, 19349663));
    return [(h() - 0.5) * 0.42, (h() - 0.5) * 0.42] as const;
  };
  // In half cells, from the map's corner.
  const point = (hx: number, hy: number) => {
    const [dx, dy] = hx % 2 && hy % 2 ? [0, 0] : shift(hx, hy);
    return [(hx / 2 + dx) * c, (hy / 2 + dy) * c] as const;
  };
  const edges = new Path2D();
  const area = new Path2D();
  for (let y = -1; y < l.h; y++) {
    for (let x = -1; x < l.w; x++) {
      const hx = x * 2 + 1;
      const hy = y * 2 + 1;
      const corners = [inSet(x, y), inSet(x + 1, y), inSet(x + 1, y + 1), inSet(x, y + 1)];
      if (!corners.some(Boolean)) continue;
      const at = [[hx, hy], [hx + 2, hy], [hx + 2, hy + 2], [hx, hy + 2]] as const;
      const shape: (readonly [number, number])[] = [];
      const edge: (readonly [number, number])[] = [];
      corners.forEach((on, i) => {
        const [ax, ay] = at[i]!;
        const [bx, by] = at[(i + 1) % 4]!;
        if (on) shape.push(point(ax, ay));
        if (on !== corners[(i + 1) % 4]) {
          const mid = point((ax + bx) / 2, (ay + by) / 2);
          shape.push(mid);
          edge.push(mid);
        }
      });
      shape.forEach(([px, py], i) => (i ? area.lineTo(px, py) : area.moveTo(px, py)));
      area.closePath();
      for (let i = 0; i + 1 < edge.length; i += 2) {
        edges.moveTo(edge[i]![0], edge[i]![1]);
        edges.lineTo(edge[i + 1]![0], edge[i + 1]![1]);
      }
    }
  }
  return { area, edges };
}

// Fill an outline; a thin stroke of the same colour covers the seams between its pieces.
function fillArea(ctx: CanvasRenderingContext2D, area: Path2D, colour: string) {
  ctx.fillStyle = ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.fill(area);
  ctx.stroke(area);
}

// Grass with tufts: small marks that keep it from looking flat.
function drawGrass(ctx: CanvasRenderingContext2D, l: Layout, c: number, look: Look) {
  ctx.fillStyle = look.grass;
  ctx.fillRect(0, 0, l.w * c, l.h * c);
  ctx.strokeStyle = look.tuft;
  ctx.lineWidth = Math.max(1, c / 20);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const r = cellNoise(l, x, y, 1);
      if (r() > 0.45) continue;
      const px = (x + r()) * c;
      const py = (y + r()) * c;
      ctx.moveTo(px - c * 0.06, py);
      ctx.lineTo(px - c * 0.1, py - c * 0.13);
      ctx.moveTo(px + c * 0.06, py);
      ctx.lineTo(px + c * 0.1, py - c * 0.13);
    }
  }
  ctx.stroke();
}

function drawTree(ctx: CanvasRenderingContext2D, px: number, py: number, c: number, look: Look, r: () => number) {
  const size = c * (0.5 + r() * 0.22);
  ctx.fillStyle = 'rgba(15, 25, 12, 0.35)';
  ctx.beginPath();
  ctx.arc(px + size * 0.18, py + size * 0.22, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.tree[Math.floor(r() * look.tree.length)]!;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + r();
    const lobeX = px + Math.cos(angle) * size * 0.48;
    const lobeY = py + Math.sin(angle) * size * 0.48;
    ctx.moveTo(lobeX + size * 0.6, lobeY);
    ctx.arc(lobeX, lobeY, size * 0.6, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 220, 0.09)';
  ctx.beginPath();
  ctx.arc(px - size * 0.2, py - size * 0.22, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWild(ctx: CanvasRenderingContext2D, l: Layout, c: number, style: WildStyle) {
  const look = GROUND[style];
  const at = (x: number, y: number) => l.cells[y]?.[x];
  drawGrass(ctx, l, c, look);

  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === 'S' || at(x, y) === '~').area, '#d9c893');
  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === ',').area, '#a98f63');
  drawWater(ctx, l, c);

  // From the top down, so that a nearer tree covers the one behind it.
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const cell = at(x, y);
      if (cell !== 'R' && cell !== 'T') continue;
      const r = cellNoise(l, x, y, 2);
      const px = (x + 0.5 + (r() - 0.5) * 0.3) * c;
      const py = (y + 0.5 + (r() - 0.5) * 0.3) * c;
      if (cell === 'R') {
        const size = c * (0.3 + r() * 0.16);
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI * 2;
          const reach = size * (0.75 + r() * 0.35);
          ctx.lineTo(px + Math.cos(angle) * reach, py + Math.sin(angle) * reach * 0.8);
        }
        ctx.closePath();
        ctx.fillStyle = '#8c8c86';
        ctx.fill();
        ctx.strokeStyle = '#3d3b37';
        ctx.lineWidth = Math.max(1, c / 16);
        ctx.stroke();
        continue;
      }
      drawTree(ctx, px, py, c, look, r);
    }
  }
}

// A roof from above: two slopes that meet at the ridge, rows of tiles or thatch, a chimney on some.
function drawHouse(ctx: CanvasRenderingContext2D, a: LayoutRoom, c: number, r: () => number, kind?: LandmarkKind) {
  const plain = ROOFS[Math.floor(r() * ROOFS.length)]!;
  const roof = (kind && SPECIAL_ROOFS[kind]) ?? plain;
  const x = a.x * c + c * 0.06;
  const y = a.y * c + c * 0.06;
  const w = a.w * c - c * 0.12;
  const h = a.h * c - c * 0.12;
  ctx.fillStyle = 'rgba(20, 16, 10, 0.4)';
  ctx.fillRect(x + c * 0.16, y + c * 0.2, w, h);
  const across = w >= h;
  // Across the ridge: the lit slope, then the one in shade.
  ctx.fillStyle = roof[0];
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = roof[1];
  if (across) ctx.fillRect(x, y + h / 2, w, h / 2);
  else ctx.fillRect(x + w / 2, y, w / 2, h);
  ctx.strokeStyle = 'rgba(30, 20, 12, 0.3)';
  ctx.lineWidth = Math.max(1, c / 26);
  ctx.beginPath();
  const step = c * 0.32;
  for (let t = step; t < (across ? h : w); t += step) {
    if (across) {
      ctx.moveTo(x, y + t);
      ctx.lineTo(x + w, y + t);
    } else {
      ctx.moveTo(x + t, y);
      ctx.lineTo(x + t, y + h);
    }
  }
  ctx.stroke();
  ctx.strokeStyle = roof[2];
  ctx.lineWidth = Math.max(1, c / 9);
  ctx.beginPath();
  ctx.moveTo(across ? x : x + w / 2, across ? y + h / 2 : y);
  ctx.lineTo(across ? x + w : x + w / 2, across ? y + h / 2 : y + h);
  ctx.stroke();
  ctx.strokeStyle = WALL;
  ctx.lineWidth = Math.max(1, c / 12);
  ctx.strokeRect(x, y, w, h);
  if (kind) {
    drawLandmark(ctx, kind, x, y, w, h, c, across);
    return;
  }
  if (r() < 0.6) {
    const s = c * 0.34;
    const cx = x + w * (0.2 + r() * 0.6) - s / 2;
    const cy = y + h * (0.2 + r() * 0.6) - s / 2;
    ctx.fillStyle = '#6b5f55';
    ctx.fillRect(cx, cy, s, s);
    ctx.strokeRect(cx, cy, s, s);
  }
}

// What tells a building from the street: a bell tower, a sign, an awning, a flag, a forge's glow.
function drawLandmark(ctx: CanvasRenderingContext2D, kind: LandmarkKind, x: number, y: number, w: number, h: number, c: number, across: boolean) {
  const mx = x + w / 2;
  const my = y + h / 2;
  const box = (px: number, py: number, pw: number, ph: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);
  };
  ctx.strokeStyle = WALL;
  ctx.lineWidth = Math.max(1, c / 12);
  if (kind === 'temple') {
    const s = c * 1.2;
    box(mx - s / 2, my - s / 2, s, s, '#a9a292');
    ctx.fillStyle = '#7d8f8c';
    ctx.beginPath();
    ctx.arc(mx, my, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - s * 0.22, my);
    ctx.lineTo(mx + s * 0.22, my);
    ctx.moveTo(mx, my - s * 0.22);
    ctx.lineTo(mx, my + s * 0.22);
    ctx.stroke();
  } else if (kind === 'tavern') {
    const s = c * 0.34;
    box(x + w * 0.25 - s / 2, y + h * 0.25 - s / 2, s, s, '#6b5f55');
    box(x + w * 0.75 - s / 2, y + h * 0.75 - s / 2, s, s, '#6b5f55');
    box(mx - c * 0.55, my - c * 0.34, c * 1.1, c * 0.68, '#8a5f33');
    ctx.fillStyle = '#e0b552';
    ctx.beginPath();
    ctx.arc(mx, my, c * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'shop') {
    // Stripes along the long side.
    const deep = c * 0.55;
    const long = across ? w : h;
    const count = Math.max(4, Math.round(long / (c * 0.4)));
    for (let i = 0; i < count; i++) {
      const t = (i / count) * long;
      ctx.fillStyle = i % 2 ? '#efe6d2' : '#b5453a';
      if (across) ctx.fillRect(x + t, y + h - deep, long / count + 0.5, deep);
      else ctx.fillRect(x + w - deep, y + t, deep, long / count + 0.5);
    }
    if (across) ctx.strokeRect(x, y + h - deep, w, deep);
    else ctx.strokeRect(x + w - deep, y, deep, h);
  } else if (kind === 'hall') {
    const s = c * 1;
    box(mx - s / 2, my - s / 2, s, s, '#8a8f8e');
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, my - s * 0.9);
    ctx.stroke();
    ctx.fillStyle = '#b5453a';
    ctx.beginPath();
    ctx.moveTo(mx, my - s * 0.9);
    ctx.lineTo(mx + s * 0.6, my - s * 0.68);
    ctx.lineTo(mx, my - s * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const s = c * 0.7;
    box(mx - s / 2, my - s / 2, s, s, '#5c534c');
    ctx.fillStyle = '#e8772e';
    ctx.beginPath();
    ctx.arc(mx, my, s * 0.27, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The town wall seen from above: a band of stone with merlons on the outer side, round towers, gates with their leaves
// open against the wall.
function drawWall(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const wall = (x: number, y: number) => l.cells[y]?.[x] === 'W';
  const cx = l.w / 2;
  const cy = l.h / 2;
  ctx.fillStyle = '#857e72';
  for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (wall(x, y)) ctx.fillRect(x * c, y * c, c, c);
  // The walk on top, a little lighter, and the outline where the wall ends.
  ctx.fillStyle = '#9b9488';
  for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (wall(x, y)) ctx.fillRect(x * c + c * 0.2, y * c + c * 0.2, c * 0.6, c * 0.6);
  ctx.strokeStyle = WALL;
  ctx.lineWidth = Math.max(1.5, c / 12);
  ctx.beginPath();
  for (let y = 0; y < l.h; y++)
    for (let x = 0; x < l.w; x++) {
      if (!wall(x, y)) continue;
      const edge = (x0: number, y0: number, x1: number, y1: number) => (ctx.moveTo(x0 * c, y0 * c), ctx.lineTo(x1 * c, y1 * c));
      if (!wall(x, y - 1)) edge(x, y, x + 1, y);
      if (!wall(x, y + 1)) edge(x, y + 1, x + 1, y + 1);
      if (!wall(x - 1, y)) edge(x, y, x, y + 1);
      if (!wall(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
    }
  ctx.stroke();
  // Merlons on the side that faces away from the town.
  ctx.fillStyle = '#5f594f';
  const m = c * 0.22;
  for (let y = 0; y < l.h; y++)
    for (let x = 0; x < l.w; x++) {
      if (!wall(x, y)) continue;
      const horizontal = wall(x - 1, y) || wall(x + 1, y);
      for (const k of [0.15, 0.6]) {
        if (horizontal) ctx.fillRect((x + k) * c, y < cy ? y * c : (y + 1) * c - m, c * 0.25, m);
        else ctx.fillRect(x < cx ? x * c : (x + 1) * c - m, (y + k) * c, m, c * 0.25);
      }
    }
  for (const g of l.wall!.gates) {
    // The leaves of an open gate, folded back along the passage.
    const px = (g.x + 0.5) * c;
    const py = (g.y + 0.5) * c;
    ctx.fillStyle = '#7a5230';
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(1, c / 16);
    for (const s of [-1, 1]) {
      const [w, h] = g.along === 'y' ? [c * 0.18, c * 0.8] : [c * 0.8, c * 0.18];
      const x = g.along === 'y' ? px + s * c * 0.95 - w / 2 : px - w / 2;
      const y = g.along === 'y' ? py - h / 2 : py + s * c * 0.95 - h / 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }
  }
  for (const t of l.wall!.towers) {
    const px = (t.x + 0.5) * c;
    const py = (t.y + 0.5) * c;
    ctx.fillStyle = '#7a7368';
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(1.5, c / 10);
    ctx.beginPath();
    ctx.arc(px, py, c * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Merlons round the top, the floor of the tower inside.
    ctx.fillStyle = '#5f594f';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * c * 0.8, py + Math.sin(a) * c * 0.8, c * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#9b9488';
    ctx.beginPath();
    ctx.arc(px, py, c * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

// Water: shallows and fords pale, the deep darker, a light line along the shore. Outdoors, in a town and in a cave.
function drawWater(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  if (!l.cells.some((r) => r.includes('~') || r.includes('='))) return;
  const wet = contour(l, c, (x, y) => at(x, y) === '~' || at(x, y) === '=');
  fillArea(ctx, wet.area, '#7fb0bd');
  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === '~').area, '#3f7d97');
  ctx.strokeStyle = 'rgba(232, 244, 244, 0.7)';
  ctx.lineWidth = Math.max(1, c / 12);
  ctx.lineCap = 'round';
  ctx.stroke(wet.edges);
}

function drawTown(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  drawGrass(ctx, l, c, TOWN);
  drawWater(ctx, l, c);
  const stone = (x: number, y: number) => at(x, y) === ',' || at(x, y) === 'P';
  const road = contour(l, c, stone);
  fillArea(ctx, road.area, '#b3a78f');
  // Cobbles on the streets, flagstones on the squares.
  ctx.save();
  ctx.clip(road.area);
  ctx.strokeStyle = 'rgba(70, 60, 46, 0.3)';
  ctx.lineWidth = Math.max(1, c / 26);
  ctx.beginPath();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (at(x, y) === 'P') {
        const half = (y % 2) * c * 0.5;
        ctx.rect(x * c + half, y * c, c, c * 0.5);
      } else if (at(x, y) === ',') {
        const r = cellNoise(l, x, y, 3);
        for (let i = 0; i < 3; i++) {
          const px = (x + 0.15 + r() * 0.7) * c;
          const py = (y + 0.15 + r() * 0.7) * c;
          ctx.moveTo(px + c * 0.1, py);
          ctx.arc(px, py, c * 0.1, 0, Math.PI * 2);
        }
      }
    }
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(60, 50, 36, 0.55)';
  ctx.lineWidth = Math.max(1, c / 14);
  ctx.lineCap = 'round';
  ctx.stroke(road.edges);
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) if (at(x, y) === 'T') drawTree(ctx, (x + 0.5) * c, (y + 0.5) * c, c, TOWN, cellNoise(l, x, y, 2));
  }
  (l.houses ?? []).forEach((a, i) => drawHouse(ctx, a, c, cellNoise(l, a.x, a.y, 4), l.landmarks?.find((m) => m.house === i)?.kind));
  if (l.wall) drawWall(ctx, l, c);
  // Wells.
  for (const p of l.pillars) {
    const px = (p.x + 0.5) * c;
    const py = (p.y + 0.5) * c;
    ctx.fillStyle = '#7d7a72';
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(1, c / 12);
    ctx.beginPath();
    ctx.arc(px, py, c * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2c5566';
    ctx.beginPath();
    ctx.arc(px, py, c * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIndoor(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const floor = (x: number, y: number) => l.cells[y]?.[x] === '.';
  ctx.fillStyle = ROCK;
  ctx.fillRect(0, 0, l.w * c, l.h * c);

  // Hatching: short strokes in the rock near the floor.
  // Floor or water: what is not rock.
  const open = (x: number, y: number) => floor(x, y) || l.cells[y]?.[x] === '~' || l.cells[y]?.[x] === '=';
  const near = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (open(x + dx, y + dy)) return true;
    return false;
  };
  ctx.strokeStyle = HATCH;
  ctx.lineWidth = Math.max(1, c / 22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (open(x, y) || !near(x, y)) continue;
      const r = cellNoise(l, x, y, 5);
      const dir = r() < 0.5 ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        const px = (x + r()) * c;
        const py = (y + r()) * c;
        const len = c * (0.16 + r() * 0.16);
        ctx.moveTo(px - len, py - len * dir);
        ctx.lineTo(px + len, py + len * dir);
      }
    }
  }
  ctx.stroke();

  const tints = l.style === 'cave' ? FLOOR.cave : FLOOR.building;
  const eachFloor = (f: (x: number, y: number) => void) => {
    for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (floor(x, y)) f(x, y);
  };
  if (l.style === 'cave') {
    // An underground lake is open ground too: the rock goes round it.
    const rock = contour(l, c, (x, y) => floor(x, y) || l.cells[y]?.[x] === '~' || l.cells[y]?.[x] === '=');
    fillArea(ctx, rock.area, tints[0]!);
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(2, c / 7);
    ctx.lineCap = 'round';
    ctx.stroke(rock.edges);
    ctx.fillStyle = 'rgba(80, 66, 48, 0.28)';
    eachFloor((x, y) => {
      const r = cellNoise(l, x, y, 6);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((x + r()) * c, (y + r()) * c, c * (0.015 + r() * 0.035), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    drawWater(ctx, l, c);
  } else {
    eachFloor((x, y) => {
      ctx.fillStyle = tints[Math.floor(cellNoise(l, x, y, 7)() * tints.length)]!;
      ctx.fillRect(x * c, y * c, c, c);
    });
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    eachFloor((x, y) => {
      ctx.rect(x * c + 0.5, y * c + 0.5, c, c);
    });
    ctx.stroke();
    // Walls: every edge between floor and rock.
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(2, c / 8);
    ctx.lineCap = 'square';
    ctx.beginPath();
    eachFloor((x, y) => {
      const line = (x0: number, y0: number, x1: number, y1: number) => {
        ctx.moveTo(x0 * c, y0 * c);
        ctx.lineTo(x1 * c, y1 * c);
      };
      if (!floor(x, y - 1)) line(x, y, x + 1, y);
      if (!floor(x, y + 1)) line(x, y + 1, x + 1, y + 1);
      if (!floor(x - 1, y)) line(x, y, x, y + 1);
      if (!floor(x + 1, y)) line(x + 1, y, x + 1, y + 1);
    });
    ctx.stroke();
    for (const p of l.pillars) {
      ctx.fillStyle = WALL;
      ctx.beginPath();
      ctx.arc((p.x + 0.5) * c, (p.y + 0.5) * c, c * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const d of l.doors) {
      const long = c * 0.92;
      const thick = c * 0.3;
      const w = d.along === 'x' ? thick : long;
      const h = d.along === 'x' ? long : thick;
      const px = (d.x + 0.5) * c - w / 2;
      const py = (d.y + 0.5) * c - h / 2;
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(px, py, w, h);
      ctx.strokeStyle = WALL;
      ctx.lineWidth = Math.max(1, c / 16);
      ctx.strokeRect(px, py, w, h);
    }
  }

}

export function drawLayout(ctx: CanvasRenderingContext2D, l: Layout, c: number, over: Overlay = {}) {
  if (isWild(l.style)) drawWild(ctx, l, c, l.style);
  else if (l.style === 'town') drawTown(ctx, l, c);
  else drawIndoor(ctx, l, c);
  drawProps(ctx, l, c);

  for (const m of over.marks ?? []) {
    const size = m.size ?? 1;
    const px = (m.x + size / 2) * c;
    const py = (m.y + size / 2) * c;
    const q = c * 0.36 * size;
    ctx.beginPath();
    if (m.kind === 'creature' || m.kind === 'party') {
      ctx.fillStyle = m.kind === 'party' ? '#e8b94a' : '#c0392b';
      ctx.arc(px, py, q, 0, Math.PI * 2);
    } else if (m.kind === 'trap') {
      ctx.fillStyle = '#e8a33d';
      ctx.moveTo(px, py - q * 1.2);
      ctx.lineTo(px + q * 1.2, py + q);
      ctx.lineTo(px - q * 1.2, py + q);
      ctx.closePath();
    } else {
      ctx.fillStyle = '#3fa66b';
      ctx.moveTo(px, py - q * 1.2);
      ctx.lineTo(px + q * 1.2, py);
      ctx.lineTo(px, py + q * 1.2);
      ctx.lineTo(px - q * 1.2, py);
      ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(1, c / 14);
    ctx.stroke();
  }

  if (!over.labels) return;
  const { labels } = over;
  ctx.font = `bold ${c * 0.8}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  l.rooms.forEach((a, i) => {
    const px = (a.x + a.w / 2) * c;
    const py = (a.y + a.h / 2) * c;
    ctx.fillStyle = 'rgba(18, 15, 11, 0.82)';
    ctx.beginPath();
    ctx.arc(px, py, c * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0e8d6';
    ctx.fillText(labels(i), px, py + c * 0.04);
  });
}

// The picture as a PNG file, without the room numbers.
export function layoutPng(l: Layout): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = l.w * CELL;
  canvas.height = l.h * CELL;
  drawLayout(canvas.getContext('2d')!, l, CELL);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? b.arrayBuffer().then((data) => resolve(new Uint8Array(data)), reject) : reject(new Error('png'))), 'image/png'),
  );
}
