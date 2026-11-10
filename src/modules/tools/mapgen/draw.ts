// Draws a layout on a canvas, by the app, so that no assets are needed: dark rock with hatching round the walls and a
// pale floor; outdoors grass, water, paths, trees and boulders. The picture holds nothing secret: it goes to the players; room numbers are the preview's only.
import { drawProps } from './draw-props';
import { buildingAt, isBuilt, isFloor, isOpenAir, isWall, isWild, seededRandom as noise, type Cell, type Layout, type LandmarkKind, type LayoutRoom, type Light, type WildStyle } from './layout';
import type { PropKind } from './furnish';

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
  // Snow on the crowns, the stones and the roofs.
  snow?: boolean;
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
// The ground's colour (Layout.tone): grass and trees outdoors, the floor indoors.
const GRASS_TONES: Record<string, Look> = {
  spring: { grass: '#86ad5a', tuft: '#6f9a45', tree: ['#4f8a3e', '#5c9a48', '#6aa954'] },
  autumn: { grass: '#a59a55', tuft: '#8e8243', tree: ['#b5602a', '#c98a2e', '#8e3d22', '#a8762c'] },
  winter: { grass: '#e3e9ec', tuft: '#c3ced5', tree: ['#3c5a48', '#476652', '#33503f'], snow: true },
  dry: { grass: '#b8a76a', tuft: '#9f8f55', tree: ['#6e7a3e', '#7d8848', '#5f6a35'] },
  ash: { grass: '#5a5550', tuft: '#48443f', tree: ['#3a3330', '#2e2926', '#463d38'] },
  // Other worlds: red dust with strange growth, grey dust with none to speak of.
  mars: { grass: '#b56a43', tuft: '#9a5434', tree: ['#7a4a8e', '#8e5a3a', '#6a3d6e'] },
  // A graveyard's dead grass; the asphalt of a city.
  barrow: { grass: '#5d6150', tuft: '#4a4e40', tree: ['#2f3329', '#3a3d31', '#262922'] },
  asphalt: { grass: '#4f5154', tuft: '#5b5d60', tree: ['#2f4a33', '#365a3b', '#284431'] },
  // The wasteland: cracked, sun-bleached earth with dead growth.
  wastes: { grass: '#a8976a', tuft: '#857552', tree: ['#5a5440', '#4a4434', '#6a6048'] },
  // The sea floor: pale sand under the water, sea grass for growth.
  seabed: { grass: '#5d8a8a', tuft: '#4a7676', tree: ['#2f6a5a', '#3a7a6a', '#245a4c'] },
  // A jungle's deep green.
  jungle: { grass: '#4a7a35', tuft: '#3a6a2a', tree: ['#2a5a2a', '#356a2a', '#1f4a24'] },
  moon: { grass: '#a3a29d', tuft: '#8c8b86', tree: ['#6e6d69', '#7d7c77', '#5f5e5a'] },
};
const FLOOR_TONES: Record<string, string[]> = {
  wood: ['#a87a4a', '#9c6f42', '#b08352'],
  marble: ['#e8e4dc', '#dedad2', '#f0ece6'],
  dark: ['#6d665c', '#655e55', '#736c62'],
  sandstone: ['#d8b98a', '#d0b07f', '#dfc297'],
  frost: ['#d6e3e8', '#cddbe1', '#dde8ec'],
  metal: ['#8d949c', '#878e96', '#939aa1'],
  grating: ['#4a4f55', '#464b51', '#4e535a'],
  lino: ['#e8e4dc', '#2b2a2e'],
};
const lookOf = (l: Layout, base: Look) => (l.tone && GRASS_TONES[l.tone]) || base;
// Surfaces the map editor paints: lava, ice, mud and pits. Not rock: indoors the walls go round them, not between.
const SURFACES = 'LIMX~=';
const isSurface = (ch: string | undefined) => !!ch && SURFACES.includes(ch);

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
  const crown = new Path2D();
  const lobes: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + r();
    const lobeX = px + Math.cos(angle) * size * 0.48;
    const lobeY = py + Math.sin(angle) * size * 0.48;
    lobes.push([lobeX, lobeY]);
    crown.moveTo(lobeX + size * 0.6, lobeY);
    crown.arc(lobeX, lobeY, size * 0.6, 0, Math.PI * 2);
  }
  ctx.fill(crown);
  // Snow lies on the lit side of every lobe; the needles show in the shade.
  if (look.snow) {
    ctx.save();
    ctx.clip(crown);
    ctx.fillStyle = 'rgba(246, 249, 251, 0.92)';
    ctx.beginPath();
    for (const [lx, ly] of lobes) {
      ctx.moveTo(lx - size * 0.2 + size * 0.34, ly - size * 0.24);
      ctx.arc(lx - size * 0.2, ly - size * 0.24, size * 0.34, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255, 255, 220, 0.09)';
  ctx.beginPath();
  ctx.arc(px - size * 0.2, py - size * 0.22, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWild(ctx: CanvasRenderingContext2D, l: Layout, c: number, style: WildStyle) {
  const look = lookOf(l, GROUND[style]);
  const at = (x: number, y: number) => l.cells[y]?.[x];
  drawGrass(ctx, l, c, look);

  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === 'S' || at(x, y) === '~' || at(x, y) === 'O').area, '#d9c893');
  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === ',').area, '#a98f63');
  drawGround(ctx, l, c);
  drawWater(ctx, l, c);
  drawSurfaces(ctx, l, c);
  drawMountains(ctx, l, c, look);
  drawBuilt(ctx, l, c);
  drawGrowth(ctx, l, c, look);
  // A forester's lodge, a hut in the swamp.
  (l.houses ?? []).forEach((a) => drawHouse(ctx, a, c, cellNoise(l, a.x, a.y, 4), undefined, look.snow));
}

