// Рисование карты на canvas: картинка, сетка, туман. Общее для редактора мастера и экрана игроков.
import { PIN_ICONS, type PinIcon } from './icons';
import { PIN_COLORS, type Fog, type FogOp, type Grid, type MapPin, type MapView } from './types';

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
}

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

  if (o.grid.on) {
    const step = img.w / o.grid.cells;
    // Первая линия — на сдвиге (у самого края не рисуем).
    const x0 = (o.grid.ox ?? 0) * step || step;
    const y0 = (o.grid.oy ?? 0) * step || step;
    ctx.beginPath();
    for (let x = x0; x < img.w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, img.h);
    }
    for (let y = y0; y < img.h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(img.w, y);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1 / xf.s;
    ctx.stroke();
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
