// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A cyberpunk quarter; an alien hive; a mad scientist's lab; a hospital; a police station.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const NEON = ['#ff4fa8', '#4fd6ff', '#b4ff4f', '#ffb84f'];
const RESIN = ['#3a3240', '#2f3a33', '#40322a'];

export const SET14_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  hoverbike: NEON, graffiti: NEON, hivewall: RESIN, curtainscreen: ['#9fc3cc', '#d6d2c8', '#b8d4a0'],
};
// Drawn once a cell when stretched.
export const SET14_TILED: Prop['kind'][] = ['hivewall', 'spines', 'nestpods'];

export function drawSets14(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A cyberpunk quarter ----
    case 'noodlestand':
      shape(ctx, '#3a3d42', rect(ctx, L + c * 0.06, T + c * 0.2, w - c * 0.12, h - c * 0.32, c * 0.04), line);
      shape(ctx, '#ff4fa8', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, c * 0.16, c * 0.02), 0);
      glow(ctx, 0, T + c * 0.14, Math.max(w, c) * 0.5, 'rgba(255, 80, 170, 0.35)');
      for (const x of [-0.5, 0, 0.5]) {
        shape(ctx, '#efe7d3', circle(ctx, x * c, c * 0.08, c * 0.12), thin);
        lines(ctx, '#e8c14a', thin, () => (ctx.moveTo(x * c - c * 0.06, c * 0.06), ctx.quadraticCurveTo(x * c, c * 0.14, x * c + c * 0.06, c * 0.06)));
      }
      break;
    case 'cables':
      for (let x = L + c / 2; x < w / 2; x += c) {
        ctx.save();
        ctx.translate(x, 0);
        for (const [col, d] of [['#1d1b1e', 0], ['#3a3d42', 0.12], ['#7a1f2b', -0.12]] as const)
          lines(ctx, col, Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.5, d * c), ctx.bezierCurveTo(-c * 0.15, (d + 0.3) * c, c * 0.15, (d - 0.3) * c, c * 0.5, d * c)));
        ctx.restore();
      }
      break;
    case 'graffiti':
      for (let x = L + c / 2; x < w / 2; x += c) {
        ctx.save();
        ctx.translate(x, 0);
        // Paint sprayed on a wall: put it on wall cells.
        const col = tone(NEON, t);
        lines(ctx, col, Math.max(2, c / 10), () => {
          ctx.moveTo(-c * 0.4, c * 0.1);
          ctx.quadraticCurveTo(-c * 0.3, -c * 0.2, -c * 0.15, c * 0.05);
          ctx.quadraticCurveTo(0, c * 0.2, c * 0.1, -c * 0.1);
          ctx.lineTo(c * 0.4, c * 0.08);
        });
        lines(ctx, NEON[(Math.floor(t * 4) + 1) % 4]!, Math.max(1.5, c / 16), () => (ctx.moveTo(-c * 0.3, c * 0.2), ctx.lineTo(c * 0.3, c * 0.2)));
        ctx.restore();
      }
      break;
    case 'hoverbike':
      glow(ctx, 0, 0, Math.max(w, h) * 0.45, `${tone(NEON, t)}44`);
      shape(ctx, tone(NEON, t), () => ctx.ellipse(0, 0, w * 0.26, h * 0.42, 0, 0, Math.PI * 2), line);
      shape(ctx, DARK, () => ctx.ellipse(0, c * 0.1, w * 0.14, h * 0.2, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#8d949c', Math.max(2, c / 12), () => (ctx.moveTo(-w * 0.34, T + c * 0.3), ctx.lineTo(w * 0.34, T + c * 0.3)));
      break;
    case 'cyberchair':
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.3, -c * 0.4, c * 0.6, c * 0.8, c * 0.16), line);
      shape(ctx, '#55585e', rect(ctx, -c * 0.2, -c * 0.24, c * 0.4, c * 0.5, c * 0.1), thin);
      lines(ctx, '#4fd6ff', thin, () => {
        for (const a of [-0.6, 0, 0.6]) (ctx.moveTo(0, -c * 0.36), ctx.quadraticCurveTo(Math.sin(a) * c * 0.4, -c * 0.5, Math.sin(a) * c * 0.5, -c * 0.3));
      });
      glow(ctx, 0, -c * 0.36, c * 0.24, 'rgba(80, 210, 255, 0.5)');
      break;
    // ---- An alien hive ----
    case 'hivewall':
      shape(ctx, tone(RESIN, t), rect(ctx, -c / 2, -c / 2, c, c), 0);
      lines(ctx, 'rgba(160, 140, 170, 0.35)', Math.max(1.5, c / 16), () => {
        ctx.moveTo(-c * 0.5, -c * 0.2);
        ctx.bezierCurveTo(-c * 0.2, c * 0.1, c * 0.1, -c * 0.4, c * 0.5, -c * 0.1);
        ctx.moveTo(-c * 0.5, c * 0.3);
        ctx.bezierCurveTo(-c * 0.1, c * 0.1, c * 0.2, c * 0.5, c * 0.5, c * 0.25);
      });
      break;
    case 'broodmother': {
      // A great swollen sac with pulsing veins.
      const r = Math.min(w, h) * 0.44;
      glow(ctx, 0, 0, r * 1.2, 'rgba(160, 230, 120, 0.3)');
      shape(ctx, '#5a4a5e', () => ctx.ellipse(0, 0, r, r * 0.86, 0.3, 0, Math.PI * 2), line);
      lines(ctx, '#9ae07a', Math.max(1.5, c / 16), () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(Math.cos(a + 0.5) * r * 0.5, Math.sin(a + 0.5) * r * 0.5, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.8);
        }
      });
      shape(ctx, '#7a5a7e', circle(ctx, 0, 0, r * 0.22), thin);
      break;
    }
    case 'spines':
      for (const [x, y, a] of [[-0.2, -0.1, -0.6], [0.16, -0.16, 0.4], [0, 0.18, 1.6], [0.24, 0.2, 2.6]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#d6cdb5', () => (ctx.moveTo(-c * 0.05, 0), ctx.lineTo(c * 0.05, 0), ctx.lineTo(0, -c * 0.3), ctx.closePath()), thin);
        ctx.restore();
      }
      break;
    case 'nestpods':
      for (const [x, y] of [[-0.2, -0.14], [0.18, -0.08], [0, 0.2]] as const) {
        shape(ctx, '#5a4a5e', () => ctx.ellipse(x * c, y * c, c * 0.14, c * 0.18, x, 0, Math.PI * 2), thin);
        shape(ctx, 'rgba(160, 230, 120, 0.6)', circle(ctx, x * c, y * c, c * 0.05), 0);
      }
      break;
    // ---- A mad scientist's lab ----
    case 'operatingtable':
      shape(ctx, '#8d949c', rect(ctx, -c * 0.3, T + c * 0.08, c * 0.6, h - c * 0.16, c * 0.04), line);
      shape(ctx, '#d6d2c8', rect(ctx, -c * 0.22, T + c * 0.16, c * 0.44, h - c * 0.32, c * 0.04), thin);
      for (let y = T + c * 0.4; y < h / 2 - c * 0.2; y += c * 0.45) shape(ctx, '#5c3d22', rect(ctx, -c * 0.3, y, c * 0.6, c * 0.08), 0);
      shape(ctx, 'rgba(120, 30, 30, 0.6)', circle(ctx, c * 0.08, c * 0.2, c * 0.06), 0);
      break;
    case 'brainjar':
      shape(ctx, 'rgba(160, 220, 200, 0.6)', circle(ctx, 0, 0, c * 0.26), line);
      shape(ctx, '#d9a0a6', () => ctx.ellipse(0, 0, c * 0.15, c * 0.12, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#a06a70', thin, () => (ctx.moveTo(0, -c * 0.12), ctx.lineTo(0, c * 0.12), ctx.moveTo(-c * 0.1, -c * 0.04), ctx.quadraticCurveTo(-c * 0.04, c * 0.02, -c * 0.1, c * 0.06)));
      glow(ctx, 0, 0, c * 0.36, 'rgba(140, 255, 200, 0.4)');
      lines(ctx, IRON, Math.max(2, c / 12), () => ctx.arc(0, 0, c * 0.28, 0, Math.PI * 2));
      break;
    case 'switchboard':
      // Levers and dials on a wall: put it on the wall.
      shape(ctx, '#3a3d42', rect(ctx, L + c * 0.04, -c * 0.18, w - c * 0.08, c * 0.36, c * 0.03), line);
      for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.28) {
        lines(ctx, '#c9c2b0', Math.max(1.5, c / 16), () => (ctx.moveTo(x, c * 0.08), ctx.lineTo(x + c * 0.06, -c * 0.08)));
        shape(ctx, '#b33a2e', circle(ctx, x + c * 0.06, -c * 0.08, c * 0.04), 0);
      }
      shape(ctx, '#efe7d3', circle(ctx, w / 2 - c * 0.2, 0, c * 0.08), thin);
      break;
    case 'specimenshelf':
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.04, T + c * 0.1, w - c * 0.08, c * 0.34), line);
      for (let x = L + c * 0.2; x < w / 2 - c * 0.12; x += c * 0.24) {
        shape(ctx, 'rgba(180, 220, 160, 0.7)', circle(ctx, x, T + c * 0.27, c * 0.1), thin);
        shape(ctx, ['#8a5a6a', '#6a7a4a', '#a07a5a'][Math.floor(((x - L) / c) * 3) % 3]!, circle(ctx, x, T + c * 0.27, c * 0.05), 0);
      }
      break;
    // ---- A hospital ----
    case 'hospitalbed':
      shape(ctx, '#8d949c', rect(ctx, -c * 0.32, T + c * 0.06, c * 0.64, h - c * 0.12, c * 0.04), line);
      shape(ctx, '#e8eef0', rect(ctx, -c * 0.26, T + c * 0.12, c * 0.52, h - c * 0.24, c * 0.04), thin);
      shape(ctx, '#9fc3cc', rect(ctx, -c * 0.26, T + c * 0.5, c * 0.52, h - c * 0.62, c * 0.04), thin);
      shape(ctx, '#ffffff', rect(ctx, -c * 0.18, T + c * 0.16, c * 0.36, c * 0.22, c * 0.06), thin);
      break;
    case 'ivdrip':
      lines(ctx, IRON, Math.max(1.5, c / 16), () => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2);
        }
      });
      shape(ctx, 'rgba(200, 230, 240, 0.85)', rect(ctx, -c * 0.1, -c * 0.12, c * 0.2, c * 0.24, c * 0.04), thin);
      lines(ctx, '#9fc3cc', thin, () => (ctx.moveTo(0, c * 0.12), ctx.quadraticCurveTo(c * 0.3, c * 0.3, c * 0.44, c * 0.1)));
      break;
    case 'wheelchair':
      for (const x of [-0.28, 0.28]) shape(ctx, DARK, rect(ctx, x * c - c * 0.05, -c * 0.24, c * 0.1, c * 0.4, c * 0.04), 0);
      shape(ctx, '#3f5d86', rect(ctx, -c * 0.22, -c * 0.2, c * 0.44, c * 0.36, c * 0.06), line);
      lines(ctx, '#8d949c', Math.max(1.5, c / 16), () => (ctx.moveTo(-c * 0.2, c * 0.3), ctx.lineTo(c * 0.2, c * 0.3)));
      break;
    case 'curtainscreen': {
      // A hospital curtain on its rail: stretch it round a bed.
      const col = tone(SET14_TINTS.curtainscreen!, t);
      lines(ctx, '#8d949c', thin, () => (ctx.moveTo(L + c * 0.04, 0), ctx.lineTo(w / 2 - c * 0.04, 0)));
      lines(ctx, col, Math.max(3, c / 8), () => {
        ctx.moveTo(L + c * 0.06, 0);
        for (let x = L + c * 0.06; x < w / 2 - c * 0.06; x += c * 0.16) ctx.quadraticCurveTo(x + c * 0.04, c * 0.08, x + c * 0.08, 0), ctx.quadraticCurveTo(x + c * 0.12, -c * 0.08, x + c * 0.16, 0);
      });
      break;
    }
    case 'lightbox':
      // An X-ray light box on a wall: put it on the wall.
      shape(ctx, '#8d949c', rect(ctx, -c * 0.4, -c * 0.12, c * 0.8, c * 0.24, c * 0.02), line);
      shape(ctx, '#e8f4ff', rect(ctx, -c * 0.34, -c * 0.08, c * 0.68, c * 0.16), 0);
      glow(ctx, 0, c * 0.1, c * 0.4, 'rgba(220, 240, 255, 0.4)');
      lines(ctx, '#3a4a5a', thin, () => {
        for (let y = -0.05; y < 0.06; y += 0.03) (ctx.moveTo(-c * 0.16, y * c), ctx.quadraticCurveTo(0, (y + 0.02) * c, c * 0.16, y * c));
        ctx.moveTo(0, -c * 0.08);
        ctx.lineTo(0, c * 0.08);
      });
      break;
    // ---- A police station ----
    case 'policecar':
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.22, T + c * 0.18, w - c * 0.3, h - c * 0.26, c * 0.3), 0);
      shape(ctx, '#1d2430', rect(ctx, L + c * 0.14, T + c * 0.1, w - c * 0.28, h - c * 0.2, c * 0.34), line);
      shape(ctx, '#efefef', rect(ctx, L + c * 0.2, T + h * 0.38, w - c * 0.4, h * 0.24, c * 0.06), 0);
      shape(ctx, '#3a4a58', rect(ctx, L + c * 0.26, T + h * 0.26, w - c * 0.52, h * 0.12, c * 0.06), thin);
      for (const [x, col] of [[-0.2, '#e0523a'], [0.2, '#3f8ae0']] as const) {
        shape(ctx, col, rect(ctx, x * c - c * 0.12, T + h * 0.48, c * 0.24, c * 0.1, c * 0.03), 0);
        glow(ctx, x * c, T + h * 0.53, c * 0.4, col === '#e0523a' ? 'rgba(255, 80, 60, 0.4)' : 'rgba(80, 140, 255, 0.4)');
      }
      break;
    case 'mugshot':
      // A height chart on a wall: put it on the wall.
      shape(ctx, '#d6d6cf', rect(ctx, L + c * 0.04, -c * 0.16, w - c * 0.08, c * 0.32), thin);
      lines(ctx, DARK, thin, () => {
        for (let x = L + c * 0.12; x < w / 2 - c * 0.08; x += c * 0.12) (ctx.moveTo(x, -c * 0.16), ctx.lineTo(x, (Math.round((x - L) / (c * 0.12)) % 4 ? -0.08 : 0) * c));
      });
      break;
    case 'barrier':
      // A police barrier in a line: stretch it across a street.
      for (let x = L + c * 0.1; x < w / 2; x += c) shape(ctx, IRON, rect(ctx, x, -c * 0.16, c * 0.08, c * 0.32), 0);
      shape(ctx, '#efefef', rect(ctx, L + c * 0.04, -c * 0.08, w - c * 0.08, c * 0.16, c * 0.02), thin);
      lines(ctx, '#3f5d86', Math.max(2, c / 10), () => {
        for (let x = L + c * 0.12; x < w / 2 - c * 0.08; x += c * 0.3) (ctx.moveTo(x, c * 0.06), ctx.lineTo(x + c * 0.12, -c * 0.06));
      });
      break;
  }
}
