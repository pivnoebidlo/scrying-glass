// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A monastery; an enchanted library; a goblin camp; a troll's cave; a pharaoh's tomb.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets14 } from './draw-sets14';

const DARK = '#2b2a2e';
const GOLD = '#d4a640';
const BONE = '#e8e2d0';
const SAND = '#c9a96a';

export const SET13_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  armchair: CLOTH, runecarpet: ['#3f5d86', '#7a5a8e', '#2f6f6a'], gobtent: ['#8a6a4a', '#6f5a3a', '#7a7a5a'],
};
// Drawn once a cell when stretched.
export const SET13_TILED: Prop['kind'][] = ['herbbed', 'bookpile', 'junkpile', 'boulderpile', 'canopic'];

export function drawSets13(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A monastery ----
    case 'bigbell': {
      const r = Math.min(w, h) * 0.42;
      lines(ctx, '#5c3d22', Math.max(4, c / 6), () => (ctx.moveTo(-w * 0.46, 0), ctx.lineTo(w * 0.46, 0)));
      shape(ctx, '#b8913e', circle(ctx, 0, 0, r), line);
      lines(ctx, '#8a6a2a', thin, () => (ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2), ctx.moveTo(r * 0.4, 0), ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2)));
      shape(ctx, '#5c4a2a', circle(ctx, 0, 0, r * 0.14), 0);
      break;
    }
    case 'scriptorium':
      shape(ctx, tone(WOOD, 0.7), rect(ctx, -c * 0.38, -c * 0.28, c * 0.76, c * 0.56, c * 0.03), line);
      shape(ctx, '#efe2bd', rect(ctx, -c * 0.26, -c * 0.2, c * 0.4, c * 0.28, c * 0.02), thin);
      lines(ctx, '#8a6a3a', thin, () => {
        for (let y = -0.14; y < 0.06; y += 0.05) (ctx.moveTo(-c * 0.22, y * c), ctx.lineTo(c * 0.1, y * c));
      });
      shape(ctx, '#b33a2e', rect(ctx, -c * 0.26, -c * 0.2, c * 0.08, c * 0.08), 0);
      glow(ctx, c * 0.26, -c * 0.12, c * 0.16, 'rgba(255, 214, 120, 0.8)');
      shape(ctx, '#f0e6c8', circle(ctx, c * 0.26, -c * 0.12, c * 0.04), thin);
      lines(ctx, DARK, thin, () => (ctx.moveTo(c * 0.18, c * 0.16), ctx.lineTo(c * 0.32, c * 0.02)));
      break;
    case 'herbbed':
      shape(ctx, '#7a5432', rect(ctx, -c * 0.46, -c * 0.4, c * 0.92, c * 0.8, c * 0.02), thin);
      shape(ctx, '#5c4a36', rect(ctx, -c * 0.38, -c * 0.32, c * 0.76, c * 0.64), 0);
      for (const [x, y, col] of [[-0.2, -0.15, '#7f9a48'], [0.15, -0.15, '#8fae5a'], [-0.2, 0.15, '#6f8a4a'], [0.15, 0.15, '#a87ac9']] as const) shape(ctx, col, circle(ctx, x * c, y * c, c * 0.11), 0);
      break;
    case 'reliquary':
      shape(ctx, GOLD, rect(ctx, -c * 0.3, -c * 0.2, c * 0.6, c * 0.4, c * 0.04), line);
      shape(ctx, '#b8913e', () => (ctx.moveTo(-c * 0.3, -c * 0.2), ctx.lineTo(0, -c * 0.34), ctx.lineTo(c * 0.3, -c * 0.2), ctx.closePath()), thin);
      for (const x of [-0.16, 0, 0.16]) shape(ctx, x ? '#b33a2e' : '#3f5d86', circle(ctx, x * c, 0, c * 0.04), 0);
      glow(ctx, 0, 0, c * 0.4, 'rgba(255, 220, 120, 0.35)');
      break;
    // ---- An enchanted library ----
    case 'spiralstair': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#5c3d22', circle(ctx, 0, 0, r), line);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const g = 160 - k * 8;
        shape(ctx, `rgb(${g}, ${g - 40}, ${g - 80})`, () => (ctx.moveTo(0, 0), ctx.arc(0, 0, r * 0.92, a, a + Math.PI / 5), ctx.closePath()), thin);
      }
      shape(ctx, '#3a2a1c', circle(ctx, 0, 0, r * 0.16), thin);
      break;
    }
    case 'armchair':
      shape(ctx, tone(CLOTH, t), rect(ctx, -c * 0.36, -c * 0.34, c * 0.72, c * 0.68, c * 0.16), line);
      shape(ctx, 'rgba(0, 0, 0, 0.2)', rect(ctx, -c * 0.36, -c * 0.34, c * 0.72, c * 0.2, c * 0.14), 0);
      for (const x of [-0.36, 0.24]) shape(ctx, tone(CLOTH, t), rect(ctx, x * c, -c * 0.2, c * 0.12, c * 0.5, c * 0.06), thin);
      break;
    case 'bookpile':
      for (const [x, y, a, k] of [[-0.16, -0.12, 0.2, 0], [0.16, -0.06, -0.3, 2], [-0.04, 0.2, 0.6, 4], [0.04, 0.02, 1.2, 6]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, CLOTH[k]!, rect(ctx, -c * 0.13, -c * 0.09, c * 0.26, c * 0.18, c * 0.02), thin);
        lines(ctx, '#efe7d3', thin, () => (ctx.moveTo(c * 0.13, -c * 0.07), ctx.lineTo(c * 0.13, c * 0.07)));
        ctx.restore();
      }
      break;
    case 'runecarpet': {
      const col = tone(SET13_TINTS.runecarpet!, t);
      shape(ctx, col, rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.04), thin);
      glow(ctx, 0, 0, Math.min(w, h) * 0.5, 'rgba(180, 160, 255, 0.35)');
      lines(ctx, '#d6c8ff', Math.max(1.5, c / 18), () => {
        ctx.rect(L + c * 0.2, T + c * 0.2, w - c * 0.4, h - c * 0.4);
        ctx.moveTo(Math.min(w, h) * 0.3, 0);
        ctx.arc(0, 0, Math.min(w, h) * 0.3, 0, Math.PI * 2);
        ctx.moveTo(0, -Math.min(w, h) * 0.3);
        ctx.lineTo(0, Math.min(w, h) * 0.3);
        ctx.moveTo(-Math.min(w, h) * 0.3, 0);
        ctx.lineTo(Math.min(w, h) * 0.3, 0);
      });
      break;
    }
    // ---- A goblin camp ----
    case 'gobtent':
      shape(ctx, tone(SET13_TINTS.gobtent!, t), () => {
        ctx.moveTo(L + c * 0.12, h / 2 - c * 0.12);
        ctx.lineTo(L + c * 0.2, T + c * 0.2);
        ctx.lineTo(w / 2 - c * 0.24, T + c * 0.14);
        ctx.lineTo(w / 2 - c * 0.1, h / 2 - c * 0.2);
        ctx.closePath();
      }, line);
      for (const [x, y] of [[-0.3, -0.2], [0.25, 0.1], [-0.1, 0.35]] as const) shape(ctx, '#5c4a36', rect(ctx, x * c, y * c, c * 0.3, c * 0.2, c * 0.02), thin);
      lines(ctx, '#3a2a1c', Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.2, T + c * 0.2), ctx.lineTo(w / 2 - c * 0.1, h / 2 - c * 0.2)));
      shape(ctx, BONE, circle(ctx, 0, 0, c * 0.08), thin);
      break;
    case 'junkpile':
      for (const [x, y, s, col] of [[-0.2, -0.1, 0.16, '#6f5a3a'], [0.16, -0.14, 0.12, '#8d949c'], [0.06, 0.16, 0.18, '#5c4a36'], [-0.22, 0.24, 0.1, '#8a4a2a']] as const) {
        shape(ctx, col, rect(ctx, (x - s) * c, (y - s * 0.6) * c, s * 2 * c, s * 1.2 * c, c * 0.02), thin);
      }
      shape(ctx, BONE, circle(ctx, c * 0.3, c * 0.3, c * 0.06), thin);
      break;
    case 'warbanner':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(0, c * 0.4), ctx.lineTo(0, -c * 0.4), ctx.moveTo(-c * 0.24, -c * 0.32), ctx.lineTo(c * 0.24, -c * 0.32)));
      shape(ctx, '#8a2f2b', () => (ctx.moveTo(-c * 0.22, -c * 0.32), ctx.lineTo(c * 0.22, -c * 0.32), ctx.lineTo(c * 0.18, c * 0.1), ctx.lineTo(0, 0), ctx.lineTo(-c * 0.2, c * 0.12), ctx.closePath()), thin);
      shape(ctx, BONE, circle(ctx, 0, -c * 0.14, c * 0.07), 0);
      break;
    case 'bonefire':
      shape(ctx, '#3a2a1c', circle(ctx, 0, 0, c * 0.3), 0);
      glow(ctx, 0, 0, c * 0.5, 'rgba(255, 140, 40, 0.75)');
      lines(ctx, BONE, Math.max(2, c / 12), () => {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.1, Math.sin(a) * c * 0.1);
          ctx.lineTo(Math.cos(a) * c * 0.34, Math.sin(a) * c * 0.34);
        }
      });
      shape(ctx, '#ffb84f', circle(ctx, 0, 0, c * 0.1), 0);
      break;
    // ---- A troll's cave ----
    case 'trollnest':
      shape(ctx, '#6b5a3a', () => ctx.ellipse(0, 0, w * 0.44, h * 0.4, 0.2, 0, Math.PI * 2), line);
      shape(ctx, '#8a7a5a', () => ctx.ellipse(-c * 0.1, -c * 0.06, w * 0.3, h * 0.26, 0.2, 0, Math.PI * 2), thin);
      lines(ctx, BONE, Math.max(2, c / 12), () => {
        for (const [x, y, a] of [[0.4, 0.3, 0.6], [-0.5, 0.2, -0.3], [0.1, -0.5, 1.4]] as const) (ctx.moveTo(x * c, y * c), ctx.lineTo(x * c + Math.cos(a) * c * 0.3, y * c + Math.sin(a) * c * 0.3));
      });
      shape(ctx, BONE, circle(ctx, w * 0.3, -h * 0.25, c * 0.1), thin);
      break;
    case 'boulderpile':
      for (const [x, y, s] of [[-0.18, -0.1, 0.2], [0.18, -0.06, 0.17], [0, 0.2, 0.18]] as const) shape(ctx, '#7d776d', () => ctx.ellipse(x * c, y * c, s * c, s * c * 0.85, x, 0, Math.PI * 2), thin);
      break;
    case 'bigclub':
      shape(ctx, '#6b4a2a', () => {
        ctx.moveTo(-c * 0.06, c * 0.42);
        ctx.lineTo(c * 0.06, c * 0.42);
        ctx.lineTo(c * 0.18, -c * 0.3);
        ctx.quadraticCurveTo(0, -c * 0.48, -c * 0.18, -c * 0.3);
        ctx.closePath();
      }, line);
      for (const [x, y] of [[-0.1, -0.24], [0.1, -0.18], [0, -0.06]] as const) shape(ctx, '#8d949c', circle(ctx, x * c, y * c, c * 0.03), 0);
      break;
    case 'cookpit':
      for (let k = 0; k < 8; k++) shape(ctx, '#7d776d', circle(ctx, Math.cos((k * Math.PI) / 4) * c * 0.34, Math.sin((k * Math.PI) / 4) * c * 0.34, c * 0.09), thin);
      glow(ctx, 0, 0, c * 0.4, 'rgba(255, 140, 40, 0.7)');
      shape(ctx, '#3a2a1c', circle(ctx, 0, 0, c * 0.24), 0);
      shape(ctx, '#a0582e', () => ctx.ellipse(0, 0, c * 0.2, c * 0.1, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.44, 0), ctx.lineTo(c * 0.44, 0)));
      break;
    // ---- A pharaoh's tomb ----
    case 'goldsarcophagus':
      shape(ctx, GOLD, () => {
        ctx.moveTo(0, T + c * 0.06);
        ctx.quadraticCurveTo(w * 0.42, T + c * 0.1, w * 0.36, T + h * 0.4);
        ctx.lineTo(w * 0.24, h / 2 - c * 0.06);
        ctx.lineTo(-w * 0.24, h / 2 - c * 0.06);
        ctx.lineTo(-w * 0.36, T + h * 0.4);
        ctx.quadraticCurveTo(-w * 0.42, T + c * 0.1, 0, T + c * 0.06);
      }, line);
      shape(ctx, '#3f5d86', rect(ctx, -w * 0.24, T + c * 0.12, w * 0.48, c * 0.12, c * 0.02), 0);
      shape(ctx, '#c9a46a', () => ctx.ellipse(0, T + c * 0.34, w * 0.16, c * 0.14, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#3f5d86', Math.max(1.5, c / 16), () => {
        for (let y = T + c * 0.7; y < h / 2 - c * 0.2; y += c * 0.18) (ctx.moveTo(-w * 0.2, y), ctx.lineTo(w * 0.2, y));
      });
      break;
    case 'canopic':
      for (const [x, y] of [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.18], [0.18, 0.18]] as const) {
        shape(ctx, '#d6cdb5', circle(ctx, x * c, y * c, c * 0.13), thin);
        shape(ctx, '#7a5432', circle(ctx, x * c, y * c, c * 0.07), 0);
      }
      break;
    case 'jackalstatue':
      shape(ctx, '#8a7a5a', rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.64, c * 0.04), line);
      shape(ctx, '#1d1b1e', () => ctx.ellipse(0, c * 0.06, c * 0.14, c * 0.2, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#1d1b1e', () => (ctx.moveTo(-c * 0.08, -c * 0.12), ctx.lineTo(0, -c * 0.34), ctx.lineTo(c * 0.08, -c * 0.12), ctx.closePath()), thin);
      for (const x of [-0.06, 0.06]) shape(ctx, '#1d1b1e', () => (ctx.moveTo(x * c - c * 0.03, -c * 0.16), ctx.lineTo(x * c, -c * 0.28), ctx.lineTo(x * c + c * 0.03, -c * 0.16), ctx.closePath()), 0);
      shape(ctx, GOLD, rect(ctx, -c * 0.1, -c * 0.06, c * 0.2, c * 0.05), 0);
      break;
    case 'hieroglyphs':
      for (let x = L + c / 2; x < w / 2; x += c) {
        ctx.save();
        ctx.translate(x, 0);
        // Carvings along a wall: put them on wall cells.
        shape(ctx, SAND, rect(ctx, -c * 0.48, -c * 0.16, c * 0.96, c * 0.32), 0);
        lines(ctx, '#7a5a2a', Math.max(1.5, c / 18), () => {
          ctx.moveTo(-c * 0.36, c * 0.08);
          ctx.lineTo(-c * 0.36, -c * 0.08);
          ctx.arc(-c * 0.3, -c * 0.08, c * 0.06, Math.PI, 0);
          ctx.moveTo(-c * 0.06, -c * 0.1);
          ctx.arc(-c * 0.1, -c * 0.02, c * 0.06, 0, Math.PI * 2);
          ctx.moveTo(c * 0.06, c * 0.08);
          ctx.lineTo(c * 0.14, -c * 0.1);
          ctx.lineTo(c * 0.22, c * 0.08);
          ctx.moveTo(c * 0.32, -c * 0.1);
          ctx.quadraticCurveTo(c * 0.44, 0, c * 0.32, c * 0.1);
        });
        ctx.restore();
      }
      break;
    default:
      drawSets14(ctx, p, w, h, c);
  }
}
