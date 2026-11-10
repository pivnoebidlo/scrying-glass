// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A witch's swamp; a jungle temple; an ice castle; a volcano's forge.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, type Ctx } from './prop-paint';
import { drawSets12 } from './draw-sets12';

const DARK = '#2b2a2e';
const ICE = '#cfe6ee';
const ICE_DEEP = '#9cc6d6';
const TEMPLE = '#8a8a6a';

export const SET11_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  wisps: ['#8fe0c8', '#c8a0ff', '#ffe9a8'],
};
// Drawn once a cell when stretched.
export const SET11_TILED: Prop['kind'][] = ['herbs', 'wisps', 'traptiles', 'vinewall', 'icicles', 'obsidian'];

export function drawSets11(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A witch's swamp ----
    case 'witchhut':
      // A crooked hut on stilts: posts, a patched roof, smoke from the chimney.
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, '#3a2a1c', circle(ctx, x * (w / 2 - c * 0.12), y * (h / 2 - c * 0.12), c * 0.08), 0);
      ctx.save();
      ctx.rotate(0.08);
      shape(ctx, '#5c4a36', rect(ctx, L + c * 0.18, T + c * 0.18, w - c * 0.36, h - c * 0.36, c * 0.04), line);
      shape(ctx, '#4a3a2a', () => (ctx.moveTo(L + c * 0.18, T + c * 0.18), ctx.lineTo(0, 0), ctx.lineTo(L + c * 0.18, h / 2 - c * 0.18), ctx.closePath()), thin);
      shape(ctx, '#6b7a3a', rect(ctx, c * 0.1, -c * 0.4, c * 0.4, c * 0.3, c * 0.02), thin);
      shape(ctx, '#7a3d22', rect(ctx, -c * 0.4, c * 0.2, c * 0.3, c * 0.24), thin);
      ctx.restore();
      shape(ctx, '#4a463f', rect(ctx, w / 2 - c * 0.5, T + c * 0.26, c * 0.2, c * 0.2), thin);
      shape(ctx, 'rgba(160, 170, 150, 0.5)', circle(ctx, w / 2 - c * 0.3, T + c * 0.1, c * 0.16), 0);
      break;
    case 'herbs':
      lines(ctx, '#5c3d22', thin, () => (ctx.moveTo(-c * 0.44, -c * 0.3), ctx.lineTo(c * 0.44, -c * 0.3)));
      for (const [x, col] of [[-0.3, '#6f8a4a'], [-0.05, '#8a7a3a'], [0.2, '#5f7a6a'], [0.38, '#7a5a6a']] as const) {
        lines(ctx, col, Math.max(1.5, c / 16), () => {
          for (let k = -2; k <= 2; k++) (ctx.moveTo(x * c, -c * 0.3), ctx.lineTo(x * c + k * c * 0.03, c * 0.1));
        });
      }
      break;
    case 'wisps': {
      const col = SET11_TINTS.wisps![Math.floor(t * 3) % 3]!;
      for (const [x, y, r] of [[-0.2, -0.1, 0.07], [0.18, 0.08, 0.05], [0, 0.26, 0.06]] as const) {
        glow(ctx, x * c, y * c, r * c * 4, `${col}88`);
        shape(ctx, col, circle(ctx, x * c, y * c, r * c), 0);
      }
      break;
    }
    case 'skullpost':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(0, c * 0.36), ctx.lineTo(0, -c * 0.06)));
      shape(ctx, '#e8e2d0', circle(ctx, 0, -c * 0.16, c * 0.14), thin);
      for (const x of [-0.05, 0.05]) shape(ctx, DARK, circle(ctx, x * c, -c * 0.18, c * 0.03), 0);
      lines(ctx, '#7a3d22', thin, () => (ctx.moveTo(-c * 0.14, -c * 0.04), ctx.lineTo(-c * 0.24, c * 0.2), ctx.moveTo(c * 0.14, -c * 0.04), ctx.lineTo(c * 0.22, c * 0.22)));
      break;
    case 'fairyring':
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const x = Math.cos(a) * Math.min(w, h) * 0.4;
        const y = Math.sin(a) * Math.min(w, h) * 0.4;
        shape(ctx, k % 3 ? '#e8e2d0' : '#b33a2e', circle(ctx, x, y, c * 0.09), thin);
      }
      glow(ctx, 0, 0, Math.min(w, h) * 0.4, 'rgba(200, 180, 255, 0.25)');
      break;
    // ---- A jungle temple ----
    case 'pyramid': {
      // A stepped pyramid from above: terraces narrowing to a shrine, a stair up the front.
      for (let k = 0; k < 4; k++) {
        const s = 1 - k * 0.22;
        const g = 140 - k * 10;
        shape(ctx, `rgb(${g}, ${g}, ${g - 34})`, rect(ctx, -w * 0.46 * s, -h * 0.46 * s, w * 0.92 * s, h * 0.92 * s, c * 0.04), thin);
      }
      shape(ctx, '#6b6a50', rect(ctx, -w * 0.14, -h * 0.14, w * 0.28, h * 0.28), line);
      shape(ctx, '#a0a080', rect(ctx, -c * 0.4, -h * 0.14, c * 0.8, h * 0.6), thin);
      lines(ctx, 'rgba(40, 40, 30, 0.5)', thin, () => {
        for (let y = -h * 0.1; y < h * 0.46; y += c * 0.2) (ctx.moveTo(-c * 0.4, y), ctx.lineTo(c * 0.4, y));
      });
      break;
    }
    case 'serpent':
      shape(ctx, TEMPLE, rect(ctx, -c * 0.36, -c * 0.36, c * 0.72, c * 0.72, c * 0.04), line);
      lines(ctx, '#5f7a5a', Math.max(4, c / 7), () => (ctx.moveTo(-c * 0.24, c * 0.24), ctx.bezierCurveTo(c * 0.3, c * 0.2, -c * 0.3, -c * 0.1, c * 0.12, -c * 0.2)));
      shape(ctx, '#5f7a5a', () => ctx.ellipse(c * 0.16, -c * 0.22, c * 0.1, c * 0.07, -0.4, 0, Math.PI * 2), thin);
      shape(ctx, '#e8c14a', circle(ctx, c * 0.18, -c * 0.24, c * 0.02), 0);
      break;
    case 'sunaltar':
      shape(ctx, TEMPLE, circle(ctx, 0, 0, c * 0.4), line);
      lines(ctx, '#5c5a44', thin, () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2);
          ctx.lineTo(Math.cos(a) * c * 0.36, Math.sin(a) * c * 0.36);
        }
      });
      glow(ctx, 0, 0, c * 0.4, 'rgba(255, 200, 80, 0.5)');
      shape(ctx, '#e8c14a', circle(ctx, 0, 0, c * 0.14), thin);
      break;
    case 'traptiles':
      shape(ctx, '#8a8a6a', rect(ctx, -c * 0.46, -c * 0.46, c * 0.92, c * 0.92), 0);
      lines(ctx, 'rgba(40, 40, 30, 0.5)', thin, () => ctx.rect(-c * 0.46, -c * 0.46, c * 0.92, c * 0.92));
      shape(ctx, '#7a7a5c', rect(ctx, -c * 0.3, -c * 0.3, c * 0.6, c * 0.6, c * 0.02), thin);
      lines(ctx, '#5c5a44', thin, () => (ctx.moveTo(-c * 0.14, 0), ctx.lineTo(c * 0.14, 0), ctx.moveTo(0, -c * 0.14), ctx.lineTo(0, c * 0.14)));
      break;
    case 'vinewall':
      lines(ctx, '#2f5a26', Math.max(2, c / 12), () => {
        ctx.moveTo(-c * 0.5, -c * 0.1);
        ctx.bezierCurveTo(-c * 0.2, c * 0.3, c * 0.1, -c * 0.3, c * 0.5, c * 0.1);
        ctx.moveTo(-c * 0.2, -c * 0.5);
        ctx.quadraticCurveTo(c * 0.1, 0, -c * 0.1, c * 0.5);
      });
      for (const [x, y] of [[-0.35, 0.05], [-0.05, -0.05], [0.25, 0.0], [-0.12, -0.32], [-0.06, 0.3]] as const) shape(ctx, '#4f8f3c', () => ctx.ellipse(x * c, y * c, c * 0.08, c * 0.05, x * 3, 0, Math.PI * 2), 0);
      break;
    // ---- An ice castle ----
    case 'icepillar':
      shape(ctx, ICE_DEEP, () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * c * 0.36, Math.sin(a) * c * 0.36);
        }
        ctx.closePath();
      }, line);
      shape(ctx, ICE, () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2);
        }
        ctx.closePath();
      }, thin);
      lines(ctx, 'rgba(255, 255, 255, 0.9)', thin, () => (ctx.moveTo(-c * 0.14, -c * 0.1), ctx.lineTo(-c * 0.04, -c * 0.24)));
      break;
    case 'icethrone':
      shape(ctx, ICE_DEEP, () => {
        ctx.moveTo(-c * 0.4, -c * 0.1);
        for (let k = 0; k < 5; k++) ctx.lineTo(-c * 0.4 + k * c * 0.2, k % 2 ? -c * 0.46 : -c * 0.3);
        ctx.lineTo(c * 0.4, -c * 0.1);
        ctx.lineTo(c * 0.36, c * 0.36);
        ctx.lineTo(-c * 0.36, c * 0.36);
        ctx.closePath();
      }, line);
      shape(ctx, ICE, rect(ctx, -c * 0.24, -c * 0.06, c * 0.48, c * 0.36, c * 0.04), thin);
      break;
    case 'frozen':
      // Someone frozen in a block of ice.
      shape(ctx, 'rgba(180, 225, 240, 0.85)', rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8, c * 0.08), line);
      shape(ctx, 'rgba(90, 80, 100, 0.55)', circle(ctx, 0, -c * 0.12, c * 0.1), 0);
      lines(ctx, 'rgba(90, 80, 100, 0.55)', Math.max(2, c / 12), () => (ctx.moveTo(0, -c * 0.02), ctx.lineTo(0, c * 0.2), ctx.moveTo(-c * 0.2, -c * 0.12), ctx.lineTo(0, 0), ctx.lineTo(c * 0.22, -c * 0.16)));
      lines(ctx, 'rgba(255, 255, 255, 0.9)', thin, () => (ctx.moveTo(-c * 0.3, c * 0.2), ctx.lineTo(-c * 0.1, -c * 0.32)));
      break;
    case 'icicles':
      // Icicles hanging from a wall or a ceiling's edge.
      for (let x = -0.4; x <= 0.41; x += 0.16) shape(ctx, ICE, () => (ctx.moveTo((x - 0.06) * c, -c * 0.3), ctx.lineTo((x + 0.06) * c, -c * 0.3), ctx.lineTo(x * c, (0.1 + ((x * 10) % 3) * 0.08) * c), ctx.closePath()), thin);
      lines(ctx, ICE_DEEP, Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.48, -c * 0.32), ctx.lineTo(c * 0.48, -c * 0.32)));
      break;
    // ---- A volcano's forge ----
    case 'lavaforge':
      shape(ctx, '#3a3530', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.08), line);
      glow(ctx, 0, 0, Math.min(w, h) * 0.55, 'rgba(255, 90, 20, 0.7)');
      shape(ctx, '#e2561b', rect(ctx, L + c * 0.3, T + c * 0.3, w - c * 0.6, h - c * 0.6, c * 0.12), thin);
      for (const [x, y] of [[-0.2, -0.15], [0.15, 0.1], [0.05, -0.25]] as const) shape(ctx, '#ffd45a', circle(ctx, x * c, y * c, c * 0.07), 0);
      lines(ctx, '#55585e', Math.max(2, c / 10), () => (ctx.moveTo(L + c * 0.1, h / 2 - c * 0.1), ctx.lineTo(L + c * 0.5, h / 2 - c * 0.5)));
      break;
    case 'obsidian':
      for (const [x, y, s] of [[-0.18, -0.12, 0.2], [0.18, 0.08, 0.16], [-0.02, 0.24, 0.13]] as const) {
        shape(ctx, '#1d1b22', () => {
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 + x * 5;
            ctx.lineTo(x * c + Math.cos(a) * s * c, y * c + Math.sin(a) * s * c);
          }
          ctx.closePath();
        }, thin);
        lines(ctx, 'rgba(160, 140, 200, 0.6)', thin, () => (ctx.moveTo((x - s * 0.4) * c, y * c), ctx.lineTo((x + s * 0.2) * c, (y - s * 0.5) * c)));
      }
      break;
    case 'firevent':
      shape(ctx, '#3a3530', circle(ctx, 0, 0, c * 0.32), line);
      glow(ctx, 0, 0, c * 0.55, 'rgba(255, 120, 30, 0.75)');
      shape(ctx, '#e2561b', circle(ctx, 0, 0, c * 0.16), 0);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        shape(ctx, '#ffb84f', () => (ctx.moveTo(0, 0), ctx.lineTo(Math.cos(a - 0.15) * c * 0.38, Math.sin(a - 0.15) * c * 0.38), ctx.lineTo(Math.cos(a + 0.15) * c * 0.38, Math.sin(a + 0.15) * c * 0.38), ctx.closePath()), 0);
      }
      break;
    case 'giantanvil':
      shape(ctx, '#3a3d42', () => {
        ctx.moveTo(L + c * 0.06, -c * 0.16);
        ctx.lineTo(w / 2 - c * 0.5, -c * 0.16);
        ctx.quadraticCurveTo(w / 2 - c * 0.06, -c * 0.16, w / 2 - c * 0.06, 0);
        ctx.quadraticCurveTo(w / 2 - c * 0.06, c * 0.16, w / 2 - c * 0.5, c * 0.16);
        ctx.lineTo(L + c * 0.06, c * 0.16);
        ctx.closePath();
      }, line);
      shape(ctx, '#55585e', rect(ctx, L + c * 0.3, -c * 0.1, w - c * 0.9, c * 0.2, c * 0.02), 0);
      glow(ctx, -c * 0.2, 0, c * 0.3, 'rgba(255, 140, 40, 0.6)');
      shape(ctx, '#e2561b', rect(ctx, -c * 0.4, -c * 0.04, c * 0.4, c * 0.08, c * 0.02), 0);
      break;
    default:
      drawSets12(ctx, p, w, h, c);
  }
}
