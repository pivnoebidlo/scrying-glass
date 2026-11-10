// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Steampunk: an inventor's laboratory; a steam city's street.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets24 } from './draw-sets24';

const DARK = '#2b2a2e';
const BRASS = '#c49b48';
const COPPER = '#c97a3a';
const IRON = '#4a4f55';
const PAINT = ['#2f4a3a', '#5a1f2b', '#2a3a5a', '#3a3530'];

export const SET23_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  steamcar: PAINT, steamtram: PAINT,
};
// Drawn once a cell when stretched.
export const SET23_TILED: Prop['kind'][] = [];

// A cog: teeth round a ring with a hub.
function cog(ctx: Ctx, x: number, y: number, r: number, col: string, line: number) {
  shape(ctx, col, () => {
    const n = Math.max(8, Math.round(r / 3));
    for (let k = 0; k < n * 2; k++) {
      const a = (k / (n * 2)) * Math.PI * 2;
      const rr = k % 2 ? r : r * 0.8;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }, line);
  shape(ctx, 'rgba(0, 0, 0, 0.35)', circle(ctx, x, y, r * 0.3), 0);
}

export function drawSets23(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- An inventor's laboratory ----
    case 'diffengine':
      // A calculating engine: columns of brass number wheels and a crank.
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.2, c * 0.04), line);
      for (let x = L + c * 0.3; x < w / 2 - c * 0.25; x += c * 0.3) for (let y = T + c * 0.3; y < h / 2 - c * 0.2; y += c * 0.3) {
        shape(ctx, BRASS, circle(ctx, x, y, c * 0.12), thin);
        shape(ctx, '#8a6a2a', circle(ctx, x, y, c * 0.04), 0);
      }
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(w / 2 - c * 0.12, 0), ctx.lineTo(w / 2 + c * 0.1, 0), ctx.lineTo(w / 2 + c * 0.1, c * 0.2)));
      break;
    case 'pneumatictubes':
      // Message tubes running along a wall: put them on the wall.
      for (const [y, col] of [[-0.14, BRASS], [0, COPPER], [0.14, BRASS]] as const) {
        lines(ctx, col, Math.max(3, c / 9), () => (ctx.moveTo(L + c * 0.04, y * c), ctx.lineTo(w / 2 - c * 0.04, y * c)));
        lines(ctx, 'rgba(255, 255, 255, 0.35)', thin, () => (ctx.moveTo(L + c * 0.04, y * c - c * 0.02), ctx.lineTo(w / 2 - c * 0.04, y * c - c * 0.02)));
      }
      for (let x = L + c * 0.5; x < w / 2; x += c) shape(ctx, IRON, rect(ctx, x - c * 0.05, -c * 0.22, c * 0.1, c * 0.44, c * 0.02), 0);
      break;
    case 'brassdiver':
      // A diving suit with a round brass helmet, on its stand.
      shape(ctx, '#7a6a52', () => ctx.ellipse(0, c * 0.08, c * 0.26, c * 0.2, 0, 0, Math.PI * 2), line);
      shape(ctx, BRASS, circle(ctx, 0, -c * 0.12, c * 0.2), line);
      for (const [x, y] of [[0, -0.12], [-0.12, -0.14], [0.12, -0.14]] as const) {
        shape(ctx, '#3a4a58', circle(ctx, x * c, y * c, c * 0.05), thin);
      }
      for (let k = 0; k < 8; k++) shape(ctx, '#8a6a2a', circle(ctx, Math.cos(k * 0.785) * c * 0.2, -c * 0.12 + Math.sin(k * 0.785) * c * 0.2, c * 0.015), 0);
      lines(ctx, '#3a3530', Math.max(2, c / 14), () => (ctx.moveTo(c * 0.18, -c * 0.04), ctx.quadraticCurveTo(c * 0.4, c * 0.1, c * 0.36, c * 0.36)));
      break;
    case 'gearwall':
      // Great cogs turning in a wall: put it on the wall.
      cog(ctx, L + c * 0.4, 0, c * 0.32, BRASS, line);
      cog(ctx, L + c * 0.88, -c * 0.06, c * 0.2, COPPER, thin);
      if (w > c * 1.5) cog(ctx, w / 2 - c * 0.4, c * 0.04, c * 0.28, BRASS, line);
      break;
    case 'dynamo':
      shape(ctx, IRON, rect(ctx, L + c * 0.08, -c * 0.32, w - c * 0.16, c * 0.64, c * 0.06), line);
      shape(ctx, COPPER, () => ctx.ellipse(-w * 0.12, 0, w * 0.22, c * 0.26, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#8a4a22', thin, () => {
        for (let x = -w * 0.3; x < w * 0.08; x += c * 0.06) (ctx.moveTo(x, -c * 0.24), ctx.lineTo(x, c * 0.24));
      });
      cog(ctx, w * 0.26, 0, c * 0.2, BRASS, thin);
      glow(ctx, -w * 0.12, 0, c * 0.4, 'rgba(160, 200, 255, 0.4)');
      lines(ctx, '#bfe4ff', thin, () => (ctx.moveTo(-w * 0.2, -c * 0.34), ctx.lineTo(-w * 0.14, -c * 0.44), ctx.lineTo(-w * 0.08, -c * 0.36)));
      break;
    // ---- A steam city's street ----
    case 'gaslamp':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.12), line);
      glow(ctx, 0, 0, c * 0.5, 'rgba(255, 210, 130, 0.6)');
      shape(ctx, '#ffe2a0', () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * c * 0.1, Math.sin(a) * c * 0.1);
        }
        ctx.closePath();
      }, thin);
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.03), 0);
      break;
    case 'pennyfarthing':
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(0, -c * 0.4), ctx.lineTo(0, c * 0.3)));
      lines(ctx, '#1d1b1e', Math.max(3, c / 10), () => (ctx.moveTo(-c * 0.04, -c * 0.36), ctx.lineTo(c * 0.04, -c * 0.36), ctx.moveTo(-c * 0.03, c * 0.3), ctx.lineTo(c * 0.03, c * 0.3)));
      lines(ctx, IRON, Math.max(2, c / 14), () => (ctx.moveTo(-c * 0.16, -c * 0.12), ctx.lineTo(c * 0.16, -c * 0.12)));
      shape(ctx, '#5c3d22', () => ctx.ellipse(0, -c * 0.02, c * 0.05, c * 0.08, 0, 0, Math.PI * 2), thin);
      break;
    case 'steamcar': {
      const col = tone(PAINT, t);
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.3, h - c * 0.26, c * 0.2), 0);
      for (const x of [L + c * 0.14, w / 2 - c * 0.26]) for (const y of [T + c * 0.4, h / 2 - c * 0.5]) shape(ctx, '#1d1b1e', rect(ctx, x, y - c * 0.12, c * 0.12, c * 0.3, c * 0.04), 0);
      shape(ctx, col, rect(ctx, L + c * 0.2, T + c * 0.1, w - c * 0.4, h - c * 0.2, c * 0.16), line);
      shape(ctx, BRASS, circle(ctx, 0, T + c * 0.36, c * 0.18), thin);
      shape(ctx, IRON, circle(ctx, 0, T + c * 0.36, c * 0.08), 0);
      shape(ctx, '#7a1f2b', rect(ctx, L + c * 0.3, -c * 0.04, w - c * 0.6, h * 0.32, c * 0.08), thin);
      shape(ctx, 'rgba(200, 200, 190, 0.45)', circle(ctx, c * 0.06, T - c * 0.02, c * 0.14), 0);
      break;
    }
    case 'steamtram': {
      // A tram car with a boiler at the front: stretch it along its rails.
      const col = tone(PAINT, t);
      lines(ctx, IRON, Math.max(2, c / 14), () => {
        for (const x of [-c * 0.3, c * 0.3]) (ctx.moveTo(x, T), ctx.lineTo(x, h / 2));
      });
      shape(ctx, col, rect(ctx, -c * 0.42, T + c * 0.1, c * 0.84, h - c * 0.2, c * 0.1), line);
      shape(ctx, '#d8c8a0', rect(ctx, -c * 0.34, T + c * 0.6, c * 0.68, h - c * 0.8, c * 0.04), thin);
      for (let y = T + c * 0.8; y < h / 2 - c * 0.3; y += c * 0.4) shape(ctx, tone(WOOD, 0.4), rect(ctx, -c * 0.28, y, c * 0.56, c * 0.14, c * 0.03), 0);
      shape(ctx, IRON, circle(ctx, 0, T + c * 0.32, c * 0.2), thin);
      shape(ctx, BRASS, circle(ctx, 0, T + c * 0.32, c * 0.08), 0);
      break;
    }
    case 'ornithopter':
      // A flapping-wing flying machine, wings spread.
      for (const s of [-1, 1]) {
        shape(ctx, 'rgba(230, 220, 190, 0.9)', () => {
          ctx.moveTo(s * c * 0.12, -c * 0.06);
          ctx.quadraticCurveTo(s * w * 0.3, -h * 0.42, s * w * 0.48, -h * 0.1);
          ctx.lineTo(s * w * 0.38, h * 0.0);
          ctx.lineTo(s * w * 0.28, -h * 0.04);
          ctx.lineTo(s * w * 0.18, h * 0.06);
          ctx.lineTo(s * c * 0.12, c * 0.06);
          ctx.closePath();
        }, thin);
        lines(ctx, tone(WOOD, 0.4), thin, () => {
          for (const k of [0.2, 0.32, 0.44]) (ctx.moveTo(s * c * 0.12, 0), ctx.lineTo(s * w * k, -h * (0.3 - k * 0.4)));
        });
      }
      shape(ctx, tone(WOOD, 0.5), () => ctx.ellipse(0, 0, c * 0.16, h * 0.38, 0, 0, Math.PI * 2), line);
      shape(ctx, BRASS, circle(ctx, 0, -h * 0.18, c * 0.09), thin);
      shape(ctx, tone(WOOD, 0.4), () => (ctx.moveTo(0, h * 0.3), ctx.lineTo(-c * 0.2, h * 0.46), ctx.lineTo(c * 0.2, h * 0.46), ctx.closePath()), thin);
      break;
    case 'smokestack': {
      // A factory chimney of brick, smoke rising.
      const r = Math.min(w, h) * 0.36;
      shape(ctx, '#8a4a3a', circle(ctx, 0, 0, r), line);
      lines(ctx, '#6a3a2a', thin, () => (ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2)));
      shape(ctx, '#1d1b1e', circle(ctx, 0, 0, r * 0.6), 0);
      for (const [x, y, s] of [[0.1, -0.1, 0.5], [0.4, -0.3, 0.42], [0.7, -0.5, 0.34]] as const) shape(ctx, 'rgba(90, 85, 80, 0.45)', circle(ctx, x * c, y * c, s * c), 0);
      break;
    }
    default:
      drawSets24(ctx, p, w, h, c);
  }
}
