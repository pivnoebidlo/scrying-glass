// Рисование карты на canvas: картинка, сетка, туман. Общее для редактора мастера и экрана игроков.
import { PIN_ICONS, type PinIcon } from './icons';
import { gridPath } from './grid';
import { GRID_STYLE, PIN_COLORS, type Fog, type FogOp, type Grid, type MapPin, type MapView } from './types';

export interface LoadedImage {
  el: HTMLImageElement;
  w: number;
  h: number;
}

export function loadImage(src: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve({ el, w: el.naturalWidth, h: el.naturalHeight });
    el.onerror = reject;
    el.src = src;
  });
}

// Маска тумана в своём разрешении (не больше FOG_MAX по длинной стороне): чёрное — скрыто.
const FOG_MAX = 2048;

export function fogCanvas(w: number, h: number): HTMLCanvasElement {
  const k = Math.min(1, FOG_MAX / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  return c;
}

export function buildFog(fog: Fog, c: HTMLCanvasElement) {
  const ctx = c.getContext('2d')!;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, c.width, c.height);
  if (fog.base === 'hidden') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
  }
  for (const op of fog.ops) applyFogOp(c, op);
}

export function applyFogOp(c: HTMLCanvasElement, op: FogOp) {
  const ctx = c.getContext('2d')!;
  const W = c.width;
  const H = c.height;
  ctx.globalCompositeOperation = op.mode === 'reveal' ? 'destination-out' : 'source-over';
  ctx.fillStyle = ctx.strokeStyle = '#000';
  if (op.kind === 'rect') {
    ctx.fillRect(op.x * W, op.y * H, op.w * W, op.h * H);
  } else if (op.kind === 'rects') {
    // One path: no seams between the rows.
    ctx.beginPath();
    for (let i = 0; i + 3 < op.rects.length; i += 4) ctx.rect(op.rects[i]! * W, op.rects[i + 1]! * H, op.rects[i + 2]! * W, op.rects[i + 3]! * H);
    ctx.fill();
  } else {
    const p = op.points;
    const r = op.r * W;
    if (p.length <= 2) {
      ctx.beginPath();
      ctx.arc(p[0]! * W, p[1]! * H, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = r * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p[0]! * W, p[1]! * H);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i]! * W, p[i + 1]! * H);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// Преобразование «пиксели карты → пиксели canvas»: экранная точка = точка карты * s + (ox, oy).
export interface Xf {
  s: number;
  ox: number;
  oy: number;
}

// Вписать прямоугольник обзора (в долях карты) в canvas целиком, по центру.
export function fitView(view: MapView, img: { w: number; h: number }, cw: number, ch: number): Xf {
  const vw = view.w * img.w;
  const vh = view.h * img.h;
  const s = Math.min(cw / vw, ch / vh);
  return { s, ox: cw / 2 - (view.x * img.w + vw / 2) * s, oy: ch / 2 - (view.y * img.h + vh / 2) * s };
}

// Что на самом деле видно на экране с пропорциями aspect (ширина / высота), если вписать в него обзор.
export function visibleArea(view: MapView, img: { w: number; h: number }, aspect: number): MapView {
  const vw = view.w * img.w;
  const vh = view.h * img.h;
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  if (vw / vh > aspect) {
    const h = vw / aspect / img.h;
    return { x: view.x, y: cy - h / 2, w: view.w, h };
  }
  const w = (vh * aspect) / img.w;
  return { x: cx - w / 2, y: view.y, w, h: view.h };
}

export interface DrawOptions {
  // Непрозрачность тумана: 1 у игроков, полупрозрачный у мастера.
  fogAlpha: number;
  // Размытие края тумана, пиксели canvas.
  fogBlur: number;
  grid: Grid;
  // Что рисовать под туманом (жетоны): у игроков туман их прячет.
  underFog?: (ctx: CanvasRenderingContext2D) => void;
  // Roofs over the picture (MapCover), each in its own area; `alpha` — the GM sees through them.
  covers?: { img: LoadedImage; area: number[]; alpha: number }[];
}

// The pictures of covers, loaded once each.
const coverPictures = new Map<string, LoadedImage | 'loading' | 'failed'>();
export function coverPicture(src: string, onload: () => void): LoadedImage | null {
  const had = coverPictures.get(src);
  if (had && had !== 'loading' && had !== 'failed') return had;
  if (!had) {
    coverPictures.set(src, 'loading');
    loadImage(src).then(
      (i) => (coverPictures.set(src, i), onload()),
      () => coverPictures.set(src, 'failed'),
    );
  }
  return null;
}

// What covers the map as the players see it, in drawing order: the levels underground gone down to (the deepest last),
// then the roofs and storeys still down.
export const shownCovers = <C extends { lifted: boolean; below?: boolean }>(covers: readonly C[] = []): C[] => [
  ...covers.filter((c) => c.below && c.lifted),
  ...covers.filter((c) => !c.below && !c.lifted),
];

// What a click at a point does (the GM in the Maps): lifts the topmost roof or storey still down there; with none left,
// goes down to the next level underground; `back` (the right button, or nothing more to do) — the other way, one step.
export function coverStep<C extends { id: string; lifted: boolean; below?: boolean; area: number[] }>(covers: readonly C[], x: number, y: number, back: boolean): { id: string; lifted: boolean } | null {
  const here = covers.filter((c) => inCover(c.area, x, y));
  const above = here.filter((c) => !c.below);
  const under = here.filter((c) => c.below);
  if (!back) {
    const up = above.findLast((c) => !c.lifted);
    if (up) return { id: up.id, lifted: true };
    const down = under.find((c) => !c.lifted);
    if (down) return { id: down.id, lifted: true };
  }
  const deepest = under.findLast((c) => c.lifted);
  if (deepest) return { id: deepest.id, lifted: false };
  const lowest = above.find((c) => c.lifted);
  return lowest ? { id: lowest.id, lifted: false } : null;
}

// A cover's area as a path in the map's pixels.
export function coverPath(area: number[], img: { w: number; h: number }): Path2D {
  const p = new Path2D();
  for (let i = 0; i + 3 < area.length; i += 4) p.rect(area[i]! * img.w, area[i + 1]! * img.h, area[i + 2]! * img.w, area[i + 3]! * img.h);
  return p;
}
export const inCover = (area: number[], x: number, y: number) => {
  for (let i = 0; i + 3 < area.length; i += 4) if (x >= area[i]! && y >= area[i + 1]! && x < area[i]! + area[i + 2]! && y < area[i + 1]! + area[i + 3]!) return true;
  return false;
};

export function drawMap(ctx: CanvasRenderingContext2D, img: LoadedImage, fog: HTMLCanvasElement, xf: Xf, o: DrawOptions) {
  const c = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.setTransform(xf.s, 0, 0, xf.s, xf.ox, xf.oy);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img.el, 0, 0, img.w, img.h);
  for (const cv of o.covers ?? []) {
    if (cv.alpha <= 0) continue;
    ctx.save();
    ctx.clip(coverPath(cv.area, img));
    ctx.globalAlpha = cv.alpha;
    ctx.drawImage(cv.img.el, 0, 0, img.w, img.h);
    ctx.restore();
  }

  if (o.grid.on) {
    // Squares or hexes (grid.ts); hexes cross the edge of the map — clipped to it.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, img.w, img.h);
    ctx.clip();
    gridPath(ctx, o.grid, img);
    ctx.strokeStyle = o.grid.color ?? GRID_STYLE.color;
    ctx.globalAlpha = o.grid.alpha ?? GRID_STYLE.alpha;
    ctx.lineWidth = (o.grid.width ?? GRID_STYLE.width) / xf.s;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (o.underFog) {
    ctx.save();
    o.underFog(ctx);
    ctx.restore();
    ctx.setTransform(xf.s, 0, 0, xf.s, xf.ox, xf.oy);
  }

  ctx.globalAlpha = o.fogAlpha;
  if (o.fogBlur > 0) ctx.filter = `blur(${o.fogBlur}px)`;
  ctx.drawImage(fog, 0, 0, img.w, img.h);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
}

// Метки: булавка остриём в точку, название под ней. r — радиус головки в пикселях canvas.
export interface PinStyle {
  r: number;
  font: string;
  // У мастера: скрытые от игроков метки — бледные с пунктиром, выбранная — с ореолом.
  master?: { selected: string | null };
}

// Контуры значков для canvas, по одному разу на значок.
const iconPaths = new Map<PinIcon, Path2D[]>();
const pathsOf = (icon: PinIcon) => {
  let p = iconPaths.get(icon);
  if (!p) iconPaths.set(icon, (p = (PIN_ICONS[icon]?.paths ?? []).map((d) => new Path2D(d))));
  return p;
};

// Где на canvas головка булавки (для попадания мышью).
export function pinHead(p: MapPin, img: { w: number; h: number }, xf: Xf, r: number) {
  return { x: p.x * img.w * xf.s + xf.ox, y: p.y * img.h * xf.s + xf.oy - r * 1.9 };
}

export function drawPins(ctx: CanvasRenderingContext2D, pins: MapPin[], img: { w: number; h: number }, xf: Xf, st: PinStyle) {
  const r = st.r;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  for (const p of pins) {
    const x = p.x * img.w * xf.s + xf.ox;
    const y = p.y * img.h * xf.s + xf.oy;
    const hy = y - r * 1.9;
    const hidden = st.master && !p.shown;
    ctx.globalAlpha = hidden ? 0.65 : 1;

    if (st.master?.selected === p.id) {
      ctx.beginPath();
      ctx.arc(x, hy, r * 1.75, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }

    // Булавка: круг и остриё, касательные к кругу.
    const a = Math.acos(1 / 1.9);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, hy, r, Math.PI / 2 + a, Math.PI / 2 - a);
    ctx.closePath();
    ctx.fillStyle = PIN_COLORS[p.color] ?? PIN_COLORS.red;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = r * 0.6;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1, r * 0.16);
    ctx.strokeStyle = '#fff';
    if (hidden) ctx.setLineDash([r * 0.35, r * 0.25]);
    ctx.stroke();
    ctx.setLineDash([]);
    const icon = p.icon && p.icon !== 'pin' ? pathsOf(p.icon) : null;
    if (icon?.length) {
      // Значок Lucide (24×24) белым внутри головки.
      const k = (r * 1.25) / 24;
      ctx.save();
      ctx.translate(x - 12 * k, hy - 12 * k);
      ctx.scale(k, k);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = p.color === 'white' ? '#333' : '#fff';
      for (const d of icon) ctx.stroke(d);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(x, hy, r * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();
    }

    if (p.title) {
      ctx.font = st.font;
      ctx.lineWidth = r * 0.45;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(p.title, x, y + r * 0.35);
      ctx.fillStyle = '#fff';
      ctx.fillText(p.title, x, y + r * 0.35);
    }
  }
  ctx.globalAlpha = 1;
}

// canvas по размеру элемента с учётом плотности пикселей экрана.
export function fitCanvas(c: HTMLCanvasElement): boolean {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(c.clientWidth * dpr));
  const h = Math.max(1, Math.round(c.clientHeight * dpr));
  if (c.width === w && c.height === h) return false;
  c.width = w;
  c.height = h;
  return true;
}