// Trees of every kind and boulders, from the top down, so that a nearer one covers the one behind it.
const GROWTH = 'RTNJQ';
function drawGrowth(ctx: CanvasRenderingContext2D, l: Layout, c: number, look: Look) {
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const cell = l.cells[y]![x]!;
      if (!GROWTH.includes(cell)) continue;
      const r = cellNoise(l, x, y, 2);
      const px = (x + 0.5 + (r() - 0.5) * 0.3) * c;
      const py = (y + 0.5 + (r() - 0.5) * 0.3) * c;
      if (cell === 'N') {
        drawPine(ctx, px, py, c, look, r);
        continue;
      }
      if (cell === 'J') {
        drawPalm(ctx, px, py, c, r);
        continue;
      }
      if (cell === 'Q') {
        drawSnag(ctx, px, py, c, r);
        continue;
      }
      if (cell === 'R') {
        const size = c * (0.3 + r() * 0.16);
        const stone = new Path2D();
        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI * 2;
          const reach = size * (0.75 + r() * 0.35);
          stone.lineTo(px + Math.cos(angle) * reach, py + Math.sin(angle) * reach * 0.8);
        }
        stone.closePath();
        ctx.fillStyle = '#8c8c86';
        ctx.fill(stone);
        if (look.snow) {
          ctx.save();
          ctx.clip(stone);
          ctx.fillStyle = 'rgba(246, 249, 251, 0.95)';
          ctx.beginPath();
          ctx.arc(px - size * 0.25, py - size * 0.3, size * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = '#3d3b37';
        ctx.lineWidth = Math.max(1, c / 16);
        ctx.stroke(stone);
        continue;
      }
      drawTree(ctx, px, py, c, look, r);
    }
  }
}

