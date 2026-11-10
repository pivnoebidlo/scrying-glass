// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A terraforming station; a speakeasy; a gym; a library and a newspaper office.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets23 } from './draw-sets23';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const HULL = '#d6d6cf';
const COPPER = '#c97a3a';

export const SET22_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  punchbag: ['#8a2f2b', '#2a2a2a', '#3f5d86'], newspapers: ['#efe7d3', '#d8cdb0'],
};
// Drawn once a cell when stretched.
export const SET22_TILED: Prop['kind'][] = ['dumbbells', 'newspapers', 'moonshine'];

export function drawSets22(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A terraforming station ----
    case 'terraformer': {
      // A great processor tower from above: rings of vents round a core.
      const r = Math.min(w, h) * 0.46;
      shape(ctx, 'rgba(20, 16, 10, 0.25)', circle(ctx, c * 0.14, c * 0.18, r), 0);
      shape(ctx, '#8d949c', circle(ctx, 0, 0, r), line);
      shape(ctx, '#6f7882', circle(ctx, 0, 0, r * 0.7), thin);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        shape(ctx, '#3a3d42', rect(ctx, Math.cos(a) * r * 0.85 - c * 0.08, Math.sin(a) * r * 0.85 - c * 0.08, c * 0.16, c * 0.16, c * 0.03), 0);
      }
      glow(ctx, 0, 0, r * 0.6, 'rgba(120, 220, 255, 0.5)');
      shape(ctx, '#bfefff', circle(ctx, 0, 0, r * 0.2), thin);
      for (let k = 0; k < 3; k++) shape(ctx, 'rgba(220, 230, 240, 0.4)', circle(ctx, r * 0.2 + k * c * 0.2, -r * 0.3 - k * c * 0.2, c * (0.2 + k * 0.06)), 0);
      break;
    }
    case 'atmoplant':
      shape(ctx, HULL, rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.2, c * 0.06), line);
      for (let x = L + c * 0.4; x < w / 2 - c * 0.2; x += c * 0.6) {
        shape(ctx, '#3f7d97', circle(ctx, x, 0, c * 0.22), thin);
        lines(ctx, '#2a5a70', thin, () => {
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            ctx.moveTo(x, 0);
            ctx.lineTo(x + Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2);
          }
        });
      }
      shape(ctx, '#5fcf7a', circle(ctx, w / 2 - c * 0.2, T + c * 0.24, c * 0.04), 0);
      break;
    case 'seedvault':
      shape(ctx, '#6f7882', rect(ctx, -c * 0.38, -c * 0.32, c * 0.76, c * 0.64, c * 0.06), line);
      for (let k = 0; k < 12; k++) {
        const x = -c * 0.27 + (k % 4) * c * 0.18;
        const y = -c * 0.2 + Math.floor(k / 4) * c * 0.2;
        shape(ctx, 'rgba(180, 230, 190, 0.85)', rect(ctx, x - c * 0.07, y - c * 0.07, c * 0.14, c * 0.14, c * 0.03), 0);
        shape(ctx, '#5f8a3a', circle(ctx, x, y, c * 0.035), 0);
      }
      break;
    case 'soilbeds':
      shape(ctx, '#8d949c', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.04), thin);
      for (let y = T + c * 0.2; y < h / 2 - c * 0.15; y += c * 0.5) {
        shape(ctx, '#5c4a36', rect(ctx, L + c * 0.16, y, w - c * 0.32, c * 0.32, c * 0.04), 0);
        for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.24) shape(ctx, '#7fbf5a', circle(ctx, x, y + c * 0.16, c * 0.06), 0);
      }
      break;
    // ---- A speakeasy ----
    case 'moonshine':
      // A copper still: pot, coil and a jug.
      shape(ctx, COPPER, circle(ctx, -c * 0.12, 0, c * 0.24), line);
      shape(ctx, '#a0582e', circle(ctx, -c * 0.12, 0, c * 0.1), 0);
      lines(ctx, COPPER, Math.max(2, c / 14), () => {
        ctx.moveTo(c * 0.08, -c * 0.1);
        for (let k = 0; k < 3; k++) ctx.ellipse(c * 0.26, -c * 0.06 + k * c * 0.08, c * 0.1, c * 0.04, 0, Math.PI, Math.PI * 3);
      });
      shape(ctx, '#d6cdb5', circle(ctx, c * 0.28, c * 0.28, c * 0.09), thin);
      break;
    case 'hiddenbar':
      // A bar behind a sliding bookcase.
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, c * 0.4, c * 0.03), line);
      for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.14) shape(ctx, ['#5a2a1a', '#2f4a2a', '#c9a442', '#7a5432'][Math.round((x - L) / (c * 0.14)) % 4]!, circle(ctx, x, T + c * 0.26, c * 0.05), 0);
      shape(ctx, tone(WOOD, 0.5), rect(ctx, L + c * 0.06, T + c * 0.6, w - c * 0.12, c * 0.3, c * 0.06), line);
      glow(ctx, 0, T + c * 0.6, w * 0.4, 'rgba(255, 190, 110, 0.4)');
      for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.45) shape(ctx, '#7a1f2b', circle(ctx, x, h / 2 - c * 0.2, c * 0.12), thin);
      break;
    case 'slotdoor':
      // A door with a sliding peephole: put it in the wall.
      shape(ctx, tone(WOOD, 0.35), rect(ctx, -c * 0.4, -c * 0.16, c * 0.8, c * 0.32, c * 0.02), line);
      shape(ctx, '#1d1b1e', rect(ctx, -c * 0.14, -c * 0.06, c * 0.28, c * 0.07, c * 0.01), 0);
      shape(ctx, '#e8c14a', circle(ctx, c * 0.0, -c * 0.02, c * 0.02), 0);
      shape(ctx, '#c9a442', circle(ctx, c * 0.28, c * 0.04, c * 0.04), thin);
      break;
    case 'pokertable':
      shape(ctx, tone(WOOD, 0.3), () => ctx.ellipse(0, 0, w * 0.46, h * 0.42, 0, 0, Math.PI * 2), line);
      shape(ctx, '#2f6a3a', () => ctx.ellipse(0, 0, w * 0.38, h * 0.34, 0, 0, Math.PI * 2), thin);
      for (const [x, y, col] of [[-0.2, -0.1, '#b33a2e'], [-0.14, -0.06, '#efe7d3'], [0.2, 0.1, '#3f5d86'], [0, 0.14, '#efe7d3']] as const) shape(ctx, col, circle(ctx, x * w, y * h, c * 0.06), thin);
      shape(ctx, 'rgba(200, 200, 190, 0.35)', circle(ctx, w * 0.1, -h * 0.2, c * 0.2), 0);
      break;
    // ---- A gym ----
    case 'treadmill':
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.3, T + c * 0.06, c * 0.6, h - c * 0.12, c * 0.08), line);
      shape(ctx, '#1d1b1e', rect(ctx, -c * 0.22, T + c * 0.3, c * 0.44, h - c * 0.44, c * 0.04), 0);
      lines(ctx, '#3a3d42', thin, () => {
        for (let y = T + c * 0.4; y < h / 2 - c * 0.14; y += c * 0.14) (ctx.moveTo(-c * 0.22, y), ctx.lineTo(c * 0.22, y));
      });
      shape(ctx, '#55585e', rect(ctx, -c * 0.26, T + c * 0.08, c * 0.52, c * 0.18, c * 0.04), thin);
      shape(ctx, '#5fd3c9', rect(ctx, -c * 0.12, T + c * 0.12, c * 0.24, c * 0.08), 0);
      break;
    case 'weightbench':
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.14, T + c * 0.1, c * 0.28, h - c * 0.2, c * 0.06), line);
      lines(ctx, '#a3a9ad', Math.max(2, c / 14), () => (ctx.moveTo(-c * 0.46, T + c * 0.36), ctx.lineTo(c * 0.46, T + c * 0.36)));
      for (const x of [-0.4, 0.4]) shape(ctx, '#1d1b1e', rect(ctx, x * c - c * 0.05, T + c * 0.16, c * 0.1, c * 0.4, c * 0.03), thin);
      break;
    case 'punchbag':
      shape(ctx, tone(SET22_TINTS.punchbag!, t), circle(ctx, 0, 0, c * 0.26), line);
      shape(ctx, 'rgba(255, 255, 255, 0.15)', circle(ctx, -c * 0.07, -c * 0.07, c * 0.1), 0);
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.06), thin);
      break;
    case 'dumbbells':
      for (const [y, s] of [[-0.18, 0.8], [0.02, 1], [0.24, 1.2]] as const) {
        lines(ctx, '#a3a9ad', Math.max(2, c / 16), () => (ctx.moveTo(-c * 0.22 * s, y * c), ctx.lineTo(c * 0.22 * s, y * c)));
        for (const x of [-0.22, 0.22]) shape(ctx, '#1d1b1e', rect(ctx, x * s * c - c * 0.04, y * c - c * 0.07 * s, c * 0.08, c * 0.14 * s, c * 0.02), 0);
      }
      break;
    case 'boxingring':
      shape(ctx, '#3f5d86', rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2), line);
      shape(ctx, '#d6d2c8', rect(ctx, L + c * 0.3, T + c * 0.3, w - c * 0.6, h - c * 0.6), 0);
      lines(ctx, '#b33a2e', Math.max(2, c / 14), () => {
        for (const d of [0.22, 0.32]) ctx.rect(L + c * d, T + c * d, w - c * d * 2, h - c * d * 2);
      });
      for (const [x, y, col] of [[-1, -1, '#b33a2e'], [1, 1, '#3f5d86'], [1, -1, '#efefef'], [-1, 1, '#efefef']] as const) shape(ctx, col, circle(ctx, x * (w / 2 - c * 0.22), y * (h / 2 - c * 0.22), c * 0.1), thin);
      break;
    // ---- A library and a newspaper office ----
    case 'readingtable':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.08, -c * 0.3, w - c * 0.16, c * 0.6, c * 0.03), line);
      for (let x = L + c * 0.5; x < w / 2 - c * 0.3; x += c) {
        glow(ctx, x, -c * 0.1, c * 0.3, 'rgba(255, 220, 140, 0.5)');
        shape(ctx, '#2f6a3a', () => ctx.ellipse(x, -c * 0.14, c * 0.14, c * 0.06, 0, 0, Math.PI * 2), thin);
        shape(ctx, '#efe7d3', rect(ctx, x - c * 0.14, c * 0.02, c * 0.28, c * 0.18, c * 0.01), thin);
      }
      break;
    case 'cardcatalog':
      shape(ctx, tone(WOOD, 0.5), rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.03), line);
      for (let x = L + c * 0.14; x < w / 2 - c * 0.1; x += c * 0.2) for (const y of [-0.2, 0, 0.2]) {
        shape(ctx, tone(WOOD, 0.65), rect(ctx, x, y * c - c * 0.07, c * 0.16, c * 0.14, c * 0.01), 0);
        shape(ctx, '#c9a442', circle(ctx, x + c * 0.08, y * c, c * 0.015), 0);
      }
      break;
    case 'printpress':
      shape(ctx, '#3a3d42', rect(ctx, L + c * 0.08, T + c * 0.12, w - c * 0.16, h - c * 0.24, c * 0.04), line);
      for (let x = L + c * 0.4; x < w / 2 - c * 0.3; x += c * 0.5) shape(ctx, '#6f7882', rect(ctx, x - c * 0.14, T + c * 0.2, c * 0.28, h - c * 0.4, c * 0.12), thin);
      shape(ctx, '#efe7d3', rect(ctx, w / 2 - c * 0.4, -c * 0.2, c * 0.4, c * 0.4), thin);
      lines(ctx, DARK, thin, () => {
        for (const y of [-0.12, -0.04, 0.04, 0.12]) (ctx.moveTo(w / 2 - c * 0.36, y * c), ctx.lineTo(w / 2 - c * 0.04, y * c));
      });
      break;
    case 'newspapers': {
      const col = tone(SET22_TINTS.newspapers!, t);
      for (const [x, y, a] of [[-0.12, -0.08, 0.1], [0.08, 0.04, -0.2], [-0.02, 0.18, 0.4]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, col, rect(ctx, -c * 0.24, -c * 0.16, c * 0.48, c * 0.32, c * 0.01), thin);
        lines(ctx, DARK, Math.max(1.5, c / 18), () => (ctx.moveTo(-c * 0.2, -c * 0.1), ctx.lineTo(c * 0.2, -c * 0.1)));
        lines(ctx, 'rgba(40, 40, 40, 0.5)', thin, () => {
          for (const yy of [-0.02, 0.04, 0.1]) (ctx.moveTo(-c * 0.2, yy * c), ctx.lineTo(c * 0.2, yy * c));
        });
        ctx.restore();
      }
      break;
    }
    case 'newsdesk':
      shape(ctx, tone(WOOD, 0.6), rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.03), line);
      shape(ctx, '#3a3530', rect(ctx, -c * 0.2, -c * 0.24, c * 0.4, c * 0.24, c * 0.03), thin);
      for (let k = 0; k < 6; k++) shape(ctx, '#efe7d3', circle(ctx, -c * 0.12 + (k % 3) * c * 0.12, -c * 0.16 + Math.floor(k / 3) * c * 0.08, c * 0.025), 0);
      shape(ctx, '#efe7d3', rect(ctx, L + c * 0.16, -c * 0.2, c * 0.3, c * 0.4, c * 0.01), thin);
      shape(ctx, tone(CLOTH, 0.1), circle(ctx, w / 2 - c * 0.3, c * 0.1, c * 0.1), thin);
      shape(ctx, '#5c3d22', circle(ctx, w / 2 - c * 0.3, c * 0.1, c * 0.06), 0);
      break;
    default:
      drawSets23(ctx, p, w, h, c);
  }
}
