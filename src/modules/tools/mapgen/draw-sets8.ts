// Fortifications for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Towers that stand on a castle wall, a watchtower, siege engines, stakes against horses.
import type { Prop } from './furnish';
import { circle, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets9 } from './draw-sets9';

const STONE = '#8a8476';
const MERLON = '#5c574d';
const DARK = '#2b2a2e';
const IRON = '#55585e';

export const SET8_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {};
// Drawn once a cell when stretched.
export const SET8_TILED: Prop['kind'][] = ['stakes'];

export function drawSets8(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  switch (p.kind) {
    case 'roundtower': {
      // A round tower from above: merlons round the edge, a wooden floor, a trapdoor to the stairs.
      const r = Math.min(w, h) * 0.47;
      shape(ctx, 'rgba(20, 16, 10, 0.35)', circle(ctx, c * 0.16, c * 0.2, r), 0);
      shape(ctx, STONE, circle(ctx, 0, 0, r), line);
      shape(ctx, '#9a6b3c', circle(ctx, 0, 0, r * 0.7), thin);
      lines(ctx, 'rgba(50, 30, 12, 0.4)', thin, () => {
        for (let y = -r * 0.6; y < r * 0.7; y += c * 0.3) (ctx.moveTo(-r * 0.7, y), ctx.lineTo(r * 0.7, y));
      });
      for (let k = 0; k < 12; k++) {
        if (k % 2) continue;
        const a = (k / 12) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        shape(ctx, MERLON, rect(ctx, r * 0.74, -c * 0.12, r * 0.24, c * 0.24), thin);
        ctx.restore();
      }
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.2, -c * 0.2, c * 0.4, c * 0.4, c * 0.03), thin);
      lines(ctx, IRON, thin, () => (ctx.moveTo(-c * 0.2, 0), ctx.lineTo(c * 0.2, 0)));
      break;
    }
    case 'squaretower':
      shape(ctx, 'rgba(20, 16, 10, 0.35)', rect(ctx, L + c * 0.2, T + c * 0.24, w - c * 0.1, h - c * 0.1), 0);
      shape(ctx, STONE, rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08), line);
      shape(ctx, '#9a9386', rect(ctx, L + c * 0.3, T + c * 0.3, w - c * 0.6, h - c * 0.6), thin);
      // Merlons along every side.
      for (let x = L + c * 0.12; x < w / 2 - c * 0.2; x += c * 0.44) {
        shape(ctx, MERLON, rect(ctx, x, T + c * 0.06, c * 0.22, c * 0.2), 0);
        shape(ctx, MERLON, rect(ctx, x, h / 2 - c * 0.26, c * 0.22, c * 0.2), 0);
      }
      for (let y = T + c * 0.12; y < h / 2 - c * 0.2; y += c * 0.44) {
        shape(ctx, MERLON, rect(ctx, L + c * 0.06, y, c * 0.2, c * 0.22), 0);
        shape(ctx, MERLON, rect(ctx, w / 2 - c * 0.26, y, c * 0.2, c * 0.22), 0);
      }
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.2, -c * 0.2, c * 0.4, c * 0.4, c * 0.03), thin);
      break;
    case 'watchtower':
      // A wooden watchtower: a platform on four posts, a little roof of planks.
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, '#3a2a1c', circle(ctx, x * (w / 2 - c * 0.16), y * (h / 2 - c * 0.16), c * 0.1), 0);
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.14, T + c * 0.14, w - c * 0.28, h - c * 0.28, c * 0.04), line);
      lines(ctx, 'rgba(50, 30, 12, 0.45)', thin, () => {
        for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.2) (ctx.moveTo(x, T + c * 0.14), ctx.lineTo(x, h / 2 - c * 0.14));
      });
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => ctx.rect(L + c * 0.14, T + c * 0.14, w - c * 0.28, h - c * 0.28));
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.16, -c * 0.16, c * 0.32, c * 0.32), thin);
      break;
    case 'ballista':
      shape(ctx, tone(WOOD, 0.5), rect(ctx, -c * 0.14, T + c * 0.2, c * 0.28, h - c * 0.4, c * 0.04), line);
      lines(ctx, '#5c3d22', Math.max(2.5, c / 9), () => {
        ctx.moveTo(L + c * 0.1, T + c * 0.5);
        ctx.quadraticCurveTo(0, T + c * 0.2, w / 2 - c * 0.1, T + c * 0.5);
      });
      lines(ctx, '#d6cdb5', thin, () => (ctx.moveTo(L + c * 0.1, T + c * 0.5), ctx.lineTo(0, T + h * 0.6), ctx.lineTo(w / 2 - c * 0.1, T + c * 0.5)));
      shape(ctx, IRON, () => (ctx.moveTo(0, T + c * 0.04), ctx.lineTo(c * 0.08, T + c * 0.2), ctx.lineTo(-c * 0.08, T + c * 0.2), ctx.closePath()), thin);
      lines(ctx, IRON, Math.max(1.5, c / 16), () => (ctx.moveTo(0, T + c * 0.2), ctx.lineTo(0, T + h * 0.6)));
      break;
    case 'catapult':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.14, T + c * 0.3, w - c * 0.28, h - c * 0.5, c * 0.04), line);
      for (const [x, y] of [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]] as const) shape(ctx, '#3a2a1c', rect(ctx, x * (w / 2 - c * 0.12) - c * 0.08, y * (h / 2 - c * 0.3) - c * 0.18, c * 0.16, c * 0.36, c * 0.04), thin);
      lines(ctx, '#5c3d22', Math.max(3, c / 8), () => (ctx.moveTo(0, h / 2 - c * 0.4), ctx.lineTo(0, T + c * 0.3)));
      shape(ctx, '#5c3d22', () => ctx.ellipse(0, T + c * 0.28, c * 0.2, c * 0.14, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#8c857a', circle(ctx, 0, T + c * 0.28, c * 0.1), thin);
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.14, -c * 0.1), ctx.lineTo(w / 2 - c * 0.14, -c * 0.1)));
      break;
    case 'stakes':
      // Sharpened stakes against horses, crossed in pairs.
      lines(ctx, '#7a5432', Math.max(2.5, c / 9), () => {
        for (const x of [-0.24, 0.24]) (ctx.moveTo((x - 0.18) * c, -c * 0.3), ctx.lineTo((x + 0.18) * c, c * 0.3), ctx.moveTo((x + 0.18) * c, -c * 0.3), ctx.lineTo((x - 0.18) * c, c * 0.3));
        ctx.moveTo(-c * 0.48, 0);
        ctx.lineTo(c * 0.48, 0);
      });
      for (const [x, y] of [[-0.42, -0.3], [-0.06, -0.3], [0.06, -0.3], [0.42, -0.3]] as const) shape(ctx, '#d6c69a', circle(ctx, x * c, y * c, c * 0.04), 0);
      break;
    default:
      drawSets9(ctx, p, w, h, c);
  }
}
