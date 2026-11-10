// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A starship's bridge; a school; a supermarket; a petrol station.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const HULL = '#d6d6cf';
const SCREEN = '#5fd3c9';
const GOODS = ['#b33a2e', '#e8c14a', '#3f8ae0', '#5fa04a', '#e8823a', '#efe7d3'];

export const SET16_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  lockers: ['#3f5d86', '#8a2f2b', '#5f7a3a', '#8d949c'], fuelpump: ['#b33a2e', '#3f8ae0', '#5fa04a'],
};
// Drawn once a cell when stretched.
export const SET16_TILED: Prop['kind'][] = ['tirestack', 'oilcans'];

export function drawSets16(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A starship's bridge ----
    case 'commandchair':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.42), line);
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.26, -c * 0.32, c * 0.52, c * 0.56, c * 0.14), thin);
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.18, -c * 0.16, c * 0.36, c * 0.34, c * 0.08), 0);
      for (const x of [-0.3, 0.3]) {
        shape(ctx, '#3a3d42', rect(ctx, x * c - c * 0.07, -c * 0.1, c * 0.14, c * 0.34, c * 0.04), thin);
        shape(ctx, SCREEN, circle(ctx, x * c, c * 0.14, c * 0.03), 0);
      }
      break;
    case 'helmconsole':
      // A curved console facing the front of the bridge.
      shape(ctx, '#3a3d42', () => {
        ctx.moveTo(L + c * 0.06, T + c * 0.2);
        ctx.quadraticCurveTo(0, T + c * 0.02 - h * 0.1, w / 2 - c * 0.06, T + c * 0.2);
        ctx.lineTo(w / 2 - c * 0.06, h / 2 - c * 0.1);
        ctx.quadraticCurveTo(0, h / 2 - c * 0.3 - h * 0.1, L + c * 0.06, h / 2 - c * 0.1);
        ctx.closePath();
      }, line);
      glow(ctx, 0, 0, w * 0.4, 'rgba(95, 211, 201, 0.3)');
      for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.36) {
        const y = -h * 0.08 * (1 - ((x / (w / 2)) ** 2));
        shape(ctx, SCREEN, rect(ctx, x - c * 0.1, y - c * 0.08, c * 0.2, c * 0.14, c * 0.02), 0);
      }
      break;
    case 'starmap': {
      // A round holographic star chart in the floor.
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#3a3d42', circle(ctx, 0, 0, r), line);
      shape(ctx, '#0b0d1e', circle(ctx, 0, 0, r * 0.84), 0);
      glow(ctx, 0, 0, r, 'rgba(95, 180, 255, 0.4)');
      lines(ctx, 'rgba(120, 200, 255, 0.7)', thin, () => {
        ctx.ellipse(0, 0, r * 0.7, r * 0.3, 0.4, 0, Math.PI * 2);
        ctx.moveTo(r * 0.4, 0);
        ctx.ellipse(0, 0, r * 0.4, r * 0.16, 0.4, 0, Math.PI * 2);
      });
      shape(ctx, '#ffe9a8', circle(ctx, 0, 0, c * 0.06), 0);
      for (const [x, y] of [[0.5, 0.2], [-0.4, -0.1], [0.2, -0.28]] as const) shape(ctx, '#bfe4ff', circle(ctx, x * r, y * r, c * 0.03), 0);
      break;
    }
    case 'viewport':
      // A long forward window onto space: put it on the wall.
      shape(ctx, IRON, rect(ctx, L + c * 0.04, -c * 0.2, w - c * 0.08, c * 0.4, c * 0.2), line);
      shape(ctx, '#0b0d1e', rect(ctx, L + c * 0.12, -c * 0.12, w - c * 0.24, c * 0.24, c * 0.12), 0);
      for (let k = 0; k < Math.round(w / c) * 6; k++) {
        const x = L + c * 0.16 + (((k * 37) % 100) / 100) * (w - c * 0.32);
        const y = -c * 0.1 + (((k * 61) % 100) / 100) * c * 0.2;
        lines(ctx, '#e8f0ff', Math.max(1, c / 40), () => (ctx.moveTo(x, y), ctx.lineTo(x + c * 0.06, y)));
      }
      for (let x = L + c; x < w / 2 - c * 0.5; x += c) lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(x, -c * 0.14), ctx.lineTo(x, c * 0.14)));
      break;
    // ---- A school ----
    case 'schooldesk':
      shape(ctx, tone(WOOD, 0.8), rect(ctx, -c * 0.36, -c * 0.34, c * 0.72, c * 0.32, c * 0.03), line);
      shape(ctx, '#efe7d3', rect(ctx, -c * 0.2, -c * 0.28, c * 0.22, c * 0.16, c * 0.01), 0);
      lines(ctx, '#3f5d86', thin, () => (ctx.moveTo(c * 0.1, -c * 0.28), ctx.lineTo(c * 0.24, -c * 0.18)));
      shape(ctx, '#3f6b8a', rect(ctx, -c * 0.2, c * 0.06, c * 0.4, c * 0.3, c * 0.06), thin);
      break;
    case 'blackboard':
      // A blackboard with chalk scribbles: put it on the wall.
      shape(ctx, tone(WOOD, 0.6), rect(ctx, L + c * 0.04, -c * 0.18, w - c * 0.08, c * 0.36, c * 0.02), line);
      shape(ctx, '#2f4a3a', rect(ctx, L + c * 0.1, -c * 0.12, w - c * 0.2, c * 0.24), 0);
      lines(ctx, 'rgba(240, 240, 230, 0.8)', thin, () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.3; x += c * 0.5) {
          ctx.moveTo(x, -c * 0.04);
          ctx.lineTo(x + c * 0.14, -c * 0.04);
          ctx.moveTo(x + c * 0.2, -c * 0.08);
          ctx.lineTo(x + c * 0.3, c * 0.04);
          ctx.moveTo(x, c * 0.06);
          ctx.lineTo(x + c * 0.36, c * 0.06);
        }
      });
      break;
    case 'lockers': {
      // A row of lockers along a wall: stretch it.
      const col = tone(SET16_TINTS.lockers!, t);
      shape(ctx, col, rect(ctx, L + c * 0.04, -c * 0.32, w - c * 0.08, c * 0.6, c * 0.02), line);
      lines(ctx, 'rgba(20, 20, 20, 0.5)', thin, () => {
        for (let x = L + c * 0.04 + c / 3; x < w / 2 - c * 0.1; x += c / 3) (ctx.moveTo(x, -c * 0.32), ctx.lineTo(x, c * 0.28));
      });
      for (let x = L + c * 0.04 + c / 6; x < w / 2; x += c / 3) {
        lines(ctx, 'rgba(20, 20, 20, 0.4)', thin, () => {
          for (const y of [-0.24, -0.2, -0.16]) (ctx.moveTo(x - c * 0.08, y * c), ctx.lineTo(x + c * 0.08, y * c));
        });
        shape(ctx, '#c9c2b0', circle(ctx, x + c * 0.08, c * 0.04, c * 0.025), 0);
      }
      break;
    }
    case 'schoolglobe':
      shape(ctx, tone(WOOD, 0.6), circle(ctx, 0, 0, c * 0.3), line);
      shape(ctx, '#4a8ac0', circle(ctx, 0, 0, c * 0.22), thin);
      shape(ctx, '#6fae5a', () => (ctx.moveTo(-c * 0.12, -c * 0.12), ctx.quadraticCurveTo(0, -c * 0.2, c * 0.06, -c * 0.04), ctx.quadraticCurveTo(-c * 0.02, c * 0.04, -c * 0.12, -c * 0.12)), 0);
      shape(ctx, '#6fae5a', () => ctx.ellipse(c * 0.08, c * 0.1, c * 0.08, c * 0.05, 0.6, 0, Math.PI * 2), 0);
      lines(ctx, GOODS[1]!, thin, () => ctx.arc(0, 0, c * 0.26, -2.4, -0.7));
      break;
    // ---- A supermarket ----
    case 'aisleshelf': {
      // A double-sided shelf of goods: stretch it along an aisle.
      shape(ctx, '#c9c2b0', rect(ctx, L + c * 0.04, -c * 0.38, w - c * 0.08, c * 0.76, c * 0.02), line);
      lines(ctx, IRON, Math.max(1.5, c / 16), () => (ctx.moveTo(L + c * 0.04, 0), ctx.lineTo(w / 2 - c * 0.04, 0)));
      let k = 0;
      for (let x = L + c * 0.14; x < w / 2 - c * 0.12; x += c * 0.16) {
        for (const y of [-0.26, 0.12]) shape(ctx, GOODS[(k++ * 7 + 3) % GOODS.length]!, rect(ctx, x, y * c, c * 0.12, c * 0.14, c * 0.02), thin);
      }
      break;
    }
    case 'checkout':
      shape(ctx, '#3a3d42', rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.04), line);
      shape(ctx, '#1d1b1e', rect(ctx, L + c * 0.12, -c * 0.16, w * 0.55, c * 0.32), 0);
      lines(ctx, '#55585e', thin, () => {
        for (let x = L + c * 0.2; x < L + c * 0.12 + w * 0.55; x += c * 0.12) (ctx.moveTo(x, -c * 0.16), ctx.lineTo(x, c * 0.16));
      });
      shape(ctx, HULL, rect(ctx, w / 2 - c * 0.5, -c * 0.2, c * 0.36, c * 0.26, c * 0.03), thin);
      shape(ctx, SCREEN, rect(ctx, w / 2 - c * 0.44, -c * 0.16, c * 0.24, c * 0.1), 0);
      glow(ctx, L + c * 0.4, 0, c * 0.2, 'rgba(255, 60, 60, 0.5)');
      break;
    case 'shopcart':
      shape(ctx, 'rgba(200, 205, 210, 0.3)', rect(ctx, -c * 0.26, -c * 0.34, c * 0.52, c * 0.6, c * 0.04), line);
      lines(ctx, '#a3a9ad', thin, () => {
        for (let x = -0.18; x < 0.26; x += 0.1) (ctx.moveTo(x * c, -c * 0.34), ctx.lineTo(x * c, c * 0.26));
        for (let y = -0.24; y < 0.26; y += 0.1) (ctx.moveTo(-c * 0.26, y * c), ctx.lineTo(c * 0.26, y * c));
      });
      lines(ctx, '#b33a2e', Math.max(2, c / 10), () => (ctx.moveTo(-c * 0.28, c * 0.36), ctx.lineTo(c * 0.28, c * 0.36)));
      shape(ctx, GOODS[3]!, rect(ctx, -c * 0.14, -c * 0.2, c * 0.16, c * 0.14, c * 0.02), thin);
      shape(ctx, GOODS[1]!, circle(ctx, c * 0.1, c * 0.04, c * 0.08), thin);
      break;
    case 'freezer':
      shape(ctx, HULL, rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.2, c * 0.06), line);
      shape(ctx, 'rgba(170, 215, 240, 0.85)', rect(ctx, L + c * 0.14, T + c * 0.18, w - c * 0.28, h - c * 0.36, c * 0.04), thin);
      for (let x = L + c * 0.24; x < w / 2 - c * 0.2; x += c * 0.22) shape(ctx, GOODS[Math.floor((x - L) / c * 3) % GOODS.length]!, rect(ctx, x, -c * 0.12, c * 0.16, c * 0.2, c * 0.02), 0);
      lines(ctx, 'rgba(255, 255, 255, 0.8)', thin, () => (ctx.moveTo(0, T + c * 0.18), ctx.lineTo(0, h / 2 - c * 0.18)));
      glow(ctx, 0, 0, Math.max(w, h) * 0.4, 'rgba(180, 220, 255, 0.25)');
      break;
    // ---- A petrol station ----
    case 'fuelpump': {
      const col = tone(SET16_TINTS.fuelpump!, t);
      shape(ctx, '#d6d2c8', rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8, c * 0.06), thin);
      shape(ctx, col, rect(ctx, -c * 0.24, -c * 0.3, c * 0.48, c * 0.5, c * 0.06), line);
      shape(ctx, '#1d1b1e', rect(ctx, -c * 0.16, -c * 0.22, c * 0.32, c * 0.14, c * 0.02), 0);
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.12, -c * 0.19, c * 0.18, c * 0.06), 0);
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(c * 0.24, -c * 0.04), ctx.quadraticCurveTo(c * 0.44, c * 0.1, c * 0.3, c * 0.32)));
      break;
    }
    case 'tirestack':
      for (const [x, y] of [[-0.2, -0.16], [0.18, -0.14], [0, 0.18]] as const) {
        shape(ctx, '#1d1b1e', circle(ctx, x * c, y * c, c * 0.16), thin);
        shape(ctx, '#3a3d42', circle(ctx, x * c, y * c, c * 0.07), 0);
      }
      break;
    case 'oilcans':
      for (let k = 0; k < 4; k++) {
        const x = -c * 0.18 + (k % 2) * c * 0.36;
        const y = -c * 0.18 + Math.floor(k / 2) * c * 0.36;
        shape(ctx, k % 3 ? '#b33a2e' : '#3f5d86', rect(ctx, x - c * 0.12, y - c * 0.14, c * 0.24, c * 0.28, c * 0.03), thin);
        shape(ctx, '#e8c14a', rect(ctx, x - c * 0.08, y - c * 0.02, c * 0.16, c * 0.06), 0);
        shape(ctx, DARK, circle(ctx, x + c * 0.06, y - c * 0.08, c * 0.03), 0);
      }
      break;
    case 'canopy': {
      // A flat forecourt roof on four posts, seen from above: put it over the pumps.
      shape(ctx, 'rgba(20, 16, 10, 0.25)', rect(ctx, L + c * 0.2, T + c * 0.24, w - c * 0.2, h - c * 0.2, c * 0.06), 0);
      shape(ctx, 'rgba(235, 235, 230, 0.92)', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08, c * 0.06), line);
      shape(ctx, tone(CLOTH, t), rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, c * 0.18), 0);
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, '#8d949c', circle(ctx, x * (w / 2 - c * 0.5), y * (h / 2 - c * 0.5), c * 0.08), thin);
      break;
    }
  }
}
