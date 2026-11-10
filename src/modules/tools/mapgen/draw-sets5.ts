// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// The north; the East; a starship and a hangar; shops and crafts: an alchemist, a tailor, a library, a bank.
import type { Prop } from './furnish';
import { circle, CLOTH, GLOW, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const SNOW = '#eef2f4';
const ICE = '#cfe6ee';
const LACQUER = '#a8322a';

export const SET5_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  lantern: ['#e0523a', '#e8c14a', '#f0e6c8'], fabric: CLOTH, potionshelf: GLOW, shuttle: ['#d6d6cf', '#8d949c', '#3f5170'], sled: WOOD,
};
// Drawn once a cell when stretched.
export const SET5_TILED: Prop['kind'][] = ['iceblock', 'snowdrift', 'bamboo', 'zengarden', 'tatami', 'fabric', 'scrolls'];

export function drawSets5(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- The north ----
    case 'igloo': {
      const r = Math.min(w, h) * 0.42;
      shape(ctx, SNOW, circle(ctx, 0, 0, r), line);
      lines(ctx, 'rgba(120, 150, 170, 0.5)', thin, () => {
        for (const k of [0.33, 0.66]) ctx.arc(0, 0, r * k, 0, Math.PI * 2);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) (ctx.moveTo(Math.cos(a) * r * 0.33, Math.sin(a) * r * 0.33), ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r));
      });
      shape(ctx, SNOW, rect(ctx, -c * 0.22, r - c * 0.1, c * 0.44, c * 0.4, c * 0.1), thin);
      shape(ctx, '#2a3640', rect(ctx, -c * 0.1, r + c * 0.1, c * 0.2, c * 0.16, c * 0.06), 0);
      break;
    }
    case 'sled':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => {
        for (const x of [-0.24, 0.24]) (ctx.moveTo(x * c, T + c * 0.06), ctx.quadraticCurveTo(x * c, T - c * 0.02, x * c * 0.6, T + c * 0.02), ctx.moveTo(x * c, T + c * 0.06), ctx.lineTo(x * c, h / 2 - c * 0.06));
      });
      shape(ctx, tone(WOOD, t), rect(ctx, -c * 0.2, T + c * 0.24, c * 0.4, h - c * 0.44, c * 0.04), line);
      shape(ctx, '#8a6a4a', rect(ctx, -c * 0.16, T + c * 0.36, c * 0.32, c * 0.3, c * 0.06), thin);
      break;
    case 'iceblock':
      for (const [x, y, s] of [[-0.12, -0.1, 0.24], [0.16, 0.12, 0.18]] as const) {
        shape(ctx, ICE, rect(ctx, (x - s) * c, (y - s) * c, s * 2 * c, s * 2 * c, c * 0.04), thin);
        lines(ctx, 'rgba(255, 255, 255, 0.9)', thin, () => (ctx.moveTo((x - s * 0.6) * c, (y + s * 0.4) * c), ctx.lineTo((x + s * 0.4) * c, (y - s * 0.6) * c)));
      }
      break;
    case 'snowdrift':
      shape(ctx, SNOW, () => {
        ctx.moveTo(-c * 0.48, c * 0.2);
        ctx.quadraticCurveTo(-c * 0.3, -c * 0.32, c * 0.05, -c * 0.12);
        ctx.quadraticCurveTo(c * 0.38, -c * 0.34, c * 0.48, c * 0.16);
        ctx.quadraticCurveTo(0, c * 0.34, -c * 0.48, c * 0.2);
      }, 0);
      lines(ctx, 'rgba(160, 180, 200, 0.6)', thin, () => (ctx.moveTo(-c * 0.3, c * 0.06), ctx.quadraticCurveTo(0, -c * 0.04, c * 0.3, c * 0.06)));
      break;
    case 'runestone':
      shape(ctx, '#8c857a', () => ctx.ellipse(0, 0, c * 0.24, c * 0.36, 0.1, 0, Math.PI * 2), line);
      lines(ctx, '#4a463f', Math.max(1.5, c / 16), () => {
        ctx.moveTo(-c * 0.06, -c * 0.22);
        ctx.lineTo(-c * 0.06, c * 0.2);
        ctx.moveTo(-c * 0.06, -c * 0.1);
        ctx.lineTo(c * 0.1, -c * 0.2);
        ctx.moveTo(-c * 0.06, c * 0.02);
        ctx.lineTo(c * 0.1, -c * 0.08);
      });
      break;
    case 'icehole':
      shape(ctx, ICE, circle(ctx, 0, 0, c * 0.36), thin);
      shape(ctx, '#2a4a5c', circle(ctx, 0, 0, c * 0.2), thin);
      lines(ctx, '#8a7046', thin, () => (ctx.moveTo(c * 0.3, -c * 0.3), ctx.lineTo(0, 0)));
      break;
    // ---- The East ----
    case 'pagoda':
      // A roof seen from above: tiers of curved eaves, a finial in the middle.
      for (const [k, col] of [[1, '#3f5a4a'], [0.68, '#355040'], [0.36, '#2b4436']] as const) {
        const x = w * 0.45 * k;
        const y = h * 0.45 * k;
        shape(ctx, col, () => {
          ctx.moveTo(-x, -y);
          ctx.quadraticCurveTo(0, -y * 0.8, x, -y);
          ctx.quadraticCurveTo(x * 0.8, 0, x, y);
          ctx.quadraticCurveTo(0, y * 0.8, -x, y);
          ctx.quadraticCurveTo(-x * 0.8, 0, -x, -y);
        }, line);
      }
      lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => (ctx.moveTo(-w * 0.45, -h * 0.45), ctx.lineTo(w * 0.45, h * 0.45), ctx.moveTo(w * 0.45, -h * 0.45), ctx.lineTo(-w * 0.45, h * 0.45)));
      shape(ctx, '#c9a442', circle(ctx, 0, 0, c * 0.1), thin);
      break;
    case 'lantern': {
      const col = tone(SET5_TINTS.lantern!, t);
      glow(ctx, 0, 0, c * 0.45, 'rgba(255, 200, 120, 0.55)');
      shape(ctx, col, () => ctx.ellipse(0, 0, c * 0.18, c * 0.22, 0, 0, Math.PI * 2), thin);
      lines(ctx, 'rgba(60, 20, 10, 0.5)', thin, () => {
        for (const y of [-0.1, 0, 0.1]) (ctx.moveTo(-c * 0.17, y * c), ctx.lineTo(c * 0.17, y * c));
      });
      shape(ctx, DARK, rect(ctx, -c * 0.08, -c * 0.26, c * 0.16, c * 0.05), 0);
      break;
    }
    case 'zengarden':
      shape(ctx, '#e3dcc6', rect(ctx, -c / 2, -c / 2, c, c), 0);
      lines(ctx, 'rgba(160, 150, 120, 0.7)', thin, () => {
        for (let y = -0.4; y < 0.5; y += 0.14) (ctx.moveTo(-c / 2, y * c), ctx.quadraticCurveTo(0, (y + 0.04) * c, c / 2, y * c));
      });
      break;
    case 'zenrock':
      lines(ctx, 'rgba(160, 150, 120, 0.7)', thin, () => {
        for (const r of [0.28, 0.38]) ctx.arc(0, 0, r * c, 0, Math.PI * 2);
      });
      shape(ctx, '#7d776d', () => ctx.ellipse(0, 0, c * 0.2, c * 0.15, 0.4, 0, Math.PI * 2), line);
      break;
    case 'bamboo':
      for (const [x, y, s] of [[-0.2, -0.16, 1], [0.14, -0.2, 0.8], [0.02, 0.12, 0.9], [0.26, 0.22, 0.7], [-0.24, 0.26, 0.75]] as const) {
        shape(ctx, '#7f9a48', circle(ctx, x * c, y * c, c * 0.07 * s), thin);
        lines(ctx, '#5f7a34', thin, () => (ctx.moveTo((x - 0.1 * s) * c, (y + 0.06) * c), ctx.lineTo((x + 0.1 * s) * c, (y - 0.06) * c)));
      }
      break;
    case 'torii':
      // A gate from above: two pillars and the lintel overhanging them.
      shape(ctx, LACQUER, rect(ctx, L + c * 0.02, -c * 0.12, w - c * 0.04, c * 0.24, c * 0.06), line);
      shape(ctx, DARK, rect(ctx, L + c * 0.02, -c * 0.06, w - c * 0.04, c * 0.08), 0);
      for (const x of [L + c * 0.4, w / 2 - c * 0.4]) shape(ctx, '#8a2820', circle(ctx, x, 0, c * 0.12), thin);
      break;
    case 'tatami':
      shape(ctx, '#c9c08a', rect(ctx, -c * 0.48, -c * 0.48, c * 0.96, c * 0.96), 0);
      lines(ctx, 'rgba(110, 100, 60, 0.35)', thin, () => {
        for (let x = -0.4; x < 0.45; x += 0.08) (ctx.moveTo(x * c, -c * 0.48), ctx.lineTo(x * c, c * 0.48));
      });
      lines(ctx, '#3f4a3a', Math.max(1.5, c / 16), () => ctx.rect(-c * 0.48, -c * 0.48, c * 0.96, c * 0.96));
      break;
    case 'lowtable':
      shape(ctx, '#4a2e22', rect(ctx, -c * 0.34, -c * 0.26, c * 0.68, c * 0.52, c * 0.06), line);
      shape(ctx, '#e8e2d0', circle(ctx, -c * 0.1, 0, c * 0.07), thin);
      shape(ctx, '#7f9a48', circle(ctx, c * 0.12, -c * 0.04, c * 0.05), thin);
      break;
    case 'koipond': {
      shape(ctx, '#8c857a', () => ctx.ellipse(0, 0, w * 0.46, h * 0.42, 0.2, 0, Math.PI * 2), line);
      shape(ctx, '#3f7d97', () => ctx.ellipse(0, 0, w * 0.38, h * 0.34, 0.2, 0, Math.PI * 2), thin);
      for (const [x, y, a, col] of [[-0.3, -0.1, 0.4, '#e86f2e'], [0.25, 0.2, 2.6, '#f0e6c8'], [0.1, -0.3, 1.2, '#e86f2e']] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, col, () => ctx.ellipse(0, 0, c * 0.12, c * 0.05, 0, 0, Math.PI * 2), 0);
        ctx.restore();
      }
      shape(ctx, '#5f8f3c', circle(ctx, -w * 0.15, h * 0.18, c * 0.1), thin);
      break;
    }
    // ---- A starship and a hangar ----
    case 'captainchair':
      shape(ctx, '#3a4048', rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.64, c * 0.2), line);
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.22, -c * 0.12, c * 0.44, c * 0.36, c * 0.1), thin);
      for (const x of [-0.3, 0.3]) shape(ctx, '#55585e', rect(ctx, x * c - c * 0.06, -c * 0.1, c * 0.12, c * 0.34, c * 0.04), thin);
      shape(ctx, '#5fd3c9', circle(ctx, c * 0.3, -c * 0.02, c * 0.03), 0);
      break;
    case 'viewscreen':
      // A great screen on the wall: put it on a wall cell.
      shape(ctx, DARK, rect(ctx, L + c * 0.04, -c * 0.12, w - c * 0.08, c * 0.2, c * 0.03), line);
      glow(ctx, 0, c * 0.1, Math.max(w, c) * 0.5, 'rgba(95, 200, 255, 0.35)');
      lines(ctx, '#8fe0ff', thin, () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.15; x += c * 0.25) (ctx.moveTo(x, c * 0.0), ctx.lineTo(x + c * 0.1, -c * 0.06));
      });
      break;
    case 'cryopod':
      shape(ctx, '#d6d6cf', rect(ctx, L + c * 0.1, T + c * 0.04, w - c * 0.2, h - c * 0.08, c * 0.3), line);
      shape(ctx, 'rgba(180, 230, 255, 0.75)', rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.4, h - c * 0.4, c * 0.22), thin);
      lines(ctx, 'rgba(255, 255, 255, 0.85)', thin, () => {
        for (let y = T + c * 0.4; y < h / 2 - c * 0.3; y += c * 0.3) (ctx.moveTo(-c * 0.12, y), ctx.lineTo(c * 0.04, y + c * 0.1));
      });
      glow(ctx, 0, 0, Math.max(w, h) * 0.45, 'rgba(160, 220, 255, 0.3)');
      break;
    case 'restraint':
      shape(ctx, '#55585e', rect(ctx, -c * 0.26, -c * 0.3, c * 0.52, c * 0.6, c * 0.12), line);
      shape(ctx, '#3a4048', rect(ctx, -c * 0.18, -c * 0.18, c * 0.36, c * 0.36, c * 0.06), thin);
      for (const [x, y] of [[-0.26, 0], [0.26, 0], [-0.1, 0.3], [0.1, 0.3]] as const) shape(ctx, '#e8c14a', rect(ctx, x * c - c * 0.05, y * c - c * 0.03, c * 0.1, c * 0.06), 0);
      break;
    case 'shuttle':
      shape(ctx, tone(SET5_TINTS.shuttle!, t), () => {
        ctx.moveTo(0, T + c * 0.1);
        ctx.quadraticCurveTo(w * 0.24, T + h * 0.2, w * 0.24, T + h * 0.5);
        ctx.lineTo(w * 0.46, h / 2 - c * 0.3);
        ctx.lineTo(w * 0.2, h / 2 - c * 0.1);
        ctx.lineTo(-w * 0.2, h / 2 - c * 0.1);
        ctx.lineTo(-w * 0.46, h / 2 - c * 0.3);
        ctx.lineTo(-w * 0.24, T + h * 0.5);
        ctx.quadraticCurveTo(-w * 0.24, T + h * 0.2, 0, T + c * 0.1);
      }, line);
      shape(ctx, '#5fa8d3', () => ctx.ellipse(0, T + h * 0.22, w * 0.1, h * 0.08, 0, 0, Math.PI * 2), thin);
      for (const x of [-0.12, 0.12]) shape(ctx, '#ffb84f', circle(ctx, x * w, h / 2 - c * 0.12, c * 0.08), 0);
      break;
    case 'fueltank':
      shape(ctx, '#d6d6cf', circle(ctx, 0, 0, c * 0.38), line);
      lines(ctx, '#e0523a', Math.max(2, c / 10), () => ctx.arc(0, 0, c * 0.28, 0, Math.PI * 2));
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.1), thin);
      break;
    case 'mech':
      // A cargo loader: a cab, two arms, two feet.
      for (const x of [-0.3, 0.3]) shape(ctx, IRON, rect(ctx, x * w - c * 0.14, h * 0.1, c * 0.28, h * 0.32, c * 0.06), thin);
      shape(ctx, '#e8c14a', rect(ctx, -w * 0.24, -h * 0.26, w * 0.48, h * 0.44, c * 0.1), line);
      shape(ctx, '#5fa8d3', rect(ctx, -w * 0.14, -h * 0.2, w * 0.28, h * 0.16, c * 0.06), thin);
      lines(ctx, DARK, Math.max(2.5, c / 8), () => (ctx.moveTo(-w * 0.24, -h * 0.1), ctx.lineTo(-w * 0.44, -h * 0.4), ctx.moveTo(w * 0.24, -h * 0.1), ctx.lineTo(w * 0.44, -h * 0.4)));
      break;
    case 'landingpad': {
      // One pad over its whole size: a yellow border, a ring and an H.
      shape(ctx, '#4a4f55', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08, c * 0.06), line);
      const r = Math.min(w, h) * 0.32;
      lines(ctx, '#e8c14a', Math.max(2, c / 10), () => {
        ctx.rect(L + c * 0.16, T + c * 0.16, w - c * 0.32, h - c * 0.32);
        ctx.moveTo(r, 0);
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.moveTo(-r * 0.4, -r * 0.5);
        ctx.lineTo(-r * 0.4, r * 0.5);
        ctx.moveTo(r * 0.4, -r * 0.5);
        ctx.lineTo(r * 0.4, r * 0.5);
        ctx.moveTo(-r * 0.4, 0);
        ctx.lineTo(r * 0.4, 0);
      });
      break;
    }
    case 'drone':
      for (const [x, y] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]] as const) {
        lines(ctx, 'rgba(200, 210, 220, 0.6)', thin, () => ctx.arc(x * c, y * c, c * 0.1, 0, Math.PI * 2));
        lines(ctx, IRON, thin, () => (ctx.moveTo(0, 0), ctx.lineTo(x * c, y * c)));
      }
      shape(ctx, '#3a4048', circle(ctx, 0, 0, c * 0.1), thin);
      shape(ctx, '#e0523a', circle(ctx, 0, 0, c * 0.03), 0);
      break;
    // ---- Shops and crafts ----
    case 'alembic':
      glow(ctx, 0, c * 0.2, c * 0.24, 'rgba(255, 150, 50, 0.6)');
      shape(ctx, '#7a5432', rect(ctx, -c * 0.14, c * 0.1, c * 0.28, c * 0.2, c * 0.04), thin);
      shape(ctx, 'rgba(200, 230, 210, 0.8)', circle(ctx, -c * 0.06, -c * 0.02, c * 0.16), thin);
      shape(ctx, '#5fcf7a', circle(ctx, -c * 0.06, -c * 0.02, c * 0.09), 0);
      lines(ctx, '#b89a64', Math.max(1.5, c / 16), () => (ctx.moveTo(c * 0.06, -c * 0.12), ctx.quadraticCurveTo(c * 0.3, -c * 0.32, c * 0.34, -c * 0.06)));
      shape(ctx, 'rgba(200, 230, 210, 0.8)', circle(ctx, c * 0.34, 0, c * 0.07), thin);
      break;
    case 'potionshelf':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.04, T + c * 0.12, w - c * 0.08, c * 0.3), line);
      for (let x = L + c * 0.2; x < w / 2 - c * 0.12; x += c * 0.2) {
        const col = GLOW[Math.floor(((x - L) / c) * 5 + t * 5) % GLOW.length]!;
        shape(ctx, col, circle(ctx, x, T + c * 0.27, c * 0.07), thin);
      }
      break;
    case 'mannequin':
      shape(ctx, '#c9b48a', () => ctx.ellipse(0, 0, c * 0.26, c * 0.14, 0, 0, Math.PI * 2), line);
      shape(ctx, '#c9b48a', circle(ctx, 0, 0, c * 0.08), thin);
      lines(ctx, '#5c3d22', thin, () => (ctx.moveTo(0, c * 0.14), ctx.lineTo(0, c * 0.36)));
      lines(ctx, '#d6d2c8', Math.max(1.5, c / 18), () => (ctx.moveTo(-c * 0.3, -c * 0.06), ctx.quadraticCurveTo(0, c * 0.1, c * 0.3, -c * 0.06)));
      break;
    case 'loom':
      shape(ctx, tone(WOOD, 0.1), rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.2, c * 0.04), line);
      shape(ctx, '#a8823a', rect(ctx, L + c * 0.22, T + c * 0.22, w - c * 0.44, h - c * 0.44), thin);
      lines(ctx, 'rgba(255, 240, 200, 0.6)', thin, () => {
        for (let x = L + c * 0.28; x < w / 2 - c * 0.22; x += c * 0.08) (ctx.moveTo(x, T + c * 0.22), ctx.lineTo(x, h / 2 - c * 0.22));
      });
      break;
    case 'fabric':
      for (const [y, k] of [[-0.24, 0], [0, 3], [0.24, 5]] as const) {
        shape(ctx, tone(CLOTH, (t * CLOTH.length + k) / CLOTH.length), rect(ctx, -c * 0.36, y * c - c * 0.1, c * 0.72, c * 0.2, c * 0.08), thin);
      }
      break;
    case 'bookcase':
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.04, T + c * 0.12, w - c * 0.08, c * 0.38), line);
      for (let x = L + c * 0.1; x < w / 2 - c * 0.08; x += c * 0.09) {
        ctx.fillStyle = CLOTH[Math.floor(((x - L) / c) * 11) % CLOTH.length]!;
        ctx.fillRect(x, T + c * 0.16, c * 0.07, c * 0.3);
      }
      break;
    case 'globe':
      shape(ctx, '#5c3d22', circle(ctx, 0, 0, c * 0.32), line);
      shape(ctx, '#4f7a9e', circle(ctx, 0, 0, c * 0.24), thin);
      shape(ctx, '#7f9a48', () => ctx.ellipse(-c * 0.06, -c * 0.04, c * 0.1, c * 0.14, 0.6, 0, Math.PI * 2), 0);
      lines(ctx, '#c9a442', thin, () => ctx.arc(0, 0, c * 0.28, 0, Math.PI * 2));
      break;
    case 'scrolls':
      for (const [x, y, a] of [[-0.14, -0.12, 0.3], [0.14, 0.04, -0.4], [-0.04, 0.22, 1.2]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#efe2bd', rect(ctx, -c * 0.2, -c * 0.06, c * 0.4, c * 0.12, c * 0.05), thin);
        shape(ctx, '#8a2f2b', rect(ctx, -c * 0.02, -c * 0.07, c * 0.04, c * 0.14), 0);
        ctx.restore();
      }
      break;
    case 'safe':
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.36, -c * 0.36, c * 0.72, c * 0.72, c * 0.04), line);
      shape(ctx, '#55585e', circle(ctx, 0, 0, c * 0.16), thin);
      lines(ctx, '#c9a442', thin, () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.14, Math.sin(a) * c * 0.14);
        }
      });
      break;
    case 'scales':
      lines(ctx, '#c9a442', Math.max(1.5, c / 16), () => (ctx.moveTo(-c * 0.32, 0), ctx.lineTo(c * 0.32, 0)));
      for (const x of [-0.3, 0.3]) shape(ctx, '#c9a442', circle(ctx, x * c, 0, c * 0.12), thin);
      shape(ctx, '#7a5432', circle(ctx, 0, 0, c * 0.06), thin);
      shape(ctx, '#e8c14a', circle(ctx, -c * 0.3, 0, c * 0.05), 0);
      break;
    case 'vaultdoor':
      // A round vault door in a wall: put it on the wall.
      shape(ctx, '#6f7882', circle(ctx, 0, 0, Math.min(w, h) * 0.46), line);
      shape(ctx, '#8d949c', circle(ctx, 0, 0, Math.min(w, h) * 0.34), thin);
      lines(ctx, '#3a3d42', Math.max(2, c / 10), () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.06, Math.sin(a) * c * 0.06);
          ctx.lineTo(Math.cos(a) * c * 0.3, Math.sin(a) * c * 0.3);
        }
      });
      for (let k = 0; k < 8; k++) shape(ctx, '#3a3d42', circle(ctx, Math.cos((k * Math.PI) / 4) * Math.min(w, h) * 0.4, Math.sin((k * Math.PI) / 4) * Math.min(w, h) * 0.4, c * 0.04), 0);
      break;
  }
}
