// Жетоны: живые данные из инициативы, размер клетки, привязка к сетке, рисование на canvas.
import type { InitiativeState } from '../initiative/types';
import { assetUrl } from '../../shared/vault';
import type { Xf } from './render';
import type { Grid, MapData, MapToken } from './types';

// Жетон, каким его рисовать: свои поля + состояние участника боя (портрет — участника, а если у него нет — свой).
export interface TokenView extends MapToken {
  turn: boolean;
  down: boolean;
  // Доля потерянных хитов (0..1), если игроки видят ранения.
  wound: number;
}

export function tokenViews(tokens: MapToken[], ini: InitiativeState): TokenView[] {
  const d = ini.display;
  return tokens.map((t) => {
    const c = t.combatant ? ini.combatants.find((x) => x.id === t.combatant) : undefined;
    if (!c) return { ...t, turn: false, down: false, wound: 0 };
    const down = c.hp !== null && c.hp <= 0;
    const wound = d.wounds && !c.hideWounds && c.maxHp && c.hp !== null && c.hp > 0 ? Math.min(1, Math.max(0, 1 - c.hp / c.maxHp)) : 0;
    return { ...t, name: c.name, portrait: c.portrait ?? t.portrait, side: c.side, hidden: t.hidden || c.hidden, turn: ini.turn === c.id, down, wound };
  });
}

// Размер клетки в пикселях картинки: по сетке карты (и когда она выключена — её число клеток).
export const cellOf = (grid: Grid, imgW: number) => imgW / grid.cells;

// Диаметр жетона 1×1 в пикселях картинки: клетка сетки с учётом масштаба жетонов карты.
export const tokenCell = (d: MapData, imgW: number) => cellOf(d.grid, imgW) * (d.tokenScale ?? 1);

// Ближайшее место на сетке для жетона размером size клеток: центр клетки у нечётных, угол — у чётных.
export function snap(x: number, y: number, size: number, grid: Grid, img: { w: number; h: number }) {
  const cell = cellOf(grid, img.w);
  const half = size % 2 ? 0.5 : 0;
  const at = (v: number, off: number) => (Math.round((v - off * cell) / cell - half) + half) * cell + off * cell;
  return { x: at(x * img.w, grid.ox ?? 0) / img.w, y: at(y * img.h, grid.oy ?? 0) / img.h };
}

export const RING = { party: '#e8b94a', ally: '#4f8de8', neutral: '#9aa0a8', enemy: '#e04545' } as const;

// Картинки жетонов: грузятся один раз, по готовности — onload (перерисовать).
const cache = new Map<string, HTMLImageElement>();
export function tokenImage(path: string, onload: () => void): HTMLImageElement | null {
  let el = cache.get(path);
  if (!el) {
    el = new Image();
    el.src = assetUrl(path);
    cache.set(path, el);
  }
  if (el.complete && el.naturalWidth) return el;
  el.addEventListener('load', onload, { once: true });
  return null;
}

export interface TokenStyle {
  cell: number; // клетка в пикселях картинки
  onload: () => void;
  // У мастера: спрятанные — полупрозрачные с пунктиром, выбранный — с ореолом; имя — у выбранного и под мышью.
  master?: { selected: string | null; hover: string | null; font: string };
}

export function drawTokens(ctx: CanvasRenderingContext2D, tokens: TokenView[], img: { w: number; h: number }, xf: Xf, st: TokenStyle) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Сначала большие: маленький жетон рядом с драконом не прячется под ним.
  for (const t of [...tokens].sort((a, b) => b.size - a.size)) {
    const x = t.x * img.w * xf.s + xf.ox;
    const y = t.y * img.h * xf.s + xf.oy;
    const r = (t.size * st.cell * xf.s) / 2;
    const ring = Math.max(1.5, r * 0.12);
    ctx.globalAlpha = st.master && t.hidden ? 0.5 : t.down ? 0.75 : 1;

    if (t.turn || st.master?.selected === t.id) {
      ctx.beginPath();
      ctx.arc(x, y, r + ring * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = t.turn ? 'rgba(255, 255, 255, 0.85)' : 'rgba(138, 92, 245, 0.8)';
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r - ring / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#333';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const im = t.portrait ? tokenImage(t.portrait, st.onload) : null;
    if (t.down) ctx.filter = 'grayscale(1) brightness(0.7)';
    if (im) {
      // Как object-fit: cover.
      const k = Math.max((2 * r) / im.naturalWidth, (2 * r) / im.naturalHeight);
      ctx.drawImage(im, x - (im.naturalWidth * k) / 2, y - (im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${r}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.name.slice(0, 1).toUpperCase(), x, y + r * 0.05);
    }
    ctx.filter = 'none';
    if (t.wound > 0) {
      ctx.fillStyle = `rgba(200, 0, 0, ${t.wound * 0.55})`;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r - ring / 2, 0, Math.PI * 2);
    ctx.lineWidth = ring;
    ctx.strokeStyle = t.down ? '#555' : RING[t.side] ?? RING.enemy;
    if (st.master && t.hidden) ctx.setLineDash([ring * 2, ring * 1.4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (st.master && (st.master.selected === t.id || st.master.hover === t.id)) {
      ctx.font = st.master.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3 * (window.devicePixelRatio || 1);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(t.name, x, y + r + 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(t.name, x, y + r + 2);
    }
  }
  ctx.globalAlpha = 1;
}
