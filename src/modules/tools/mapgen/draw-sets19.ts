// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A troll's bridge; a knights' tournament; a royal kitchen; an alchemist's garden; an abandoned asylum.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets20 } from './draw-sets20';

const DARK = '#2b2a2e';
const GOLD = '#d4a640';
const STONE = '#8a857c';
const TILE = '#d6d2c8';

export const SET19_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  pavilion: CLOTH, joustbanner: CLOTH,
};
// Drawn once a cell when stretched.
export const SET19_TILED: Prop['kind'][] = ['mandrake', 'herbspiral'];

export function drawSets19(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A troll's bridge ----
    case 'trollbridge': {
      // An old humped stone bridge, lying along its length, a toll chest at one end.
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.2, T + c * 0.3, w - c * 0.2, h - c * 0.4, c * 0.1), 0);
      shape(ctx, STONE, rect(ctx, L + c * 0.04, T + c * 0.14, w - c * 0.08, h - c * 0.28, c * 0.08), line);
      shape(ctx, '#a39e94', rect(ctx, L + c * 0.04, T + c * 0.32, w - c * 0.08, h - c * 0.64, c * 0.04), thin);
      lines(ctx, '#6a655c', thin, () => {
        for (let x = L + c * 0.4; x < w / 2 - c * 0.1; x += c * 0.4) (ctx.moveTo(x, T + c * 0.32), ctx.lineTo(x, h / 2 - c * 0.32));
      });
      for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.6) for (const y of [T + c * 0.2, h / 2 - c * 0.2]) shape(ctx, '#6a655c', rect(ctx, x, y - c * 0.06, c * 0.3, c * 0.12, c * 0.02), 0);
      shape(ctx, tone(WOOD, 0.4), rect(ctx, w / 2 - c * 0.6, -c * 0.14, c * 0.34, c * 0.28, c * 0.03), thin);
      shape(ctx, GOLD, circle(ctx, w / 2 - c * 0.43, 0, c * 0.05), 0);
      break;
    }
    case 'tollsign':
      lines(ctx, '#5c3d22', Math.max(2, c / 10), () => (ctx.moveTo(0, c * 0.4), ctx.lineTo(0, -c * 0.1)));
      shape(ctx, tone(WOOD, 0.7), () => (ctx.moveTo(-c * 0.36, -c * 0.34), ctx.lineTo(c * 0.28, -c * 0.34), ctx.lineTo(c * 0.4, -c * 0.2), ctx.lineTo(c * 0.28, -c * 0.06), ctx.lineTo(-c * 0.36, -c * 0.06), ctx.closePath()), line);
      shape(ctx, GOLD, circle(ctx, -c * 0.14, -c * 0.2, c * 0.06), thin);
      lines(ctx, '#b33a2e', Math.max(1.5, c / 16), () => (ctx.moveTo(c * 0.0, -c * 0.26), ctx.lineTo(c * 0.2, -c * 0.14), ctx.moveTo(c * 0.2, -c * 0.26), ctx.lineTo(c * 0.0, -c * 0.14)));
      break;
    // ---- A knights' tournament ----
    case 'tiltrail':
      // The barrier the knights ride along: stretch it.
      lines(ctx, tone(WOOD, 0.6), Math.max(4, c / 6), () => (ctx.moveTo(L + c * 0.06, 0), ctx.lineTo(w / 2 - c * 0.06, 0)));
      for (let x = L + c * 0.2; x < w / 2; x += c * 0.5) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, -c * 0.08, c * 0.25, c * 0.16);
        ctx.fillStyle = '#efe7d3';
        ctx.fill();
        ctx.restore();
      }
      for (let x = L + c * 0.5; x < w / 2; x += c) shape(ctx, '#5c3d22', rect(ctx, x - c * 0.06, -c * 0.14, c * 0.12, c * 0.28, c * 0.02), thin);
      break;
    case 'pavilion': {
      // A knight's round tent with a scalloped edge and a pennant.
      const col = tone(CLOTH, t);
      const r = Math.min(w, h) * 0.44;
      shape(ctx, 'rgba(20, 16, 10, 0.3)', circle(ctx, c * 0.1, c * 0.14, r), 0);
      shape(ctx, col, () => {
        for (let k = 0; k <= 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          const rr = k % 2 ? r : r * 0.94;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
      }, line);
      lines(ctx, 'rgba(255, 255, 255, 0.5)', thin, () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
        }
      });
      shape(ctx, GOLD, circle(ctx, 0, 0, c * 0.08), thin);
      shape(ctx, '#efe7d3', () => (ctx.moveTo(0, 0), ctx.lineTo(c * 0.36, -c * 0.1), ctx.lineTo(0, -c * 0.2), ctx.closePath()), thin);
      break;
    }
    case 'lancerack':
      shape(ctx, tone(WOOD, 0.5), rect(ctx, L + c * 0.06, -c * 0.1, w - c * 0.12, c * 0.2, c * 0.03), line);
      for (let x = L + c * 0.24; x < w / 2 - c * 0.1; x += c * 0.3) {
        const col = CLOTH[Math.round((x - L) / (c * 0.3)) % CLOTH.length]!;
        lines(ctx, '#efe7d3', Math.max(3, c / 10), () => (ctx.moveTo(x, c * 0.42), ctx.lineTo(x, -c * 0.42)));
        lines(ctx, col, Math.max(3, c / 10), () => {
          for (const y of [-0.3, -0.1, 0.1, 0.3]) (ctx.moveTo(x, y * c), ctx.lineTo(x, (y + 0.08) * c));
        });
      }
      break;
    case 'joustbanner':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, c * 0.4), ctx.lineTo(-c * 0.3, -c * 0.4)));
      shape(ctx, tone(CLOTH, t), () => (ctx.moveTo(-c * 0.3, -c * 0.4), ctx.lineTo(c * 0.34, -c * 0.4), ctx.lineTo(c * 0.2, -c * 0.24), ctx.lineTo(c * 0.34, -c * 0.08), ctx.lineTo(-c * 0.3, -c * 0.08), ctx.closePath()), thin);
      shape(ctx, GOLD, () => (ctx.moveTo(-c * 0.1, -c * 0.34), ctx.lineTo(c * 0.04, -c * 0.34), ctx.lineTo(-c * 0.03, -c * 0.12), ctx.closePath()), 0);
      break;
    // ---- A royal kitchen ----
    case 'roastspit':
      shape(ctx, '#3a3530', rect(ctx, L + c * 0.1, -c * 0.3, w - c * 0.2, c * 0.6, c * 0.06), line);
      glow(ctx, 0, 0, w * 0.45, 'rgba(255, 130, 40, 0.65)');
      shape(ctx, '#e2561b', rect(ctx, L + c * 0.3, -c * 0.12, w - c * 0.6, c * 0.24, c * 0.08), 0);
      lines(ctx, '#55585e', Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.04, 0), ctx.lineTo(w / 2 - c * 0.04, 0)));
      shape(ctx, '#a0582e', () => ctx.ellipse(0, 0, w * 0.26, c * 0.2, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#c9803e', () => ctx.ellipse(-w * 0.04, -c * 0.04, w * 0.16, c * 0.1, 0, 0, Math.PI * 2), 0);
      break;
    case 'greatoven':
      shape(ctx, '#9a5a3a', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, Math.min(w, h) * 0.3), line);
      lines(ctx, '#6a3a22', thin, () => {
        for (let y = T + c * 0.3; y < h / 2 - c * 0.1; y += c * 0.24) (ctx.moveTo(L + c * 0.2, y), ctx.lineTo(w / 2 - c * 0.2, y));
      });
      shape(ctx, '#1d1b1e', rect(ctx, -c * 0.3, h / 2 - c * 0.5, c * 0.6, c * 0.4, c * 0.2), thin);
      glow(ctx, 0, h / 2 - c * 0.3, c * 0.5, 'rgba(255, 130, 40, 0.6)');
      shape(ctx, '#d9a050', () => ctx.ellipse(0, h / 2 - c * 0.28, c * 0.18, c * 0.08, 0, 0, Math.PI * 2), 0);
      break;
    case 'kitchentable':
      shape(ctx, tone(WOOD, 0.75), rect(ctx, L + c * 0.08, T + c * 0.1, w - c * 0.16, h - c * 0.2, c * 0.03), line);
      shape(ctx, '#e8d8b8', () => ctx.ellipse(L + c * 0.5, 0, c * 0.2, c * 0.14, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#b33a2e', circle(ctx, 0, -c * 0.1, c * 0.08), thin);
      shape(ctx, '#e8823a', circle(ctx, c * 0.16, c * 0.08, c * 0.07), thin);
      shape(ctx, '#5fa04a', () => ctx.ellipse(w / 2 - c * 0.5, -c * 0.04, c * 0.14, c * 0.06, 0.4, 0, Math.PI * 2), thin);
      lines(ctx, '#a3a9ad', Math.max(1.5, c / 18), () => (ctx.moveTo(-c * 0.3, c * 0.2), ctx.lineTo(-c * 0.06, c * 0.24)));
      break;
    case 'potrack':
      // Copper pans hanging from a rail: put it on the wall.
      lines(ctx, '#55585e', Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.06, -c * 0.3), ctx.lineTo(w / 2 - c * 0.06, -c * 0.3)));
      for (let x = L + c * 0.24; x < w / 2 - c * 0.1; x += c * 0.34) {
        lines(ctx, '#55585e', thin, () => (ctx.moveTo(x, -c * 0.3), ctx.lineTo(x, -c * 0.14)));
        shape(ctx, '#c97a3a', circle(ctx, x, 0, c * 0.13), thin);
        shape(ctx, '#a0582e', circle(ctx, x, 0, c * 0.07), 0);
      }
      break;
    // ---- An alchemist's garden ----
    case 'mandrake':
      for (const [x, y] of [[-0.2, -0.14], [0.18, -0.08], [0, 0.2]] as const) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          shape(ctx, '#4f7a3a', () => ctx.ellipse(x * c + Math.cos(a) * c * 0.07, y * c + Math.sin(a) * c * 0.07, c * 0.07, c * 0.035, a, 0, Math.PI * 2), 0);
        }
        shape(ctx, '#8a5a6a', circle(ctx, x * c, y * c, c * 0.03), 0);
      }
      break;
    case 'herbspiral':
      shape(ctx, '#5c4a36', circle(ctx, 0, 0, c * 0.44), 0);
      lines(ctx, STONE, Math.max(3, c / 9), () => {
        for (let a = 0; a < Math.PI * 4; a += 0.1) {
          const r = c * 0.06 + (a / (Math.PI * 4)) * c * 0.36;
          if (a === 0) ctx.moveTo(r, 0);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      });
      for (const [x, y, col] of [[0.18, 0.1, '#7f9a48'], [-0.16, -0.12, '#a87ac9'], [0.04, -0.24, '#e8c14a'], [-0.24, 0.18, '#5fa04a']] as const) shape(ctx, col, circle(ctx, x * c, y * c, c * 0.06), 0);
      break;
    case 'gardenarch':
      for (const x of [L + c * 0.14, w / 2 - c * 0.14]) shape(ctx, tone(WOOD, 0.5), rect(ctx, x - c * 0.07, -c * 0.3, c * 0.14, c * 0.6), thin);
      lines(ctx, tone(WOOD, 0.5), thin, () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.15; x += c * 0.16) (ctx.moveTo(x, -c * 0.3), ctx.lineTo(x, c * 0.3));
      });
      for (let k = 0; k < Math.round(w / c) * 6; k++) shape(ctx, k % 3 ? '#4f7a3a' : '#c94a6a', circle(ctx, L + c * 0.2 + ((k * 37) % 100) / 100 * (w - c * 0.4), -c * 0.24 + ((k * 61) % 100) / 100 * c * 0.48, c * (k % 3 ? 0.07 : 0.05)), 0);
      break;
    case 'sundial':
      shape(ctx, STONE, circle(ctx, 0, 0, c * 0.36), line);
      shape(ctx, '#c9c2b0', circle(ctx, 0, 0, c * 0.28), thin);
      lines(ctx, '#6a655c', thin, () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.22, Math.sin(a) * c * 0.22);
          ctx.lineTo(Math.cos(a) * c * 0.27, Math.sin(a) * c * 0.27);
        }
      });
      shape(ctx, '#55585e', () => (ctx.moveTo(0, 0), ctx.lineTo(c * 0.2, -c * 0.03), ctx.lineTo(c * 0.2, c * 0.03), ctx.closePath()), thin);
      shape(ctx, 'rgba(20, 16, 10, 0.3)', () => (ctx.moveTo(0, 0), ctx.lineTo(-c * 0.06, c * 0.2), ctx.lineTo(c * 0.0, c * 0.2), ctx.closePath()), 0);
      break;
    // ---- An abandoned asylum ----
    case 'asylumbed':
      shape(ctx, '#6f6a62', rect(ctx, -c * 0.3, T + c * 0.06, c * 0.6, h - c * 0.12, c * 0.02), line);
      shape(ctx, '#bdb6a2', rect(ctx, -c * 0.24, T + c * 0.12, c * 0.48, h - c * 0.24, c * 0.03), thin);
      shape(ctx, 'rgba(120, 90, 50, 0.4)', circle(ctx, c * 0.06, c * 0.1, c * 0.14), 0);
      for (let y = T + c * 0.5; y < h / 2 - c * 0.2; y += c * 0.5) shape(ctx, '#5c4a36', rect(ctx, -c * 0.32, y, c * 0.64, c * 0.07), 0);
      break;
    case 'shockchair':
      shape(ctx, '#5c4a36', rect(ctx, -c * 0.28, -c * 0.3, c * 0.56, c * 0.6, c * 0.06), line);
      shape(ctx, '#3a3530', rect(ctx, -c * 0.2, -c * 0.2, c * 0.4, c * 0.42, c * 0.04), thin);
      shape(ctx, '#8d949c', () => ctx.ellipse(0, -c * 0.32, c * 0.16, c * 0.1, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#1d1b1e', Math.max(1.5, c / 16), () => (ctx.moveTo(c * 0.12, -c * 0.36), ctx.quadraticCurveTo(c * 0.4, -c * 0.46, c * 0.44, -c * 0.1)));
      shape(ctx, '#55585e', rect(ctx, c * 0.34, -c * 0.1, c * 0.14, c * 0.2, c * 0.02), thin);
      glow(ctx, 0, -c * 0.32, c * 0.24, 'rgba(160, 200, 255, 0.5)');
      break;
    case 'paddedwall':
      // Padded cell wall: put it along the wall.
      shape(ctx, TILE, rect(ctx, L + c * 0.04, -c * 0.2, w - c * 0.08, c * 0.4, c * 0.02), thin);
      for (let x = L + c * 0.04; x < w / 2 - c * 0.1; x += c / 3) for (const y of [-0.2, 0]) {
        shape(ctx, '#e8e2d0', rect(ctx, x + c * 0.02, y * c + c * 0.02, c / 3 - c * 0.04, c * 0.16, c * 0.06), thin);
      }
      break;
    case 'straitjacket':
      shape(ctx, '#d6cdb5', () => {
        ctx.moveTo(-c * 0.18, -c * 0.3);
        ctx.lineTo(c * 0.18, -c * 0.3);
        ctx.lineTo(c * 0.22, c * 0.3);
        ctx.lineTo(-c * 0.22, c * 0.3);
        ctx.closePath();
      }, line);
      lines(ctx, '#8a7a5a', Math.max(2, c / 12), () => {
        ctx.moveTo(-c * 0.3, -c * 0.06);
        ctx.lineTo(c * 0.3, -c * 0.06);
        ctx.moveTo(-c * 0.32, c * 0.14);
        ctx.lineTo(c * 0.32, c * 0.14);
      });
      for (const y of [-0.06, 0.14]) shape(ctx, '#a3a9ad', rect(ctx, -c * 0.04, y * c - c * 0.04, c * 0.08, c * 0.08), 0);
      lines(ctx, DARK, thin, () => (ctx.moveTo(0, -c * 0.3), ctx.lineTo(0, c * 0.3)));
      break;
    default:
      drawSets20(ctx, p, w, h, c);
  }
}
