// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Crafts (a mill, a bakery, a stable, a forge, baths); nature (a waterfall, a cliff, crystals, mushrooms); a city's
// places (a market, an arena, a theatre, a crypt).
import type { Prop } from './furnish';
import { circle, CLOTH, GLOW, glow, lines, rect, shape, STONE, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets7 } from './draw-sets7';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const HORSES = ['#7a5432', '#3a2a1c', '#d6cdb5', '#8a6a4a', '#555'];
const MUSHROOMS = ['#b33a2e', '#c9a24a', '#7a5a8e'];

export const SET6_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  horse: HORSES, giantmushroom: MUSHROOMS, glowshrooms: GLOW, cavecrystals: GLOW, stage: CLOTH, produce: ['#d9772e', '#7f9a48', '#b33a2e', '#e8c14a'],
};
// Drawn once a cell when stretched.
export const SET6_TILED: Prop['kind'][] = ['glowshrooms', 'lilypads', 'produce', 'driftwood'];

export function drawSets6(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- Crafts ----
    case 'windmill': {
      // A round stone tower and four sails across it.
      const r = Math.min(w, h) * 0.22;
      ctx.save();
      ctx.rotate(0.35);
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.rotate((k * Math.PI) / 2);
        shape(ctx, '#e3d6b4', rect(ctx, c * 0.08, -c * 0.16, Math.min(w, h) * 0.42, c * 0.32, c * 0.02), thin);
        lines(ctx, '#7a5a34', thin, () => {
          for (let x = c * 0.2; x < Math.min(w, h) * 0.48; x += c * 0.2) (ctx.moveTo(x, -c * 0.16), ctx.lineTo(x, c * 0.16));
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.min(w, h) * 0.5, 0);
        });
        ctx.restore();
      }
      ctx.restore();
      shape(ctx, '#8a8174', circle(ctx, 0, 0, r), line);
      shape(ctx, '#6b4a2a', circle(ctx, 0, 0, r * 0.5), thin);
      break;
    }
    case 'watermill':
      // A wheel standing in a stream, paddles along it.
      shape(ctx, '#6b4a2a', rect(ctx, -c * 0.22, T + c * 0.06, c * 0.44, h - c * 0.12, c * 0.04), line);
      lines(ctx, '#4a3626', Math.max(1.5, c / 14), () => {
        for (let y = T + c * 0.2; y < h / 2 - c * 0.1; y += c * 0.24) (ctx.moveTo(-c * 0.3, y), ctx.lineTo(c * 0.3, y));
      });
      shape(ctx, IRON, rect(ctx, -c * 0.36, -c * 0.06, c * 0.72, c * 0.12), thin);
      break;
    case 'breadrack':
      shape(ctx, tone(WOOD, 0.5), rect(ctx, L + c * 0.04, T + c * 0.12, w - c * 0.08, h - c * 0.24), line);
      for (let x = L + c * 0.22; x < w / 2 - c * 0.15; x += c * 0.26) {
        shape(ctx, '#c98a3e', () => ctx.ellipse(x, -c * 0.06, c * 0.11, c * 0.07, 0, 0, Math.PI * 2), thin);
        shape(ctx, '#d9a45a', circle(ctx, x + c * 0.04, c * 0.12, c * 0.07), thin);
      }
      break;
    case 'horse': {
      // A horse from above: body, neck and head to the front, a tail behind.
      const col = tone(HORSES, t);
      shape(ctx, col, () => ctx.ellipse(0, c * 0.14, c * 0.22, h * 0.3, 0, 0, Math.PI * 2), line);
      shape(ctx, col, () => ctx.ellipse(0, T + c * 0.36, c * 0.1, c * 0.2, 0, 0, Math.PI * 2), thin);
      shape(ctx, col, () => ctx.ellipse(0, T + c * 0.14, c * 0.09, c * 0.12, 0, 0, Math.PI * 2), thin);
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(0, T + c * 0.26), ctx.lineTo(0, -c * 0.1), ctx.moveTo(0, h / 2 - c * 0.24), ctx.quadraticCurveTo(c * 0.1, h / 2 - c * 0.1, 0, h / 2 - c * 0.02)));
      break;
    }
    case 'hayrack':
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.06, T + c * 0.14, w - c * 0.12, h - c * 0.28, c * 0.04), line);
      shape(ctx, '#d9b75a', rect(ctx, L + c * 0.14, T + c * 0.22, w - c * 0.28, h - c * 0.44, c * 0.06), thin);
      lines(ctx, '#a8862f', thin, () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.15; x += c * 0.12) (ctx.moveTo(x, T + c * 0.24), ctx.lineTo(x + c * 0.06, h / 2 - c * 0.24));
      });
      break;
    case 'saddle':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.36, 0), ctx.lineTo(c * 0.36, 0)));
      shape(ctx, '#7a4a2a', () => ctx.ellipse(0, 0, c * 0.2, c * 0.3, 0, 0, Math.PI * 2), line);
      shape(ctx, '#5c3418', () => ctx.ellipse(0, -c * 0.12, c * 0.1, c * 0.08, 0, 0, Math.PI * 2), thin);
      break;
    case 'forge':
      shape(ctx, '#6b665d', rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.1), line);
      shape(ctx, '#2a1a10', rect(ctx, L + c * 0.3, T + c * 0.3, w - c * 0.6, h - c * 0.6, c * 0.1), thin);
      glow(ctx, 0, 0, Math.min(w, h) * 0.45, 'rgba(255, 120, 30, 0.8)');
      for (const [x, y] of [[-0.2, -0.1], [0.15, 0.12], [0.05, -0.2]] as const) shape(ctx, '#ffb84f', circle(ctx, x * c, y * c, c * 0.08), 0);
      shape(ctx, '#8a5f35', rect(ctx, w / 2 - c * 0.3, h / 2 - c * 0.5, c * 0.22, c * 0.4, c * 0.04), thin);
      break;
    case 'quench':
      shape(ctx, tone(WOOD, 0.2), circle(ctx, 0, 0, c * 0.3), line);
      shape(ctx, '#2c4a56', circle(ctx, 0, 0, c * 0.22), thin);
      lines(ctx, 'rgba(230, 240, 245, 0.6)', thin, () => (ctx.moveTo(-c * 0.1, -c * 0.14), ctx.quadraticCurveTo(0, -c * 0.32, c * 0.08, -c * 0.44)));
      break;
    case 'bathpool': {
      shape(ctx, '#bdb5a3', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08, c * 0.3), line);
      shape(ctx, '#6fa8bd', rect(ctx, L + c * 0.3, T + c * 0.3, w - c * 0.6, h - c * 0.6, c * 0.24), thin);
      lines(ctx, 'rgba(240, 248, 250, 0.55)', Math.max(1.5, c / 16), () => {
        for (const [x, y] of [[-0.4, -0.3], [0.3, 0.1], [-0.1, 0.4]] as const) (ctx.moveTo(x * c, y * c), ctx.quadraticCurveTo((x + 0.1) * c, (y - 0.25) * c, x * c, (y - 0.5) * c));
      });
      break;
    }
    // ---- Nature ----
    case 'waterfall':
      // Water falling over a ledge at the front into a pool of foam.
      shape(ctx, '#6b665d', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h * 0.3, c * 0.06), line);
      shape(ctx, '#7fb0bd', rect(ctx, L + c * 0.2, T + c * 0.1, w - c * 0.4, h * 0.7, c * 0.06), thin);
      lines(ctx, 'rgba(255, 255, 255, 0.8)', Math.max(1.5, c / 14), () => {
        for (let x = L + c * 0.3; x < w / 2 - c * 0.25; x += c * 0.18) (ctx.moveTo(x, T + c * 0.15), ctx.lineTo(x, T + h * 0.7));
      });
      shape(ctx, 'rgba(240, 250, 252, 0.9)', () => ctx.ellipse(0, h * 0.25, w * 0.4, h * 0.16, 0, 0, Math.PI * 2), 0);
      break;
    case 'cliff':
      // A cliff's edge: the ground falls away to the front.
      shape(ctx, '#7d776d', () => {
        ctx.moveTo(L, -c * 0.1);
        for (let x = L; x <= w / 2; x += c * 0.25) ctx.lineTo(x, (Math.sin(x * 7) * 0.08 - 0.05) * c);
        ctx.lineTo(w / 2, c * 0.42);
        ctx.lineTo(L, c * 0.42);
        ctx.closePath();
      }, line);
      lines(ctx, 'rgba(40, 34, 28, 0.55)', thin, () => {
        for (let x = L + c * 0.15; x < w / 2; x += c * 0.22) (ctx.moveTo(x, c * 0.05), ctx.lineTo(x - c * 0.06, c * 0.38));
      });
      break;
    case 'cavecrystals': {
      const col = tone(GLOW, t);
      glow(ctx, 0, 0, Math.min(w, h) * 0.55, `${col}55`);
      for (const [x, y, a, s] of [[0, 0, 0, 1.4], [-0.35, 0.2, -0.7, 1], [0.4, 0.25, 0.6, 1.1], [-0.2, -0.35, -0.3, 0.9], [0.3, -0.3, 0.4, 0.8]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, col, () => {
          ctx.moveTo(0, -c * 0.4 * s);
          ctx.lineTo(c * 0.12 * s, -c * 0.1 * s);
          ctx.lineTo(c * 0.08 * s, c * 0.14 * s);
          ctx.lineTo(-c * 0.08 * s, c * 0.14 * s);
          ctx.lineTo(-c * 0.12 * s, -c * 0.1 * s);
          ctx.closePath();
        }, thin);
        lines(ctx, 'rgba(255, 255, 255, 0.6)', thin, () => (ctx.moveTo(0, -c * 0.36 * s), ctx.lineTo(0, c * 0.1 * s)));
        ctx.restore();
      }
      break;
    }
    case 'giantmushroom': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, 'rgba(20, 16, 10, 0.3)', circle(ctx, c * 0.15, c * 0.2, r), 0);
      shape(ctx, tone(MUSHROOMS, t), circle(ctx, 0, 0, r), line);
      for (const [x, y, s] of [[-0.4, -0.3, 0.16], [0.3, -0.4, 0.12], [0.1, 0.2, 0.2], [-0.3, 0.45, 0.1], [0.5, 0.3, 0.14]] as const) shape(ctx, '#efe7d3', circle(ctx, x * c, y * c, s * c), 0);
      break;
    }
    case 'glowshrooms': {
      const col = tone(GLOW, t);
      for (const [x, y, s] of [[-0.18, -0.14, 0.12], [0.16, -0.06, 0.1], [0, 0.2, 0.13], [0.28, 0.26, 0.08]] as const) {
        glow(ctx, x * c, y * c, s * c * 2.4, `${col}66`);
        shape(ctx, col, circle(ctx, x * c, y * c, s * c), thin);
      }
      break;
    }
    case 'lilypads':
      for (const [x, y, s] of [[-0.18, -0.14, 0.16], [0.18, 0.04, 0.13], [-0.04, 0.24, 0.11]] as const) {
        shape(ctx, '#5f8f3c', () => {
          ctx.moveTo(x * c, y * c);
          ctx.arc(x * c, y * c, s * c, 0.4, Math.PI * 2);
          ctx.closePath();
        }, thin);
      }
      shape(ctx, '#f0b8d0', circle(ctx, c * 0.18, c * 0.04, c * 0.05), 0);
      break;
    case 'driftwood':
      lines(ctx, '#a89a80', Math.max(3, c / 7), () => (ctx.moveTo(-c * 0.36, c * 0.1), ctx.lineTo(c * 0.32, -c * 0.12)));
      lines(ctx, '#a89a80', Math.max(2, c / 11), () => (ctx.moveTo(c * 0.02, -c * 0.02), ctx.lineTo(c * 0.14, c * 0.26)));
      break;
    // ---- A city's places ----
    case 'produce':
      shape(ctx, tone(WOOD, 0.6), rect(ctx, -c * 0.4, -c * 0.32, c * 0.8, c * 0.64, c * 0.03), line);
      for (let k = 0; k < 4; k++) {
        const x = -c * 0.2 + (k % 2) * c * 0.4;
        const y = -c * 0.15 + Math.floor(k / 2) * c * 0.3;
        const col = SET6_TINTS.produce![(k + Math.floor(t * 4)) % 4]!;
        for (const [dx, dy] of [[-0.06, -0.04], [0.06, -0.03], [0, 0.05]] as const) shape(ctx, col, circle(ctx, x + dx * c, y + dy * c, c * 0.06), 0);
      }
      break;
    case 'dummy':
      lines(ctx, '#5c3d22', Math.max(2, c / 10), () => (ctx.moveTo(-c * 0.32, 0), ctx.lineTo(c * 0.32, 0)));
      shape(ctx, '#c9b48a', circle(ctx, 0, 0, c * 0.18), line);
      lines(ctx, '#8a7046', thin, () => (ctx.moveTo(-c * 0.12, -c * 0.06), ctx.lineTo(c * 0.12, c * 0.06), ctx.moveTo(c * 0.12, -c * 0.06), ctx.lineTo(-c * 0.12, c * 0.06)));
      break;
    case 'archery':
      shape(ctx, '#d9b75a', circle(ctx, 0, 0, c * 0.36), line);
      for (const [r, col] of [[0.28, '#efe7d3'], [0.2, '#3f5d86'], [0.12, '#b33a2e'], [0.05, '#e8c14a']] as const) shape(ctx, col, circle(ctx, 0, 0, r * c), 0);
      lines(ctx, '#5c3d22', thin, () => (ctx.moveTo(c * 0.06, -c * 0.02), ctx.lineTo(c * 0.3, -c * 0.2)));
      break;
    case 'stage':
      // A stage of boards with its curtain at the back.
      shape(ctx, '#8a5f35', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08, c * 0.04), line);
      lines(ctx, 'rgba(50, 30, 12, 0.45)', thin, () => {
        for (let x = L + c * 0.3; x < w / 2; x += c * 0.3) (ctx.moveTo(x, T + c * 0.4), ctx.lineTo(x, h / 2 - c * 0.04));
      });
      shape(ctx, tone(CLOTH, t), () => {
        ctx.moveTo(L + c * 0.04, T + c * 0.04);
        for (let x = L + c * 0.04; x <= w / 2 - c * 0.04; x += c * 0.2) ctx.quadraticCurveTo(x + c * 0.1, T + c * 0.44, x + c * 0.2, T + c * 0.36);
        ctx.lineTo(w / 2 - c * 0.04, T + c * 0.04);
        ctx.closePath();
      }, thin);
      for (const x of [L + c * 0.3, 0, w / 2 - c * 0.3]) glow(ctx, x, h / 2 - c * 0.1, c * 0.2, 'rgba(255, 214, 120, 0.7)');
      break;
    case 'seats':
      // Straight rows across the whole width, two to a cell.
      for (let y = T + c * 0.28; y < h / 2; y += c / 2) shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.04, y - c * 0.1, w - c * 0.08, c * 0.2, c * 0.04), thin);
      break;
    case 'podium':
      shape(ctx, tone(STONE, 0.3), rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8, c * 0.04), line);
      shape(ctx, tone(STONE, 0.6), rect(ctx, -c * 0.28, -c * 0.28, c * 0.56, c * 0.56, c * 0.04), thin);
      shape(ctx, tone(STONE, 0.9), rect(ctx, -c * 0.16, -c * 0.16, c * 0.32, c * 0.32, c * 0.03), thin);
      break;
    case 'cryptentrance':
      // Steps down into the dark between two pillars, a slab half pushed away.
      shape(ctx, '#8a8476', rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.04), line);
      for (let k = 0; k < 4; k++) {
        const y = T + c * 0.3 + (k * (h - c * 0.6)) / 4;
        shape(ctx, `rgb(${110 - k * 22}, ${104 - k * 22}, ${92 - k * 20})`, rect(ctx, L + c * 0.4, y, w - c * 0.8, (h - c * 0.6) / 4), 0);
      }
      for (const x of [L + c * 0.24, w / 2 - c * 0.24]) shape(ctx, '#6b665d', circle(ctx, x, T + c * 0.24, c * 0.14), thin);
      shape(ctx, '#a39d90', rect(ctx, w / 2 - c * 0.7, h / 2 - c * 0.5, c * 0.6, c * 0.36, c * 0.04), thin);
      break;
    default:
      drawSets7(ctx, p, w, h, c);
  }
}
