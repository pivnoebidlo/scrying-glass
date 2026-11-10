// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A travelling circus; harpies' nests; a vampire's ballroom; an underwater temple.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, type Ctx } from './prop-paint';
import { drawSets16 } from './draw-sets16';

const DARK = '#2b2a2e';
const GOLD = '#d4a640';
const BONE = '#e8e2d0';
const STRIPES = ['#b33a2e', '#3f5d86', '#5f7a3a', '#7a3d7a'];
const CORAL = '#d9826a';

export const SET15_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  bigtop: STRIPES, feathers: ['#8a7a6a', '#4a4a52', '#b8a888'],
};
// Drawn once a cell when stretched.
export const SET15_TILED: Prop['kind'][] = ['feathers'];

export function drawSets15(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A travelling circus ----
    case 'bigtop': {
      // A striped tent from above: wedges round a centre pole, a flag on top.
      const r = Math.min(w, h) * 0.47;
      const col = tone(STRIPES, t);
      shape(ctx, 'rgba(20, 16, 10, 0.3)', circle(ctx, c * 0.12, c * 0.16, r), 0);
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        shape(ctx, k % 2 ? '#efe7d3' : col, () => (ctx.moveTo(0, 0), ctx.arc(0, 0, r, a, a + Math.PI / 8), ctx.closePath()), 0);
      }
      lines(ctx, DARK, line, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
      shape(ctx, GOLD, circle(ctx, 0, 0, c * 0.1), thin);
      shape(ctx, col, () => (ctx.moveTo(0, 0), ctx.lineTo(c * 0.3, -c * 0.08), ctx.lineTo(0, -c * 0.16), ctx.closePath()), thin);
      break;
    }
    case 'circusring': {
      const r = Math.min(w, h) * 0.46;
      shape(ctx, '#b33a2e', circle(ctx, 0, 0, r), line);
      shape(ctx, '#c9a46a', circle(ctx, 0, 0, r * 0.86), thin);
      lines(ctx, '#efe7d3', Math.max(2, c / 12), () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
          ctx.lineTo(Math.cos(a + 0.2) * r * 0.9, Math.sin(a + 0.2) * r * 0.9);
        }
      });
      shape(ctx, '#3f5d86', () => ctx.ellipse(0, 0, c * 0.24, c * 0.16, 0, 0, Math.PI * 2), thin);
      shape(ctx, GOLD, rect(ctx, -c * 0.16, -c * 0.04, c * 0.32, c * 0.08), 0);
      break;
    }
    case 'beastcage':
      shape(ctx, '#7a3d22', rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.2, c * 0.04), line);
      shape(ctx, '#5c4a36', rect(ctx, L + c * 0.16, T + c * 0.2, w - c * 0.32, h - c * 0.4), 0);
      shape(ctx, '#c98a3a', () => ctx.ellipse(0, 0, w * 0.2, h * 0.18, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#8a5a2a', circle(ctx, w * 0.14, -h * 0.04, c * 0.12), thin);
      lines(ctx, '#3a3d42', Math.max(1.5, c / 16), () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.16) (ctx.moveTo(x, T + c * 0.12), ctx.lineTo(x, h / 2 - c * 0.12));
      });
      for (const x of [L + c * 0.3, w / 2 - c * 0.3]) for (const y of [T + c * 0.06, h / 2 - c * 0.06]) shape(ctx, DARK, rect(ctx, x - c * 0.12, y - c * 0.05, c * 0.24, c * 0.1, c * 0.02), 0);
      break;
    case 'tightrope':
      for (const x of [L + c * 0.3, w / 2 - c * 0.3]) {
        shape(ctx, '#5c3d22', circle(ctx, x, 0, c * 0.14), line);
        shape(ctx, '#b33a2e', circle(ctx, x, 0, c * 0.06), 0);
      }
      lines(ctx, '#efe7d3', Math.max(1.5, c / 18), () => (ctx.moveTo(L + c * 0.3, 0), ctx.lineTo(w / 2 - c * 0.3, 0)));
      lines(ctx, 'rgba(20, 16, 10, 0.3)', Math.max(1.5, c / 18), () => (ctx.moveTo(L + c * 0.34, c * 0.1), ctx.lineTo(w / 2 - c * 0.26, c * 0.1)));
      break;
    case 'candycart':
      shape(ctx, '#e8a0b8', rect(ctx, -c * 0.38, -c * 0.26, c * 0.76, c * 0.52, c * 0.06), line);
      for (let k = 0; k < 4; k++) shape(ctx, k % 2 ? '#efe7d3' : '#b33a2e', rect(ctx, -c * 0.38 + k * c * 0.19, -c * 0.4, c * 0.19, c * 0.14), thin);
      for (const [x, col] of [[-0.2, '#f4c0d8'], [0, '#c0e0f4'], [0.2, '#f4e8a0']] as const) shape(ctx, col, circle(ctx, x * c, c * 0.02, c * 0.09), thin);
      for (const x of [-0.3, 0.3]) shape(ctx, DARK, circle(ctx, x * c, c * 0.3, c * 0.08), 0);
      break;
    // ---- Harpies' nests ----
    case 'harpynest': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#6b5a3a', circle(ctx, 0, 0, r), line);
      lines(ctx, '#4a3a22', thin, () => {
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
          ctx.lineTo(Math.cos(a + 0.6) * r * 1.02, Math.sin(a + 0.6) * r * 1.02);
        }
      });
      shape(ctx, '#4a3a2a', circle(ctx, 0, 0, r * 0.56), thin);
      for (const [x, y] of [[-0.12, -0.06], [0.1, -0.1], [0, 0.12]] as const) shape(ctx, '#c9c2b0', () => ctx.ellipse(x * c, y * c, c * 0.09, c * 0.12, x * 4, 0, Math.PI * 2), thin);
      shape(ctx, GOLD, circle(ctx, r * 0.3, r * 0.3, c * 0.05), 0);
      shape(ctx, BONE, circle(ctx, -r * 0.34, r * 0.24, c * 0.06), thin);
      break;
    }
    case 'feathers': {
      const col = tone(SET15_TINTS.feathers!, t);
      for (const [x, y, a] of [[-0.2, -0.12, 0.4], [0.18, -0.06, -0.8], [0, 0.2, 1.6], [-0.24, 0.24, 2.4]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, col, () => ctx.ellipse(0, 0, c * 0.05, c * 0.15, 0, 0, Math.PI * 2), thin);
        lines(ctx, 'rgba(20, 16, 10, 0.5)', thin, () => (ctx.moveTo(0, -c * 0.15), ctx.lineTo(0, c * 0.18)));
        ctx.restore();
      }
      break;
    }
    // ---- A vampire's ballroom ----
    case 'ballfloor': {
      // A chequered dance floor with a rose in the middle.
      const s = c / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08);
      ctx.clip();
      for (let y = T; y < h / 2; y += s) for (let x = L; x < w / 2; x += s) {
        ctx.fillStyle = (Math.round((x - L) / s) + Math.round((y - T) / s)) % 2 ? '#1d1b22' : '#d6d2c8';
        ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
      lines(ctx, GOLD, line, () => ctx.rect(L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08));
      shape(ctx, '#7a1f2b', circle(ctx, 0, 0, Math.min(w, h) * 0.18), thin);
      lines(ctx, GOLD, thin, () => ctx.arc(0, 0, Math.min(w, h) * 0.12, 0, Math.PI * 2));
      break;
    }
    case 'bloodfountain': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#8d8a86', circle(ctx, 0, 0, r), line);
      shape(ctx, '#6a0f18', circle(ctx, 0, 0, r * 0.8), thin);
      lines(ctx, 'rgba(255, 120, 120, 0.4)', thin, () => (ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2), ctx.moveTo(r * 0.66, 0), ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2)));
      shape(ctx, '#8d8a86', circle(ctx, 0, 0, r * 0.24), thin);
      shape(ctx, '#9a1f2b', circle(ctx, 0, 0, r * 0.1), 0);
      break;
    }
    case 'vampcoffin':
      shape(ctx, '#2a1a22', () => {
        ctx.moveTo(-w * 0.2, T + c * 0.06);
        ctx.lineTo(w * 0.2, T + c * 0.06);
        ctx.lineTo(w * 0.36, T + h * 0.3);
        ctx.lineTo(w * 0.22, h / 2 - c * 0.06);
        ctx.lineTo(-w * 0.22, h / 2 - c * 0.06);
        ctx.lineTo(-w * 0.36, T + h * 0.3);
        ctx.closePath();
      }, line);
      shape(ctx, '#7a1f2b', () => {
        ctx.moveTo(-w * 0.13, T + c * 0.16);
        ctx.lineTo(w * 0.13, T + c * 0.16);
        ctx.lineTo(w * 0.26, T + h * 0.3);
        ctx.lineTo(w * 0.15, h / 2 - c * 0.16);
        ctx.lineTo(-w * 0.15, h / 2 - c * 0.16);
        ctx.lineTo(-w * 0.26, T + h * 0.3);
        ctx.closePath();
      }, thin);
      lines(ctx, GOLD, Math.max(1.5, c / 16), () => (ctx.moveTo(0, T + h * 0.22), ctx.lineTo(0, T + h * 0.5), ctx.moveTo(-w * 0.08, T + h * 0.3), ctx.lineTo(w * 0.08, T + h * 0.3)));
      break;
    case 'bloodthrone':
      shape(ctx, '#2a1a22', () => {
        ctx.moveTo(-c * 0.4, c * 0.38);
        ctx.lineTo(-c * 0.4, -c * 0.2);
        ctx.lineTo(-c * 0.24, -c * 0.46);
        ctx.lineTo(0, -c * 0.3);
        ctx.lineTo(c * 0.24, -c * 0.46);
        ctx.lineTo(c * 0.4, -c * 0.2);
        ctx.lineTo(c * 0.4, c * 0.38);
        ctx.closePath();
      }, line);
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.26, -c * 0.16, c * 0.52, c * 0.46, c * 0.06), thin);
      shape(ctx, GOLD, circle(ctx, 0, -c * 0.3, c * 0.05), 0);
      break;
    // ---- An underwater temple ----
    case 'merthrone':
      shape(ctx, '#e8d8c8', () => {
        ctx.moveTo(-c * 0.4, c * 0.36);
        for (let k = 0; k <= 6; k++) {
          const a = Math.PI + (k / 6) * Math.PI;
          ctx.lineTo(Math.cos(a) * c * 0.42, Math.sin(a) * c * 0.46 + c * 0.04);
        }
        ctx.lineTo(c * 0.4, c * 0.36);
        ctx.closePath();
      }, line);
      lines(ctx, '#c9a898', thin, () => {
        for (let k = 1; k < 6; k++) {
          const a = Math.PI + (k / 6) * Math.PI;
          ctx.moveTo(0, c * 0.2);
          ctx.lineTo(Math.cos(a) * c * 0.4, Math.sin(a) * c * 0.42 + c * 0.04);
        }
      });
      shape(ctx, '#3f7d97', rect(ctx, -c * 0.24, c * 0.0, c * 0.48, c * 0.3, c * 0.06), thin);
      shape(ctx, '#f0f0ff', circle(ctx, 0, -c * 0.3, c * 0.05), 0);
      break;
    case 'pearlclam':
      shape(ctx, '#8a8aa0', () => ctx.ellipse(0, c * 0.08, c * 0.4, c * 0.28, 0, 0, Math.PI * 2), line);
      shape(ctx, '#e8b8c8', () => ctx.ellipse(0, c * 0.08, c * 0.3, c * 0.18, 0, 0, Math.PI * 2), thin);
      glow(ctx, 0, c * 0.06, c * 0.3, 'rgba(255, 255, 255, 0.6)');
      shape(ctx, '#f8f6f0', circle(ctx, 0, c * 0.06, c * 0.08), thin);
      lines(ctx, '#6a6a80', thin, () => {
        for (let k = -2; k <= 2; k++) (ctx.moveTo(0, -c * 0.12), ctx.lineTo(k * c * 0.14, -c * 0.32));
      });
      break;
    case 'tridentstatue':
      shape(ctx, '#7a9a98', rect(ctx, -c * 0.34, -c * 0.34, c * 0.68, c * 0.68, c * 0.06), line);
      lines(ctx, GOLD, Math.max(2, c / 10), () => {
        ctx.moveTo(0, c * 0.3);
        ctx.lineTo(0, -c * 0.28);
        ctx.moveTo(-c * 0.16, -c * 0.28);
        ctx.lineTo(-c * 0.16, -c * 0.1);
        ctx.lineTo(c * 0.16, -c * 0.1);
        ctx.lineTo(c * 0.16, -c * 0.28);
      });
      shape(ctx, 'rgba(90, 160, 120, 0.6)', circle(ctx, -c * 0.22, c * 0.2, c * 0.08), 0);
      break;
    case 'conchhorn':
      shape(ctx, '#f0d8c0', () => {
        ctx.moveTo(-c * 0.36, c * 0.14);
        ctx.quadraticCurveTo(-c * 0.1, -c * 0.4, c * 0.36, -c * 0.1);
        ctx.quadraticCurveTo(c * 0.2, c * 0.3, -c * 0.36, c * 0.14);
      }, line);
      shape(ctx, CORAL, () => ctx.ellipse(c * 0.2, -c * 0.06, c * 0.12, c * 0.08, 0.4, 0, Math.PI * 2), thin);
      lines(ctx, '#c9a898', thin, () => {
        for (const k of [-0.2, -0.05, 0.1]) (ctx.moveTo(k * c, -c * 0.16), ctx.lineTo((k + 0.04) * c, c * 0.12));
      });
      break;
    default:
      drawSets16(ctx, p, w, h, c);
  }
}
