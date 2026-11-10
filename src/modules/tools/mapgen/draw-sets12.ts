// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A space station; a Mars colony; a detective's office and a casino (noir); an office and the metro (modern); a shelter
// in the wasteland, built in the atomic age.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets13 } from './draw-sets13';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const HULL = '#d6d6cf';
const SCREEN = '#5fd3c9';
const FELT = '#2f6a3a';
const OLIVE = '#6b7346';

export const SET12_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  colonyflag: CLOTH, subwaycar: ['#8d949c', '#3f5170', '#b33a2e'], cans: ['#b33a2e', '#c9a442', '#3f5d86'],
};
// Drawn once a cell when stretched.
export const SET12_TILED: Prop['kind'][] = ['oxygen', 'cans'];

export function drawSets12(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  const stripes = (x: number, y: number, ww: number, hh: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, ww, hh);
    ctx.clip();
    ctx.fillStyle = '#e8c14a';
    ctx.fillRect(x, y, ww, hh);
    ctx.strokeStyle = DARK;
    ctx.lineWidth = c * 0.08;
    ctx.beginPath();
    for (let k = -hh; k < ww + hh; k += c * 0.2) (ctx.moveTo(x + k, y + hh), ctx.lineTo(x + k + hh, y));
    ctx.stroke();
    ctx.restore();
  };
  switch (p.kind) {
    // ---- A space station ----
    case 'airlock': {
      // A round airlock door in a bulkhead: put it on the wall.
      const r = Math.min(w, h) * 0.46;
      shape(ctx, '#6f7882', circle(ctx, 0, 0, r), line);
      shape(ctx, '#8d949c', circle(ctx, 0, 0, r * 0.76), thin);
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(-r * 0.76, 0), ctx.lineTo(r * 0.76, 0)));
      shape(ctx, '#e8c14a', circle(ctx, 0, 0, r * 0.18), thin);
      for (let k = 0; k < 8; k++) shape(ctx, '#e0523a', circle(ctx, Math.cos((k * Math.PI) / 4) * r * 0.88, Math.sin((k * Math.PI) / 4) * r * 0.88, c * 0.04), 0);
      break;
    }
    case 'hydroponics':
      shape(ctx, HULL, rect(ctx, L + c * 0.06, T + c * 0.14, w - c * 0.12, h - c * 0.28, c * 0.04), line);
      glow(ctx, 0, 0, Math.max(w, h) * 0.4, 'rgba(220, 120, 255, 0.25)');
      for (let x = L + c * 0.24; x < w / 2 - c * 0.15; x += c * 0.24) for (const y of [-0.12, 0.12]) shape(ctx, '#5fcf7a', circle(ctx, x, y * c, c * 0.08), 0);
      break;
    case 'oxygen':
      for (const [x, y] of [[-0.18, -0.12], [0.16, -0.1], [0, 0.18]] as const) {
        shape(ctx, '#d6d6cf', circle(ctx, x * c, y * c, c * 0.14), thin);
        shape(ctx, '#3f8ae0', circle(ctx, x * c, y * c, c * 0.06), 0);
      }
      break;
    case 'spacesuit':
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.36, -c * 0.1), ctx.lineTo(c * 0.36, -c * 0.1)));
      shape(ctx, '#efe7d3', () => ctx.ellipse(0, c * 0.06, c * 0.24, c * 0.18, 0, 0, Math.PI * 2), line);
      shape(ctx, '#efe7d3', circle(ctx, 0, -c * 0.12, c * 0.14), thin);
      shape(ctx, '#e8a14f', circle(ctx, 0, -c * 0.12, c * 0.09), 0);
      shape(ctx, '#8d949c', rect(ctx, -c * 0.12, c * 0.08, c * 0.24, c * 0.12, c * 0.03), 0);
      break;
    case 'starwindow':
      // A window onto space on a bulkhead: put it on the wall.
      shape(ctx, '#55585e', rect(ctx, L + c * 0.04, -c * 0.18, w - c * 0.08, c * 0.36, c * 0.1), line);
      shape(ctx, '#0b0d1e', rect(ctx, L + c * 0.12, -c * 0.12, w - c * 0.24, c * 0.24, c * 0.06), 0);
      for (let k = 0; k < Math.round(w / c) * 5; k++) shape(ctx, '#f0f0ff', circle(ctx, L + c * 0.14 + ((k * 37) % 100) / 100 * (w - c * 0.28), -c * 0.1 + ((k * 61) % 100) / 100 * c * 0.2, c * 0.012 * (1 + (k % 3))), 0);
      break;
    // ---- A Mars colony ----
    case 'habdome': {
      const r = Math.min(w, h) * 0.46;
      shape(ctx, 'rgba(20, 16, 10, 0.3)', circle(ctx, c * 0.15, c * 0.2, r), 0);
      shape(ctx, 'rgba(210, 225, 235, 0.95)', circle(ctx, 0, 0, r), line);
      lines(ctx, 'rgba(120, 130, 140, 0.6)', thin, () => {
        for (const k of [0.33, 0.66]) ctx.arc(0, 0, r * k, 0, Math.PI * 2);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) (ctx.moveTo(0, 0), ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r));
      });
      shape(ctx, '#8d949c', rect(ctx, -c * 0.2, r - c * 0.1, c * 0.4, c * 0.3, c * 0.06), thin);
      break;
    }
    case 'rocket':
      shape(ctx, 'rgba(30, 20, 10, 0.3)', circle(ctx, 0, 0, Math.min(w, h) * 0.46), 0);
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
        shape(ctx, '#b33a2e', () => (ctx.moveTo(Math.cos(a - 0.3) * c * 0.3, Math.sin(a - 0.3) * c * 0.3), ctx.lineTo(Math.cos(a) * Math.min(w, h) * 0.46, Math.sin(a) * Math.min(w, h) * 0.46), ctx.lineTo(Math.cos(a + 0.3) * c * 0.3, Math.sin(a + 0.3) * c * 0.3), ctx.closePath()), thin);
      }
      shape(ctx, HULL, circle(ctx, 0, 0, c * 0.34), line);
      shape(ctx, '#8d949c', circle(ctx, 0, 0, c * 0.2), thin);
      shape(ctx, '#3a4048', circle(ctx, 0, 0, c * 0.08), 0);
      break;
    case 'extractor':
      shape(ctx, '#8d949c', rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.64, c * 0.08), line);
      shape(ctx, '#3f7d97', circle(ctx, 0, 0, c * 0.18), thin);
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(c * 0.32, 0), ctx.lineTo(c * 0.48, 0)));
      shape(ctx, SCREEN, circle(ctx, -c * 0.2, -c * 0.2, c * 0.04), 0);
      break;
    case 'colonyflag':
      lines(ctx, '#8d949c', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, c * 0.4), ctx.lineTo(-c * 0.3, -c * 0.4)));
      shape(ctx, tone(CLOTH, t), rect(ctx, -c * 0.3, -c * 0.4, c * 0.62, c * 0.36, c * 0.02), thin);
      shape(ctx, '#efe7d3', circle(ctx, 0, -c * 0.22, c * 0.08), 0);
      break;
    // ---- A detective's office and a casino ----
    case 'corkboard':
      // Evidence pinned to a board and joined with red string: put it on the wall.
      shape(ctx, '#b88f55', rect(ctx, L + c * 0.06, -c * 0.12, w - c * 0.12, c * 0.3, c * 0.02), line);
      const pins: [number, number][] = [];
      for (let x = L + c * 0.24; x < w / 2 - c * 0.15; x += c * 0.34) {
        const y = -c * 0.06 + ((x * 7) % 0.1) * c;
        shape(ctx, '#efe7d3', rect(ctx, x - c * 0.1, y - c * 0.02, c * 0.2, c * 0.14), thin);
        pins.push([x, y]);
      }
      lines(ctx, '#b33a2e', thin, () => pins.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))));
      break;
    case 'coatrack':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.4;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.22, Math.sin(a) * c * 0.22);
        }
      });
      shape(ctx, '#3a3530', () => ctx.ellipse(c * 0.1, c * 0.04, c * 0.22, c * 0.1, 0.4, 0, Math.PI * 2), thin);
      shape(ctx, DARK, circle(ctx, -c * 0.12, -c * 0.1, c * 0.14), thin);
      shape(ctx, '#3a3530', circle(ctx, -c * 0.12, -c * 0.1, c * 0.08), 0);
      break;
    case 'roulette': {
      const r = Math.min(w, h) * 0.24;
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.14), line);
      shape(ctx, FELT, rect(ctx, L + c * 0.14, T + c * 0.14, w - c * 0.28, h - c * 0.28, c * 0.08), thin);
      shape(ctx, '#3a2a1c', circle(ctx, 0, -h * 0.18, r), thin);
      for (let k = 0; k < 18; k++) shape(ctx, k % 2 ? '#b33a2e' : DARK, () => (ctx.moveTo(0, -h * 0.18), ctx.arc(0, -h * 0.18, r * 0.86, (k / 18) * Math.PI * 2, ((k + 1) / 18) * Math.PI * 2), ctx.closePath()), 0);
      shape(ctx, '#c9a442', circle(ctx, 0, -h * 0.18, r * 0.3), 0);
      lines(ctx, 'rgba(255, 255, 255, 0.4)', thin, () => {
        for (let x = -w * 0.3; x < w * 0.32; x += c * 0.2) (ctx.moveTo(x, h * 0.08), ctx.lineTo(x, h * 0.34));
      });
      break;
    }
    case 'cardtable':
      shape(ctx, '#5c3d22', circle(ctx, 0, 0, Math.min(w, h) * 0.46), line);
      shape(ctx, FELT, circle(ctx, 0, 0, Math.min(w, h) * 0.4), thin);
      for (const [x, y, a] of [[-0.2, -0.1, 0.3], [0.1, -0.2, -0.4], [0.25, 0.2, 0.9]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#efe7d3', rect(ctx, -c * 0.07, -c * 0.1, c * 0.14, c * 0.2, c * 0.02), thin);
        ctx.restore();
      }
      for (const [x, y, col] of [[-0.3, 0.3, '#b33a2e'], [-0.2, 0.36, '#3f5d86'], [0.4, -0.2, '#e8c14a']] as const) shape(ctx, col, circle(ctx, x * c, y * c, c * 0.06), thin);
      break;
    case 'slotmachine':
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.3, -c * 0.34, c * 0.6, c * 0.68, c * 0.08), line);
      shape(ctx, '#efe7d3', rect(ctx, -c * 0.22, -c * 0.16, c * 0.44, c * 0.18, c * 0.02), thin);
      for (const [x, col] of [[-0.14, '#b33a2e'], [0, '#e8c14a'], [0.14, '#5fa04a']] as const) shape(ctx, col, circle(ctx, x * c, -c * 0.07, c * 0.04), 0);
      glow(ctx, 0, -c * 0.07, c * 0.4, 'rgba(255, 200, 100, 0.4)');
      lines(ctx, '#c9a442', Math.max(2, c / 12), () => (ctx.moveTo(c * 0.3, -c * 0.1), ctx.lineTo(c * 0.42, -c * 0.3)));
      break;
    // ---- An office and the metro ----
    case 'cubicle':
      shape(ctx, '#8d949c', rect(ctx, L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08), line);
      shape(ctx, '#c9c2b0', rect(ctx, L + c * 0.14, T + c * 0.14, w - c * 0.28, h - c * 0.28), thin);
      shape(ctx, tone(WOOD, 0.8), rect(ctx, L + c * 0.14, T + c * 0.14, w - c * 0.28, c * 0.5), thin);
      shape(ctx, DARK, rect(ctx, -c * 0.24, T + c * 0.2, c * 0.48, c * 0.08), 0);
      glow(ctx, 0, T + c * 0.3, c * 0.3, 'rgba(120, 170, 255, 0.35)');
      shape(ctx, '#3a3d42', circle(ctx, 0, c * 0.2, c * 0.18), thin);
      break;
    case 'watercooler':
      shape(ctx, '#d6d6cf', rect(ctx, -c * 0.22, -c * 0.22, c * 0.44, c * 0.44, c * 0.04), line);
      shape(ctx, 'rgba(120, 190, 230, 0.85)', circle(ctx, 0, 0, c * 0.16), thin);
      shape(ctx, '#3f8ae0', circle(ctx, 0, 0, c * 0.06), 0);
      break;
    case 'copier':
      shape(ctx, '#c9c2b0', rect(ctx, -c * 0.38, -c * 0.32, c * 0.76, c * 0.64, c * 0.04), line);
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.26, -c * 0.2, c * 0.4, c * 0.3, c * 0.02), thin);
      shape(ctx, '#efe7d3', rect(ctx, c * 0.2, -c * 0.16, c * 0.14, c * 0.22), 0);
      shape(ctx, '#5fcf7a', circle(ctx, c * 0.26, c * 0.18, c * 0.03), 0);
      break;
    case 'turnstile':
      for (const x of [-0.32, 0.32]) shape(ctx, '#8d949c', rect(ctx, x * c - c * 0.08, -c * 0.4, c * 0.16, c * 0.8, c * 0.04), line);
      lines(ctx, '#c9c2b0', Math.max(2, c / 12), () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2;
          ctx.moveTo(-c * 0.24, 0);
          ctx.lineTo(-c * 0.24 + Math.cos(a) * c * 0.22, Math.sin(a) * c * 0.22);
        }
      });
      shape(ctx, '#5fcf7a', circle(ctx, c * 0.32, -c * 0.3, c * 0.04), 0);
      break;
    case 'subwaycar':
      shape(ctx, tone(SET12_TINTS.subwaycar!, t), rect(ctx, L + c * 0.12, T + c * 0.06, w - c * 0.24, h - c * 0.12, c * 0.2), line);
      shape(ctx, '#b8c4cc', rect(ctx, L + c * 0.24, T + c * 0.2, w - c * 0.48, h - c * 0.4, c * 0.1), thin);
      for (let y = T + c * 0.5; y < h / 2 - c * 0.4; y += c * 0.8) for (const x of [L + c * 0.3, w / 2 - c * 0.5]) shape(ctx, '#6f7882', rect(ctx, x, y, c * 0.2, c * 0.5, c * 0.04), 0);
      lines(ctx, 'rgba(255, 255, 255, 0.5)', thin, () => (ctx.moveTo(0, T + c * 0.3), ctx.lineTo(0, h / 2 - c * 0.3)));
      break;
    case 'ticketmachine':
      shape(ctx, '#3f5170', rect(ctx, -c * 0.3, -c * 0.3, c * 0.6, c * 0.6, c * 0.06), line);
      shape(ctx, '#123238', rect(ctx, -c * 0.2, -c * 0.22, c * 0.4, c * 0.2, c * 0.02), thin);
      glow(ctx, 0, -c * 0.12, c * 0.3, 'rgba(95, 211, 201, 0.35)');
      for (let k = 0; k < 6; k++) shape(ctx, '#d6d6cf', circle(ctx, -c * 0.12 + (k % 3) * c * 0.12, c * 0.06 + Math.floor(k / 3) * c * 0.1, c * 0.03), 0);
      break;
    // ---- A shelter in the wasteland ----
    case 'blastdoor':
      // A heavy sliding door with hazard stripes: put it in the wall.
      shape(ctx, '#55585e', rect(ctx, L + c * 0.04, -c * 0.26, w - c * 0.08, c * 0.52, c * 0.04), line);
      stripes(L + c * 0.04, -c * 0.26, w - c * 0.08, c * 0.12);
      stripes(L + c * 0.04, c * 0.14, w - c * 0.08, c * 0.12);
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(0, -c * 0.14), ctx.lineTo(0, c * 0.14)));
      shape(ctx, '#e0523a', circle(ctx, w / 2 - c * 0.2, 0, c * 0.05), 0);
      break;
    case 'exosuit':
      // An armoured exoskeleton on its stand.
      shape(ctx, IRON, rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8, c * 0.04), thin);
      shape(ctx, OLIVE, () => ctx.ellipse(0, c * 0.04, c * 0.3, c * 0.22, 0, 0, Math.PI * 2), line);
      for (const x of [-0.3, 0.3]) shape(ctx, '#5a6140', circle(ctx, x * c, -c * 0.04, c * 0.13), thin);
      shape(ctx, '#5a6140', rect(ctx, -c * 0.12, -c * 0.3, c * 0.24, c * 0.2, c * 0.06), thin);
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.08, -c * 0.24, c * 0.16, c * 0.05), 0);
      break;
    case 'purifier':
      shape(ctx, '#8d949c', rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.06), line);
      for (const [x, y] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4]] as const) shape(ctx, '#3f7d97', circle(ctx, x * c, y * c, c * 0.24), thin);
      lines(ctx, '#55585e', Math.max(2, c / 10), () => (ctx.moveTo(-c * 0.4, -c * 0.4), ctx.lineTo(c * 0.4, -c * 0.4), ctx.lineTo(c * 0.4, c * 0.4), ctx.lineTo(-c * 0.4, c * 0.4)));
      shape(ctx, '#5fcf7a', circle(ctx, c * 0.4, c * 0.4, c * 0.1), thin);
      break;
    case 'hamradio':
      shape(ctx, tone(WOOD, 0.6), rect(ctx, -c * 0.4, -c * 0.24, c * 0.8, c * 0.48, c * 0.04), line);
      shape(ctx, '#3a3530', rect(ctx, -c * 0.34, -c * 0.18, c * 0.44, c * 0.3, c * 0.03), thin);
      glow(ctx, -c * 0.12, -c * 0.04, c * 0.24, 'rgba(255, 190, 90, 0.5)');
      for (const x of [0.18, 0.3]) shape(ctx, '#c9c2b0', circle(ctx, x * c, 0, c * 0.05), thin);
      lines(ctx, IRON, thin, () => (ctx.moveTo(c * 0.3, -c * 0.24), ctx.lineTo(c * 0.44, -c * 0.46)));
      break;
    case 'cans':
      for (let k = 0; k < 6; k++) {
        const x = -c * 0.24 + (k % 3) * c * 0.24;
        const y = -c * 0.12 + Math.floor(k / 3) * c * 0.24;
        shape(ctx, '#a3a9ad', circle(ctx, x, y, c * 0.1), thin);
        shape(ctx, SET12_TINTS.cans![(k + Math.floor(t * 3)) % 3]!, circle(ctx, x, y, c * 0.06), 0);
      }
      break;
    case 'generator':
      shape(ctx, OLIVE, rect(ctx, L + c * 0.06, -c * 0.32, w - c * 0.12, c * 0.64, c * 0.06), line);
      lines(ctx, 'rgba(20, 20, 20, 0.5)', thin, () => {
        for (let x = L + c * 0.2; x < 0; x += c * 0.1) (ctx.moveTo(x, -c * 0.24), ctx.lineTo(x, c * 0.24));
      });
      shape(ctx, IRON, circle(ctx, w / 2 - c * 0.4, 0, c * 0.18), thin);
      shape(ctx, '#e0523a', circle(ctx, c * 0.1, -c * 0.18, c * 0.04), 0);
      lines(ctx, DARK, Math.max(2, c / 12), () => (ctx.moveTo(w / 2 - c * 0.06, c * 0.2), ctx.quadraticCurveTo(w / 2 + c * 0.2, c * 0.3, w / 2 + c * 0.1, c * 0.48)));
      break;
    default:
      drawSets13(ctx, p, w, h, c);
  }
}
