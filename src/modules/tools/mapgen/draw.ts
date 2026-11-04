// Draws a layout on a canvas, by the app, so that no assets are needed: dark rock with hatching round the walls and a
// pale floor; outdoors grass, water, paths, trees and boulders. The picture holds nothing secret: it goes to the players; room numbers are the preview's only.
import { isWild, seededRandom as noise, type Cell, type Layout, type WildStyle } from './layout';

export const CELL = 40;
const ROCK = '#26221d';
const HATCH = '#4b443a';
const WALL = '#120f0b';
const FLOOR = { building: ['#d9cfb8', '#d3c8af', '#ddd3bd'], cave: ['#b9ad96', '#b2a58d', '#bfb39d'] };
const GROUND: Record<WildStyle, { grass: string; tuft: string; tree: string[] }> = {
  forest: { grass: '#5f7a43', tuft: '#4f6a37', tree: ['#2f5230', '#376036', '#29492c'] },
  meadow: { grass: '#8aa356', tuft: '#769148', tree: ['#3f6a35', '#4a7a3c', '#35592e'] },
  shore: { grass: '#92a35e', tuft: '#7d9050', tree: ['#46733e', '#3c6636', '#528045'] },
  swamp: { grass: '#646b43', tuft: '#535a38', tree: ['#3c4a2c', '#465430', '#333f26'] },
};
const LINE = 'rgba(70, 58, 42, 0.22)';

// What the preview shows over the picture; the map gets tokens and hidden pins instead.
export interface LayoutMark extends Cell {
  kind: 'creature' | 'trap' | 'hoard';
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

function drawWild(ctx: CanvasRenderingContext2D, l: Layout, c: number, style: WildStyle) {
  const r = noise(l.seed);
  const look = GROUND[style];
  const at = (x: number, y: number) => l.cells[y]?.[x];
  ctx.fillStyle = look.grass;
  ctx.fillRect(0, 0, l.w * c, l.h * c);
  // Tufts: small marks that keep the grass from looking flat.
  ctx.strokeStyle = look.tuft;
  ctx.lineWidth = Math.max(1, c / 20);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
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

  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === 'S' || at(x, y) === '~').area, '#d9c893');
  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === ',').area, '#a98f63');
  const wet = contour(l, c, (x, y) => at(x, y) === '~' || at(x, y) === '=');
  fillArea(ctx, wet.area, '#7fb0bd');
  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === '~').area, '#3f7d97');
  ctx.strokeStyle = 'rgba(232, 244, 244, 0.7)';
  ctx.lineWidth = Math.max(1, c / 12);
  ctx.lineCap = 'round';
  ctx.stroke(wet.edges);

  // From the top down, so that a nearer tree covers the one behind it.
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const cell = at(x, y);
      if (cell !== 'R' && cell !== 'T') continue;
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
  }
}

function drawIndoor(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const r = noise(l.seed);
  const floor = (x: number, y: number) => l.cells[y]?.[x] === '.';
  ctx.fillStyle = ROCK;
  ctx.fillRect(0, 0, l.w * c, l.h * c);

  // Hatching: short strokes in the rock near the floor.
  const near = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (floor(x + dx, y + dy)) return true;
    return false;
  };
  ctx.strokeStyle = HATCH;
  ctx.lineWidth = Math.max(1, c / 22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (floor(x, y) || !near(x, y)) continue;
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
    const rock = contour(l, c, floor);
    fillArea(ctx, rock.area, tints[0]!);
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(2, c / 7);
    ctx.lineCap = 'round';
    ctx.stroke(rock.edges);
    ctx.fillStyle = 'rgba(80, 66, 48, 0.28)';
    eachFloor((x, y) => {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((x + r()) * c, (y + r()) * c, c * (0.015 + r() * 0.035), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else {
    eachFloor((x, y) => {
      ctx.fillStyle = tints[Math.floor(r() * tints.length)]!;
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
  else drawIndoor(ctx, l, c);

  for (const m of over.marks ?? []) {
    const size = m.size ?? 1;
    const px = (m.x + size / 2) * c;
    const py = (m.y + size / 2) * c;
    const q = c * 0.36 * size;
    ctx.beginPath();
    if (m.kind === 'creature') {
      ctx.fillStyle = '#c0392b';
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
