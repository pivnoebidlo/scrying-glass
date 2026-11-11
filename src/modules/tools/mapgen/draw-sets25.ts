// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Steampunk: an airship station; a steam factory.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets26 } from './draw-sets26';

const BRASS = '#c49b48';
const COPPER = '#c97a3a';
const IRON = '#4a4f55';
const DARK = '#2b2a2e';

export const SET25_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  luggagecart: ['#7a3d22', '#2f4a3a', '#5a1f2b'],
};
// Drawn once a cell when stretched.
export const SET25_TILED: Prop['kind'][] = [];

export function drawSets25(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- An airship station ----
    case 'mooringtower': {
      // A lattice mast with a ring at the top for a dirigible's nose.
      const r = Math.min(w, h) * 0.44;
      shape(ctx, IRON, () => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, line);
      lines(ctx, '#6a7078', thin, () => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.lineTo(Math.cos(a + Math.PI) * r, Math.sin(a + Math.PI) * r);
        }
      });
      shape(ctx, BRASS, circle(ctx, 0, 0, r * 0.36), line);
      shape(ctx, IRON, circle(ctx, 0, 0, r * 0.18), 0);
      lines(ctx, '#c9b38a', thin, () => (ctx.moveTo(0, 0), ctx.lineTo(r * 1.1, -r * 0.6)));
      break;
    }
    case 'passengerdeck':
      // A wooden boarding deck with a brass rail: stretch it along the berth.
      shape(ctx, tone(WOOD, 0.6), rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08, c * 0.02), line);
      lines(ctx, 'rgba(60, 40, 20, 0.45)', thin, () => {
        for (let x = L + c * 0.2; x < w / 2; x += c * 0.2) (ctx.moveTo(x, T + c * 0.04), ctx.lineTo(x, h / 2 - c * 0.04));
      });
      lines(ctx, BRASS, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.1, T + c * 0.12), ctx.lineTo(w / 2 - c * 0.1, T + c * 0.12)));
      for (let x = L + c * 0.1; x < w / 2; x += c * 0.5) shape(ctx, BRASS, circle(ctx, x, T + c * 0.12, c * 0.05), 0);
      break;
    case 'luggagecart': {
      const col = tone(SET25_TINTS.luggagecart!, t);
      shape(ctx, IRON, rect(ctx, -c * 0.34, -c * 0.26, c * 0.68, c * 0.52, c * 0.04), thin);
      for (const [x, y, ww, hh] of [[-0.28, -0.2, 0.3, 0.22], [0.04, -0.2, 0.24, 0.18], [-0.24, 0.04, 0.48, 0.18]] as const) {
        shape(ctx, col, rect(ctx, x * c, y * c, ww * c, hh * c, c * 0.03), thin);
        lines(ctx, BRASS, thin, () => (ctx.moveTo((x + ww / 2) * c, y * c), ctx.lineTo((x + ww / 2) * c, (y + hh) * c)));
      }
      lines(ctx, IRON, Math.max(2, c / 14), () => (ctx.moveTo(c * 0.34, -c * 0.1), ctx.lineTo(c * 0.48, -c * 0.3)));
      break;
    }
    case 'ticketkiosk':
      shape(ctx, '#2f4a3a', () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          ctx.lineTo(Math.cos(a) * c * 0.38, Math.sin(a) * c * 0.38);
        }
        ctx.closePath();
      }, line);
      shape(ctx, BRASS, circle(ctx, 0, 0, c * 0.14), thin);
      lines(ctx, IRON, thin, () => (ctx.moveTo(0, 0), ctx.lineTo(0, -c * 0.1), ctx.moveTo(0, 0), ctx.lineTo(c * 0.07, 0)));
      glow(ctx, 0, 0, c * 0.45, 'rgba(255, 210, 130, 0.3)');
      break;
    // ---- A steam factory ----
    case 'steamhammer':
      shape(ctx, IRON, rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2, c * 0.04), line);
      for (const x of [L + c * 0.24, w / 2 - c * 0.24]) shape(ctx, '#3a3d42', rect(ctx, x - c * 0.1, T + c * 0.14, c * 0.2, h - c * 0.28), thin);
      shape(ctx, '#6a7078', rect(ctx, -w * 0.2, -h * 0.2, w * 0.4, h * 0.4, c * 0.04), line);
      shape(ctx, '#e2561b', rect(ctx, -w * 0.12, h * 0.24, w * 0.24, c * 0.14, c * 0.04), 0);
      glow(ctx, 0, h * 0.28, c * 0.5, 'rgba(255, 130, 40, 0.6)');
      shape(ctx, 'rgba(220, 220, 215, 0.45)', circle(ctx, w * 0.3, -h * 0.34, c * 0.2), 0);
      break;
    case 'conveyor':
      // A belt carrying parts: stretch it.
      shape(ctx, IRON, rect(ctx, L + c * 0.04, -c * 0.3, w - c * 0.08, c * 0.6, c * 0.06), line);
      shape(ctx, '#2a2c30', rect(ctx, L + c * 0.1, -c * 0.22, w - c * 0.2, c * 0.44), 0);
      lines(ctx, '#3a3d42', thin, () => {
        for (let x = L + c * 0.16; x < w / 2 - c * 0.1; x += c * 0.12) (ctx.moveTo(x, -c * 0.22), ctx.lineTo(x, c * 0.22));
      });
      for (let x = L + c * 0.4; x < w / 2 - c * 0.2; x += c * 0.7) shape(ctx, COPPER, rect(ctx, x - c * 0.12, -c * 0.12, c * 0.24, c * 0.24, c * 0.04), thin);
      break;
    case 'furnace': {
      shape(ctx, '#7a3d2a', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.1), line);
      lines(ctx, '#5a2a1a', thin, () => {
        for (let y = T + c * 0.26; y < h / 2 - c * 0.1; y += c * 0.2) (ctx.moveTo(L + c * 0.06, y), ctx.lineTo(w / 2 - c * 0.06, y));
      });
      glow(ctx, 0, h * 0.2, Math.min(w, h) * 0.6, 'rgba(255, 110, 30, 0.7)');
      shape(ctx, '#1d1b1e', rect(ctx, -w * 0.26, h * 0.06, w * 0.52, h * 0.32, c * 0.1), thin);
      shape(ctx, '#ffb84f', rect(ctx, -w * 0.2, h * 0.14, w * 0.4, h * 0.18, c * 0.06), 0);
      shape(ctx, IRON, circle(ctx, 0, -h * 0.2, Math.min(w, h) * 0.18), thin);
      break;
    }
    case 'pressuregauges':
      // A panel of dials and valves: put it on the wall.
      shape(ctx, '#3a3530', rect(ctx, L + c * 0.04, -c * 0.2, w - c * 0.08, c * 0.4, c * 0.03), line);
      for (let x = L + c * 0.3; x < w / 2 - c * 0.15; x += c * 0.4) {
        shape(ctx, BRASS, circle(ctx, x, 0, c * 0.14), thin);
        shape(ctx, '#efe7d3', circle(ctx, x, 0, c * 0.1), 0);
        lines(ctx, '#b33a2e', thin, () => (ctx.moveTo(x, 0), ctx.lineTo(x + c * 0.06, -c * 0.06)));
      }
      lines(ctx, COPPER, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.04, c * 0.16), ctx.lineTo(w / 2 - c * 0.04, c * 0.16)));
      break;
    case 'coalpile':
      shape(ctx, '#1d1b1e', () => ctx.ellipse(0, 0, w * 0.44, h * 0.38, 0, 0, Math.PI * 2), 0);
      for (let k = 0; k < 10; k++) shape(ctx, '#2f2d30', circle(ctx, Math.cos(k * 2.3) * w * 0.3 * ((k % 4) / 4 + 0.2), Math.sin(k * 2.3) * h * 0.26 * ((k % 4) / 4 + 0.2), c * 0.08), 0);
      lines(ctx, '#55585e', Math.max(2, c / 12), () => (ctx.moveTo(w * 0.2, -h * 0.3), ctx.lineTo(w * 0.42, -h * 0.46)));
      shape(ctx, DARK, rect(ctx, w * 0.14, -h * 0.34, c * 0.16, c * 0.1, c * 0.02), 0);
      break;
    default:
      drawSets26(ctx, p, w, h, c);
  }
}
