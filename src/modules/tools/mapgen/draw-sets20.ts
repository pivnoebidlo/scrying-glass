// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A mech hangar; a building site; a container port; an amusement park.
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, tone, type Ctx } from './prop-paint';
import { drawSets21 } from './draw-sets21';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const YELLOW = '#e8b33a';
const BOXES = ['#b33a2e', '#3f5d86', '#5f7a3a', '#e8823a', '#6f7882', '#7a3d7a'];
const FUN = ['#e0523a', '#3f8ae0', '#e8c14a', '#5fcf7a', '#ff6fb0'];

export const SET20_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  container: BOXES, bumpercars: FUN,
};
// Drawn once a cell when stretched.
export const SET20_TILED: Prop['kind'][] = ['trafficcones', 'rebar'];

export function drawSets20(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  const hazard = (x: number, y: number, ww: number, hh: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, ww, hh);
    ctx.clip();
    ctx.fillStyle = YELLOW;
    ctx.fillRect(x, y, ww, hh);
    ctx.strokeStyle = DARK;
    ctx.lineWidth = c * 0.06;
    ctx.beginPath();
    for (let k = -hh; k < ww + hh; k += c * 0.16) (ctx.moveTo(x + k, y + hh), ctx.lineTo(x + k + hh, y));
    ctx.stroke();
    ctx.restore();
  };
  switch (p.kind) {
    // ---- A mech hangar ----
    case 'mechgantry':
      // A repair frame round a standing walker: catwalks on both sides.
      hazard(L + c * 0.04, T + c * 0.04, w - c * 0.08, c * 0.12);
      hazard(L + c * 0.04, h / 2 - c * 0.16, w - c * 0.08, c * 0.12);
      for (const x of [L + c * 0.1, w / 2 - c * 0.5]) {
        shape(ctx, '#6f7882', rect(ctx, x, T + c * 0.2, c * 0.4, h - c * 0.4, c * 0.02), line);
        lines(ctx, IRON, thin, () => {
          for (let y = T + c * 0.3; y < h / 2 - c * 0.2; y += c * 0.14) (ctx.moveTo(x, y), ctx.lineTo(x + c * 0.4, y));
        });
      }
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.5, T + c * 0.5), ctx.lineTo(w / 2 - c * 0.5, T + c * 0.5)));
      shape(ctx, '#3a3d42', rect(ctx, -c * 0.1, T + c * 0.5, c * 0.2, c * 0.3), 0);
      shape(ctx, '#8d949c', circle(ctx, 0, T + c * 0.86, c * 0.1), thin);
      break;
    case 'mechwreck':
      // A walker toppled on its back, sparking.
      shape(ctx, 'rgba(20, 16, 10, 0.2)', () => ctx.ellipse(c * 0.1, c * 0.14, w * 0.3, h * 0.26, 0.4, 0, Math.PI * 2), 0);
      ctx.save();
      ctx.rotate(0.4);
      shape(ctx, '#6f7346', rect(ctx, -w * 0.22, -h * 0.2, w * 0.44, h * 0.4, c * 0.1), line);
      shape(ctx, '#3a4048', rect(ctx, -w * 0.12, -h * 0.34, w * 0.24, h * 0.14, c * 0.04), thin);
      for (const [x, y, a] of [[-0.3, 0.1, 0.6], [0.3, 0.12, -0.5], [-0.14, 0.32, 0.2], [0.18, 0.34, -0.2]] as const) {
        ctx.save();
        ctx.translate(x * w, y * h);
        ctx.rotate(a);
        shape(ctx, '#5a6140', rect(ctx, -c * 0.12, -c * 0.3, c * 0.24, c * 0.6, c * 0.06), thin);
        ctx.restore();
      }
      ctx.restore();
      glow(ctx, w * 0.1, -h * 0.1, c * 0.4, 'rgba(255, 200, 100, 0.6)');
      shape(ctx, '#ffe9a8', circle(ctx, w * 0.1, -h * 0.1, c * 0.04), 0);
      break;
    case 'mecharm':
      shape(ctx, '#6f7346', rect(ctx, L + c * 0.1, -c * 0.18, w * 0.5, c * 0.36, c * 0.08), line);
      shape(ctx, '#55585e', circle(ctx, L + c * 0.1 + w * 0.5, 0, c * 0.18), thin);
      shape(ctx, '#5a6140', rect(ctx, L + c * 0.1 + w * 0.5, -c * 0.14, w * 0.32, c * 0.28, c * 0.06), thin);
      for (const y of [-0.12, 0, 0.12]) shape(ctx, '#3a3d42', rect(ctx, w / 2 - c * 0.2, y * c - c * 0.04, c * 0.16, c * 0.08, c * 0.02), 0);
      break;
    case 'ammocrates':
      for (const [x, y] of [[-0.18, -0.16], [0.18, -0.16], [0, 0.18]] as const) {
        shape(ctx, '#5a6140', rect(ctx, x * c - c * 0.16, y * c - c * 0.12, c * 0.32, c * 0.24, c * 0.02), thin);
        shape(ctx, YELLOW, rect(ctx, x * c - c * 0.16, y * c - c * 0.02, c * 0.32, c * 0.04), 0);
      }
      break;
    // ---- A building site ----
    case 'towercrane': {
      // A tower crane from above: the mast, the long jib, its counterweight.
      shape(ctx, IRON, rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8), thin);
      shape(ctx, YELLOW, rect(ctx, -c * 0.3, -c * 0.3, c * 0.6, c * 0.6, c * 0.02), line);
      lines(ctx, '#a07a1a', thin, () => (ctx.moveTo(-c * 0.3, -c * 0.3), ctx.lineTo(c * 0.3, c * 0.3), ctx.moveTo(c * 0.3, -c * 0.3), ctx.lineTo(-c * 0.3, c * 0.3)));
      ctx.save();
      ctx.rotate(-0.5);
      const jib = Math.max(w, h) * 0.6;
      shape(ctx, YELLOW, rect(ctx, -c * 0.6, -c * 0.1, jib + c * 0.6, c * 0.2), thin);
      lines(ctx, '#a07a1a', thin, () => {
        for (let x = -c * 0.6; x < jib; x += c * 0.2) (ctx.moveTo(x, -c * 0.1), ctx.lineTo(x + c * 0.1, c * 0.1), ctx.lineTo(x + c * 0.2, -c * 0.1));
      });
      shape(ctx, '#8d949c', rect(ctx, -c * 0.9, -c * 0.16, c * 0.36, c * 0.32, c * 0.02), thin);
      lines(ctx, DARK, thin, () => (ctx.moveTo(jib * 0.7, 0), ctx.lineTo(jib * 0.7, c * 0.4)));
      shape(ctx, IRON, rect(ctx, jib * 0.7 - c * 0.1, c * 0.36, c * 0.2, c * 0.1), 0);
      ctx.restore();
      break;
    }
    case 'scaffold':
      // Scaffolding along a wall: stretch it.
      shape(ctx, 'rgba(160, 120, 60, 0.85)', rect(ctx, L + c * 0.04, -c * 0.32, w - c * 0.08, c * 0.64), thin);
      lines(ctx, '#8d949c', Math.max(2, c / 14), () => {
        for (const y of [-0.32, 0.32]) (ctx.moveTo(L + c * 0.04, y * c), ctx.lineTo(w / 2 - c * 0.04, y * c));
        for (let x = L + c * 0.04; x < w / 2; x += c * 0.5) (ctx.moveTo(x, -c * 0.32), ctx.lineTo(x, c * 0.32));
      });
      lines(ctx, 'rgba(90, 60, 30, 0.6)', thin, () => {
        for (let y = -0.24; y < 0.3; y += 0.12) (ctx.moveTo(L + c * 0.04, y * c), ctx.lineTo(w / 2 - c * 0.04, y * c));
      });
      break;
    case 'cementmixer':
      shape(ctx, '#e8823a', rect(ctx, -c * 0.32, -c * 0.3, c * 0.64, c * 0.6, c * 0.04), thin);
      shape(ctx, '#d6d6cf', () => ctx.ellipse(0, -c * 0.02, c * 0.26, c * 0.22, 0.6, 0, Math.PI * 2), line);
      lines(ctx, '#8d949c', thin, () => {
        for (const k of [-0.1, 0, 0.1]) (ctx.moveTo(-c * 0.18, k * c - c * 0.1), ctx.lineTo(c * 0.18, k * c + c * 0.1));
      });
      shape(ctx, '#55585e', circle(ctx, c * 0.16, c * 0.14, c * 0.07), 0);
      for (const x of [-0.26, 0.26]) shape(ctx, DARK, rect(ctx, x * c - c * 0.06, c * 0.24, c * 0.12, c * 0.1, c * 0.02), 0);
      break;
    case 'trafficcones':
      for (const [x, y] of [[-0.2, -0.16], [0.2, -0.1], [0, 0.2]] as const) {
        shape(ctx, '#e8823a', rect(ctx, x * c - c * 0.11, y * c - c * 0.11, c * 0.22, c * 0.22, c * 0.03), thin);
        shape(ctx, '#e8823a', circle(ctx, x * c, y * c, c * 0.08), thin);
        lines(ctx, '#ffffff', Math.max(1.5, c / 18), () => ctx.arc(x * c, y * c, c * 0.05, 0, Math.PI * 2));
        shape(ctx, '#e8823a', circle(ctx, x * c, y * c, c * 0.025), 0);
      }
      break;
    case 'rebar':
      shape(ctx, '#8a857c', rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8), 0);
      lines(ctx, '#7a4a2a', Math.max(1.5, c / 18), () => {
        for (let k = -0.3; k <= 0.31; k += 0.15) (ctx.moveTo(k * c, -c * 0.4), ctx.lineTo(k * c, c * 0.4), ctx.moveTo(-c * 0.4, k * c), ctx.lineTo(c * 0.4, k * c));
      });
      break;
    // ---- A container port ----
    case 'container': {
      // A shipping container, ridged: stretch it to 1×3 or put several side by side.
      const col = tone(BOXES, t);
      shape(ctx, col, rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.02), line);
      lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => {
        if (h >= w) for (let y = T + c * 0.2; y < h / 2 - c * 0.1; y += c * 0.12) (ctx.moveTo(L + c * 0.1, y), ctx.lineTo(w / 2 - c * 0.1, y));
        else for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.12) (ctx.moveTo(x, T + c * 0.1), ctx.lineTo(x, h / 2 - c * 0.1));
      });
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, '#3a3d42', rect(ctx, x * (w / 2 - c * 0.12) - c * 0.05, y * (h / 2 - c * 0.12) - c * 0.05, c * 0.1, c * 0.1), 0);
      break;
    }
    case 'gantrycrane':
      // A container crane straddling the quay.
      for (const y of [T + c * 0.2, h / 2 - c * 0.2]) lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.04, y), ctx.lineTo(w / 2 - c * 0.04, y)));
      for (const x of [L + c * 0.4, w / 2 - c * 0.4]) shape(ctx, '#3f8ae0', rect(ctx, x - c * 0.2, T + c * 0.1, c * 0.4, h - c * 0.2, c * 0.02), line);
      shape(ctx, '#3f8ae0', rect(ctx, L + c * 0.2, -c * 0.2, w - c * 0.4, c * 0.4, c * 0.02), line);
      lines(ctx, '#2a5a9a', thin, () => {
        for (let x = L + c * 0.3; x < w / 2 - c * 0.3; x += c * 0.3) (ctx.moveTo(x, -c * 0.2), ctx.lineTo(x + c * 0.15, c * 0.2), ctx.lineTo(x + c * 0.3, -c * 0.2));
      });
      shape(ctx, '#e8b33a', rect(ctx, -c * 0.24, -c * 0.16, c * 0.48, c * 0.32, c * 0.04), thin);
      break;
    case 'mooring':
      shape(ctx, '#2a2c30', circle(ctx, 0, 0, c * 0.2), line);
      shape(ctx, '#3a3d42', circle(ctx, 0, 0, c * 0.12), 0);
      lines(ctx, '#c9b38a', Math.max(2, c / 12), () => (ctx.moveTo(c * 0.16, -c * 0.06), ctx.quadraticCurveTo(c * 0.4, -c * 0.2, c * 0.5, -c * 0.44)));
      break;
    // ---- An amusement park ----
    case 'ferriswheel': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, 'rgba(20, 16, 10, 0.2)', circle(ctx, c * 0.1, c * 0.14, r), 0);
      lines(ctx, '#d6d6cf', Math.max(2, c / 12), () => {
        ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
        }
      });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        shape(ctx, FUN[k % FUN.length]!, rect(ctx, Math.cos(a) * r * 0.9 - c * 0.1, Math.sin(a) * r * 0.9 - c * 0.08, c * 0.2, c * 0.16, c * 0.04), thin);
      }
      shape(ctx, '#e8c14a', circle(ctx, 0, 0, c * 0.14), thin);
      break;
    }
    case 'coaster':
      // A stretch of roller-coaster track on its supports: stretch it.
      for (let x = L + c * 0.5; x < w / 2; x += c) shape(ctx, '#8d949c', circle(ctx, x, 0, c * 0.1), thin);
      lines(ctx, '#e0523a', Math.max(2, c / 12), () => {
        for (const d of [-0.14, 0.14]) (ctx.moveTo(L + c * 0.04, d * c), ctx.lineTo(w / 2 - c * 0.04, d * c));
      });
      lines(ctx, '#7a3a2a', thin, () => {
        for (let x = L + c * 0.1; x < w / 2; x += c * 0.16) (ctx.moveTo(x, -c * 0.14), ctx.lineTo(x, c * 0.14));
      });
      break;
    case 'bumpercars': {
      // A rink of little cars.
      shape(ctx, '#3a3d42', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.2), line);
      shape(ctx, '#55585e', rect(ctx, L + c * 0.18, T + c * 0.18, w - c * 0.36, h - c * 0.36, c * 0.14), 0);
      const n = Math.max(3, Math.round((w * h) / (c * c)));
      for (let k = 0; k < n; k++) {
        const x = L + c * 0.4 + hash(k * 2 + 1) * (w - c * 0.8);
        const y = T + c * 0.4 + hash(k * 2 + 2) * (h - c * 0.8);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(k * 1.3);
        shape(ctx, FUN[(k + Math.round(t * 5)) % FUN.length]!, rect(ctx, -c * 0.14, -c * 0.1, c * 0.28, c * 0.2, c * 0.08), thin);
        ctx.restore();
      }
      break;
    }
    case 'cottoncandy':
      shape(ctx, '#ff9fc8', rect(ctx, -c * 0.32, -c * 0.24, c * 0.64, c * 0.48, c * 0.06), line);
      for (let k = 0; k < 4; k++) shape(ctx, k % 2 ? '#efe7d3' : '#ff6fb0', rect(ctx, -c * 0.32 + k * c * 0.16, -c * 0.38, c * 0.16, c * 0.14), thin);
      shape(ctx, '#d6d6cf', circle(ctx, 0, c * 0.02, c * 0.14), thin);
      for (const [x, col] of [[-0.18, '#ffc8e0'], [0.18, '#c8e0ff']] as const) shape(ctx, col, circle(ctx, x * c, c * 0.28, c * 0.09), thin);
      break;
    case 'ticketbooth':
      shape(ctx, '#b33a2e', rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.64, c * 0.04), line);
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.14), thin);
      shape(ctx, 'rgba(200, 225, 240, 0.9)', rect(ctx, -c * 0.2, c * 0.06, c * 0.4, c * 0.2, c * 0.03), thin);
      glow(ctx, 0, 0, c * 0.4, 'rgba(255, 220, 120, 0.35)');
      break;
    default:
      drawSets21(ctx, p, w, h, c);
  }
}

// A steady scatter in [0, 1) that does not line up like k * a % b does.
function hash(k: number) {
  const x = Math.sin(k * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
