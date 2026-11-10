// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A dwarven hall; a kobold warren; a dragon's hoard; a wizard's lair; a plague quarter.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets18 } from './draw-sets18';

const DARK = '#2b2a2e';
const GOLD = '#d4a640';
const STONE = '#8a857c';
const GEMS = ['#b33a2e', '#3f8ae0', '#5fcf7a', '#a87ac9'];

export const SET17_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  teleportcircle: ['#8fb8ff', '#c8a0ff', '#8fe0c8', '#ffb84f'],
};
// Drawn once a cell when stretched.
export const SET17_TILED: Prop['kind'][] = ['alecask', 'koboldtrap', 'corpsepile'];

export function drawSets17(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A dwarven hall ----
    case 'dwarfstatue':
      // A great carved dwarf with a hammer, seen from above.
      shape(ctx, STONE, rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.04), line);
      shape(ctx, '#a39e94', circle(ctx, 0, -h * 0.06, Math.min(w, h) * 0.26), thin);
      shape(ctx, '#7d776d', () => (ctx.moveTo(-w * 0.18, -h * 0.02), ctx.lineTo(0, h * 0.34), ctx.lineTo(w * 0.18, -h * 0.02), ctx.closePath()), thin);
      lines(ctx, '#6a655c', thin, () => {
        for (const k of [-0.08, 0, 0.08]) (ctx.moveTo(k * w, h * 0.02), ctx.lineTo(k * w * 0.5, h * 0.28));
      });
      shape(ctx, '#6a655c', rect(ctx, w * 0.22, -h * 0.3, c * 0.2, h * 0.5, c * 0.02), thin);
      shape(ctx, '#55585e', rect(ctx, w * 0.16, -h * 0.36, c * 0.36, c * 0.2, c * 0.03), thin);
      break;
    case 'runeforge':
      shape(ctx, STONE, rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.08), line);
      glow(ctx, 0, 0, Math.min(w, h) * 0.5, 'rgba(120, 200, 255, 0.55)');
      shape(ctx, '#2a3a4a', circle(ctx, 0, 0, Math.min(w, h) * 0.26), thin);
      lines(ctx, '#9fd8ff', Math.max(1.5, c / 16), () => {
        const r = Math.min(w, h) * 0.18;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      });
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, '#9fd8ff', rect(ctx, x * (w / 2 - c * 0.3) - c * 0.06, y * (h / 2 - c * 0.3) - c * 0.06, c * 0.12, c * 0.12), 0);
      break;
    case 'alecask':
      shape(ctx, tone(WOOD, 0.5), () => ctx.ellipse(0, 0, c * 0.4, c * 0.3, 0, 0, Math.PI * 2), line);
      lines(ctx, '#3a3d42', Math.max(1.5, c / 16), () => {
        for (const x of [-0.24, 0.24]) (ctx.moveTo(x * c, -c * 0.26), ctx.lineTo(x * c, c * 0.26));
      });
      shape(ctx, '#8a6a3a', circle(ctx, 0, 0, c * 0.12), thin);
      shape(ctx, '#55585e', rect(ctx, -c * 0.03, c * 0.08, c * 0.06, c * 0.16), 0);
      break;
    case 'stonetable':
      shape(ctx, STONE, rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2, c * 0.06), line);
      lines(ctx, '#6a655c', thin, () => ctx.rect(L + c * 0.22, T + c * 0.22, w - c * 0.44, h - c * 0.44));
      for (const [x, y] of [[-0.3, -0.1], [0.2, 0.15], [0.4, -0.2]] as const) shape(ctx, '#c9a442', circle(ctx, x * c, y * c, c * 0.08), thin);
      shape(ctx, '#8a5a2a', () => ctx.ellipse(-c * 0.1, c * 0.2, c * 0.16, c * 0.08, 0.3, 0, Math.PI * 2), thin);
      break;
    // ---- A kobold warren ----
    case 'koboldtrap':
      // A crude trap: a spiked board under a scatter of straw.
      shape(ctx, '#7a5432', rect(ctx, -c * 0.36, -c * 0.36, c * 0.72, c * 0.72, c * 0.02), thin);
      for (let k = 0; k < 9; k++) shape(ctx, '#c9c2b0', () => {
        const x = -c * 0.24 + (k % 3) * c * 0.24;
        const y = -c * 0.24 + Math.floor(k / 3) * c * 0.24;
        ctx.moveTo(x - c * 0.05, y + c * 0.04);
        ctx.lineTo(x + c * 0.05, y + c * 0.04);
        ctx.lineTo(x, y - c * 0.06);
        ctx.closePath();
      }, thin);
      lines(ctx, 'rgba(220, 190, 110, 0.7)', thin, () => {
        for (const [x, y, a] of [[-0.3, -0.1, 0.3], [0.1, 0.2, -0.6], [0.2, -0.28, 1.1]] as const) (ctx.moveTo(x * c, y * c), ctx.lineTo(x * c + Math.cos(a) * c * 0.3, y * c + Math.sin(a) * c * 0.3));
      });
      break;
    case 'kobolddragon':
      // A crude dragon idol the kobolds worship.
      shape(ctx, '#7a3d22', circle(ctx, 0, 0, c * 0.36), line);
      shape(ctx, '#b33a2e', () => {
        ctx.moveTo(0, -c * 0.3);
        ctx.lineTo(c * 0.12, -c * 0.06);
        ctx.lineTo(c * 0.3, c * 0.02);
        ctx.lineTo(c * 0.1, c * 0.12);
        ctx.lineTo(0, c * 0.3);
        ctx.lineTo(-c * 0.1, c * 0.12);
        ctx.lineTo(-c * 0.3, c * 0.02);
        ctx.lineTo(-c * 0.12, -c * 0.06);
        ctx.closePath();
      }, thin);
      shape(ctx, '#e8c14a', circle(ctx, 0, -c * 0.12, c * 0.04), 0);
      for (let k = 0; k < 5; k++) shape(ctx, GOLD, circle(ctx, Math.cos(k * 1.3) * c * 0.4, Math.sin(k * 1.3) * c * 0.4, c * 0.04), 0);
      break;
    case 'tunnelhole':
      shape(ctx, '#5c4a36', () => ctx.ellipse(0, 0, c * 0.36, c * 0.3, 0, 0, Math.PI * 2), 0);
      shape(ctx, '#1a1512', () => ctx.ellipse(0, c * 0.02, c * 0.24, c * 0.2, 0, 0, Math.PI * 2), 0);
      for (const [x, y] of [[-0.3, -0.24], [0.32, 0.2], [0.26, -0.26]] as const) shape(ctx, '#7d776d', circle(ctx, x * c, y * c, c * 0.06), thin);
      break;
    // ---- A dragon's hoard ----
    case 'goldhoard': {
      // One heap, as big as its frame.
      const rx = w * 0.48;
      const ry = h * 0.42;
      shape(ctx, '#b8913e', () => ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2), 0);
      shape(ctx, GOLD, () => ctx.ellipse(-rx * 0.08, -ry * 0.1, rx * 0.75, ry * 0.7, 0, 0, Math.PI * 2), 0);
      shape(ctx, '#e8c060', () => ctx.ellipse(-rx * 0.12, -ry * 0.18, rx * 0.4, ry * 0.38, 0, 0, Math.PI * 2), 0);
      const n = Math.round((w * h) / (c * c)) * 5;
      for (let k = 0; k < n; k++) shape(ctx, '#f0d070', circle(ctx, Math.cos(k * 2.4) * rx * 0.85 * (((k * 7) % 10) / 10), Math.sin(k * 2.4) * ry * 0.85 * (((k * 7) % 10) / 10), c * 0.045), 0);
      for (let k = 0; k < Math.max(2, n / 8); k++) shape(ctx, GEMS[(k + Math.round(t * 4)) % 4]!, circle(ctx, Math.cos(k * 1.7 + 1) * rx * 0.6, Math.sin(k * 1.7 + 1) * ry * 0.55, c * 0.05), thin);
      break;
    }
    case 'crown':
      shape(ctx, GOLD, () => {
        ctx.moveTo(-c * 0.26, c * 0.14);
        ctx.lineTo(-c * 0.26, -c * 0.12);
        ctx.lineTo(-c * 0.13, 0);
        ctx.lineTo(0, -c * 0.2);
        ctx.lineTo(c * 0.13, 0);
        ctx.lineTo(c * 0.26, -c * 0.12);
        ctx.lineTo(c * 0.26, c * 0.14);
        ctx.closePath();
      }, line);
      for (const [x, k] of [[-0.14, 0], [0, 1], [0.14, 2]] as const) shape(ctx, GEMS[k]!, circle(ctx, x * c, c * 0.06, c * 0.04), 0);
      break;
    case 'dragonsword':
      // A legendary sword stuck in the hoard.
      lines(ctx, '#d6dde3', Math.max(3, c / 8), () => (ctx.moveTo(-c * 0.3, c * 0.3), ctx.lineTo(c * 0.2, -c * 0.2)));
      lines(ctx, GOLD, Math.max(3, c / 9), () => (ctx.moveTo(c * 0.12, -c * 0.32), ctx.lineTo(c * 0.32, -c * 0.12)));
      lines(ctx, '#5c3d22', Math.max(3, c / 9), () => (ctx.moveTo(c * 0.22, -c * 0.22), ctx.lineTo(c * 0.36, -c * 0.36)));
      glow(ctx, 0, 0, c * 0.4, 'rgba(160, 200, 255, 0.4)');
      break;
    // ---- A wizard's lair ----
    case 'teleportcircle': {
      const col = tone(SET17_TINTS.teleportcircle!, t);
      const r = Math.min(w, h) * 0.44;
      glow(ctx, 0, 0, r * 1.1, `${col}66`);
      lines(ctx, col, Math.max(2, c / 12), () => {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.moveTo(r * 0.8, 0);
        ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
          const b = -Math.PI / 2 + ((k + 1) * 4 * Math.PI) / 5;
          ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
          ctx.lineTo(Math.cos(b) * r * 0.8, Math.sin(b) * r * 0.8);
        }
      });
      break;
    }
    case 'crystalball':
      shape(ctx, tone(WOOD, 0.4), circle(ctx, 0, 0, c * 0.3), line);
      glow(ctx, 0, 0, c * 0.45, 'rgba(180, 160, 255, 0.55)');
      shape(ctx, 'rgba(200, 190, 255, 0.9)', circle(ctx, 0, 0, c * 0.2), thin);
      shape(ctx, 'rgba(255, 255, 255, 0.85)', circle(ctx, -c * 0.07, -c * 0.07, c * 0.05), 0);
      break;
    case 'staffrack':
      shape(ctx, tone(WOOD, 0.6), rect(ctx, -c * 0.4, -c * 0.12, c * 0.8, c * 0.24, c * 0.03), line);
      for (const [x, col] of [[-0.26, '#9fd8ff'], [-0.08, '#e0523a'], [0.1, '#5fcf7a'], [0.28, '#c8a0ff']] as const) {
        lines(ctx, '#6b4a2a', Math.max(2, c / 12), () => (ctx.moveTo(x * c, c * 0.34), ctx.lineTo(x * c, -c * 0.26)));
        glow(ctx, x * c, -c * 0.3, c * 0.14, `${col}99`);
        shape(ctx, col, circle(ctx, x * c, -c * 0.3, c * 0.05), thin);
      }
      break;
    case 'perch':
      // A familiar's perch with an owl on it.
      lines(ctx, '#6b4a2a', Math.max(2, c / 10), () => (ctx.moveTo(-c * 0.36, 0), ctx.lineTo(c * 0.36, 0)));
      shape(ctx, '#8a6a4a', () => ctx.ellipse(0, -c * 0.02, c * 0.16, c * 0.2, 0, 0, Math.PI * 2), thin);
      for (const x of [-0.06, 0.06]) {
        shape(ctx, '#efe7d3', circle(ctx, x * c, -c * 0.1, c * 0.045), 0);
        shape(ctx, DARK, circle(ctx, x * c, -c * 0.1, c * 0.02), 0);
      }
      shape(ctx, '#e8a14f', () => (ctx.moveTo(-c * 0.02, -c * 0.06), ctx.lineTo(c * 0.02, -c * 0.06), ctx.lineTo(0, -c * 0.02), ctx.closePath()), 0);
      break;
    // ---- A plague quarter ----
    case 'plaguecart':
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2, c * 0.03), line);
      for (const [x, y, a] of [[-0.3, -0.06, 0.2], [0.2, 0.08, -0.3]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#c9bfa8', rect(ctx, -c * 0.36, -c * 0.12, c * 0.72, c * 0.24, c * 0.1), thin);
        lines(ctx, '#8a7a5a', thin, () => {
          for (const k of [-0.2, 0, 0.2]) (ctx.moveTo(k * c, -c * 0.12), ctx.lineTo(k * c, c * 0.12));
        });
        ctx.restore();
      }
      for (const x of [L + c * 0.14, w / 2 - c * 0.14]) shape(ctx, DARK, rect(ctx, x - c * 0.06, -c * 0.24, c * 0.12, c * 0.48, c * 0.03), 0);
      break;
    case 'quarantine':
      // A painted cross on a boarded door: put it on the wall.
      shape(ctx, tone(WOOD, 0.4), rect(ctx, -c * 0.42, -c * 0.16, c * 0.84, c * 0.32, c * 0.02), line);
      lines(ctx, '#5c3d22', thin, () => {
        for (const y of [-0.06, 0.06]) (ctx.moveTo(-c * 0.42, y * c), ctx.lineTo(c * 0.42, y * c));
      });
      lines(ctx, '#b33a2e', Math.max(3, c / 8), () => (ctx.moveTo(-c * 0.14, -c * 0.12), ctx.lineTo(c * 0.14, c * 0.12), ctx.moveTo(c * 0.14, -c * 0.12), ctx.lineTo(-c * 0.14, c * 0.12)));
      break;
    case 'corpsepile':
      for (const [x, y, a] of [[-0.12, -0.12, 0.4], [0.12, 0.06, -0.5], [-0.06, 0.2, 1.2]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#c9bfa8', rect(ctx, -c * 0.26, -c * 0.08, c * 0.52, c * 0.16, c * 0.08), thin);
        ctx.restore();
      }
      shape(ctx, 'rgba(60, 50, 40, 0.5)', circle(ctx, c * 0.24, -c * 0.24, c * 0.06), 0);
      break;
    case 'censer':
      // A smoking brazier of herbs against the miasma.
      lines(ctx, '#55585e', Math.max(1.5, c / 16), () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + 0.5;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.32, Math.sin(a) * c * 0.32);
        }
      });
      shape(ctx, '#3a3d42', circle(ctx, 0, 0, c * 0.2), line);
      glow(ctx, 0, 0, c * 0.32, 'rgba(255, 140, 60, 0.5)');
      shape(ctx, '#e2561b', circle(ctx, 0, 0, c * 0.1), 0);
      for (const [x, y, r] of [[0.06, -0.2, 0.1], [-0.08, -0.32, 0.08], [0.1, -0.42, 0.06]] as const) shape(ctx, 'rgba(180, 190, 160, 0.45)', circle(ctx, x * c, y * c, r * c), 0);
      break;
    default:
      drawSets18(ctx, p, w, h, c);
  }
}
