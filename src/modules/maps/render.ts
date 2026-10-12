// Рисование карты на canvas: картинка, сетка, туман. Общее для редактора мастера и экрана игроков.
import type { Fog, FogOp, Grid, MapView } from './types';

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
    ctx.beginPath();
    for (let x = step; x < img.w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, img.h);
    }
    for (let y = step; y < img.h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(img.w, y);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1 / xf.s;
    ctx.stroke();
  }

  ctx.globalAlpha = o.fogAlpha;
  if (o.fogBlur > 0) ctx.filter = `blur(${o.fogBlur}px)`;
  ctx.drawImage(fog, 0, 0, img.w, img.h);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
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