// A fir from above: rings of needles, darker inside; it keeps its green in autumn.
const PINE = ['#2c4a33', '#33543a', '#284431'];
function drawPine(ctx: CanvasRenderingContext2D, px: number, py: number, c: number, look: Look, r: () => number) {
  const size = c * (0.48 + r() * 0.16);
  const turn = r() * Math.PI;
  ctx.fillStyle = 'rgba(15, 25, 12, 0.35)';
  ctx.beginPath();
  ctx.arc(px + size * 0.2, py + size * 0.24, size * 0.9, 0, Math.PI * 2);
  ctx.fill();
  const tone = PINE[Math.floor(r() * PINE.length)]!;
  for (const [k, shade] of [[1, tone], [0.68, 'rgba(0, 0, 0, 0.18)'], [0.38, 'rgba(0, 0, 0, 0.22)']] as const) {
    const star = new Path2D();
    const n = 9;
    for (let i = 0; i <= n * 2; i++) {
      const a = turn + (i / (n * 2)) * Math.PI * 2;
      const reach = size * k * (i % 2 ? 0.62 : 1);
      if (i) star.lineTo(px + Math.cos(a) * reach, py + Math.sin(a) * reach);
      else star.moveTo(px + Math.cos(a) * reach, py + Math.sin(a) * reach);
    }
    ctx.fillStyle = shade;
    ctx.fill(star);
    if (k === 1) {
      ctx.strokeStyle = 'rgba(10, 20, 10, 0.55)';
      ctx.lineWidth = Math.max(1, c / 28);
      ctx.stroke(star);
      if (look.snow) {
        ctx.save();
        ctx.clip(star);
        ctx.fillStyle = 'rgba(246, 249, 251, 0.88)';
        ctx.beginPath();
        ctx.arc(px - size * 0.3, py - size * 0.32, size * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

// A palm from above: long fronds out of the middle.
function drawPalm(ctx: CanvasRenderingContext2D, px: number, py: number, c: number, r: () => number) {
  const size = c * (0.55 + r() * 0.15);
  const turn = r() * Math.PI;
  const n = 7;
  ctx.fillStyle = 'rgba(15, 25, 12, 0.3)';
  ctx.beginPath();
  ctx.arc(px + size * 0.2, py + size * 0.24, size * 0.7, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.fillStyle = i % 2 ? '#5f8f3c' : '#4f7d33';
    ctx.beginPath();
    ctx.ellipse(size * 0.5, 0, size * 0.52, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 50, 20, 0.7)';
    ctx.lineWidth = Math.max(1, c / 30);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#7a5a34';
  ctx.beginPath();
  ctx.arc(px, py, size * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

// A dead tree from above: bare branches out of the trunk.
function drawSnag(ctx: CanvasRenderingContext2D, px: number, py: number, c: number, r: () => number) {
  const size = c * (0.45 + r() * 0.15);
  ctx.lineCap = 'round';
  const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (depth > 0) for (const d of [-0.5, 0.45]) branch(x2, y2, a + d + (r() - 0.5) * 0.4, len * 0.6, w * 0.6, depth - 1);
  };
  ctx.strokeStyle = 'rgba(15, 12, 8, 0.3)';
  for (let i = 0; i < 4; i++) branch(px + c * 0.08, py + c * 0.1, i * 1.6 + r(), size * 0.55, Math.max(1, c / 10), 1);
  ctx.strokeStyle = '#5b4a3a';
  const turn = r() * 6;
  for (let i = 0; i < 4; i++) branch(px, py, turn + i * 1.6 + r() * 0.5, size * 0.55, Math.max(1, c / 10), 2);
  ctx.fillStyle = '#4a3b2c';
  ctx.beginPath();
  ctx.arc(px, py, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

// Ground the editor paints outdoors: cobbles, a road of stone slabs, a ploughed field with its rows.
function drawGround(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  const has = (ch: string) => l.cells.some((row) => row.includes(ch));
  const each = (ch: string, f: (x: number, y: number) => void) => {
    for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (at(x, y) === ch) f(x, y);
  };
  if (has('V')) {
    const field = contour(l, c, (x, y) => at(x, y) === 'V');
    fillArea(ctx, field.area, '#8a6c44');
    ctx.save();
    ctx.clip(field.area);
    ctx.lineCap = 'round';
    each('V', (x, y) => {
      for (let k = 0; k < 3; k++) {
        const py = (y + (k + 0.5) / 3) * c;
        ctx.strokeStyle = 'rgba(60, 44, 24, 0.55)';
        ctx.lineWidth = Math.max(1, c / 14);
        ctx.beginPath();
        ctx.moveTo(x * c, py + c * 0.06);
        ctx.lineTo((x + 1) * c, py + c * 0.06);
        ctx.stroke();
        ctx.strokeStyle = '#7f9a48';
        ctx.lineWidth = Math.max(1, c / 9);
        ctx.setLineDash([c * 0.12, c * 0.1]);
        ctx.beginPath();
        ctx.moveTo(x * c, py - c * 0.03);
        ctx.lineTo((x + 1) * c, py - c * 0.03);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(60, 44, 24, 0.6)';
    ctx.lineWidth = Math.max(1, c / 14);
    ctx.stroke(field.edges);
  }
  if (has('K')) {
    const road = contour(l, c, (x, y) => at(x, y) === 'K');
    fillArea(ctx, road.area, '#a79f8f');
    ctx.save();
    ctx.clip(road.area);
    ctx.strokeStyle = 'rgba(60, 52, 40, 0.5)';
    ctx.lineWidth = Math.max(1, c / 22);
    each('K', (x, y) => {
      // Slabs in staggered rows, a little different each.
      const r = cellNoise(l, x, y, 11);
      for (let k = 0; k < 2; k++) {
        const top = (y + k / 2) * c;
        const off = ((y * 2 + k) % 2) * 0.5;
        for (let j = -1; j < 2; j++) {
          const left = (x + j * 0.66 + off * 0.66) * c;
          ctx.fillStyle = `rgba(255, 250, 235, ${0.05 + r() * 0.12})`;
          ctx.fillRect(left, top, c * 0.66, c / 2);
          ctx.strokeRect(left, top, c * 0.66, c / 2);
        }
      }
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(60, 52, 40, 0.75)';
    ctx.lineWidth = Math.max(1.5, c / 10);
    ctx.stroke(road.edges);
  }
  if (has('C')) {
    const cobbles = contour(l, c, (x, y) => at(x, y) === 'C');
    fillArea(ctx, cobbles.area, '#8f8778');
    ctx.save();
    ctx.clip(cobbles.area);
    ctx.strokeStyle = 'rgba(50, 44, 36, 0.55)';
    ctx.lineWidth = Math.max(1, c / 28);
    each('C', (x, y) => {
      const r = cellNoise(l, x, y, 12);
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++) {
          const cx = (x + (i + 0.5 + (j % 2) * 0.5) / 3) * c;
          const cy = (y + (j + 0.5) / 3) * c;
          ctx.fillStyle = ['#a39b8b', '#9a9282', '#aca594'][Math.floor(r() * 3)]!;
          ctx.beginPath();
          ctx.ellipse(cx, cy, c * (0.13 + r() * 0.03), c * (0.12 + r() * 0.03), r() * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(50, 44, 36, 0.7)';
    ctx.lineWidth = Math.max(1.5, c / 10);
    ctx.stroke(cobbles.edges);
  }
}

// Mountains: a mass of rock with its edge in shade, ridges and screes; snow on the tops in winter.
function drawMountains(ctx: CanvasRenderingContext2D, l: Layout, c: number, look: Look) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  if (!l.cells.some((row) => row.includes('A'))) return;
  const rock = contour(l, c, (x, y) => at(x, y) === 'A');
  ctx.save();
  ctx.translate(c * 0.18, c * 0.22);
  ctx.fillStyle = 'rgba(20, 16, 10, 0.4)';
  ctx.fill(rock.area);
  ctx.restore();
  fillArea(ctx, rock.area, '#8a8174');
  ctx.save();
  ctx.clip(rock.area);
  // How deep inside the range a cell is: the tops are the cells farthest from its edge.
  const depth = (x: number, y: number) => {
    for (let d = 1; d < 4; d++)
      for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (at(x + dx, y + dy) !== 'A') return d - 1;
    return 3;
  };
  for (let y = 0; y < l.h; y++)
    for (let x = 0; x < l.w; x++) {
      if (at(x, y) !== 'A') continue;
      const r = cellNoise(l, x, y, 13);
      const d = depth(x, y);
      // Not a peak on every cell: some cells are slopes between them.
      if (r() < (d ? 0.45 : 0.6)) {
        ctx.fillStyle = 'rgba(60, 52, 42, 0.35)';
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc((x + r()) * c, (y + r()) * c, c * (0.03 + r() * 0.04), 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }
      const px = (x + 0.5 + (r() - 0.5) * 0.5) * c;
      const py = (y + 0.6 + (r() - 0.5) * 0.4) * c;
      const hgt = c * (0.55 + d * 0.3 + r() * 0.3);
      const wid = c * (0.7 + d * 0.15 + r() * 0.3);
      // A peak: its lit face and its shaded one, split by the ridge.
      ctx.fillStyle = d >= 2 && look.snow ? '#eef2f4' : `rgb(${150 + d * 12}, ${142 + d * 12}, ${128 + d * 12})`;
      ctx.beginPath();
      ctx.moveTo(px - wid, py + hgt * 0.4);
      ctx.lineTo(px, py - hgt);
      ctx.lineTo(px, py + hgt * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = d >= 2 && look.snow ? '#c9d3da' : `rgb(${96 + d * 8}, ${90 + d * 8}, ${80 + d * 8})`;
      ctx.beginPath();
      ctx.moveTo(px, py - hgt);
      ctx.lineTo(px + wid, py + hgt * 0.4);
      ctx.lineTo(px, py + hgt * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(40, 34, 28, 0.6)';
      ctx.lineWidth = Math.max(1, c / 24);
      ctx.beginPath();
      ctx.moveTo(px - wid, py + hgt * 0.4);
      ctx.lineTo(px, py - hgt);
      ctx.lineTo(px + wid, py + hgt * 0.4);
      ctx.stroke();
      // The high tops white with snow in any season.
      if (d >= 2 && !look.snow) {
        ctx.fillStyle = 'rgba(246, 249, 251, 0.9)';
        ctx.beginPath();
        ctx.moveTo(px - wid * 0.3, py - hgt * 0.45);
        ctx.lineTo(px, py - hgt);
        ctx.lineTo(px + wid * 0.3, py - hgt * 0.45);
        ctx.closePath();
        ctx.fill();
      }
    }
  ctx.restore();
  ctx.strokeStyle = '#3d362d';
  ctx.lineWidth = Math.max(2, c / 8);
  ctx.lineJoin = 'round';
  ctx.stroke(rock.edges);
}

// A roof from above: two slopes that meet at the ridge, rows of tiles or thatch, a chimney on some.
function drawHouse(ctx: CanvasRenderingContext2D, a: LayoutRoom, c: number, r: () => number, kind?: LandmarkKind, snow = false) {
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
  // Snow on both slopes, thinner by the eaves where the roof shows.
  if (snow) {
    const e = c * 0.18;
    ctx.fillStyle = 'rgba(246, 249, 251, 0.85)';
    if (across) ctx.fillRect(x + e, y + e, w - 2 * e, h / 2 - e);
    else ctx.fillRect(x + e, y + e, w / 2 - e, h - 2 * e);
    ctx.fillStyle = 'rgba(208, 218, 226, 0.65)';
    if (across) ctx.fillRect(x + e, y + h / 2, w - 2 * e, h / 2 - e);
    else ctx.fillRect(x + w / 2, y + e, w / 2 - e, h - 2 * e);
  }
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
function drawSurfaces(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  const has = (ch: string) => l.cells.some((r) => r.includes(ch));
  const each = (ch: string, f: (x: number, y: number) => void) => {
    for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (at(x, y) === ch) f(x, y);
  };
  if (has('M')) {
    const mud = contour(l, c, (x, y) => at(x, y) === 'M');
    fillArea(ctx, mud.area, '#6b5638');
    ctx.fillStyle = 'rgba(40, 30, 18, 0.35)';
    each('M', (x, y) => {
      const r = cellNoise(l, x, y, 8);
      ctx.beginPath();
      ctx.ellipse((x + r()) * c, (y + r()) * c, c * (0.1 + r() * 0.12), c * (0.06 + r() * 0.08), r() * 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(40, 30, 18, 0.5)';
    ctx.lineWidth = Math.max(1, c / 16);
    ctx.stroke(mud.edges);
  }
  if (has('I')) {
    const ice = contour(l, c, (x, y) => at(x, y) === 'I');
    fillArea(ctx, ice.area, '#cfe6ee');
    ctx.save();
    ctx.clip(ice.area);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, c / 26);
    ctx.beginPath();
    each('I', (x, y) => {
      const r = cellNoise(l, x, y, 9);
      if (r() < 0.5) return;
      const px = (x + r()) * c;
      const py = (y + r()) * c;
      ctx.moveTo(px, py);
      ctx.lineTo(px + (r() - 0.5) * c * 0.8, py + (r() - 0.5) * c * 0.8);
    });
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#8fb8c6';
    ctx.lineWidth = Math.max(1, c / 12);
    ctx.stroke(ice.edges);
  }
  if (has('X')) {
    const pit = contour(l, c, (x, y) => at(x, y) === 'X');
    fillArea(ctx, pit.area, '#0b0907');
    ctx.strokeStyle = '#4b443a';
    ctx.lineWidth = Math.max(2, c / 6);
    ctx.lineJoin = 'round';
    ctx.stroke(pit.edges);
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(1, c / 16);
    ctx.stroke(pit.edges);
  }
  if (has('L')) {
    const lava = contour(l, c, (x, y) => at(x, y) === 'L');
    ctx.save();
    ctx.shadowColor = 'rgba(255, 110, 30, 0.8)';
    ctx.shadowBlur = c * 0.6;
    fillArea(ctx, lava.area, '#e2561b');
    ctx.restore();
    ctx.save();
    ctx.clip(lava.area);
    each('L', (x, y) => {
      const r = cellNoise(l, x, y, 10);
      for (let i = 0; i < 2; i++) {
        const px = (x + r()) * c;
        const py = (y + r()) * c;
        const g = ctx.createRadialGradient(px, py, 0, px, py, c * 0.45);
        g.addColorStop(0, 'rgba(255, 214, 90, 0.9)');
        g.addColorStop(1, 'rgba(255, 140, 40, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(px - c * 0.45, py - c * 0.45, c * 0.9, c * 0.9);
      }
      if (r() < 0.45) {
        // A crust floating on it.
        ctx.fillStyle = 'rgba(58, 29, 18, 0.85)';
        ctx.beginPath();
        ctx.ellipse((x + r()) * c, (y + r()) * c, c * (0.12 + r() * 0.14), c * (0.08 + r() * 0.1), r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
    ctx.strokeStyle = '#3a1d12';
    ctx.lineWidth = Math.max(2, c / 8);
    ctx.lineJoin = 'round';
    ctx.stroke(lava.edges);
  }
}

function drawWater(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  if (!l.cells.some((r) => r.includes('~') || r.includes('=') || r.includes('O'))) return;
  const wet = contour(l, c, (x, y) => at(x, y) === '~' || at(x, y) === '=' || at(x, y) === 'O');
  fillArea(ctx, wet.area, '#7fb0bd');
  fillArea(ctx, contour(l, c, (x, y) => at(x, y) === '~' || at(x, y) === 'O').area, '#3f7d97');
  // The sea: deeper, with waves.
  if (l.cells.some((r) => r.includes('O'))) {
    const deep = contour(l, c, (x, y) => at(x, y) === 'O');
    fillArea(ctx, deep.area, '#2a5c78');
    ctx.save();
    ctx.clip(deep.area);
    ctx.strokeStyle = 'rgba(210, 236, 244, 0.45)';
    ctx.lineWidth = Math.max(1, c / 20);
    ctx.lineCap = 'round';
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++) {
        if (at(x, y) !== 'O') continue;
        const r = cellNoise(l, x, y, 14);
        if (r() < 0.4) continue;
        const wx = (x + r()) * c;
        const wy = (y + r()) * c;
        ctx.beginPath();
        ctx.arc(wx - c * 0.12, wy, c * 0.12, Math.PI * 1.1, Math.PI * 1.9);
        ctx.arc(wx + c * 0.12, wy, c * 0.12, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(232, 244, 244, 0.7)';
  ctx.lineWidth = Math.max(1, c / 12);
  ctx.lineCap = 'round';
  ctx.stroke(wet.edges);
}

function drawTown(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  const at = (x: number, y: number) => l.cells[y]?.[x];
  const look = lookOf(l, TOWN);
  drawGrass(ctx, l, c, look);
  drawWater(ctx, l, c);
  drawSurfaces(ctx, l, c);
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
  drawGround(ctx, l, c);
  drawMountains(ctx, l, c, look);
  drawBuilt(ctx, l, c);
  drawGrowth(ctx, l, c, look);
  (l.houses ?? []).forEach((a, i) => drawHouse(ctx, a, c, cellNoise(l, a.x, a.y, 4), l.landmarks?.find((m) => m.house === i)?.kind, look.snow));
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
  // Plain floor and floors of any material: what the rock is cut away from.
  const floor = (x: number, y: number) => l.cells[y]?.[x] === '.' || isFloor(l.cells[y]?.[x]);
  ctx.fillStyle = ROCK;
  ctx.fillRect(0, 0, l.w * c, l.h * c);

  // Hatching: short strokes in the rock near the floor.
  // Floor, water, lava, ice, mud, a pit: what is not rock.
  const open = (x: number, y: number) => floor(x, y) || isSurface(l.cells[y]?.[x]);
  const near = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (open(x + dx, y + dy)) return true;
    return false;
  };
  // Another world: bulkheads of dark metal in panels, not rock.
  if (l.genre === 'scifi' && l.style === 'building') {
    ctx.fillStyle = '#2d3239';
    ctx.fillRect(0, 0, l.w * c, l.h * c);
    ctx.strokeStyle = 'rgba(120, 130, 140, 0.35)';
    ctx.lineWidth = Math.max(1, c / 30);
    ctx.beginPath();
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++) {
        if (open(x, y) || !near(x, y)) continue;
        ctx.rect(x * c + c * 0.08, y * c + c * 0.08, c * 0.84, c * 0.84);
        if ((x + y) % 3 === 0) (ctx.moveTo(x * c + c * 0.2, y * c + c * 0.5), ctx.lineTo(x * c + c * 0.8, y * c + c * 0.5));
      }
    ctx.stroke();
  }
  ctx.strokeStyle = HATCH;
  ctx.lineWidth = Math.max(1, c / 22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (l.genre === 'scifi' && l.style === 'building') break;
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

  const tints = (l.tone && FLOOR_TONES[l.tone]) || (l.style === 'cave' ? FLOOR.cave : FLOOR.building);
  const eachFloor = (f: (x: number, y: number) => void) => {
    for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (floor(x, y)) f(x, y);
  };
  if (l.style === 'cave') {
    // An underground lake is open ground too: the rock goes round it.
    const rock = contour(l, c, open);
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
    drawSurfaces(ctx, l, c);
    drawBuilt(ctx, l, c, false);
  } else {
    eachFloor((x, y) => {
      // Linoleum: black and white in a chequer.
      ctx.fillStyle = l.tone === 'lino' ? tints[(x + y) % 2]! : tints[Math.floor(cellNoise(l, x, y, 7)() * tints.length)]!;
      ctx.fillRect(x * c, y * c, c, c);
    });
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (l.tone === 'wood') {
      // Planks: three to a cell, their ends staggered.
      eachFloor((x, y) => {
        for (let k = 0; k < 3; k++) {
          const py = y * c + (k * c) / 3 + 0.5;
          ctx.moveTo(x * c, py);
          ctx.lineTo(x * c + c, py);
          const end = x * c + (((x + k * 2 + y) % 3) * c) / 3;
          ctx.moveTo(end + 0.5, py);
          ctx.lineTo(end + 0.5, py + c / 3);
        }
      });
    } else if (l.tone === 'grating') {
      // A grating: a fine lattice over the dark below.
      ctx.strokeStyle = 'rgba(160, 168, 176, 0.55)';
      eachFloor((x, y) => {
        for (let k = 1; k < 4; k++) {
          ctx.moveTo(x * c + (k * c) / 4, y * c);
          ctx.lineTo(x * c + (k * c) / 4, y * c + c);
          ctx.moveTo(x * c, y * c + (k * c) / 4);
          ctx.lineTo(x * c + c, y * c + (k * c) / 4);
        }
        ctx.rect(x * c + 0.5, y * c + 0.5, c, c);
      });
    } else
      eachFloor((x, y) => {
        ctx.rect(x * c + 0.5, y * c + 0.5, c, c);
      });
    ctx.stroke();
    // Metal plates: a rivet in each corner.
    if (l.tone === 'metal') {
      ctx.fillStyle = 'rgba(60, 64, 70, 0.6)';
      eachFloor((x, y) => {
        for (const [dx, dy] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]] as const) {
          ctx.beginPath();
          ctx.arc((x + dx) * c, (y + dy) * c, Math.max(0.8, c * 0.035), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    // Water, lava, ice, a pit: in the room's floor.
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++)
        if (isSurface(l.cells[y]?.[x])) {
          ctx.fillStyle = tints[0]!;
          ctx.fillRect(x * c, y * c, c, c);
        }
    drawWater(ctx, l, c);
    drawSurfaces(ctx, l, c);
    drawBuilt(ctx, l, c, false);
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
      if (!open(x, y - 1)) line(x, y, x + 1, y);
      if (!open(x, y + 1)) line(x, y + 1, x + 1, y + 1);
      if (!open(x - 1, y)) line(x, y, x, y + 1);
      if (!open(x + 1, y)) line(x + 1, y, x + 1, y + 1);
    });
    // And round the surfaces where they touch the rock.
    for (let y = 0; y < l.h; y++)
      for (let x = 0; x < l.w; x++) {
        if (!isSurface(l.cells[y]?.[x])) continue;
        if (!open(x, y - 1)) (ctx.moveTo(x * c, y * c), ctx.lineTo((x + 1) * c, y * c));
        if (!open(x, y + 1)) (ctx.moveTo(x * c, (y + 1) * c), ctx.lineTo((x + 1) * c, (y + 1) * c));
        if (!open(x - 1, y)) (ctx.moveTo(x * c, y * c), ctx.lineTo(x * c, (y + 1) * c));
        if (!open(x + 1, y)) (ctx.moveTo((x + 1) * c, y * c), ctx.lineTo((x + 1) * c, (y + 1) * c));
      }
    ctx.stroke();
    for (const p of l.pillars) {
      ctx.fillStyle = WALL;
      ctx.beginPath();
      ctx.arc((p.x + 0.5) * c, (p.y + 0.5) * c, c * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
    drawDoors(ctx, l, c);
  }

}

function drawDoors(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
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

// Edges of a set of cells where it meets what is not in it.
function edgesOf(c: number, cells: { x: number; y: number }[], inSet: (x: number, y: number) => boolean) {
  const p = new Path2D();
  for (const { x, y } of cells) {
    if (!inSet(x, y - 1)) (p.moveTo(x * c, y * c), p.lineTo((x + 1) * c, y * c));
    if (!inSet(x, y + 1)) (p.moveTo(x * c, (y + 1) * c), p.lineTo((x + 1) * c, (y + 1) * c));
    if (!inSet(x - 1, y)) (p.moveTo(x * c, y * c), p.lineTo(x * c, (y + 1) * c));
    if (!inSet(x + 1, y)) (p.moveTo((x + 1) * c, y * c), p.lineTo((x + 1) * c, (y + 1) * c));
  }
  return p;
}

const PLANKS = ['#a87a4a', '#9c6f42', '#b08352'];
const TIMBER = ['#6b5038', '#5e4630', '#735840'];
// A building put up outdoors, without its roof: a plank floor, timber walls with a shadow outside, doors.
function drawBuilt(ctx: CanvasRenderingContext2D, l: Layout, c: number, outdoors = true) {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (isBuilt(l.cells[y]![x])) cells.push({ x, y });
  if (!cells.length) return;
  const at = (x: number, y: number) => l.cells[y]?.[x];
  // A shadow on the ground: of the whole building outdoors, of the walls indoors.
  ctx.fillStyle = 'rgba(20, 16, 10, 0.35)';
  for (const { x, y } of cells) if (outdoors || isWall(at(x, y))) ctx.fillRect(x * c + c * 0.14, y * c + c * 0.18, c, c);
  ctx.lineCap = 'butt';
  const seams = (colour: string, width: number, draw: () => void) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    draw();
    ctx.stroke();
  };
  for (const { x, y } of cells) {
    const r = cellNoise(l, x, y, 7);
    const X = x * c;
    const Y = y * c;
    const fill = (colours: readonly string[]) => {
      ctx.fillStyle = colours[Math.floor(r() * colours.length)]!;
      ctx.fillRect(X, Y, c, c);
    };
    // Courses of blocks or bricks: rows of `n` a cell, every other row half a block along.
    const courses = (rows: number, per: number, colour: string, width: number) =>
      seams(colour, width, () => {
        for (let k = 0; k < rows; k++) {
          const top = Y + (k * c) / rows;
          ctx.moveTo(X, top);
          ctx.lineTo(X + c, top);
          const off = ((y * rows + k) % 2) * (c / per / 2);
          for (let j = 0; j <= per; j++) {
            const px = X + off + (j * c) / per;
            if (px > X && px < X + c) (ctx.moveTo(px, top), ctx.lineTo(px, top + c / rows));
          }
        }
      });
    switch (at(x, y)) {
      case 'F':
        fill(PLANKS);
        seams(LINE, 1, () => {
          for (let k = 0; k < 3; k++) {
            const py = Y + (k * c) / 3 + 0.5;
            ctx.moveTo(X, py);
            ctx.lineTo(X + c, py);
            const end = X + (((x + k * 2 + y) % 3) * c) / 3;
            ctx.moveTo(end + 0.5, py);
            ctx.lineTo(end + 0.5, py + c / 3);
          }
        });
        break;
      case 's':
        fill(['#a8a196', '#a09a8e', '#b0a99d']);
        courses(2, 2, 'rgba(60, 54, 44, 0.45)', Math.max(1, c / 26));
        break;
      case 't':
        // Tiles: cream and terracotta in a chequer.
        for (let j = 0; j < 2; j++)
          for (let i = 0; i < 2; i++) {
            ctx.fillStyle = (x * 2 + i + y * 2 + j) % 2 ? '#c9764f' : '#e3d6b4';
            ctx.fillRect(X + (i * c) / 2, Y + (j * c) / 2, c / 2, c / 2);
          }
        seams('rgba(70, 50, 30, 0.35)', Math.max(1, c / 34), () => {
          ctx.rect(X + 0.5, Y + 0.5, c / 2, c / 2);
          ctx.rect(X + c / 2, Y + c / 2, c / 2, c / 2);
        });
        break;
      case 'c':
        ctx.fillStyle = '#8a2f2b';
        ctx.fillRect(X, Y, c, c);
        // A gold lozenge in each cell.
        ctx.fillStyle = 'rgba(214, 168, 74, 0.55)';
        ctx.beginPath();
        ctx.moveTo(X + c / 2, Y + c * 0.25);
        ctx.lineTo(X + c * 0.75, Y + c / 2);
        ctx.lineTo(X + c / 2, Y + c * 0.75);
        ctx.lineTo(X + c * 0.25, Y + c / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'd':
        fill(['#7d6448', '#756043', '#836a4e']);
        ctx.fillStyle = 'rgba(40, 30, 18, 0.35)';
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.arc(X + r() * c, Y + r() * c, c * (0.02 + r() * 0.03), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'm':
        fill(['#e6e2da', '#ebe7df', '#dfdbd2']);
        seams('rgba(120, 118, 130, 0.35)', Math.max(1, c / 34), () => {
          ctx.moveTo(X + r() * c, Y);
          ctx.quadraticCurveTo(X + r() * c, Y + c / 2, X + r() * c, Y + c);
          ctx.rect(X + 0.5, Y + 0.5, c, c);
        });
        break;
      case 'k':
        fill(['#7d776d', '#857f74', '#757066']);
        courses(3, 2, 'rgba(30, 26, 20, 0.55)', Math.max(1, c / 22));
        break;
      case 'r':
        fill(['#9a4a34', '#a3523a', '#8f442f']);
        courses(4, 3, 'rgba(225, 210, 190, 0.55)', Math.max(1, c / 26));
        break;
      default: {
        // Logs along the wall: across a wall that runs up and down, along one that runs side to side.
        fill(TIMBER);
        const upright = isWall(at(x, y - 1)) || isWall(at(x, y + 1));
        const sideways = isWall(at(x - 1, y)) || isWall(at(x + 1, y));
        seams('rgba(25, 16, 8, 0.45)', Math.max(1, c / 22), () => {
          for (let k = 1; k < 3; k++) {
            if (sideways || !upright) (ctx.moveTo(X, Y + (k * c) / 3), ctx.lineTo(X + c, Y + (k * c) / 3));
            else (ctx.moveTo(X + (k * c) / 3, Y), ctx.lineTo(X + (k * c) / 3, Y + c));
          }
        });
      }
    }
  }
  // A carpet's gold border, where it meets another floor.
  const carpet = cells.filter((p) => at(p.x, p.y) === 'c');
  if (carpet.length) {
    const area = new Path2D();
    for (const p of carpet) area.rect(p.x * c, p.y * c, c, c);
    ctx.save();
    ctx.clip(area);
    ctx.strokeStyle = '#d6a84a';
    ctx.lineWidth = Math.max(2, c / 6);
    ctx.stroke(edgesOf(c, carpet, (x, y) => at(x, y) === 'c'));
    ctx.restore();
  }
  // The walls' outline: where a wall meets the floor or the ground; outdoors the building's own edge too.
  ctx.strokeStyle = WALL;
  ctx.lineWidth = Math.max(1.5, c / 12);
  ctx.lineCap = 'square';
  const walls = cells.filter((p) => isWall(at(p.x, p.y)));
  ctx.stroke(edgesOf(c, walls, (x, y) => isWall(at(x, y)) || l.doors.some((d) => d.x === x && d.y === y)));
  if (outdoors) {
    const floors = cells.filter((p) => isFloor(at(p.x, p.y)));
    ctx.stroke(edgesOf(c, floors, (x, y) => isBuilt(at(x, y))));
    drawDoors(ctx, l, c);
  }
}

// Roofs over the buildings put up outdoors (Layout.roofs): over the things inside them too.
function drawRoofs(ctx: CanvasRenderingContext2D, l: Layout, c: number, snow: boolean) {
  for (const mark of l.roofs ?? []) {
    const cells = buildingAt(l, mark.x, mark.y);
    if (!cells.length) continue;
    const mine = new Set(cells.map((p) => `${p.x},${p.y}`));
    const inSet = (x: number, y: number) => mine.has(`${x},${y}`);
    const xs = cells.map((p) => p.x);
    const ys = cells.map((p) => p.y);
    const x0 = Math.min(...xs) * c;
    const y0 = Math.min(...ys) * c;
    const w = (Math.max(...xs) + 1) * c - x0;
    const h = (Math.max(...ys) + 1) * c - y0;
    const area = new Path2D();
    for (const p of cells) area.rect(p.x * c, p.y * c, c, c);
    const roof = ROOFS[Math.floor(cellNoise(l, Math.min(...xs), Math.min(...ys), 4)() * ROOFS.length)]!;
    const across = w >= h;
    ctx.save();
    ctx.translate(c * 0.16, c * 0.2);
    ctx.fillStyle = 'rgba(20, 16, 10, 0.4)';
    ctx.fill(area);
    ctx.restore();
    ctx.save();
    ctx.clip(area);
    ctx.fillStyle = roof[0];
    ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = roof[1];
    if (across) ctx.fillRect(x0, y0 + h / 2, w, h / 2);
    else ctx.fillRect(x0 + w / 2, y0, w / 2, h);
    if (snow) {
      ctx.fillStyle = 'rgba(246, 249, 251, 0.85)';
      if (across) ctx.fillRect(x0, y0, w, h / 2);
      else ctx.fillRect(x0, y0, w / 2, h);
      ctx.fillStyle = 'rgba(208, 218, 226, 0.65)';
      if (across) ctx.fillRect(x0, y0 + h / 2, w, h / 2);
      else ctx.fillRect(x0 + w / 2, y0, w / 2, h);
    }
    ctx.strokeStyle = 'rgba(30, 20, 12, 0.3)';
    ctx.lineWidth = Math.max(1, c / 26);
    ctx.beginPath();
    const step = c * 0.32;
    for (let t = step; t < (across ? h : w); t += step) {
      if (across) (ctx.moveTo(x0, y0 + t), ctx.lineTo(x0 + w, y0 + t));
      else (ctx.moveTo(x0 + t, y0), ctx.lineTo(x0 + t, y0 + h));
    }
    ctx.stroke();
    ctx.strokeStyle = roof[2];
    ctx.lineWidth = Math.max(1, c / 9);
    ctx.beginPath();
    ctx.moveTo(across ? x0 : x0 + w / 2, across ? y0 + h / 2 : y0);
    ctx.lineTo(across ? x0 + w : x0 + w / 2, across ? y0 + h / 2 : y0 + h);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(1, c / 12);
    ctx.lineCap = 'square';
    ctx.stroke(edgesOf(c, cells, inSet));
  }
}

// The time of day: the picture is tinted (multiplied) by the colour of the hour, and at dusk and at night the fires,
// lamps, glowing things, lava and lit windows keep their light round them.
const HOURS: Record<Light, { tint: string; lit: number }> = {
  dawn: { tint: 'rgb(255, 214, 190)', lit: 0 },
  dusk: { tint: 'rgb(214, 146, 150)', lit: 0.5 },
  night: { tint: 'rgb(48, 60, 112)', lit: 1 },
};
const WARM = '255, 190, 110';
const LIGHT_OF: Partial<Record<PropKind, { r: number; rgb?: string }>> = {
  candle: { r: 2.2 }, torch: { r: 3.8 }, brazier: { r: 4.2 }, campfire: { r: 5 }, hearth: { r: 4.2 }, chandelier: { r: 5.5 },
  lamppost: { r: 4.5 }, crystal: { r: 3, rgb: '140, 200, 255' }, cauldron: { r: 1.8, rgb: '150, 230, 120' },
  oven: { r: 3 }, spit: { r: 4.5 }, console: { r: 2, rgb: '95, 211, 201' }, terminal: { r: 1.6, rgb: '95, 211, 201' },
  holo: { r: 3, rgb: '120, 200, 255' }, reactor: { r: 5, rgb: '120, 255, 170' }, beacon: { r: 3, rgb: '255, 80, 60' },
  lighthouse: { r: 8 }, wayshrine: { r: 1.6 }, orb: { r: 2.5, rgb: '160, 140, 255' }, portal: { r: 4, rgb: '170, 120, 255' }, runes: { r: 1.5, rgb: '170, 120, 255' },
  tank: { r: 2, rgb: '120, 255, 170' }, forcefield: { r: 2.5, rgb: '120, 200, 255' }, holosign: { r: 3, rgb: '255, 120, 200' },
  goo: { r: 1.6, rgb: '150, 230, 120' }, xenocrystal: { r: 2, rgb: '180, 140, 255' }, candelabra: { r: 3.5 }, jukebox: { r: 2.5 },
  hovercar: { r: 2.5, rgb: '255, 233, 168' }, sedan: { r: 2.5, rgb: '255, 233, 168' },
  tv: { r: 2, rgb: '120, 170, 255' }, computer: { r: 1.6, rgb: '120, 170, 255' }, burnbarrel: { r: 4 }, toxicbarrel: { r: 1.4, rgb: '160, 255, 90' },
  lantern: { r: 3 }, alembic: { r: 1.6 }, viewscreen: { r: 3, rgb: '120, 200, 255' }, cryopod: { r: 2, rgb: '160, 220, 255' },
  forge: { r: 4.5 }, cavecrystals: { r: 3.5, rgb: '170, 140, 255' }, glowshrooms: { r: 1.8, rgb: '140, 230, 200' }, stage: { r: 3 },
  boiler: { r: 3.5 }, teslacoil: { r: 3, rgb: '140, 200, 255' }, treasurepile: { r: 2.5, rgb: '255, 220, 110' }, giantclam: { r: 1.6, rgb: '255, 240, 230' },
  tripod: { r: 3.5 },
};
// `power`: how much of the darkness the light takes away (windows less than a fire).
export function lightsOf(l: Layout): { x: number; y: number; r: number; rgb: string; power: number }[] {
  const out: { x: number; y: number; r: number; rgb: string; power: number }[] = [];
  for (const p of l.props ?? []) {
    const k = LIGHT_OF[p.kind];
    if (k) out.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, r: k.r * Math.max(1, Math.sqrt((p.w * p.h) / 2)), rgb: k.rgb ?? WARM, power: 1 });
  }
  for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) if (l.cells[y]![x] === 'L') out.push({ x: x + 0.5, y: y + 0.5, r: 1.8, rgb: '255, 110, 40', power: 1 });
  // Lit windows: a glow round every house.
  for (const a of l.houses ?? []) out.push({ x: a.x + a.w / 2, y: a.y + a.h / 2, r: Math.max(a.w, a.h) / 2 + 0.6, rgb: WARM, power: 0.4 });
  return out;
}
function drawHour(ctx: CanvasRenderingContext2D, l: Layout, c: number) {
  if (!l.light) return;
  const hour = HOURS[l.light];
  const lights = hour.lit ? lightsOf(l) : [];
  // The darkness is smooth: a small mask, stretched — a big map at a big scale would not fit another full canvas.
  const k = 8;
  const mask = typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(l.w * k, l.h * k);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  if (mask) {
    const m = mask.getContext('2d')!;
    m.fillStyle = hour.tint;
    m.fillRect(0, 0, mask.width, mask.height);
    m.globalCompositeOperation = 'destination-out';
    for (const s of lights) {
      const g = m.createRadialGradient(s.x * k, s.y * k, 0, s.x * k, s.y * k, s.r * k);
      g.addColorStop(0, `rgba(0, 0, 0, ${hour.lit * s.power})`);
      g.addColorStop(0.45, `rgba(0, 0, 0, ${hour.lit * s.power * 0.75})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      m.fillStyle = g;
      m.fillRect((s.x - s.r) * k, (s.y - s.r) * k, s.r * 2 * k, s.r * 2 * k);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(mask, 0, 0, l.w * c, l.h * c);
  } else {
    ctx.fillStyle = hour.tint;
    ctx.fillRect(0, 0, l.w * c, l.h * c);
  }
  ctx.restore();
  // The light's own colour on what it falls on.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const s of lights) {
    const g = ctx.createRadialGradient(s.x * c, s.y * c, 0, s.x * c, s.y * c, s.r * c);
    g.addColorStop(0, `rgba(${s.rgb}, ${0.32 * hour.lit * s.power})`);
    g.addColorStop(1, `rgba(${s.rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect((s.x - s.r) * c, (s.y - s.r) * c, s.r * 2 * c, s.r * 2 * c);
  }
  ctx.restore();
}

export function drawLayout(ctx: CanvasRenderingContext2D, l: Layout, c: number, over: Overlay = {}) {
  if (isWild(l.style)) drawWild(ctx, l, c, l.style);
  else if (l.style === 'town') drawTown(ctx, l, c);
  else drawIndoor(ctx, l, c);
  drawProps(ctx, l, c);
  if (isOpenAir(l.style)) drawRoofs(ctx, l, c, l.tone === 'winter');
  drawHour(ctx, l, c);

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
