// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Jungle and desert, a sailing ship (fantasy); a home and a street of today (modern); the wasteland after the fall.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const RUST = ['#8a4a2a', '#6f5a3a', '#7a3d22'];
const PAINT = ['#c9c2a8', '#3f5170', '#7a1f2b', '#5b6b3c', '#2b2a2e'];

export const SET4_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  sofa: CLOTH, bicycle: ['#b33a2e', '#3f5d86', '#2b2a2e', '#5fa04a'], wreck: RUST, shack: RUST, cactus: ['#4f7d4a', '#5f8a4a'],
  fridge: PAINT,
};
// Drawn once a cell when stretched.
export const SET4_TILED: Prop['kind'][] = ['vines', 'quicksand', 'tires', 'bigleaf'];

export function drawSets4(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- Jungle and desert ----
    case 'cactus': {
      const col = tone(SET4_TINTS.cactus!, t);
      shape(ctx, col, circle(ctx, 0, 0, c * 0.2), line);
      for (const [x, y] of [[-0.22, -0.08], [0.2, 0.06]] as const) shape(ctx, col, circle(ctx, x * c, y * c, c * 0.11), thin);
      lines(ctx, 'rgba(240, 240, 220, 0.8)', thin, () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.12, Math.sin(a) * c * 0.12);
          ctx.lineTo(Math.cos(a) * c * 0.22, Math.sin(a) * c * 0.22);
        }
      });
      shape(ctx, '#e86fa0', circle(ctx, 0, 0, c * 0.05), 0);
      break;
    }
    case 'skull':
      // A bull's skull bleached by the sun.
      shape(ctx, '#e8e2d0', () => {
        ctx.moveTo(-c * 0.14, -c * 0.12);
        ctx.lineTo(c * 0.14, -c * 0.12);
        ctx.lineTo(c * 0.08, c * 0.26);
        ctx.lineTo(-c * 0.08, c * 0.26);
        ctx.closePath();
      }, thin);
      lines(ctx, '#e8e2d0', Math.max(2, c / 12), () => {
        ctx.moveTo(-c * 0.12, -c * 0.1);
        ctx.quadraticCurveTo(-c * 0.36, -c * 0.12, -c * 0.38, -c * 0.32);
        ctx.moveTo(c * 0.12, -c * 0.1);
        ctx.quadraticCurveTo(c * 0.36, -c * 0.12, c * 0.38, -c * 0.32);
      });
      for (const x of [-0.06, 0.06]) shape(ctx, DARK, circle(ctx, x * c, -c * 0.02, c * 0.035), 0);
      break;
    case 'vines':
      lines(ctx, '#24401c', Math.max(2, c / 11), () => {
        ctx.moveTo(-c * 0.5, -c * 0.2);
        ctx.bezierCurveTo(-c * 0.2, -c * 0.4, c * 0.1, c * 0.1, c * 0.5, -c * 0.1);
        ctx.moveTo(-c * 0.4, c * 0.4);
        ctx.quadraticCurveTo(0, c * 0.1, c * 0.3, c * 0.45);
      });
      for (const [x, y] of [[-0.3, -0.26], [0, -0.06], [0.3, -0.06], [-0.1, 0.24], [0.2, 0.34]] as const)
        shape(ctx, '#5f8f3c', () => ctx.ellipse(x * c, y * c, c * 0.08, c * 0.05, x * 4, 0, Math.PI * 2), 0);
      break;
    case 'bigleaf':
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.rotate((k * Math.PI) / 2 + 0.4);
        shape(ctx, k % 2 ? '#3f7d33' : '#4f8f3c', () => ctx.ellipse(c * 0.22, 0, c * 0.24, c * 0.13, 0, 0, Math.PI * 2), thin);
        lines(ctx, 'rgba(20, 40, 15, 0.6)', thin, () => (ctx.moveTo(0, 0), ctx.lineTo(c * 0.44, 0)));
        ctx.restore();
      }
      break;
    case 'idolhead':
      // A head of a fallen statue, overgrown.
      shape(ctx, '#8a8476', rect(ctx, L + c * 0.12, T + c * 0.12, w - c * 0.24, h - c * 0.24, c * 0.2), line);
      shape(ctx, '#6b665d', rect(ctx, -c * 0.4, -c * 0.1, c * 0.24, c * 0.12, c * 0.04), thin);
      shape(ctx, '#6b665d', rect(ctx, c * 0.16, -c * 0.1, c * 0.24, c * 0.12, c * 0.04), thin);
      shape(ctx, '#6b665d', rect(ctx, -c * 0.08, c * 0.08, c * 0.16, c * 0.3, c * 0.04), thin);
      lines(ctx, '#4a463f', Math.max(1.5, c / 14), () => (ctx.moveTo(-c * 0.3, c * 0.5), ctx.lineTo(c * 0.3, c * 0.5)));
      lines(ctx, '#3f6a35', Math.max(1.5, c / 16), () => (ctx.moveTo(L + c * 0.2, T + c * 0.3), ctx.quadraticCurveTo(-c * 0.2, T + c * 0.6, L + c * 0.5, h / 2 - c * 0.2)));
      break;
    case 'quicksand':
      shape(ctx, '#c9a96a', () => ctx.ellipse(0, 0, c * 0.44, c * 0.4, 0, 0, Math.PI * 2), 0);
      lines(ctx, 'rgba(120, 90, 40, 0.5)', thin, () => {
        for (const r of [0.3, 0.18, 0.08]) ctx.ellipse(0, 0, c * r, c * r * 0.9, 0, 0, Math.PI * 2);
      });
      break;
    case 'joshua':
      // A desert tree of spiky tufts on bare arms.
      lines(ctx, '#7a6a4a', Math.max(2, c / 10), () => {
        for (const [x, y] of [[-0.3, -0.2], [0.28, -0.26], [0.1, 0.32], [-0.22, 0.26]] as const) (ctx.moveTo(0, 0), ctx.lineTo(x * c, y * c));
      });
      for (const [x, y] of [[-0.3, -0.2], [0.28, -0.26], [0.1, 0.32], [-0.22, 0.26]] as const) shape(ctx, '#6f8a4a', circle(ctx, x * c, y * c, c * 0.1), thin);
      break;
    // ---- A sailing ship ----
    case 'mast':
      lines(ctx, '#8a7046', thin, () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.48, Math.sin(a) * c * 0.48);
        }
      });
      shape(ctx, '#7a5432', circle(ctx, 0, 0, c * 0.2), line);
      lines(ctx, '#5c3d22', thin, () => ctx.arc(0, 0, c * 0.12, 0, Math.PI * 2));
      break;
    case 'helm':
      shape(ctx, tone(WOOD, 0.4), circle(ctx, 0, 0, c * 0.26), line);
      shape(ctx, '#6b4a2a', circle(ctx, 0, 0, c * 0.16), thin);
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.06, Math.sin(a) * c * 0.06);
          ctx.lineTo(Math.cos(a) * c * 0.4, Math.sin(a) * c * 0.4);
        }
      });
      shape(ctx, '#c9a442', circle(ctx, 0, 0, c * 0.06), thin);
      break;
    case 'cannon':
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.3, -c * 0.1, c * 0.6, h * 0.5, c * 0.04), line);
      for (const x of [-0.32, 0.32]) shape(ctx, '#3a2a1c', circle(ctx, x * c, h * 0.12, c * 0.1), thin);
      shape(ctx, DARK, rect(ctx, -c * 0.12, T + c * 0.04, c * 0.24, h * 0.6, c * 0.1), line);
      shape(ctx, '#111', circle(ctx, 0, T + c * 0.1, c * 0.06), 0);
      break;
    case 'hammock':
      lines(ctx, '#8a7046', thin, () => (ctx.moveTo(0, T), ctx.lineTo(0, T + c * 0.2), ctx.moveTo(0, h / 2), ctx.lineTo(0, h / 2 - c * 0.2)));
      shape(ctx, '#d8cdb3', () => ctx.ellipse(0, 0, w * 0.3, h / 2 - c * 0.2, 0, 0, Math.PI * 2), thin);
      lines(ctx, 'rgba(120, 100, 70, 0.5)', thin, () => {
        for (let y = T + c * 0.4; y < h / 2 - c * 0.3; y += c * 0.16) (ctx.moveTo(-w * 0.24, y), ctx.lineTo(w * 0.24, y));
      });
      break;
    case 'capstan':
      shape(ctx, tone(WOOD, 0.2), circle(ctx, 0, 0, c * 0.22), line);
      lines(ctx, '#5c3d22', Math.max(2, c / 10), () => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          ctx.moveTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2);
          ctx.lineTo(Math.cos(a) * c * 0.46, Math.sin(a) * c * 0.46);
        }
      });
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.08), thin);
      break;
    // ---- A home and a street of today ----
    case 'sofa':
      shape(ctx, tone(CLOTH, t), rect(ctx, L + c * 0.06, T + c * 0.14, w - c * 0.12, h - c * 0.24, c * 0.12), line);
      shape(ctx, 'rgba(0, 0, 0, 0.18)', rect(ctx, L + c * 0.06, T + c * 0.14, w - c * 0.12, c * 0.2, c * 0.1), 0);
      lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => {
        for (let x = L + c; x < w / 2 - c * 0.1; x += c) (ctx.moveTo(x, T + c * 0.36), ctx.lineTo(x, h / 2 - c * 0.12));
      });
      for (const x of [L + c * 0.06, w / 2 - c * 0.18]) shape(ctx, tone(CLOTH, t), rect(ctx, x, T + c * 0.14, c * 0.12, h - c * 0.24, c * 0.06), thin);
      break;
    case 'tv':
      shape(ctx, DARK, rect(ctx, -c * 0.4, -c * 0.08, c * 0.8, c * 0.1, c * 0.02), line);
      shape(ctx, '#55585e', rect(ctx, -c * 0.12, c * 0.02, c * 0.24, c * 0.1, c * 0.02), thin);
      glow(ctx, 0, c * 0.1, c * 0.4, 'rgba(120, 170, 255, 0.35)');
      break;
    case 'fridge':
      shape(ctx, tone(PAINT, t), rect(ctx, -c * 0.34, -c * 0.34, c * 0.68, c * 0.68, c * 0.06), line);
      lines(ctx, 'rgba(0, 0, 0, 0.35)', thin, () => (ctx.moveTo(-c * 0.34, c * 0.04), ctx.lineTo(c * 0.34, c * 0.04)));
      shape(ctx, '#8d949c', rect(ctx, c * 0.18, c * 0.1, c * 0.06, c * 0.18, c * 0.02), 0);
      break;
    case 'stove':
      shape(ctx, '#d6d6cf', rect(ctx, -c * 0.36, -c * 0.36, c * 0.72, c * 0.72, c * 0.04), line);
      for (const [x, y] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]] as const) {
        shape(ctx, DARK, circle(ctx, x * c, y * c, c * 0.11), thin);
        lines(ctx, '#8d949c', thin, () => ctx.arc(x * c, y * c, c * 0.06, 0, Math.PI * 2));
      }
      break;
    case 'computer':
      shape(ctx, tone(WOOD, 0.6), rect(ctx, L + c * 0.06, T + c * 0.12, w - c * 0.12, h - c * 0.24, c * 0.03), line);
      shape(ctx, DARK, rect(ctx, -c * 0.3, T + c * 0.18, c * 0.6, c * 0.08, c * 0.02), thin);
      glow(ctx, 0, T + c * 0.26, c * 0.3, 'rgba(120, 170, 255, 0.35)');
      shape(ctx, '#d6d6cf', rect(ctx, -c * 0.26, T + c * 0.38, c * 0.4, c * 0.14, c * 0.02), thin);
      shape(ctx, '#d6d6cf', () => ctx.ellipse(c * 0.3, T + c * 0.45, c * 0.05, c * 0.07, 0, 0, Math.PI * 2), thin);
      break;
    case 'washer':
      shape(ctx, '#e8e4dc', rect(ctx, -c * 0.34, -c * 0.34, c * 0.68, c * 0.68, c * 0.06), line);
      shape(ctx, '#8d949c', circle(ctx, 0, c * 0.04, c * 0.22), thin);
      shape(ctx, '#9fc3cc', circle(ctx, 0, c * 0.04, c * 0.15), thin);
      break;
    case 'bicycle': {
      const col = tone(SET4_TINTS.bicycle!, t);
      for (const y of [-0.3, 0.3]) shape(ctx, DARK, rect(ctx, -c * 0.04, y * c - c * 0.12, c * 0.08, c * 0.24, c * 0.04), 0);
      lines(ctx, col, Math.max(2, c / 12), () => (ctx.moveTo(0, -c * 0.3), ctx.lineTo(0, c * 0.3)));
      lines(ctx, DARK, Math.max(1.5, c / 16), () => (ctx.moveTo(-c * 0.16, -c * 0.24), ctx.lineTo(c * 0.16, -c * 0.24)));
      shape(ctx, DARK, rect(ctx, -c * 0.05, c * 0.04, c * 0.1, c * 0.12, c * 0.04), 0);
      break;
    }
    case 'cone':
      shape(ctx, '#e86f2e', circle(ctx, 0, 0, c * 0.2), line);
      lines(ctx, '#f6f1e4', Math.max(1.5, c / 14), () => ctx.arc(0, 0, c * 0.11, 0, Math.PI * 2));
      shape(ctx, '#e86f2e', circle(ctx, 0, 0, c * 0.05), 0);
      break;
    // ---- The wasteland ----
    case 'toxicbarrel':
      shape(ctx, '#a39a3a', circle(ctx, 0, 0, c * 0.3), line);
      lines(ctx, 'rgba(60, 50, 20, 0.6)', thin, () => ctx.arc(0, 0, c * 0.22, 0, Math.PI * 2));
      shape(ctx, DARK, () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 - Math.PI / 2;
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, c * 0.16, a - 0.45, a + 0.45);
          ctx.closePath();
        }
      }, 0);
      shape(ctx, '#a39a3a', circle(ctx, 0, 0, c * 0.04), 0);
      glow(ctx, c * 0.3, c * 0.3, c * 0.25, 'rgba(160, 255, 90, 0.5)');
      break;
    case 'wreck':
      shape(ctx, tone(RUST, t), rect(ctx, L + c * 0.16, T + c * 0.1, w - c * 0.32, h - c * 0.2, c * 0.3), line);
      shape(ctx, '#3a3029', rect(ctx, L + c * 0.28, T + h * 0.3, w - c * 0.56, h * 0.34, c * 0.1), thin);
      lines(ctx, 'rgba(30, 20, 10, 0.6)', thin, () => {
        ctx.moveTo(L + c * 0.3, T + c * 0.3);
        ctx.lineTo(L + c * 0.6, T + c * 0.5);
        ctx.moveTo(w / 2 - c * 0.3, h / 2 - c * 0.4);
        ctx.lineTo(w / 2 - c * 0.5, h / 2 - c * 0.2);
      });
      shape(ctx, DARK, rect(ctx, L + c * 0.04, h / 2 - c * 0.8, c * 0.16, c * 0.36, c * 0.06), thin);
      break;
    case 'tires':
      for (const [x, y] of [[-0.16, -0.12], [0.16, -0.08], [0, 0.18]] as const) {
        shape(ctx, DARK, circle(ctx, x * c, y * c, c * 0.16), thin);
        shape(ctx, '#4a4a48', circle(ctx, x * c, y * c, c * 0.08), 0);
      }
      break;
    case 'barricade':
      // One heap of scrap along its whole length: planks, sheets of tin, spikes.
      shape(ctx, '#6f5a3a', rect(ctx, L + c * 0.04, -c * 0.16, w - c * 0.08, c * 0.3, c * 0.04), line);
      for (let x = L + c * 0.2; x < w / 2 - c * 0.2; x += c * 0.5) {
        shape(ctx, (x / c) % 1 > 0.5 ? '#8d949c' : '#8a4a2a', () => {
          ctx.moveTo(x - c * 0.14, -c * 0.16);
          ctx.lineTo(x + c * 0.04, -c * 0.34);
          ctx.lineTo(x + c * 0.18, -c * 0.16);
          ctx.closePath();
        }, thin);
      }
      lines(ctx, IRON, thin, () => {
        for (let x = L + c * 0.1; x < w / 2 - c * 0.05; x += c * 0.1) (ctx.moveTo(x, -c * 0.16), ctx.lineTo(x + c * 0.05, c * 0.14));
      });
      break;
    case 'burnbarrel':
      shape(ctx, '#6f5a3a', circle(ctx, 0, 0, c * 0.26), line);
      shape(ctx, '#2a1a10', circle(ctx, 0, 0, c * 0.18), thin);
      glow(ctx, 0, 0, c * 0.45, 'rgba(255, 140, 40, 0.75)');
      shape(ctx, '#ffb84f', circle(ctx, 0, 0, c * 0.08), 0);
      break;
    case 'radsign':
      shape(ctx, IRON, rect(ctx, -c * 0.04, c * 0.0, c * 0.08, c * 0.36), thin);
      shape(ctx, '#e8c14a', () => {
        ctx.moveTo(0, -c * 0.36);
        ctx.lineTo(c * 0.3, c * 0.14);
        ctx.lineTo(-c * 0.3, c * 0.14);
        ctx.closePath();
      }, line);
      shape(ctx, DARK, () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 - Math.PI / 2;
          ctx.moveTo(0, -c * 0.02);
          ctx.arc(0, -c * 0.02, c * 0.12, a - 0.45, a + 0.45);
          ctx.closePath();
        }
      }, 0);
      break;
    case 'shack':
      shape(ctx, tone(RUST, t), rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.02), line);
      lines(ctx, 'rgba(30, 20, 10, 0.5)', thin, () => {
        for (let x = L + c * 0.24; x < w / 2 - c * 0.1; x += c * 0.16) (ctx.moveTo(x, T + c * 0.08), ctx.lineTo(x, h / 2 - c * 0.08));
      });
      for (const [x, y] of [[-0.3, -0.2], [0.24, 0.3]] as const) shape(ctx, '#8d949c', rect(ctx, x * c, y * c, c * 0.32, c * 0.22, c * 0.02), thin);
      break;
  }
}
