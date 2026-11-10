// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A gryphon's eyrie; a plague doctor's study; a prison ship; a research station in the ice;
// a restaurant; a morgue; a military base; a campsite.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const HULL = '#d6d6cf';
const STEEL = '#a3a9ad';
const OLIVE = '#5a6140';
const GOLD = '#d4a640';
const WINES = ['#4a1f2a', '#2f4a2a', '#7a1f2b'];

export const SET24_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  domtent: ['#e8823a', '#3f8ae0', '#5fa04a', '#b33a2e'], sleepingbag: ['#3f5d86', '#b33a2e', '#5f7a3a'], diningtable: ['#efe7d3', '#b33a2e', '#2f6a3a'],
};
// Drawn once a cell when stretched.
export const SET24_TILED: Prop['kind'][] = ['leechjars'];

export function drawSets24(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A gryphon's eyrie ----
    case 'gryphonnest': {
      const r = Math.min(w, h) * 0.46;
      shape(ctx, '#7d776d', circle(ctx, 0, 0, r), line);
      shape(ctx, '#6b5a3a', circle(ctx, 0, 0, r * 0.78), thin);
      lines(ctx, '#4a3a22', Math.max(2, c / 14), () => {
        for (let k = 0; k < 18; k++) {
          const a = (k / 18) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45);
          ctx.lineTo(Math.cos(a + 0.7) * r * 0.8, Math.sin(a + 0.7) * r * 0.8);
        }
      });
      shape(ctx, '#c9a46a', circle(ctx, 0, 0, r * 0.42), thin);
      for (const [x, y] of [[-0.14, -0.06], [0.14, -0.04], [0, 0.14]] as const) shape(ctx, '#e8dcc0', () => ctx.ellipse(x * r * 2, y * r * 2, c * 0.13, c * 0.17, x * 3, 0, Math.PI * 2), thin);
      shape(ctx, GOLD, circle(ctx, r * 0.6, r * 0.3, c * 0.06), 0);
      break;
    }
    case 'gryphonfeathers':
      for (const [x, y, a, col] of [[-0.16, -0.1, 0.5, '#c9a46a'], [0.16, 0.0, -0.7, '#8a6a4a'], [-0.04, 0.2, 1.8, '#d8c8a0']] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, col, () => ctx.ellipse(0, 0, c * 0.08, c * 0.26, 0, 0, Math.PI * 2), thin);
        lines(ctx, 'rgba(30, 20, 10, 0.5)', thin, () => (ctx.moveTo(0, -c * 0.26), ctx.lineTo(0, c * 0.3)));
        ctx.restore();
      }
      break;
    // ---- A plague doctor's study ----
    case 'plaguemask':
      // A beaked mask, hat and coat on a stand.
      shape(ctx, '#2a2428', () => ctx.ellipse(0, c * 0.06, c * 0.3, c * 0.24, 0, 0, Math.PI * 2), line);
      shape(ctx, '#1d1b1e', circle(ctx, 0, -c * 0.06, c * 0.2), thin);
      shape(ctx, '#d6cdb5', circle(ctx, 0, -c * 0.06, c * 0.12), thin);
      shape(ctx, '#d6cdb5', () => (ctx.moveTo(-c * 0.06, -c * 0.02), ctx.lineTo(0, c * 0.32), ctx.lineTo(c * 0.06, -c * 0.02), ctx.closePath()), thin);
      for (const x of [-0.05, 0.05]) shape(ctx, '#7a1f2b', circle(ctx, x * c, -c * 0.1, c * 0.03), 0);
      break;
    case 'leechjars':
      for (const [x, y] of [[-0.18, -0.14], [0.18, -0.12], [0, 0.18]] as const) {
        shape(ctx, 'rgba(160, 190, 150, 0.7)', circle(ctx, x * c, y * c, c * 0.13), thin);
        lines(ctx, '#2a1a1a', Math.max(1.5, c / 18), () => {
          for (const d of [-0.04, 0.03]) (ctx.moveTo((x - 0.05) * c, (y + d) * c), ctx.quadraticCurveTo(x * c, (y + d - 0.04) * c, (x + 0.05) * c, (y + d) * c));
        });
      }
      break;
    case 'bloodletting':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, -c * 0.4, -c * 0.24, c * 0.8, c * 0.48, c * 0.03), line);
      shape(ctx, STEEL, () => ctx.ellipse(-c * 0.16, 0, c * 0.14, c * 0.1, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#7a1f2b', () => ctx.ellipse(-c * 0.16, 0, c * 0.1, c * 0.06, 0, 0, Math.PI * 2), 0);
      lines(ctx, STEEL, Math.max(1.5, c / 18), () => (ctx.moveTo(c * 0.06, -c * 0.12), ctx.lineTo(c * 0.32, -c * 0.12), ctx.moveTo(c * 0.06, 0), ctx.lineTo(c * 0.28, 0.0), ctx.moveTo(c * 0.06, c * 0.12), ctx.lineTo(c * 0.3, c * 0.12)));
      break;
    // ---- A prison ship ----
    case 'cryocell':
      shape(ctx, IRON, rect(ctx, -c * 0.32, T + c * 0.06, c * 0.64, h - c * 0.12, c * 0.16), line);
      shape(ctx, 'rgba(170, 220, 250, 0.85)', rect(ctx, -c * 0.22, T + c * 0.16, c * 0.44, h - c * 0.32, c * 0.12), thin);
      glow(ctx, 0, 0, Math.max(w, h) * 0.4, 'rgba(150, 210, 255, 0.4)');
      shape(ctx, 'rgba(70, 80, 100, 0.5)', () => ctx.ellipse(0, 0, c * 0.12, h * 0.3, 0, 0, Math.PI * 2), 0);
      shape(ctx, '#e0523a', circle(ctx, 0, h / 2 - c * 0.14, c * 0.03), 0);
      break;
    case 'prisonbunk':
      shape(ctx, IRON, rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.04), line);
      shape(ctx, '#e8823a', rect(ctx, L + c * 0.16, T + c * 0.16, w - c * 0.32, h - c * 0.32, c * 0.06), thin);
      lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => (ctx.moveTo(L + c * 0.16, T + c * 0.4), ctx.lineTo(w / 2 - c * 0.16, T + c * 0.4)));
      lines(ctx, '#ffd84a', Math.max(2, c / 14), () => ctx.rect(L + c * 0.04, T + c * 0.04, w - c * 0.08, h - c * 0.08));
      break;
    // ---- A research station in the ice ----
    case 'drillrig':
      shape(ctx, '#b33a2e', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.04), line);
      lines(ctx, '#7a1f2b', Math.max(1.5, c / 18), () => (ctx.moveTo(L + c * 0.06, T + c * 0.06), ctx.lineTo(w / 2 - c * 0.06, h / 2 - c * 0.06), ctx.moveTo(w / 2 - c * 0.06, T + c * 0.06), ctx.lineTo(L + c * 0.06, h / 2 - c * 0.06)));
      shape(ctx, IRON, circle(ctx, 0, 0, Math.min(w, h) * 0.2), thin);
      shape(ctx, '#1d1b1e', circle(ctx, 0, 0, Math.min(w, h) * 0.1), 0);
      break;
    case 'weathermast':
      lines(ctx, STEEL, Math.max(1.5, c / 18), () => {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + 0.3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.42, Math.sin(a) * c * 0.42);
        }
      });
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.08), thin);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 1.3;
        lines(ctx, IRON, thin, () => (ctx.moveTo(0, 0), ctx.lineTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2)));
        shape(ctx, '#e8823a', circle(ctx, Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2, c * 0.05), thin);
      }
      break;
    case 'icecore':
      shape(ctx, HULL, rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.04), line);
      for (let y = -0.16; y <= 0.17; y += 0.16) shape(ctx, 'rgba(190, 225, 240, 0.95)', rect(ctx, L + c * 0.16, y * c - c * 0.05, w - c * 0.32, c * 0.1, c * 0.05), thin);
      lines(ctx, 'rgba(90, 120, 140, 0.6)', thin, () => {
        for (let x = L + c * 0.4; x < w / 2 - c * 0.2; x += c * 0.3) for (const y of [-0.16, 0, 0.16]) (ctx.moveTo(x, y * c - c * 0.05), ctx.lineTo(x, y * c + c * 0.05));
      });
      break;
    // ---- A restaurant ----
    case 'diningtable': {
      const col = tone(SET24_TINTS.diningtable!, t);
      shape(ctx, col, circle(ctx, 0, 0, Math.min(w, h) * 0.4), line);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const r = Math.min(w, h) * 0.26;
        shape(ctx, '#ffffff', circle(ctx, Math.cos(a) * r, Math.sin(a) * r, c * 0.08), thin);
      }
      glow(ctx, 0, 0, c * 0.3, 'rgba(255, 210, 130, 0.5)');
      shape(ctx, '#f0e6c8', circle(ctx, 0, 0, c * 0.04), thin);
      break;
    }
    case 'winerack':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.04, -c * 0.24, w - c * 0.08, c * 0.48, c * 0.02), line);
      for (let x = L + c * 0.14; x < w / 2 - c * 0.08; x += c * 0.14) for (const y of [-0.12, 0.0, 0.12]) shape(ctx, WINES[(Math.round((x - L) / (c * 0.14)) + Math.round(y * 10) + 3) % 3]!, circle(ctx, x, y * c, c * 0.045), 0);
      break;
    case 'chefstove':
      shape(ctx, STEEL, rect(ctx, L + c * 0.06, -c * 0.32, w - c * 0.12, c * 0.64, c * 0.04), line);
      for (let x = L + c * 0.36; x < w / 2 - c * 0.2; x += c * 0.5) for (const y of [-0.14, 0.14]) {
        shape(ctx, '#1d1b1e', circle(ctx, x, y * c, c * 0.12), thin);
        lines(ctx, '#3f8ae0', thin, () => ctx.arc(x, y * c, c * 0.08, 0, Math.PI * 2));
      }
      shape(ctx, '#3a3d42', () => ctx.ellipse(L + c * 0.36, -c * 0.14, c * 0.16, c * 0.1, 0, 0, Math.PI * 2), thin);
      break;
    // ---- A morgue ----
    case 'morguedrawers':
      // Cold drawers in a wall: put it on the wall.
      shape(ctx, STEEL, rect(ctx, L + c * 0.04, -c * 0.3, w - c * 0.08, c * 0.6, c * 0.02), line);
      for (let x = L + c * 0.04; x < w / 2 - c * 0.1; x += c / 2) for (const y of [-0.3, 0]) {
        shape(ctx, '#c9cfd3', rect(ctx, x + c * 0.03, y * c + c * 0.03, c / 2 - c * 0.06, c * 0.24, c * 0.02), thin);
        shape(ctx, IRON, rect(ctx, x + c * 0.15, y * c + c * 0.12, c * 0.2, c * 0.04), 0);
      }
      break;
    case 'autopsy':
      shape(ctx, STEEL, rect(ctx, -c * 0.32, T + c * 0.06, c * 0.64, h - c * 0.12, c * 0.06), line);
      shape(ctx, '#e8eef0', () => ctx.ellipse(0, 0, c * 0.18, h * 0.38, 0, 0, Math.PI * 2), thin);
      shape(ctx, IRON, circle(ctx, 0, h / 2 - c * 0.2, c * 0.04), 0);
      lines(ctx, '#55585e', thin, () => ctx.rect(-c * 0.26, T + c * 0.12, c * 0.52, h - c * 0.24));
      break;
    // ---- A military base ----
    case 'sandbags':
      // Two staggered rows along the whole length.
      for (const [y, off] of [[-0.12, 0], [0.12, 0.16]] as const) for (let x = L + c * 0.06 + off * c; x < w / 2 - c * 0.3; x += c * 0.32) shape(ctx, '#a8946a', rect(ctx, x, y * c - c * 0.1, c * 0.3, c * 0.2, c * 0.08), thin);
      break;
    case 'battletank':
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.2, T + c * 0.24, w - c * 0.24, h - c * 0.3, c * 0.1), 0);
      for (const x of [L + c * 0.1, w / 2 - c * 0.4]) {
        shape(ctx, '#2a2c30', rect(ctx, x, T + c * 0.08, c * 0.3, h - c * 0.16, c * 0.06), thin);
        lines(ctx, '#3a3d42', thin, () => {
          for (let y = T + c * 0.16; y < h / 2 - c * 0.1; y += c * 0.14) (ctx.moveTo(x, y), ctx.lineTo(x + c * 0.3, y));
        });
      }
      shape(ctx, OLIVE, rect(ctx, L + c * 0.36, T + c * 0.2, w - c * 0.72, h - c * 0.4, c * 0.1), line);
      shape(ctx, '#4a5034', circle(ctx, 0, c * 0.1, Math.min(w, h) * 0.24), thin);
      lines(ctx, '#4a5034', Math.max(4, c / 6), () => (ctx.moveTo(0, c * 0.1), ctx.lineTo(0, T - c * 0.3)));
      break;
    case 'radar':
      shape(ctx, IRON, rect(ctx, -c * 0.2, -c * 0.2, c * 0.4, c * 0.4, c * 0.04), line);
      ctx.save();
      ctx.rotate(-0.5);
      shape(ctx, HULL, () => ctx.ellipse(0, -c * 0.06, Math.min(w, h) * 0.44, c * 0.16, 0, 0, Math.PI * 2), line);
      lines(ctx, STEEL, thin, () => {
        for (let x = -0.3; x <= 0.31; x += 0.15) (ctx.moveTo(x * w, -c * 0.18), ctx.lineTo(x * w, c * 0.06));
      });
      ctx.restore();
      shape(ctx, '#5fcf7a', circle(ctx, c * 0.12, c * 0.12, c * 0.03), 0);
      break;
    case 'bunker':
      shape(ctx, '#8a857c', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, Math.min(w, h) * 0.3), line);
      shape(ctx, '#a39e94', rect(ctx, L + c * 0.24, T + c * 0.24, w - c * 0.48, h - c * 0.48, Math.min(w, h) * 0.2), thin);
      shape(ctx, '#1d1b1e', rect(ctx, -w * 0.3, h / 2 - c * 0.24, w * 0.6, c * 0.1, c * 0.03), 0);
      lines(ctx, '#6a655c', thin, () => (ctx.moveTo(0, T + c * 0.24), ctx.lineTo(0, h / 2 - c * 0.24)));
      break;
    // ---- A campsite ----
    case 'domtent': {
      const col = tone(SET24_TINTS.domtent!, t);
      const r = Math.min(w, h) * 0.44;
      shape(ctx, 'rgba(20, 16, 10, 0.3)', circle(ctx, c * 0.1, c * 0.12, r), 0);
      shape(ctx, col, circle(ctx, 0, 0, r), line);
      lines(ctx, 'rgba(0, 0, 0, 0.35)', Math.max(1.5, c / 18), () => {
        ctx.moveTo(-r * 0.7, -r * 0.7);
        ctx.quadraticCurveTo(0, 0, r * 0.7, r * 0.7);
        ctx.moveTo(r * 0.7, -r * 0.7);
        ctx.quadraticCurveTo(0, 0, -r * 0.7, r * 0.7);
      });
      shape(ctx, 'rgba(0, 0, 0, 0.3)', () => (ctx.moveTo(-r * 0.3, r * 0.9), ctx.lineTo(0, r * 0.4), ctx.lineTo(r * 0.3, r * 0.9), ctx.closePath()), 0);
      break;
    }
    case 'sleepingbag': {
      const col = tone(SET24_TINTS.sleepingbag!, t);
      shape(ctx, col, rect(ctx, -c * 0.22, T + c * 0.08, c * 0.44, h - c * 0.16, c * 0.2), line);
      lines(ctx, 'rgba(0, 0, 0, 0.25)', thin, () => {
        for (let y = T + c * 0.5; y < h / 2 - c * 0.1; y += c * 0.2) (ctx.moveTo(-c * 0.2, y), ctx.lineTo(c * 0.2, y));
      });
      shape(ctx, '#efe7d3', () => ctx.ellipse(0, T + c * 0.28, c * 0.14, c * 0.1, 0, 0, Math.PI * 2), thin);
      break;
    }
    case 'camper':
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.26, h - c * 0.24, c * 0.2), 0);
      shape(ctx, '#efe7d3', rect(ctx, L + c * 0.1, T + c * 0.06, w - c * 0.2, h - c * 0.12, c * 0.24), line);
      shape(ctx, '#3f8ae0', rect(ctx, L + c * 0.1, T + h * 0.36, w - c * 0.2, c * 0.14), 0);
      shape(ctx, '#3a4a58', rect(ctx, L + c * 0.22, T + c * 0.14, w - c * 0.44, c * 0.24, c * 0.08), thin);
      shape(ctx, 'rgba(200, 225, 240, 0.85)', rect(ctx, -c * 0.16, h * 0.1, c * 0.32, c * 0.24, c * 0.04), thin);
      break;
    case 'grill':
      shape(ctx, '#1d1b1e', circle(ctx, 0, 0, c * 0.28), line);
      glow(ctx, 0, 0, c * 0.36, 'rgba(255, 120, 40, 0.5)');
      lines(ctx, STEEL, thin, () => {
        for (let y = -0.2; y <= 0.21; y += 0.08) (ctx.moveTo(-Math.sqrt(0.28 ** 2 - y ** 2) * c, y * c), ctx.lineTo(Math.sqrt(0.28 ** 2 - y ** 2) * c, y * c));
      });
      for (const [x, y] of [[-0.08, -0.06], [0.1, 0.06]] as const) shape(ctx, '#a0582e', () => ctx.ellipse(x * c, y * c, c * 0.1, c * 0.04, 0.3, 0, Math.PI * 2), thin);
      shape(ctx, tone(CLOTH, 0.1), rect(ctx, -c * 0.03, c * 0.26, c * 0.06, c * 0.18), 0);
      break;
  }
}
