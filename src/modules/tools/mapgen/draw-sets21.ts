// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// An elven palace; an orc fortress; a sunken ship; a yeti's cave; a cultists' lair.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets22 } from './draw-sets22';

const DARK = '#2b2a2e';
const SILVER = '#c8d0d8';
const BONE = '#e8e2d0';
const ROT = '#4a5a4a';
const ICE = '#cfe6ee';

export const SET21_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  cultrobes: ['#5a1f2b', '#2a2a3a', '#3a4a2a'],
};
// Drawn once a cell when stretched.
export const SET21_TILED: Prop['kind'][] = ['skullpile', 'barnacles', 'icechunks', 'cultrobes'];

export function drawSets21(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- An elven palace ----
    case 'moonthrone':
      shape(ctx, '#e8eef4', () => {
        ctx.moveTo(-c * 0.38, c * 0.36);
        ctx.lineTo(-c * 0.38, -c * 0.1);
        ctx.quadraticCurveTo(-c * 0.38, -c * 0.46, 0, -c * 0.46);
        ctx.quadraticCurveTo(c * 0.38, -c * 0.46, c * 0.38, -c * 0.1);
        ctx.lineTo(c * 0.38, c * 0.36);
        ctx.closePath();
      }, line);
      shape(ctx, '#3f5d86', rect(ctx, -c * 0.24, -c * 0.06, c * 0.48, c * 0.36, c * 0.06), thin);
      glow(ctx, 0, -c * 0.3, c * 0.3, 'rgba(200, 220, 255, 0.6)');
      shape(ctx, SILVER, () => (ctx.arc(0, -c * 0.28, c * 0.1, Math.PI * 0.3, Math.PI * 1.7), ctx.arc(c * 0.04, -c * 0.28, c * 0.08, Math.PI * 1.6, Math.PI * 0.4, true)), 0);
      break;
    case 'silvertree': {
      // A pale tree growing inside the hall, its leaves faintly glowing.
      const r = Math.min(w, h) * 0.46;
      glow(ctx, 0, 0, r * 1.1, 'rgba(200, 230, 255, 0.4)');
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        shape(ctx, k % 2 ? '#d8e8f0' : '#b8d0e0', circle(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42), 0);
      }
      shape(ctx, '#e8f4fa', circle(ctx, 0, 0, r * 0.4), 0);
      lines(ctx, 'rgba(120, 140, 160, 0.6)', thin, () => ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2));
      shape(ctx, SILVER, circle(ctx, 0, 0, r * 0.12), thin);
      break;
    }
    case 'elvenlamp':
      lines(ctx, SILVER, Math.max(2, c / 14), () => (ctx.moveTo(0, c * 0.36), ctx.quadraticCurveTo(-c * 0.2, 0, 0, -c * 0.18)));
      glow(ctx, 0, -c * 0.22, c * 0.4, 'rgba(200, 230, 255, 0.7)');
      shape(ctx, '#e8f4ff', () => ctx.ellipse(0, -c * 0.24, c * 0.08, c * 0.12, 0, 0, Math.PI * 2), thin);
      break;
    case 'elvenfountain': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#e8eef4', () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, line);
      shape(ctx, '#7ab8d6', circle(ctx, 0, 0, r * 0.76), thin);
      lines(ctx, 'rgba(255, 255, 255, 0.5)', thin, () => (ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2), ctx.moveTo(r * 0.3, 0), ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2)));
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        shape(ctx, '#f0f4f8', () => ctx.ellipse(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14, r * 0.12, r * 0.05, a, 0, Math.PI * 2), thin);
      }
      break;
    }
    // ---- An orc fortress ----
    case 'orcthrone':
      shape(ctx, tone(WOOD, 0.3), rect(ctx, -c * 0.36, -c * 0.28, c * 0.72, c * 0.64, c * 0.04), line);
      for (let k = 0; k < 5; k++) shape(ctx, BONE, () => (ctx.moveTo(-c * 0.36 + k * c * 0.18, -c * 0.28), ctx.lineTo(-c * 0.3 + k * c * 0.18, -c * 0.48), ctx.lineTo(-c * 0.24 + k * c * 0.18, -c * 0.28), ctx.closePath()), thin);
      shape(ctx, '#6b5a3a', rect(ctx, -c * 0.24, -c * 0.12, c * 0.48, c * 0.4, c * 0.04), thin);
      lines(ctx, '#3a2a1c', thin, () => (ctx.moveTo(-c * 0.24, c * 0.08), ctx.lineTo(c * 0.24, c * 0.08)));
      shape(ctx, BONE, circle(ctx, 0, -c * 0.34, c * 0.08), thin);
      break;
    case 'skullpile':
      for (const [x, y] of [[-0.16, 0.12], [0.16, 0.12], [0, -0.12], [-0.28, -0.14], [0.28, -0.1]] as const) {
        shape(ctx, BONE, circle(ctx, x * c, y * c, c * 0.11), thin);
        for (const d of [-0.04, 0.04]) shape(ctx, DARK, circle(ctx, (x + d) * c, (y - 0.01) * c, c * 0.025), 0);
      }
      break;
    case 'wargpen':
      lines(ctx, tone(WOOD, 0.3), Math.max(3, c / 9), () => ctx.rect(L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2));
      for (let x = L + c * 0.1; x <= w / 2 - c * 0.1 + 1; x += c * 0.5) for (const y of [T + c * 0.1, h / 2 - c * 0.1]) shape(ctx, '#3a2a1c', circle(ctx, x, y, c * 0.07), 0);
      shape(ctx, '#4a3f36', () => ctx.ellipse(-w * 0.12, 0, c * 0.36, c * 0.18, 0.3, 0, Math.PI * 2), thin);
      shape(ctx, '#4a3f36', circle(ctx, -w * 0.12 + c * 0.34, -c * 0.06, c * 0.12), thin);
      shape(ctx, '#e0c040', circle(ctx, -w * 0.12 + c * 0.4, -c * 0.1, c * 0.025), 0);
      shape(ctx, BONE, rect(ctx, w * 0.14, c * 0.1, c * 0.3, c * 0.06, c * 0.03), thin);
      break;
    case 'spikedgate':
      // A gate of sharpened logs with iron spikes: put it in a wall gap.
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.04, -c * 0.2, w - c * 0.08, c * 0.4, c * 0.02), line);
      lines(ctx, '#3a2a1c', thin, () => {
        for (let x = L + c * 0.2; x < w / 2; x += c * 0.16) (ctx.moveTo(x, -c * 0.2), ctx.lineTo(x, c * 0.2));
      });
      for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.3) shape(ctx, '#8d949c', () => (ctx.moveTo(x - c * 0.05, c * 0.2), ctx.lineTo(x, c * 0.36), ctx.lineTo(x + c * 0.05, c * 0.2), ctx.closePath()), thin);
      break;
    // ---- A sunken ship ----
    case 'sunkenhull':
      // The broken half of a hull lying on the sea floor, overgrown.
      shape(ctx, 'rgba(10, 20, 30, 0.18)', () => ctx.ellipse(c * 0.1, c * 0.12, w * 0.3, h * 0.38, 0.2, 0, Math.PI * 2), 0);
      ctx.save();
      ctx.rotate(0.2);
      shape(ctx, '#4a3a2a', () => {
        ctx.moveTo(0, -h * 0.46);
        ctx.quadraticCurveTo(w * 0.42, -h * 0.2, w * 0.36, h * 0.3);
        ctx.lineTo(w * 0.2, h * 0.2);
        ctx.lineTo(w * 0.06, h * 0.36);
        ctx.lineTo(-w * 0.12, h * 0.22);
        ctx.lineTo(-w * 0.36, h * 0.3);
        ctx.quadraticCurveTo(-w * 0.42, -h * 0.2, 0, -h * 0.46);
      }, line);
      lines(ctx, '#2f241a', thin, () => {
        for (let y = -h * 0.3; y < h * 0.2; y += c * 0.3) (ctx.moveTo(-w * 0.3, y), ctx.lineTo(w * 0.3, y));
      });
      for (const [x, y] of [[-0.2, -0.1], [0.1, 0.1], [0.2, -0.2]] as const) shape(ctx, ROT, circle(ctx, x * w, y * h, c * 0.16), 0);
      lines(ctx, '#3a2a1c', Math.max(3, c / 8), () => (ctx.moveTo(0, -h * 0.1), ctx.lineTo(w * 0.1, h * 0.4)));
      ctx.restore();
      break;
    case 'barnacles':
      for (let k = 0; k < 7; k++) {
        const x = Math.cos(k * 2.3) * c * 0.3 * ((k % 3) / 3 + 0.3);
        const y = Math.sin(k * 2.3) * c * 0.3 * ((k % 3) / 3 + 0.3);
        shape(ctx, '#c9c2b0', circle(ctx, x, y, c * 0.07), thin);
        shape(ctx, '#5a5a52', circle(ctx, x, y, c * 0.025), 0);
      }
      break;
    case 'anchorchain':
      lines(ctx, '#4a4f55', Math.max(2, c / 14), () => {
        for (let x = L + c * 0.1; x < w / 2 - c * 0.1; x += c * 0.2) ctx.ellipse(x + c * 0.1, 0, c * 0.1, c * 0.06, 0, 0, Math.PI * 2);
      });
      break;
    case 'drownedchest':
      shape(ctx, '#4a3a2a', rect(ctx, -c * 0.32, -c * 0.22, c * 0.64, c * 0.44, c * 0.04), line);
      shape(ctx, '#3a2a1c', rect(ctx, -c * 0.32, -c * 0.34, c * 0.64, c * 0.14, c * 0.04), thin);
      shape(ctx, '#d4a640', circle(ctx, -c * 0.1, -c * 0.06, c * 0.05), 0);
      shape(ctx, '#d4a640', circle(ctx, c * 0.06, -c * 0.1, c * 0.04), 0);
      shape(ctx, ROT, circle(ctx, c * 0.24, c * 0.14, c * 0.1), 0);
      glow(ctx, 0, -c * 0.06, c * 0.3, 'rgba(255, 220, 120, 0.4)');
      break;
    // ---- A yeti's cave ----
    case 'yetibed':
      shape(ctx, '#d8d4c8', () => ctx.ellipse(0, 0, w * 0.44, h * 0.4, 0.2, 0, Math.PI * 2), line);
      lines(ctx, '#a8a498', thin, () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * w * 0.24, Math.sin(a) * h * 0.2);
          ctx.lineTo(Math.cos(a + 0.2) * w * 0.4, Math.sin(a + 0.2) * h * 0.36);
        }
      });
      shape(ctx, '#bcb8ac', () => ctx.ellipse(-c * 0.1, 0, w * 0.22, h * 0.18, 0.2, 0, Math.PI * 2), 0);
      break;
    case 'icechunks':
      for (const [x, y, s] of [[-0.18, -0.1, 0.18], [0.18, -0.06, 0.14], [0, 0.2, 0.15]] as const) {
        shape(ctx, ICE, () => {
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 + x * 4;
            ctx.lineTo(x * c + Math.cos(a) * s * c, y * c + Math.sin(a) * s * c);
          }
          ctx.closePath();
        }, thin);
        lines(ctx, 'rgba(255, 255, 255, 0.9)', thin, () => (ctx.moveTo((x - s * 0.4) * c, y * c), ctx.lineTo(x * c, (y - s * 0.5) * c)));
      }
      break;
    case 'mammothtusk':
      shape(ctx, '#efe2c4', () => {
        ctx.moveTo(L + c * 0.1, c * 0.2);
        ctx.quadraticCurveTo(0, -c * 0.5, w / 2 - c * 0.1, -c * 0.2);
        ctx.quadraticCurveTo(0, -c * 0.24, L + c * 0.1, c * 0.36);
        ctx.closePath();
      }, line);
      lines(ctx, '#c9b894', thin, () => {
        for (let k = 0.25; k < 0.9; k += 0.2) (ctx.moveTo(L + w * k, -c * 0.12 + Math.abs(k - 0.5) * c * 0.4), ctx.lineTo(L + w * k + c * 0.04, -c * 0.02 + Math.abs(k - 0.5) * c * 0.4));
      });
      break;
    case 'frozencarcass':
      shape(ctx, 'rgba(180, 225, 240, 0.85)', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.1), line);
      shape(ctx, 'rgba(110, 70, 50, 0.6)', () => ctx.ellipse(0, 0, w * 0.32, h * 0.26, 0, 0, Math.PI * 2), 0);
      lines(ctx, 'rgba(110, 70, 50, 0.6)', Math.max(3, c / 9), () => {
        for (const x of [-0.2, -0.06, 0.08, 0.22]) (ctx.moveTo(x * w, h * 0.2), ctx.lineTo(x * w, h * 0.38));
      });
      lines(ctx, 'rgba(255, 255, 255, 0.9)', thin, () => (ctx.moveTo(L + c * 0.3, h / 2 - c * 0.3), ctx.lineTo(L + c * 0.7, T + c * 0.3)));
      break;
    // ---- A cultists' lair ----
    case 'cultaltar':
      shape(ctx, '#2a2428', rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.04), line);
      lines(ctx, '#7a1f2b', Math.max(1.5, c / 16), () => {
        ctx.moveTo(-c * 0.2, 0);
        ctx.arc(0, 0, c * 0.2, Math.PI, Math.PI * 3);
        ctx.moveTo(0, -c * 0.2);
        ctx.lineTo(0, c * 0.2);
      });
      for (const x of [L + c * 0.24, w / 2 - c * 0.24]) {
        glow(ctx, x, -c * 0.16, c * 0.24, 'rgba(255, 170, 80, 0.6)');
        shape(ctx, '#2a2428', circle(ctx, x, -c * 0.16, c * 0.06), 0);
      }
      shape(ctx, 'rgba(120, 20, 30, 0.7)', () => ctx.ellipse(c * 0.3, c * 0.2, c * 0.14, c * 0.06, 0, 0, Math.PI * 2), 0);
      break;
    case 'bloodcircle': {
      const r = Math.min(w, h) * 0.44;
      glow(ctx, 0, 0, r, 'rgba(160, 20, 30, 0.35)');
      lines(ctx, '#8a1f24', Math.max(2, c / 12), () => {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        for (let k = 0; k < 3; k++) {
          const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
          const b = -Math.PI / 2 + ((k + 1) * Math.PI * 2) / 3;
          ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
        }
        ctx.moveTo(r * 0.3, 0);
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      });
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        shape(ctx, '#e8e2d0', circle(ctx, Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0, c * 0.05), thin);
      }
      break;
    }
    case 'sacrificeslab':
      shape(ctx, '#5a5458', rect(ctx, -c * 0.3, T + c * 0.06, c * 0.6, h - c * 0.12, c * 0.04), line);
      lines(ctx, '#3a3438', thin, () => (ctx.moveTo(-c * 0.3, 0), ctx.lineTo(c * 0.3, 0)));
      for (const y of [T + c * 0.3, h / 2 - c * 0.3]) for (const x of [-0.34, 0.34]) shape(ctx, '#55585e', circle(ctx, x * c, y, c * 0.05), thin);
      shape(ctx, 'rgba(120, 20, 30, 0.7)', () => ctx.ellipse(0, c * 0.2, c * 0.16, c * 0.3, 0, 0, Math.PI * 2), 0);
      break;
    case 'cultrobes': {
      // Hooded figures from above, in a row: stretch it.
      const col = tone(SET21_TINTS.cultrobes!, t);
      shape(ctx, col, () => ctx.ellipse(0, c * 0.04, c * 0.26, c * 0.22, 0, 0, Math.PI * 2), line);
      shape(ctx, 'rgba(0, 0, 0, 0.35)', circle(ctx, 0, -c * 0.02, c * 0.13), 0);
      shape(ctx, col, () => ctx.arc(0, -c * 0.02, c * 0.13, Math.PI * 0.9, Math.PI * 2.1), thin);
      glow(ctx, c * 0.18, c * 0.14, c * 0.16, 'rgba(255, 170, 80, 0.5)');
      break;
    }
    default:
      drawSets22(ctx, p, w, h, c);
  }
}
