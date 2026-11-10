// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// An asteroid base; a cyber clinic; a night club; an airport; a cinema.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, type Ctx } from './prop-paint';
import { drawSets19 } from './draw-sets19';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const HULL = '#d6d6cf';
const SCREEN = '#5fd3c9';
const NEON = ['#ff4fa8', '#4fd6ff', '#b4ff4f', '#ffb84f'];

export const SET18_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  discofloor: NEON, cinemaseats: CLOTH, airportseats: ['#3f5d86', '#5f6a74', '#8a2f2b'],
};
// Drawn once a cell when stretched.
export const SET18_TILED: Prop['kind'][] = ['discofloor'];

export function drawSets18(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- An asteroid base ----
    case 'mininglaser':
      shape(ctx, IRON, rect(ctx, -c * 0.34, -c * 0.1, c * 0.68, c * 0.5, c * 0.06), line);
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.34, c * 0.28, c * 0.68, c * 0.08), 0);
      shape(ctx, '#8d949c', rect(ctx, -c * 0.1, -c * 0.46, c * 0.2, c * 0.4, c * 0.04), thin);
      glow(ctx, 0, -c * 0.46, c * 0.3, 'rgba(255, 80, 60, 0.7)');
      shape(ctx, '#ff5a3a', circle(ctx, 0, -c * 0.46, c * 0.05), 0);
      break;
    case 'orecrusher':
      shape(ctx, '#6f7882', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.06), line);
      shape(ctx, '#3a3d42', rect(ctx, L + c * 0.24, T + c * 0.24, w - c * 0.48, h * 0.4, c * 0.03), thin);
      for (let x = L + c * 0.36; x < w / 2 - c * 0.3; x += c * 0.24) for (const y of [T + c * 0.36, T + c * 0.36 + h * 0.2]) shape(ctx, '#8d949c', circle(ctx, x, y, c * 0.08), thin);
      for (let k = 0; k < 6; k++) shape(ctx, '#7a6a5a', circle(ctx, L + c * 0.4 + ((k * 37) % 100) / 100 * (w - c * 0.8), h / 2 - c * 0.3, c * 0.06), 0);
      stripes(ctx, L + c * 0.06, h / 2 - c * 0.18, w - c * 0.12, c * 0.1, c);
      break;
    case 'dockclamp':
      // A docking clamp for small craft.
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        ctx.save();
        ctx.rotate(a);
        shape(ctx, '#8d949c', () => (ctx.moveTo(-c * 0.12, -Math.min(w, h) * 0.46), ctx.lineTo(c * 0.12, -Math.min(w, h) * 0.46), ctx.lineTo(c * 0.06, -Math.min(w, h) * 0.2), ctx.lineTo(-c * 0.06, -Math.min(w, h) * 0.2), ctx.closePath()), line);
        ctx.restore();
      }
      lines(ctx, '#e8c14a', Math.max(2, c / 10), () => ctx.arc(0, 0, Math.min(w, h) * 0.2, 0, Math.PI * 2));
      shape(ctx, SCREEN, circle(ctx, 0, 0, c * 0.06), 0);
      break;
    case 'gravboots':
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.38, -c * 0.2), ctx.lineTo(c * 0.38, -c * 0.2)));
      for (const x of [-0.16, 0.16]) {
        shape(ctx, '#e8823a', rect(ctx, x * c - c * 0.1, -c * 0.14, c * 0.2, c * 0.34, c * 0.06), line);
        shape(ctx, '#3a3d42', rect(ctx, x * c - c * 0.1, c * 0.12, c * 0.2, c * 0.08, c * 0.02), 0);
      }
      break;
    // ---- A cyber clinic ----
    case 'cyberlimbs':
      // Spare limbs hanging on a rack: put it on the wall.
      shape(ctx, IRON, rect(ctx, L + c * 0.04, T + c * 0.06, w - c * 0.08, c * 0.08), 0);
      for (let x = L + c * 0.24; x < w / 2 - c * 0.1; x += c * 0.34) {
        const arm = Math.round((x - L) / (c * 0.34)) % 2;
        lines(ctx, '#a3a9ad', Math.max(3, c / 9), () => (ctx.moveTo(x, T + c * 0.12), ctx.lineTo(x, T + c * (arm ? 0.5 : 0.6))));
        shape(ctx, '#3a3d42', circle(ctx, x, T + c * 0.32, c * 0.05), 0);
        shape(ctx, '#8d949c', arm ? circle(ctx, x, T + c * 0.56, c * 0.08) : rect(ctx, x - c * 0.07, T + c * 0.58, c * 0.14, c * 0.06, c * 0.02), thin);
      }
      break;
    case 'surgerybot': {
      // A ring of surgical arms over a patient's couch.
      shape(ctx, '#e8eef0', rect(ctx, -c * 0.2, T + c * 0.1, c * 0.4, h - c * 0.2, c * 0.08), line);
      const cy = 0;
      lines(ctx, IRON, Math.max(2, c / 12), () => ctx.arc(0, cy, Math.min(w, h) * 0.36, 0, Math.PI * 2));
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const r = Math.min(w, h) * 0.36;
        lines(ctx, '#8d949c', Math.max(2, c / 14), () => (ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r), ctx.lineTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4)));
        shape(ctx, SCREEN, circle(ctx, Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, c * 0.04), 0);
      }
      glow(ctx, 0, 0, c * 0.5, 'rgba(95, 211, 201, 0.3)');
      break;
    }
    case 'implantcase':
      shape(ctx, HULL, rect(ctx, -c * 0.36, -c * 0.26, c * 0.72, c * 0.52, c * 0.04), line);
      for (let k = 0; k < 6; k++) {
        const x = -c * 0.22 + (k % 3) * c * 0.22;
        const y = -c * 0.1 + Math.floor(k / 3) * c * 0.2;
        shape(ctx, '#3a3d42', rect(ctx, x - c * 0.08, y - c * 0.07, c * 0.16, c * 0.14, c * 0.02), 0);
        shape(ctx, NEON[k % 4]!, circle(ctx, x, y, c * 0.03), 0);
      }
      break;
    // ---- A night club ----
    case 'djbooth':
      shape(ctx, '#1d1b22', rect(ctx, L + c * 0.06, -c * 0.3, w - c * 0.12, c * 0.6, c * 0.06), line);
      for (const x of [-0.5, 0.5]) {
        shape(ctx, '#3a3d42', circle(ctx, x * c, 0, c * 0.2), thin);
        shape(ctx, '#1d1b1e', circle(ctx, x * c, 0, c * 0.05), 0);
      }
      for (let k = 0; k < 5; k++) shape(ctx, NEON[k % 4]!, rect(ctx, -c * 0.2 + k * c * 0.09, -c * 0.12, c * 0.05, c * 0.24 - (k % 3) * c * 0.06), 0);
      glow(ctx, 0, 0, w * 0.5, 'rgba(255, 80, 200, 0.3)');
      break;
    case 'discofloor': {
      const s = c / 2;
      for (let k = 0; k < 4; k++) {
        const x = (k % 2) * s - s;
        const y = Math.floor(k / 2) * s - s;
        ctx.fillStyle = NEON[(k + Math.floor(t * 4)) % 4]!;
        ctx.fillRect(x, y, s, s);
      }
      lines(ctx, '#1d1b22', Math.max(1.5, c / 20), () => (ctx.rect(-s, -s, c, c), ctx.moveTo(0, -s), ctx.lineTo(0, s), ctx.moveTo(-s, 0), ctx.lineTo(s, 0)));
      break;
    }
    case 'velvetrope':
      for (let x = L + c * 0.2; x < w / 2; x += (w - c * 0.4) / Math.max(1, Math.round(w / c))) shape(ctx, '#c9a442', circle(ctx, x, 0, c * 0.08), thin);
      lines(ctx, '#7a1f2b', Math.max(3, c / 10), () => {
        const n = Math.max(1, Math.round(w / c));
        const step = (w - c * 0.4) / n;
        ctx.moveTo(L + c * 0.2, 0);
        for (let k = 0; k < n; k++) ctx.quadraticCurveTo(L + c * 0.2 + step * (k + 0.5), c * 0.16, L + c * 0.2 + step * (k + 1), 0);
      });
      break;
    case 'neonbar':
      shape(ctx, '#1d1b22', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, c * 0.5, c * 0.06), line);
      lines(ctx, NEON[1]!, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.1, T + c * 0.54), ctx.lineTo(w / 2 - c * 0.1, T + c * 0.54)));
      glow(ctx, 0, T + c * 0.54, w * 0.4, 'rgba(80, 210, 255, 0.35)');
      for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.4) {
        shape(ctx, '#efe7d3', circle(ctx, x, T + c * 0.26, c * 0.05), 0);
        shape(ctx, '#3a3d42', circle(ctx, x, T + c * 0.8, c * 0.13), thin);
      }
      break;
    // ---- An airport ----
    case 'jetliner': {
      // A passenger plane at the gate, nose up.
      shape(ctx, 'rgba(20, 16, 10, 0.25)', () => ctx.ellipse(c * 0.2, c * 0.3, w * 0.12, h * 0.46, 0, 0, Math.PI * 2), 0);
      shape(ctx, HULL, () => (ctx.moveTo(L + c * 0.1, h * 0.04), ctx.lineTo(0, -h * 0.12), ctx.lineTo(w / 2 - c * 0.1, h * 0.04), ctx.lineTo(w / 2 - c * 0.1, h * 0.1), ctx.lineTo(0, h * 0.02), ctx.lineTo(L + c * 0.1, h * 0.1), ctx.closePath()), line);
      shape(ctx, HULL, () => (ctx.moveTo(-w * 0.18, h * 0.42), ctx.lineTo(0, h * 0.32), ctx.lineTo(w * 0.18, h * 0.42), ctx.lineTo(w * 0.18, h * 0.46), ctx.lineTo(-w * 0.18, h * 0.46), ctx.closePath()), thin);
      shape(ctx, '#efefef', () => ctx.ellipse(0, 0, w * 0.07, h * 0.48, 0, 0, Math.PI * 2), line);
      shape(ctx, '#3a4a58', () => ctx.ellipse(0, -h * 0.42, w * 0.04, c * 0.12, 0, 0, Math.PI * 2), 0);
      for (const x of [-0.24, 0.24]) shape(ctx, '#8d949c', () => ctx.ellipse(x * w, h * 0.0, c * 0.1, c * 0.24, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#3f5d86', rect(ctx, -w * 0.02, h * 0.3, w * 0.04, h * 0.16), 0);
      break;
    }
    case 'baggagebelt':
      shape(ctx, IRON, rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, Math.min(w, h) * 0.4), line);
      shape(ctx, '#1d1b1e', rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.4, h - c * 0.4, Math.min(w, h) * 0.3), 0);
      shape(ctx, IRON, rect(ctx, L + c * 0.44, T + c * 0.44, w - c * 0.88, h - c * 0.88, Math.min(w, h) * 0.2), thin);
      for (const [x, y, col] of [[-0.4, -0.3, '#b33a2e'], [0.3, 0.32, '#3f5d86'], [0.5, -0.3, '#5f7a3a']] as const) shape(ctx, col, rect(ctx, x * w - c * 0.12, y * h - c * 0.08, c * 0.24, c * 0.16, c * 0.03), thin);
      break;
    case 'airportseats': {
      // A row of joined seats: stretch it.
      const col = tone(SET18_TINTS.airportseats!, t);
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.06, c * 0.24), ctx.lineTo(w / 2 - c * 0.06, c * 0.24)));
      for (let x = L + c * 0.08; x < w / 2 - c * 0.3; x += c * 0.5) shape(ctx, col, rect(ctx, x, -c * 0.26, c * 0.42, c * 0.46, c * 0.08), thin);
      break;
    }
    case 'departures':
      // A departures board on the wall.
      shape(ctx, '#1d1b1e', rect(ctx, L + c * 0.04, -c * 0.2, w - c * 0.08, c * 0.4, c * 0.03), line);
      lines(ctx, '#e8c14a', Math.max(1, c / 26), () => {
        for (const y of [-0.12, -0.04, 0.04, 0.12]) for (let x = L + c * 0.12; x < w / 2 - c * 0.12; x += c * 0.5) (ctx.moveTo(x, y * c), ctx.lineTo(x + c * 0.3, y * c));
      });
      break;
    // ---- A cinema ----
    case 'cinemascreen':
      shape(ctx, '#3a1f22', rect(ctx, L + c * 0.04, -c * 0.24, w - c * 0.08, c * 0.48, c * 0.03), line);
      shape(ctx, '#f0f0ea', rect(ctx, L + c * 0.3, -c * 0.12, w - c * 0.6, c * 0.18), 0);
      glow(ctx, 0, c * 0.2, w * 0.4, 'rgba(240, 240, 255, 0.35)');
      break;
    case 'cinemaseats': {
      // A row of red seats: stretch it.
      const col = tone(CLOTH, t);
      for (let x = L + c * 0.06; x < w / 2 - c * 0.3; x += c * 0.5) {
        shape(ctx, col, rect(ctx, x, -c * 0.3, c * 0.42, c * 0.56, c * 0.1), thin);
        shape(ctx, 'rgba(0, 0, 0, 0.25)', rect(ctx, x, -c * 0.3, c * 0.42, c * 0.16, c * 0.08), 0);
      }
      break;
    }
    case 'popcornstand':
      shape(ctx, '#b33a2e', rect(ctx, -c * 0.38, -c * 0.3, c * 0.76, c * 0.6, c * 0.06), line);
      shape(ctx, 'rgba(255, 245, 210, 0.85)', rect(ctx, -c * 0.28, -c * 0.22, c * 0.56, c * 0.3, c * 0.04), thin);
      for (let k = 0; k < 10; k++) shape(ctx, '#f8eec8', circle(ctx, -c * 0.22 + ((k * 7) % 10) / 10 * c * 0.44, -c * 0.16 + ((k * 3) % 5) / 5 * c * 0.2, c * 0.04), 0);
      glow(ctx, 0, -c * 0.06, c * 0.4, 'rgba(255, 220, 120, 0.4)');
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.3, c * 0.16, c * 0.6, c * 0.08), 0);
      break;
    case 'projector':
      shape(ctx, DARK, rect(ctx, -c * 0.3, -c * 0.2, c * 0.6, c * 0.4, c * 0.04), line);
      for (const x of [-0.14, 0.14]) shape(ctx, IRON, circle(ctx, x * c, -c * 0.26, c * 0.12), thin);
      shape(ctx, '#3a4a58', circle(ctx, 0, c * 0.24, c * 0.07), thin);
      glow(ctx, 0, c * 0.4, c * 0.3, 'rgba(255, 250, 220, 0.5)');
      break;
    default:
      drawSets19(ctx, p, w, h, c);
  }
}

function stripes(ctx: Ctx, x: number, y: number, ww: number, hh: number, c: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, ww, hh);
  ctx.clip();
  ctx.fillStyle = '#e8c14a';
  ctx.fillRect(x, y, ww, hh);
  ctx.strokeStyle = DARK;
  ctx.lineWidth = c * 0.06;
  ctx.beginPath();
  for (let k = -hh; k < ww + hh; k += c * 0.16) (ctx.moveTo(x + k, y + hh), ctx.lineTo(x + k + hh, y));
  ctx.stroke();
  ctx.restore();
}
