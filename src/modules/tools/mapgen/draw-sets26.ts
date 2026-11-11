// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// The Wild West: a saloon; a bank; a sheriff's office; a railway station; the open range.
import type { Prop } from './furnish';
import { circle, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const DARK = '#2b2a2e';
const IRON = '#4a4f55';
const BRASS = '#c49b48';
const GOLD = '#d4a640';
const BONE = '#e8e2d0';
const CANVAS = '#e8dcc0';

export const SET26_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  railcar: ['#7a3d22', '#5a2a1a', '#3a4a5a'],
};
// Drawn once a cell when stretched.
export const SET26_TILED: Prop['kind'][] = ['tumbleweed', 'moneybags'];

export function drawSets26(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A saloon ----
    case 'saloondoors':
      // Swinging half-doors: put them in the doorway.
      for (const s of [-1, 1]) {
        shape(ctx, tone(WOOD, 0.5), rect(ctx, s < 0 ? L + c * 0.06 : c * 0.02, -c * 0.08, w / 2 - c * 0.08, c * 0.16, c * 0.03), line);
        lines(ctx, tone(WOOD, 0.3), thin, () => {
          for (let k = 1; k < 4; k++) {
            const x = (s < 0 ? L + c * 0.06 : c * 0.02) + (k * (w / 2 - c * 0.08)) / 4;
            ctx.moveTo(x, -c * 0.08);
            ctx.lineTo(x, c * 0.08);
          }
        });
      }
      for (const x of [L + c * 0.04, w / 2 - c * 0.04]) shape(ctx, IRON, circle(ctx, x, 0, c * 0.04), 0);
      break;
    case 'saloonbar':
      shape(ctx, tone(WOOD, 0.35), rect(ctx, L + c * 0.06, -c * 0.32, w - c * 0.12, c * 0.4, c * 0.04), line);
      lines(ctx, BRASS, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.1, c * 0.14), ctx.lineTo(w / 2 - c * 0.1, c * 0.14)));
      for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.55) {
        shape(ctx, 'rgba(200, 160, 80, 0.85)', circle(ctx, x, -c * 0.14, c * 0.06), thin);
        shape(ctx, '#3a2a1a', circle(ctx, x + c * 0.2, -c * 0.18, c * 0.05), 0);
        shape(ctx, '#7a3d22', circle(ctx, x + c * 0.1, c * 0.34, c * 0.11), thin);
      }
      break;
    case 'spittoon':
      shape(ctx, BRASS, circle(ctx, 0, 0, c * 0.18), line);
      shape(ctx, '#7a5a2a', circle(ctx, 0, 0, c * 0.1), 0);
      shape(ctx, 'rgba(255, 255, 255, 0.35)', circle(ctx, -c * 0.06, -c * 0.06, c * 0.04), 0);
      break;
    case 'faro':
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.06), line);
      shape(ctx, '#2f6a3a', rect(ctx, L + c * 0.18, T + c * 0.18, w - c * 0.36, h - c * 0.36, c * 0.04), thin);
      for (const [x, y, a] of [[-0.2, -0.1, 0.2], [0.0, -0.12, -0.1], [0.2, -0.08, 0.3], [0.1, 0.16, -0.4]] as const) {
        ctx.save();
        ctx.translate(x * w, y * h);
        ctx.rotate(a);
        shape(ctx, '#efe7d3', rect(ctx, -c * 0.06, -c * 0.09, c * 0.12, c * 0.18, c * 0.02), thin);
        ctx.restore();
      }
      for (const [x, y] of [[-0.3, 0.2], [-0.26, 0.24], [0.3, -0.24]] as const) shape(ctx, GOLD, circle(ctx, x * w, y * h, c * 0.05), thin);
      break;
    case 'wantedboard':
      // Wanted posters on a board: put it on the wall.
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.04, -c * 0.18, w - c * 0.08, c * 0.36, c * 0.02), line);
      for (let x = L + c * 0.24; x < w / 2 - c * 0.1; x += c * 0.36) {
        shape(ctx, '#e8d8b0', rect(ctx, x - c * 0.12, -c * 0.14, c * 0.24, c * 0.28, c * 0.01), thin);
        shape(ctx, '#7a6a52', circle(ctx, x, -c * 0.04, c * 0.06), 0);
        lines(ctx, DARK, thin, () => (ctx.moveTo(x - c * 0.08, -c * 0.11), ctx.lineTo(x + c * 0.08, -c * 0.11), ctx.moveTo(x - c * 0.06, c * 0.08), ctx.lineTo(x + c * 0.06, c * 0.08)));
      }
      break;
    // ---- A bank ----
    case 'bankcounter':
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.04, -c * 0.24, w - c * 0.08, c * 0.48, c * 0.04), line);
      lines(ctx, BRASS, Math.max(1.5, c / 16), () => {
        for (let x = L + c * 0.12; x < w / 2 - c * 0.08; x += c * 0.1) (ctx.moveTo(x, -c * 0.24), ctx.lineTo(x, -c * 0.06));
        ctx.moveTo(L + c * 0.04, -c * 0.06);
        ctx.lineTo(w / 2 - c * 0.04, -c * 0.06);
      });
      for (let x = L + c * 0.5; x < w / 2 - c * 0.3; x += c) shape(ctx, '#1d1b1e', rect(ctx, x - c * 0.14, -c * 0.24, c * 0.28, c * 0.18), 0);
      break;
    case 'moneybags':
      for (const [x, y] of [[-0.16, -0.08], [0.16, -0.04], [0, 0.18]] as const) {
        shape(ctx, CANVAS, circle(ctx, x * c, y * c, c * 0.14), thin);
        lines(ctx, '#7a5432', Math.max(1.5, c / 18), () => (ctx.moveTo((x - 0.05) * c, (y - 0.12) * c), ctx.lineTo((x + 0.05) * c, (y - 0.12) * c)));
        shape(ctx, '#3f6a3a', rect(ctx, (x - 0.04) * c, (y - 0.03) * c, c * 0.08, c * 0.06), 0);
      }
      break;
    case 'bankvault': {
      // A round vault door with a wheel: put it in the wall.
      const r = Math.min(w, h) * 0.46;
      shape(ctx, IRON, circle(ctx, 0, 0, r), line);
      shape(ctx, '#6a7078', circle(ctx, 0, 0, r * 0.8), thin);
      lines(ctx, BRASS, Math.max(2, c / 10), () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI;
          ctx.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
          ctx.lineTo(-Math.cos(a) * r * 0.4, -Math.sin(a) * r * 0.4);
        }
      });
      shape(ctx, BRASS, circle(ctx, 0, 0, r * 0.12), thin);
      for (let k = 0; k < 12; k++) shape(ctx, '#3a3d42', circle(ctx, Math.cos((k * Math.PI) / 6) * r * 0.9, Math.sin((k * Math.PI) / 6) * r * 0.9, c * 0.03), 0);
      break;
    }
    // ---- A sheriff's office ----
    case 'jailcell':
      // A barred cell with a cot and a bucket.
      shape(ctx, 'rgba(60, 50, 40, 0.25)', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08), 0);
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.14, T + c * 0.14, c * 0.4, h - c * 0.6, c * 0.03), thin);
      shape(ctx, '#7a6a52', circle(ctx, w / 2 - c * 0.3, T + c * 0.3, c * 0.1), thin);
      lines(ctx, IRON, Math.max(2, c / 14), () => {
        ctx.rect(L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08);
        for (let x = L + c * 0.16; x < w / 2 - c * 0.04; x += c * 0.14) (ctx.moveTo(x, h / 2 - c * 0.04), ctx.lineTo(x, h / 2 - c * 0.2));
      });
      shape(ctx, IRON, rect(ctx, -c * 0.06, h / 2 - c * 0.12, c * 0.12, c * 0.08), 0);
      break;
    case 'sheriffdesk':
      shape(ctx, tone(WOOD, 0.5), rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.03), line);
      shape(ctx, GOLD, () => {
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          const rr = k % 2 ? c * 0.05 : c * 0.11;
          ctx.lineTo(-c * 0.2 + Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
      }, thin);
      shape(ctx, '#e8d8b0', rect(ctx, c * 0.04, -c * 0.18, c * 0.3, c * 0.24, c * 0.01), thin);
      shape(ctx, '#5c3d22', () => ctx.ellipse(w / 2 - c * 0.3, c * 0.12, c * 0.16, c * 0.09, 0, 0, Math.PI * 2), thin);
      break;
    case 'gunrack':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.04, -c * 0.1, w - c * 0.08, c * 0.2, c * 0.02), line);
      for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.24) {
        lines(ctx, '#3a3d42', Math.max(2, c / 14), () => (ctx.moveTo(x, -c * 0.38), ctx.lineTo(x, c * 0.1)));
        shape(ctx, '#6b4a2a', rect(ctx, x - c * 0.05, c * 0.08, c * 0.1, c * 0.28, c * 0.03), thin);
      }
      break;
    // ---- A railway station ----
    case 'locomotive': {
      // A steam engine, chimney at the front: stretch it along the rails.
      lines(ctx, IRON, Math.max(2, c / 14), () => {
        for (const x of [-c * 0.3, c * 0.3]) (ctx.moveTo(x, T), ctx.lineTo(x, h / 2));
      });
      shape(ctx, '#1d1b1e', rect(ctx, -c * 0.38, T + c * 0.2, c * 0.76, h - c * 0.3, c * 0.08), line);
      shape(ctx, '#2a2c30', () => ctx.ellipse(0, T + h * 0.38, c * 0.3, h * 0.3, 0, 0, Math.PI * 2), thin);
      for (let y = T + h * 0.18; y < T + h * 0.62; y += c * 0.5) lines(ctx, BRASS, Math.max(1.5, c / 16), () => (ctx.moveTo(-c * 0.28, y), ctx.lineTo(c * 0.28, y)));
      shape(ctx, '#3a3d42', circle(ctx, 0, T + c * 0.36, c * 0.14), thin);
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.4, h / 2 - h * 0.3, c * 0.8, h * 0.26, c * 0.06), thin);
      shape(ctx, '#b33a2e', () => (ctx.moveTo(-c * 0.36, T + c * 0.2), ctx.lineTo(0, T), ctx.lineTo(c * 0.36, T + c * 0.2), ctx.closePath()), thin);
      shape(ctx, 'rgba(220, 220, 215, 0.45)', circle(ctx, c * 0.2, T + c * 0.2, c * 0.24), 0);
      break;
    }
    case 'railcar': {
      const col = tone(SET26_TINTS.railcar!, t);
      lines(ctx, IRON, Math.max(2, c / 14), () => {
        for (const x of [-c * 0.3, c * 0.3]) (ctx.moveTo(x, T), ctx.lineTo(x, h / 2));
      });
      shape(ctx, col, rect(ctx, -c * 0.4, T + c * 0.1, c * 0.8, h - c * 0.2, c * 0.04), line);
      lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => {
        for (let y = T + c * 0.3; y < h / 2 - c * 0.1; y += c * 0.2) (ctx.moveTo(-c * 0.4, y), ctx.lineTo(c * 0.4, y));
      });
      break;
    }
    case 'watertower':
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, tone(WOOD, 0.3), rect(ctx, x * w * 0.36 - c * 0.06, y * h * 0.36 - c * 0.06, c * 0.12, c * 0.12), 0);
      shape(ctx, tone(WOOD, 0.55), circle(ctx, 0, 0, Math.min(w, h) * 0.38), line);
      lines(ctx, IRON, Math.max(1.5, c / 16), () => {
        for (const k of [0.24, 0.32]) (ctx.moveTo(Math.min(w, h) * k, 0), ctx.arc(0, 0, Math.min(w, h) * k, 0, Math.PI * 2));
      });
      shape(ctx, '#3a4a58', circle(ctx, 0, 0, Math.min(w, h) * 0.1), 0);
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(Math.min(w, h) * 0.38, 0), ctx.lineTo(w / 2, c * 0.2)));
      break;
    case 'stationplatform':
      shape(ctx, tone(WOOD, 0.7), rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08), line);
      lines(ctx, 'rgba(60, 40, 20, 0.4)', thin, () => {
        for (let y = T + c * 0.2; y < h / 2; y += c * 0.2) (ctx.moveTo(L + c * 0.04, y), ctx.lineTo(w / 2 - c * 0.04, y));
      });
      shape(ctx, '#efe7d3', rect(ctx, -c * 0.4, T + c * 0.14, c * 0.8, c * 0.2, c * 0.02), thin);
      lines(ctx, DARK, thin, () => (ctx.moveTo(-c * 0.3, T + c * 0.24), ctx.lineTo(c * 0.3, T + c * 0.24)));
      break;
    // ---- The open range ----
    case 'coveredwagon':
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, -c * 0.3, T + c * 0.2, c * 0.76, h - c * 0.3, c * 0.2), 0);
      for (const y of [T + c * 0.5, h / 2 - c * 0.5]) for (const x of [-0.44, 0.44]) shape(ctx, '#5c3d22', rect(ctx, x * c - c * 0.05, y - c * 0.2, c * 0.1, c * 0.4, c * 0.03), 0);
      shape(ctx, CANVAS, rect(ctx, -c * 0.38, T + c * 0.14, c * 0.76, h - c * 0.36, c * 0.3), line);
      lines(ctx, '#b8a888', thin, () => {
        for (let y = T + c * 0.4; y < h / 2 - c * 0.3; y += c * 0.3) (ctx.moveTo(-c * 0.38, y), ctx.lineTo(c * 0.38, y));
      });
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(0, h / 2 - c * 0.22), ctx.lineTo(0, h / 2)));
      break;
    case 'hitchpost':
      lines(ctx, tone(WOOD, 0.4), Math.max(3, c / 9), () => (ctx.moveTo(L + c * 0.1, 0), ctx.lineTo(w / 2 - c * 0.1, 0)));
      for (const x of [L + c * 0.14, w / 2 - c * 0.14]) shape(ctx, tone(WOOD, 0.3), circle(ctx, x, 0, c * 0.08), thin);
      lines(ctx, '#7a5432', thin, () => (ctx.moveTo(-c * 0.1, 0), ctx.quadraticCurveTo(-c * 0.06, c * 0.2, c * 0.06, c * 0.3)));
      break;
    case 'tumbleweed':
      shape(ctx, 'rgba(160, 130, 80, 0.4)', circle(ctx, 0, 0, c * 0.24), 0);
      lines(ctx, '#8a6a3a', thin, () => {
        for (let k = 0; k < 9; k++) {
          const a = k * 1.9;
          ctx.moveTo(Math.cos(a) * c * 0.22, Math.sin(a) * c * 0.22);
          ctx.quadraticCurveTo(0, 0, Math.cos(a + 2.2) * c * 0.22, Math.sin(a + 2.2) * c * 0.22);
        }
      });
      break;
    case 'cattleskull':
      shape(ctx, BONE, () => ctx.ellipse(0, c * 0.06, c * 0.1, c * 0.18, 0, 0, Math.PI * 2), thin);
      lines(ctx, BONE, Math.max(3, c / 10), () => (ctx.moveTo(-c * 0.06, -c * 0.06), ctx.quadraticCurveTo(-c * 0.3, -c * 0.1, -c * 0.34, -c * 0.28), ctx.moveTo(c * 0.06, -c * 0.06), ctx.quadraticCurveTo(c * 0.3, -c * 0.1, c * 0.34, -c * 0.28)));
      for (const x of [-0.04, 0.04]) shape(ctx, DARK, circle(ctx, x * c, 0, c * 0.025), 0);
      break;
    case 'windpump': {
      const r = Math.min(w, h) * 0.44;
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) lines(ctx, IRON, thin, () => (ctx.moveTo(0, 0), ctx.lineTo(x * r * 0.5, y * r * 0.5)));
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        shape(ctx, '#d6d2c8', () => (ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2), ctx.lineTo(Math.cos(a - 0.12) * r, Math.sin(a - 0.12) * r), ctx.lineTo(Math.cos(a + 0.1) * r, Math.sin(a + 0.1) * r), ctx.closePath()), thin);
      }
      shape(ctx, IRON, circle(ctx, 0, 0, r * 0.14), thin);
      shape(ctx, '#b33a2e', () => (ctx.moveTo(0, 0), ctx.lineTo(r * 0.9, r * 0.2), ctx.lineTo(r * 0.9, -r * 0.1), ctx.closePath()), thin);
      break;
    }
  }
}
