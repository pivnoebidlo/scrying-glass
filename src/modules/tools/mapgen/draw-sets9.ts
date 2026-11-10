// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// An army's camp; magic places; a festival; a town's own things.
import type { Prop } from './furnish';
import { circle, CLOTH, GLOW, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets10 } from './draw-sets10';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const STRIPES = ['#b33a2e', '#3f5d86', '#5b7a3c', '#a8823a'];

export const SET9_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  commandtent: CLOTH, fairtent: STRIPES, carousel: STRIPES, pentagram: GLOW, necroaltar: GLOW, balloons: CLOTH,
};
// Drawn once a cell when stretched.
export const SET9_TILED: Prop['kind'][] = ['balloons', 'floatingbooks'];

export function drawSets9(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- An army's camp ----
    case 'commandtent': {
      // A big square tent: four slopes to a ridge cross, pennants at the corners.
      const col = tone(CLOTH, t);
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.2, T + c * 0.24, w - c * 0.2, h - c * 0.2), 0);
      shape(ctx, col, rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2, c * 0.06), line);
      lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => (ctx.moveTo(L + c * 0.1, T + c * 0.1), ctx.lineTo(w / 2 - c * 0.1, h / 2 - c * 0.1), ctx.moveTo(w / 2 - c * 0.1, T + c * 0.1), ctx.lineTo(L + c * 0.1, h / 2 - c * 0.1)));
      shape(ctx, 'rgba(255, 255, 255, 0.15)', () => (ctx.moveTo(L + c * 0.1, T + c * 0.1), ctx.lineTo(0, 0), ctx.lineTo(w / 2 - c * 0.1, T + c * 0.1), ctx.closePath()), 0);
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) shape(ctx, '#e8c14a', () => {
        const px = x * (w / 2 - c * 0.12);
        const py = y * (h / 2 - c * 0.12);
        ctx.moveTo(px, py);
        ctx.lineTo(px + c * 0.2, py + c * 0.06);
        ctx.lineTo(px, py + c * 0.12);
        ctx.closePath();
      }, thin);
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.2, h / 2 - c * 0.14, c * 0.4, c * 0.1), 0);
      break;
    }
    case 'supplywagon':
      // A covered wagon: canvas hoops over the bed, a shaft to the front.
      for (const [x, y] of [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]] as const) shape(ctx, DARK, rect(ctx, x * (w / 2 - c * 0.12) - c * 0.07, y * (h / 2 - c * 0.4) - c * 0.2, c * 0.14, c * 0.4, c * 0.05), 0);
      shape(ctx, '#e3d6b4', rect(ctx, L + c * 0.2, T + c * 0.5, w - c * 0.4, h - c * 0.7, c * 0.3), line);
      lines(ctx, 'rgba(120, 100, 70, 0.6)', thin, () => {
        for (let y = T + c * 0.8; y < h / 2 - c * 0.3; y += c * 0.4) (ctx.moveTo(L + c * 0.2, y), ctx.lineTo(w / 2 - c * 0.2, y));
      });
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.2, T + c * 0.5), ctx.lineTo(0, T + c * 0.04), ctx.lineTo(c * 0.2, T + c * 0.5)));
      break;
    case 'drawbridge':
      // A bridge of heavy planks on chains: it goes over the moat.
      shape(ctx, '#7a5432', rect(ctx, L + c * 0.1, T + c * 0.04, w - c * 0.2, h - c * 0.08, c * 0.03), line);
      lines(ctx, 'rgba(40, 25, 10, 0.55)', Math.max(1, c / 22), () => {
        for (let x = L + c * 0.3; x < w / 2 - c * 0.1; x += c * 0.22) (ctx.moveTo(x, T + c * 0.04), ctx.lineTo(x, h / 2 - c * 0.04));
      });
      for (const y of [T + c * 0.3, h / 2 - c * 0.3]) lines(ctx, IRON, Math.max(1.5, c / 16), () => (ctx.moveTo(L + c * 0.14, y), ctx.lineTo(w / 2 - c * 0.14, y)));
      lines(ctx, IRON, thin, () => {
        for (const x of [L + c * 0.14, w / 2 - c * 0.14]) {
          ctx.moveTo(x, T + c * 0.04);
          for (let y = T + c * 0.04; y < T + c * 0.8; y += c * 0.1) ctx.lineTo(x + (y % 0.2 > 0.1 ? 2 : -2), y);
        }
      });
      break;
    case 'portcullis':
      // An iron grid let down across a gate: put it in the gateway.
      shape(ctx, 'rgba(30, 30, 35, 0.25)', rect(ctx, L + c * 0.04, -c * 0.16, w - c * 0.08, c * 0.32), 0);
      lines(ctx, '#3a3d42', Math.max(2, c / 12), () => {
        ctx.moveTo(L + c * 0.04, -c * 0.1);
        ctx.lineTo(w / 2 - c * 0.04, -c * 0.1);
        ctx.moveTo(L + c * 0.04, c * 0.1);
        ctx.lineTo(w / 2 - c * 0.04, c * 0.1);
      });
      for (let x = L + c * 0.12; x < w / 2; x += c * 0.16) shape(ctx, '#3a3d42', () => (ctx.moveTo(x - c * 0.04, -c * 0.16), ctx.lineTo(x + c * 0.04, -c * 0.16), ctx.lineTo(x, c * 0.2), ctx.closePath()), 0);
      break;
    case 'armorstand':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.34, 0), ctx.lineTo(c * 0.34, 0)));
      shape(ctx, '#8d949c', () => ctx.ellipse(0, 0, c * 0.26, c * 0.16, 0, 0, Math.PI * 2), line);
      shape(ctx, '#a3a9ad', circle(ctx, 0, 0, c * 0.12), thin);
      lines(ctx, '#55585e', thin, () => (ctx.moveTo(-c * 0.06, -c * 0.02), ctx.lineTo(c * 0.06, -c * 0.02)));
      shape(ctx, tone(CLOTH, 0.1), () => (ctx.moveTo(c * 0.08, -c * 0.12), ctx.lineTo(c * 0.18, -c * 0.32), ctx.lineTo(c * 0.02, -c * 0.16), ctx.closePath()), 0);
      break;
    // ---- Magic places ----
    case 'stonecircle': {
      const r = Math.min(w, h) * 0.4;
      lines(ctx, 'rgba(60, 80, 40, 0.4)', Math.max(2, c / 10), () => ctx.arc(0, 0, r, 0, Math.PI * 2));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ctx.save();
        ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
        ctx.rotate(a);
        shape(ctx, '#8c857a', rect(ctx, -c * 0.18, -c * 0.12, c * 0.36, c * 0.24, c * 0.06), line);
        ctx.restore();
      }
      shape(ctx, '#7d776d', rect(ctx, -c * 0.3, -c * 0.16, c * 0.6, c * 0.32, c * 0.04), line);
      lines(ctx, '#5f8f3c', thin, () => (ctx.moveTo(-c * 0.2, 0), ctx.quadraticCurveTo(0, -c * 0.12, c * 0.2, 0)));
      break;
    }
    case 'observatory': {
      // A dome from above with its slit open and the telescope showing.
      const r = Math.min(w, h) * 0.46;
      shape(ctx, '#8a8476', circle(ctx, 0, 0, r), line);
      shape(ctx, '#5f7a8e', circle(ctx, 0, 0, r * 0.84), line);
      lines(ctx, 'rgba(255, 255, 255, 0.2)', thin, () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84);
        }
      });
      shape(ctx, '#1d2430', rect(ctx, -c * 0.2, -r * 0.84, c * 0.4, r * 0.84), thin);
      shape(ctx, '#b8913e', rect(ctx, -c * 0.08, -r * 0.7, c * 0.16, r * 0.7, c * 0.04), thin);
      break;
    }
    case 'necroaltar': {
      const col = tone(GLOW, t);
      glow(ctx, 0, 0, Math.max(w, h) * 0.5, `${col}55`);
      shape(ctx, '#3a3530', rect(ctx, L + c * 0.08, -c * 0.24, w - c * 0.16, c * 0.48, c * 0.04), line);
      for (const x of [-0.6, -0.2, 0.2, 0.6]) shape(ctx, '#e8e2d0', circle(ctx, x * c, -c * 0.08, c * 0.09), thin);
      for (const x of [-0.6, -0.2, 0.2, 0.6]) for (const dx of [-0.03, 0.03]) shape(ctx, DARK, circle(ctx, (x + dx) * c, -c * 0.1, c * 0.02), 0);
      shape(ctx, col, circle(ctx, 0, c * 0.12, c * 0.08), 0);
      break;
    }
    case 'pentagram': {
      const col = tone(GLOW, t);
      const r = Math.min(w, h) * 0.42;
      glow(ctx, 0, 0, r * 1.2, `${col}55`);
      lines(ctx, col, Math.max(1.5, c / 14), () => {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        for (let k = 0; k <= 5; k++) {
          const a = -Math.PI / 2 + ((k * 2) % 5) * ((Math.PI * 2) / 5);
          if (k) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      });
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
        glow(ctx, Math.cos(a) * r, Math.sin(a) * r, c * 0.16, 'rgba(255, 214, 120, 0.8)');
        shape(ctx, '#f0e6c8', circle(ctx, Math.cos(a) * r, Math.sin(a) * r, c * 0.05), thin);
      }
      break;
    }
    case 'floatingbooks':
      for (const [x, y, a, k] of [[-0.16, -0.12, 0.4, 0], [0.16, 0.06, -0.6, 3], [-0.04, 0.24, 1.1, 5]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, 'rgba(20, 16, 10, 0.2)', rect(ctx, -c * 0.08, -c * 0.02, c * 0.24, c * 0.18), 0);
        shape(ctx, CLOTH[k]!, rect(ctx, -c * 0.12, -c * 0.1, c * 0.24, c * 0.18, c * 0.02), thin);
        lines(ctx, '#efe7d3', thin, () => (ctx.moveTo(0, -c * 0.1), ctx.lineTo(0, c * 0.08)));
        ctx.restore();
      }
      glow(ctx, 0, 0, c * 0.4, 'rgba(180, 160, 255, 0.3)');
      break;
    // ---- A festival ----
    case 'carousel': {
      const r = Math.min(w, h) * 0.46;
      shape(ctx, tone(STRIPES, t), circle(ctx, 0, 0, r), line);
      for (let k = 0; k < 12; k++) {
        if (k % 2) continue;
        const a = (k / 12) * Math.PI * 2;
        shape(ctx, '#efe7d3', () => (ctx.moveTo(0, 0), ctx.arc(0, 0, r, a, a + Math.PI / 6), ctx.closePath()), 0);
      }
      lines(ctx, DARK, thin, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
      shape(ctx, '#c9a442', circle(ctx, 0, 0, r * 0.18), thin);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + 0.26;
        glow(ctx, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, c * 0.12, 'rgba(255, 220, 140, 0.8)');
      }
      break;
    }
    case 'maypole':
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        lines(ctx, CLOTH[k % CLOTH.length]!, Math.max(1.5, c / 18), () => (ctx.moveTo(0, 0), ctx.quadraticCurveTo(Math.cos(a + 0.4) * c * 0.25, Math.sin(a + 0.4) * c * 0.25, Math.cos(a) * c * 0.46, Math.sin(a) * c * 0.46)));
      }
      shape(ctx, '#f0e6c8', circle(ctx, 0, 0, c * 0.1), thin);
      shape(ctx, '#5f8f3c', circle(ctx, 0, 0, c * 0.05), 0);
      break;
    case 'garland':
      // A string of little flags: stretch it between posts or across a street.
      lines(ctx, '#5c3d22', thin, () => (ctx.moveTo(L, 0), ctx.quadraticCurveTo(0, c * 0.14, w / 2, 0)));
      for (let x = L + c * 0.16, k = 0; x < w / 2 - c * 0.08; x += c * 0.22, k++) {
        const y = c * 0.14 * (1 - (2 * x / w) ** 2) * 0.5;
        shape(ctx, STRIPES[k % STRIPES.length]!, () => (ctx.moveTo(x - c * 0.07, y), ctx.lineTo(x + c * 0.07, y), ctx.lineTo(x, y + c * 0.16), ctx.closePath()), 0);
      }
      glow(ctx, 0, c * 0.05, Math.max(w, c) * 0.3, 'rgba(255, 220, 140, 0.15)');
      break;
    case 'fairtent': {
      const col = tone(STRIPES, t);
      const r = Math.min(w, h) * 0.44;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        shape(ctx, k % 2 ? col : '#efe7d3', () => (ctx.moveTo(0, 0), ctx.arc(0, 0, r, a, a + Math.PI / 4), ctx.closePath()), thin);
      }
      lines(ctx, DARK, line, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
      shape(ctx, '#e8c14a', circle(ctx, 0, 0, c * 0.08), thin);
      break;
    }
    case 'foodcart':
      for (const y of [T + c * 0.4, h / 2 - c * 0.4]) for (const x of [-0.34, 0.34]) shape(ctx, DARK, rect(ctx, x * c - c * 0.06, y - c * 0.14, c * 0.12, c * 0.28, c * 0.04), 0);
      shape(ctx, tone(WOOD, 0.7), rect(ctx, -c * 0.3, T + c * 0.2, c * 0.6, h - c * 0.4, c * 0.04), line);
      shape(ctx, tone(STRIPES, 0.1), () => {
        ctx.moveTo(-c * 0.38, T + c * 0.12);
        ctx.lineTo(c * 0.38, T + c * 0.12);
        ctx.lineTo(c * 0.38, T + c * 0.5);
        ctx.lineTo(-c * 0.38, T + c * 0.5);
        ctx.closePath();
      }, thin);
      for (const [x, col] of [[-0.14, '#c98a3e'], [0.12, '#b33a2e']] as const) shape(ctx, col, circle(ctx, x * c, c * 0.3, c * 0.08), thin);
      break;
    case 'puppetshow':
      shape(ctx, tone(STRIPES, 0.5), rect(ctx, L + c * 0.06, T + c * 0.12, w - c * 0.12, h - c * 0.24, c * 0.04), line);
      shape(ctx, '#2a1f33', rect(ctx, L + c * 0.3, T + c * 0.2, w - c * 0.6, c * 0.3), thin);
      shape(ctx, '#b33a2e', () => {
        for (let x = L + c * 0.3; x < w / 2 - c * 0.3; x += c * 0.2) (ctx.moveTo(x, T + c * 0.2), ctx.quadraticCurveTo(x + c * 0.1, T + c * 0.36, x + c * 0.2, T + c * 0.2));
      }, 0);
      shape(ctx, '#e8c9a0', circle(ctx, -c * 0.2, T + c * 0.4, c * 0.06), 0);
      shape(ctx, '#e8c9a0', circle(ctx, c * 0.2, T + c * 0.4, c * 0.06), 0);
      break;
    case 'balloons':
      for (const [x, y, k] of [[-0.16, -0.16, 0], [0.16, -0.12, 1], [0, 0.04, 3], [-0.2, 0.14, 4], [0.18, 0.16, 5]] as const) {
        lines(ctx, 'rgba(60, 50, 40, 0.5)', thin, () => (ctx.moveTo(x * c, y * c + c * 0.1), ctx.lineTo(0, c * 0.4)));
        shape(ctx, CLOTH[(k + Math.floor(t * 8)) % CLOTH.length]!, () => ctx.ellipse(x * c, y * c, c * 0.1, c * 0.12, 0, 0, Math.PI * 2), thin);
        shape(ctx, 'rgba(255, 255, 255, 0.5)', circle(ctx, x * c - c * 0.03, y * c - c * 0.04, c * 0.025), 0);
      }
      break;
    // ---- A town's own things ----
    case 'clocktower': {
      // A square tower with its pointed roof and the clock face on its front.
      shape(ctx, 'rgba(20, 16, 10, 0.35)', rect(ctx, L + c * 0.2, T + c * 0.24, w - c * 0.1, h - c * 0.1), 0);
      shape(ctx, '#8a8476', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12), line);
      shape(ctx, '#4a5e70', () => (ctx.moveTo(L + c * 0.16, T + c * 0.16), ctx.lineTo(0, 0), ctx.lineTo(w / 2 - c * 0.16, T + c * 0.16), ctx.closePath()), thin);
      shape(ctx, '#3a4b5a', () => (ctx.moveTo(w / 2 - c * 0.16, T + c * 0.16), ctx.lineTo(0, 0), ctx.lineTo(w / 2 - c * 0.16, h / 2 - c * 0.16), ctx.closePath()), thin);
      shape(ctx, '#4a5e70', () => (ctx.moveTo(L + c * 0.16, h / 2 - c * 0.16), ctx.lineTo(0, 0), ctx.lineTo(w / 2 - c * 0.16, h / 2 - c * 0.16), ctx.closePath()), thin);
      shape(ctx, '#3a4b5a', () => (ctx.moveTo(L + c * 0.16, T + c * 0.16), ctx.lineTo(0, 0), ctx.lineTo(L + c * 0.16, h / 2 - c * 0.16), ctx.closePath()), thin);
      shape(ctx, '#efe7d3', circle(ctx, 0, h / 2 - c * 0.06, c * 0.2), line);
      lines(ctx, DARK, Math.max(1.5, c / 18), () => (ctx.moveTo(0, h / 2 - c * 0.06), ctx.lineTo(0, h / 2 - c * 0.2), ctx.moveTo(0, h / 2 - c * 0.06), ctx.lineTo(c * 0.1, h / 2 - c * 0.02)));
      break;
    }
    case 'noticeboard':
      lines(ctx, '#5c3d22', Math.max(2, c / 10), () => (ctx.moveTo(L + c * 0.2, 0), ctx.lineTo(L + c * 0.2, c * 0.3), ctx.moveTo(w / 2 - c * 0.2, 0), ctx.lineTo(w / 2 - c * 0.2, c * 0.3)));
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.08, -c * 0.2, w - c * 0.16, c * 0.3, c * 0.03), line);
      for (const [x, y, col] of [[-0.5, -0.14, '#efe7d3'], [-0.15, -0.16, '#e8d9a8'], [0.2, -0.12, '#efe7d3'], [0.5, -0.15, '#e3cfa0']] as const) {
        shape(ctx, col, rect(ctx, x * c - c * 0.1, y * c, c * 0.2, c * 0.18), thin);
        lines(ctx, 'rgba(60, 50, 40, 0.5)', thin, () => (ctx.moveTo(x * c - c * 0.06, y * c + c * 0.06), ctx.lineTo(x * c + c * 0.06, y * c + c * 0.06)));
      }
      break;
    case 'guardbooth':
      shape(ctx, tone(STRIPES, 0.1), rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.64, c * 0.04), line);
      lines(ctx, '#efe7d3', Math.max(2, c / 10), () => {
        for (let k = -2; k <= 2; k++) (ctx.moveTo(k * c * 0.14 - c * 0.08, -c * 0.32), ctx.lineTo(k * c * 0.14 + c * 0.08, c * 0.32));
      });
      shape(ctx, '#3a2a1c', rect(ctx, -c * 0.16, c * 0.16, c * 0.32, c * 0.16), thin);
      break;
    case 'pillory':
      lines(ctx, '#5c3d22', Math.max(3, c / 9), () => (ctx.moveTo(0, -c * 0.4), ctx.lineTo(0, c * 0.4)));
      shape(ctx, tone(WOOD, 0.2), rect(ctx, -c * 0.4, -c * 0.12, c * 0.8, c * 0.24, c * 0.03), line);
      for (const x of [-0.24, 0, 0.24]) shape(ctx, DARK, circle(ctx, x * c, 0, x ? c * 0.05 : c * 0.08), 0);
      break;
    default:
      drawSets10(ctx, p, w, h, c);
  }
}
