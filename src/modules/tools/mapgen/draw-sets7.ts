// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Under the sea; the sky and airships; a steampunk workshop; a nomads' camp; a pirates' cove.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, STONE, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const BRASS = '#b8913e';
const CORAL = ['#e86f6f', '#e8a14f', '#c76fe0', '#e86fb0'];

export const SET7_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  coral: CORAL, anemone: CORAL, airship: CLOTH, balloon: CLOTH, yurt: ['#d8cdb3', '#a8823a', '#8e3b32'], floatrock: STONE,
};
// Drawn once a cell when stretched.
export const SET7_TILED: Prop['kind'][] = ['coral', 'kelp', 'bubbles', 'cloud', 'gears', 'sheep'];

export function drawSets7(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- Under the sea ----
    case 'coral': {
      const col = tone(CORAL, t);
      lines(ctx, col, Math.max(2, c / 10), () => {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + 0.3;
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2 - c * 0.05, Math.cos(a + 0.4) * c * 0.38, Math.sin(a + 0.4) * c * 0.38);
          ctx.moveTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2);
          ctx.lineTo(Math.cos(a - 0.5) * c * 0.32, Math.sin(a - 0.5) * c * 0.32);
        }
      });
      break;
    }
    case 'kelp':
      lines(ctx, '#3f6a35', Math.max(3, c / 7), () => {
        for (const x of [-0.2, 0.05, 0.25]) (ctx.moveTo(x * c, c * 0.45), ctx.bezierCurveTo((x - 0.15) * c, c * 0.15, (x + 0.15) * c, -c * 0.15, x * c, -c * 0.45));
      });
      break;
    case 'giantclam':
      shape(ctx, '#d6cdb5', () => ctx.ellipse(0, c * 0.1, w * 0.44, h * 0.36, 0, Math.PI, 0), line);
      shape(ctx, '#c9b48a', () => ctx.ellipse(0, c * 0.1, w * 0.44, h * 0.3, 0, 0, Math.PI), line);
      lines(ctx, 'rgba(110, 90, 60, 0.5)', thin, () => {
        for (let k = 1; k < 6; k++) {
          const a = Math.PI + (k / 6) * Math.PI;
          ctx.moveTo(0, c * 0.1);
          ctx.lineTo(Math.cos(a) * w * 0.44, c * 0.1 + Math.sin(a) * h * 0.36);
        }
      });
      glow(ctx, 0, c * 0.1, c * 0.4, 'rgba(255, 240, 230, 0.6)');
      shape(ctx, '#f6f1ec', circle(ctx, 0, c * 0.1, c * 0.14), thin);
      break;
    case 'shipwreck':
      // A broken hull on its side, ribs showing.
      shape(ctx, '#5c4a36', () => {
        ctx.moveTo(0, T + c * 0.1);
        ctx.quadraticCurveTo(w * 0.46, T + h * 0.3, w * 0.36, h / 2 - c * 0.2);
        ctx.lineTo(-w * 0.1, h / 2 - c * 0.5);
        ctx.lineTo(-w * 0.36, h / 2 - c * 0.2);
        ctx.quadraticCurveTo(-w * 0.46, T + h * 0.3, 0, T + c * 0.1);
      }, line);
      lines(ctx, '#3a2e22', Math.max(2, c / 12), () => {
        for (let y = T + c * 0.6; y < h / 2 - c * 0.5; y += c * 0.45) (ctx.moveTo(-w * 0.34, y), ctx.lineTo(w * 0.34, y));
      });
      lines(ctx, '#3a2e22', Math.max(3, c / 8), () => (ctx.moveTo(-c * 0.2, -c * 0.2), ctx.lineTo(w * 0.5, -h * 0.1)));
      shape(ctx, 'rgba(20, 40, 50, 0.6)', () => ctx.ellipse(-w * 0.12, h * 0.1, c * 0.4, c * 0.3, 0.5, 0, Math.PI * 2), 0);
      break;
    case 'anemone': {
      const col = tone(CORAL, t);
      lines(ctx, col, Math.max(1.5, c / 16), () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.1, Math.sin(a) * c * 0.1);
          ctx.quadraticCurveTo(Math.cos(a + 0.3) * c * 0.25, Math.sin(a + 0.3) * c * 0.25, Math.cos(a) * c * 0.36, Math.sin(a) * c * 0.36);
        }
      });
      shape(ctx, col, circle(ctx, 0, 0, c * 0.12), thin);
      break;
    }
    case 'bubbles':
      for (const [x, y, r] of [[-0.2, -0.1, 0.08], [0.1, -0.24, 0.05], [0.18, 0.12, 0.1], [-0.1, 0.24, 0.06]] as const) {
        lines(ctx, 'rgba(230, 248, 255, 0.85)', thin, () => ctx.arc(x * c, y * c, r * c, 0, Math.PI * 2));
        shape(ctx, 'rgba(255, 255, 255, 0.8)', circle(ctx, (x - r * 0.3) * c, (y - r * 0.3) * c, r * c * 0.25), 0);
      }
      break;
    // ---- The sky and airships ----
    case 'cloud':
      shape(ctx, 'rgba(248, 250, 252, 0.85)', () => {
        for (const [x, y, r] of [[-0.2, 0.05, 0.22], [0.08, -0.08, 0.26], [0.26, 0.1, 0.18], [-0.02, 0.18, 0.2]] as const) {
          ctx.moveTo(x * c + r * c, y * c);
          ctx.arc(x * c, y * c, r * c, 0, Math.PI * 2);
        }
      }, 0);
      break;
    case 'airship': {
      // A gas bag over a gondola, fins at the back, a propeller.
      shape(ctx, 'rgba(20, 16, 10, 0.25)', () => ctx.ellipse(c * 0.3, c * 0.4, w * 0.4, h * 0.46, 0, 0, Math.PI * 2), 0);
      shape(ctx, tone(CLOTH, t), () => ctx.ellipse(0, -c * 0.1, w * 0.42, h * 0.44, 0, 0, Math.PI * 2), line);
      lines(ctx, 'rgba(0, 0, 0, 0.25)', thin, () => {
        for (const k of [-0.5, 0, 0.5]) ctx.ellipse(0, -c * 0.1, w * 0.42 * Math.abs(Math.cos(k)), h * 0.44, 0, 0, Math.PI * 2);
      });
      for (const sx of [-1, 1]) shape(ctx, tone(CLOTH, t), () => (ctx.moveTo(sx * w * 0.1, h * 0.28), ctx.lineTo(sx * w * 0.36, h * 0.46), ctx.lineTo(sx * w * 0.08, h * 0.42), ctx.closePath()), thin);
      shape(ctx, '#7a5432', rect(ctx, -w * 0.14, -h * 0.12, w * 0.28, h * 0.3, c * 0.06), thin);
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, h * 0.48), ctx.lineTo(c * 0.3, h * 0.48)));
      break;
    }
    case 'mooringmast':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.2), line);
      lines(ctx, '#3a3d42', thin, () => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.44, Math.sin(a) * c * 0.44);
        }
      });
      shape(ctx, '#e0523a', circle(ctx, 0, 0, c * 0.07), 0);
      break;
    case 'floatrock': {
      // A floating island seen from above: rock with grass on top, roots and its shadow far below.
      shape(ctx, 'rgba(20, 30, 40, 0.25)', () => ctx.ellipse(c * 0.5, c * 0.6, w * 0.38, h * 0.32, 0, 0, Math.PI * 2), 0);
      shape(ctx, tone(STONE, t), () => ctx.ellipse(0, 0, w * 0.44, h * 0.4, 0.2, 0, Math.PI * 2), line);
      shape(ctx, '#7f9558', () => ctx.ellipse(-c * 0.1, -c * 0.1, w * 0.34, h * 0.28, 0.2, 0, Math.PI * 2), thin);
      lines(ctx, '#5c4430', thin, () => {
        for (const [x, y] of [[0.4, 0.3], [-0.3, 0.38], [0.1, 0.42]] as const) (ctx.moveTo(x * w * 0.8, y * h * 0.8), ctx.lineTo(x * w, y * h));
      });
      break;
    }
    case 'balloon':
      shape(ctx, tone(CLOTH, t), circle(ctx, 0, 0, Math.min(w, h) * 0.44), line);
      lines(ctx, 'rgba(255, 255, 255, 0.45)', Math.max(2, c / 10), () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * Math.min(w, h) * 0.44, Math.sin(a) * Math.min(w, h) * 0.44);
        }
      });
      shape(ctx, '#7a5432', rect(ctx, -c * 0.16, -c * 0.16, c * 0.32, c * 0.32, c * 0.04), thin);
      break;
    // ---- A steampunk workshop ----
    case 'gears':
      for (const [x, y, r] of [[-0.14, -0.1, 0.2], [0.18, 0.14, 0.14]] as const) {
        shape(ctx, BRASS, () => {
          const n = r > 0.15 ? 10 : 8;
          for (let k = 0; k < n * 2; k++) {
            const a = (k / (n * 2)) * Math.PI * 2;
            const rr = (k % 2 ? r : r * 1.25) * c;
            ctx.lineTo(x * c + Math.cos(a) * rr, y * c + Math.sin(a) * rr);
          }
          ctx.closePath();
        }, thin);
        shape(ctx, '#7a5a2a', circle(ctx, x * c, y * c, r * c * 0.35), 0);
      }
      break;
    case 'boiler':
      shape(ctx, '#7a3d22', circle(ctx, 0, 0, Math.min(w, h) * 0.42), line);
      lines(ctx, BRASS, Math.max(2, c / 10), () => {
        for (const k of [0.3, 0.38]) ctx.arc(0, 0, Math.min(w, h) * k, 0, Math.PI * 2);
      });
      shape(ctx, '#2a1a10', rect(ctx, -c * 0.2, h * 0.16, c * 0.4, c * 0.2, c * 0.06), thin);
      glow(ctx, 0, h * 0.26, c * 0.5, 'rgba(255, 140, 40, 0.7)');
      for (const x of [-0.3, 0.3]) {
        shape(ctx, '#efe7d3', circle(ctx, x * c, -c * 0.3, c * 0.12), thin);
        lines(ctx, DARK, thin, () => (ctx.moveTo(x * c, -c * 0.3), ctx.lineTo(x * c + c * 0.06, -c * 0.38)));
      }
      break;
    case 'automaton':
      shape(ctx, BRASS, circle(ctx, 0, 0, c * 0.28), line);
      shape(ctx, '#8a6a2a', circle(ctx, 0, -c * 0.06, c * 0.14), thin);
      for (const x of [-0.05, 0.05]) shape(ctx, '#5fd3c9', circle(ctx, x * c, -c * 0.1, c * 0.03), 0);
      lines(ctx, '#7a5a2a', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.28, 0), ctx.lineTo(-c * 0.42, c * 0.18), ctx.moveTo(c * 0.28, 0), ctx.lineTo(c * 0.42, c * 0.18)));
      shape(ctx, IRON, circle(ctx, 0, c * 0.14, c * 0.06), thin);
      break;
    case 'telescope':
      lines(ctx, '#5c3d22', thin, () => {
        for (const a of [0.6, 2.5, 4.4]) (ctx.moveTo(0, c * 0.2), ctx.lineTo(Math.cos(a) * c * 0.3, c * 0.2 + Math.sin(a) * c * 0.3));
      });
      shape(ctx, BRASS, () => {
        ctx.moveTo(-c * 0.08, h / 2 - c * 0.3);
        ctx.lineTo(c * 0.08, h / 2 - c * 0.3);
        ctx.lineTo(c * 0.14, T + c * 0.12);
        ctx.lineTo(-c * 0.14, T + c * 0.12);
        ctx.closePath();
      }, line);
      shape(ctx, '#8fc0d6', () => ctx.ellipse(0, T + c * 0.12, c * 0.14, c * 0.05, 0, 0, Math.PI * 2), thin);
      break;
    case 'teslacoil':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.26), line);
      lines(ctx, '#b87333', thin, () => {
        for (const r of [0.2, 0.15, 0.1]) ctx.arc(0, 0, r * c, 0, Math.PI * 2);
      });
      glow(ctx, 0, 0, c * 0.5, 'rgba(140, 200, 255, 0.55)');
      lines(ctx, '#d8f0ff', Math.max(1.5, c / 18), () => {
        ctx.moveTo(0, 0);
        ctx.lineTo(c * 0.18, -c * 0.12);
        ctx.lineTo(c * 0.12, -c * 0.2);
        ctx.lineTo(c * 0.36, -c * 0.34);
        ctx.moveTo(0, 0);
        ctx.lineTo(-c * 0.14, c * 0.16);
        ctx.lineTo(-c * 0.24, c * 0.12);
        ctx.lineTo(-c * 0.38, c * 0.3);
      });
      shape(ctx, '#c9d6e0', circle(ctx, 0, 0, c * 0.08), thin);
      break;
    case 'gauges':
      // Pressure gauges on a wall: put them on a wall cell.
      for (const x of [-0.22, 0.22]) {
        shape(ctx, BRASS, circle(ctx, x * c, c * 0.06, c * 0.16), thin);
        shape(ctx, '#efe7d3', circle(ctx, x * c, c * 0.06, c * 0.11), 0);
        lines(ctx, '#b33a2e', thin, () => (ctx.moveTo(x * c, c * 0.06), ctx.lineTo(x * c + c * 0.07, -c * 0.01)));
      }
      lines(ctx, '#8d949c', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.46, -c * 0.16), ctx.lineTo(c * 0.46, -c * 0.16)));
      break;
    // ---- A nomads' camp ----
    case 'yurt': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, tone(SET7_TINTS.yurt!, t), circle(ctx, 0, 0, r), line);
      lines(ctx, 'rgba(90, 60, 30, 0.45)', thin, () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      });
      lines(ctx, '#8e3b32', Math.max(2, c / 10), () => ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2));
      shape(ctx, '#5c3d22', circle(ctx, 0, 0, r * 0.22), thin);
      shape(ctx, '#7a5432', rect(ctx, -c * 0.2, r - c * 0.08, c * 0.4, c * 0.16), thin);
      break;
    }
    case 'camel':
      shape(ctx, '#c9a46a', () => ctx.ellipse(0, c * 0.12, c * 0.2, h * 0.3, 0, 0, Math.PI * 2), line);
      for (const y of [-0.1, 0.35]) shape(ctx, '#b88f55', circle(ctx, 0, y * c, c * 0.12), thin);
      shape(ctx, '#c9a46a', () => ctx.ellipse(0, T + c * 0.22, c * 0.08, c * 0.18, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#8e3b32', rect(ctx, -c * 0.22, c * 0.02, c * 0.44, c * 0.1, c * 0.03), 0);
      break;
    case 'tripod':
      shape(ctx, '#3a2a1c', circle(ctx, 0, 0, c * 0.3), 0);
      glow(ctx, 0, 0, c * 0.45, 'rgba(255, 140, 40, 0.6)');
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => {
        for (const a of [-1.57, 0.52, 2.62]) (ctx.moveTo(0, 0), ctx.lineTo(Math.cos(a) * c * 0.42, Math.sin(a) * c * 0.42));
      });
      shape(ctx, DARK, circle(ctx, 0, 0, c * 0.16), thin);
      shape(ctx, '#8a6a3a', circle(ctx, 0, 0, c * 0.1), 0);
      break;
    case 'hiderack':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.1, T + c * 0.2), ctx.lineTo(w / 2 - c * 0.1, T + c * 0.2)));
      for (let x = L + c * 0.5; x < w / 2; x += c) {
        shape(ctx, x % 2 > 1 ? '#a8823a' : '#8a6a4a', () => {
          ctx.moveTo(x - c * 0.3, T + c * 0.2);
          ctx.lineTo(x + c * 0.3, T + c * 0.2);
          ctx.lineTo(x + c * 0.36, h / 2 - c * 0.2);
          ctx.lineTo(x, h / 2 - c * 0.1);
          ctx.lineTo(x - c * 0.36, h / 2 - c * 0.2);
          ctx.closePath();
        }, thin);
      }
      break;
    case 'sheep':
      for (const [x, y, a] of [[-0.18, -0.1, 0.3], [0.18, 0.12, -0.5]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#f0ebe0', () => {
          for (const [dx, dy] of [[-0.06, -0.05], [0.06, -0.05], [-0.06, 0.05], [0.06, 0.05], [0, 0]] as const) {
            ctx.moveTo(dx * c + c * 0.09, dy * c);
            ctx.arc(dx * c, dy * c, c * 0.09, 0, Math.PI * 2);
          }
        }, thin);
        shape(ctx, DARK, () => ctx.ellipse(c * 0.17, 0, c * 0.06, c * 0.045, 0, 0, Math.PI * 2), 0);
        ctx.restore();
      }
      break;
    // ---- A pirates' cove ----
    case 'treasurepile': {
      shape(ctx, '#d4a640', () => ctx.ellipse(0, 0, w * 0.44, h * 0.38, 0, 0, Math.PI * 2), line);
      glow(ctx, 0, 0, Math.min(w, h) * 0.5, 'rgba(255, 220, 110, 0.45)');
      for (let k = 0; k < 14; k++) {
        const a = k * 2.4;
        const r = (k / 14) * Math.min(w, h) * 0.34;
        shape(ctx, k % 4 ? '#e8c14a' : '#b3e0f0', circle(ctx, Math.cos(a) * r, Math.sin(a) * r * 0.85, c * 0.07), thin);
      }
      shape(ctx, '#7a4f24', rect(ctx, -c * 0.3, -h * 0.3, c * 0.6, c * 0.36, c * 0.05), thin);
      shape(ctx, '#d4a640', rect(ctx, -c * 0.06, -h * 0.3 + c * 0.12, c * 0.12, c * 0.12), 0);
      break;
    }
    case 'jollyroger':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, -c * 0.36), ctx.lineTo(-c * 0.3, c * 0.4)));
      shape(ctx, '#1d1b1e', rect(ctx, -c * 0.3, -c * 0.36, c * 0.66, c * 0.42, c * 0.02), thin);
      shape(ctx, '#efe7d3', circle(ctx, c * 0.03, -c * 0.17, c * 0.08), 0);
      lines(ctx, '#efe7d3', Math.max(1.5, c / 18), () => (ctx.moveTo(-c * 0.12, -c * 0.04), ctx.lineTo(c * 0.18, -c * 0.3), ctx.moveTo(c * 0.18, -c * 0.04), ctx.lineTo(-c * 0.12, -c * 0.3)));
      break;
    case 'plank':
      // A plank over the side: it goes out over the water.
      shape(ctx, '#9a6b3c', rect(ctx, -c * 0.18, T + c * 0.04, c * 0.36, h - c * 0.08, c * 0.03), line);
      lines(ctx, 'rgba(50, 30, 12, 0.4)', thin, () => (ctx.moveTo(-c * 0.06, T + c * 0.1), ctx.lineTo(-c * 0.06, h / 2 - c * 0.1)));
      break;
    case 'charttable':
      shape(ctx, tone(WOOD, 0.7), rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.2, c * 0.04), line);
      shape(ctx, '#e8d9a8', rect(ctx, L + c * 0.2, T + c * 0.18, w - c * 0.5, h - c * 0.36, c * 0.02), thin);
      lines(ctx, '#8a6a3a', thin, () => {
        ctx.moveTo(L + c * 0.3, 0);
        ctx.quadraticCurveTo(0, -c * 0.2, w / 2 - c * 0.4, c * 0.08);
      });
      lines(ctx, '#b33a2e', Math.max(1.5, c / 16), () => (ctx.moveTo(w / 2 - c * 0.46, c * 0.02), ctx.lineTo(w / 2 - c * 0.36, c * 0.12), ctx.moveTo(w / 2 - c * 0.36, c * 0.02), ctx.lineTo(w / 2 - c * 0.46, c * 0.12)));
      shape(ctx, BRASS, circle(ctx, w / 2 - c * 0.18, -c * 0.12, c * 0.07), thin);
      break;
    case 'parrot':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, 0), ctx.lineTo(c * 0.3, 0)));
      shape(ctx, '#d9473a', () => ctx.ellipse(0, -c * 0.04, c * 0.1, c * 0.16, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#3f7d33', () => ctx.ellipse(0, c * 0.14, c * 0.05, c * 0.12, 0, 0, Math.PI * 2), 0);
      shape(ctx, '#e8c14a', circle(ctx, 0, -c * 0.2, c * 0.04), 0);
      break;
    case 'ropebridge':
      // A bridge of planks on ropes: it goes over a chasm or water.
      for (let y = T + c * 0.12; y < h / 2; y += c * 0.24) shape(ctx, '#9a6b3c', rect(ctx, -c * 0.32, y, c * 0.64, c * 0.16, c * 0.02), thin);
      lines(ctx, '#b89a64', Math.max(1.5, c / 16), () => {
        for (const x of [-0.36, 0.36]) (ctx.moveTo(x * c, T), ctx.lineTo(x * c, h / 2));
      });
      break;
  }
}
