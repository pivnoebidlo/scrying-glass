// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// The forest and the road, a port, a temple and magic, a prison, a village and a farm.
import type { Prop } from './furnish';
import { circle, CLOTH, GLOW, glow, lines, rect, shape, STONE, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets3 } from './draw-sets3';

const IRON = '#55585e';
const SLIME = ['#7ac74f', '#4fa8c7', '#c74f8e', '#c7b24f'];

export const SET2_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  portal: GLOW, orb: GLOW, runes: GLOW, slime: SLIME, buoy: ['#d9473a', '#e8c14a', '#e8e2d0'], milestone: STONE,
};
// Drawn once a cell when stretched.
export const SET2_TILED: Prop['kind'][] = ['runes', 'slime', 'sheaf', 'pumpkins', 'chickens', 'nets'];

export function drawSets2(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  const planks = (x0: number, y0: number, ww: number, hh: number, across: boolean) => {
    shape(ctx, '#9a6b3c', rect(ctx, x0, y0, ww, hh), line);
    lines(ctx, 'rgba(50, 30, 12, 0.5)', thin, () => {
      if (across) for (let y = y0 + c * 0.2; y < y0 + hh; y += c * 0.2) (ctx.moveTo(x0, y), ctx.lineTo(x0 + ww, y));
      else for (let x = x0 + c * 0.2; x < x0 + ww; x += c * 0.2) (ctx.moveTo(x, y0), ctx.lineTo(x, y0 + hh));
    });
  };
  switch (p.kind) {
    // ---- The forest and the road ----
    case 'shelter':
      // A lean-to of branches over a bed of needles.
      shape(ctx, '#6b5a3a', rect(ctx, L + c * 0.12, T + c * 0.2, w - c * 0.24, h - c * 0.4, c * 0.08), line);
      lines(ctx, '#4a3626', Math.max(1.5, c / 16), () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.15; x += c * 0.16) (ctx.moveTo(x, T + c * 0.2), ctx.lineTo(x + c * 0.08, h / 2 - c * 0.2));
      });
      lines(ctx, '#3f6a35', Math.max(1, c / 20), () => {
        for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.3) (ctx.moveTo(x, T + c * 0.3), ctx.lineTo(x + c * 0.14, T + c * 0.5));
      });
      break;
    case 'beartrap':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.3), line);
      lines(ctx, '#2b2a2e', thin, () => {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.3, Math.sin(a) * c * 0.3);
          ctx.lineTo(Math.cos(a) * c * 0.18, Math.sin(a) * c * 0.18);
        }
      });
      shape(ctx, '#8d949c', circle(ctx, 0, 0, c * 0.08), thin);
      break;
    case 'bridge':
      // A footbridge of planks between two banks: it goes over the water.
      planks(L + c * 0.12, T, w - c * 0.24, h, true);
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => {
        ctx.moveTo(L + c * 0.12, T);
        ctx.lineTo(L + c * 0.12, h / 2);
        ctx.moveTo(w / 2 - c * 0.12, T);
        ctx.lineTo(w / 2 - c * 0.12, h / 2);
      });
      break;
    case 'milestone':
      shape(ctx, tone(STONE, t), rect(ctx, -c * 0.2, -c * 0.28, c * 0.4, c * 0.56, c * 0.18), line);
      lines(ctx, 'rgba(40, 34, 28, 0.6)', thin, () => {
        ctx.moveTo(-c * 0.08, -c * 0.08);
        ctx.lineTo(c * 0.08, -c * 0.08);
        ctx.moveTo(-c * 0.08, c * 0.04);
        ctx.lineTo(c * 0.08, c * 0.04);
      });
      break;
    case 'beehive':
      shape(ctx, '#c9a24a', circle(ctx, 0, 0, c * 0.3), line);
      lines(ctx, '#8a6a2a', thin, () => {
        for (const r of [0.1, 0.2]) ctx.arc(0, 0, c * r, 0, Math.PI * 2);
      });
      shape(ctx, '#2b2a2e', circle(ctx, 0, c * 0.22, c * 0.05), 0);
      break;
    case 'wayshrine':
      shape(ctx, '#8a8174', rect(ctx, -c * 0.3, -c * 0.3, c * 0.6, c * 0.6, c * 0.06), line);
      shape(ctx, '#6b5a3a', () => {
        ctx.moveTo(-c * 0.38, -c * 0.06);
        ctx.lineTo(0, -c * 0.4);
        ctx.lineTo(c * 0.38, -c * 0.06);
        ctx.closePath();
      }, thin);
      shape(ctx, '#f0e6c8', circle(ctx, 0, c * 0.12, c * 0.06), thin);
      glow(ctx, 0, c * 0.12, c * 0.18, 'rgba(255, 214, 120, 0.6)');
      break;
    // ---- A port ----
    case 'pier':
      planks(L, T, w, h, false);
      for (const x of [L + c * 0.1, w / 2 - c * 0.1])
        for (let y = T + c * 0.5; y < h / 2; y += c) shape(ctx, '#5c3d22', circle(ctx, x, y, c * 0.09), thin);
      break;
    case 'bollard':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.2), line);
      shape(ctx, '#3a3d42', circle(ctx, 0, 0, c * 0.12), thin);
      lines(ctx, '#b89a64', Math.max(1.5, c / 14), () => ctx.arc(0, 0, c * 0.24, 0.3, 2.6));
      break;
    case 'nets':
      shape(ctx, 'rgba(160, 140, 100, 0.25)', () => ctx.ellipse(0, 0, w * 0.44, h * 0.4, 0, 0, Math.PI * 2), 0);
      lines(ctx, '#8a7a58', thin, () => {
        for (let k = -3; k <= 3; k++) {
          ctx.moveTo(k * c * 0.12 - c * 0.2, -h * 0.38);
          ctx.lineTo(k * c * 0.12 + c * 0.2, h * 0.38);
          ctx.moveTo(k * c * 0.12 + c * 0.2, -h * 0.38);
          ctx.lineTo(k * c * 0.12 - c * 0.2, h * 0.38);
        }
      });
      shape(ctx, '#e8c14a', circle(ctx, w * 0.3, 0, c * 0.06), thin);
      break;
    case 'anchor':
      lines(ctx, IRON, Math.max(2.5, c / 9), () => {
        ctx.moveTo(0, -c * 0.32);
        ctx.lineTo(0, c * 0.3);
        ctx.moveTo(-c * 0.16, -c * 0.2);
        ctx.lineTo(c * 0.16, -c * 0.2);
        ctx.moveTo(-c * 0.3, c * 0.08);
        ctx.quadraticCurveTo(0, c * 0.5, c * 0.3, c * 0.08);
      });
      shape(ctx, IRON, circle(ctx, 0, -c * 0.36, c * 0.07), thin);
      break;
    case 'rope':
      shape(ctx, '#b89a64', circle(ctx, 0, 0, c * 0.32), line);
      lines(ctx, '#8a7046', thin, () => {
        for (const r of [0.24, 0.16, 0.08]) ctx.arc(0, 0, c * r, 0, Math.PI * 2);
      });
      break;
    case 'buoy':
      shape(ctx, tone(SET2_TINTS.buoy!, t), circle(ctx, 0, 0, c * 0.24), line);
      lines(ctx, '#f6f1e4', Math.max(1.5, c / 14), () => (ctx.moveTo(-c * 0.24, 0), ctx.lineTo(c * 0.24, 0)));
      lines(ctx, 'rgba(232, 244, 244, 0.6)', thin, () => ctx.arc(0, 0, c * 0.34, 0.4, 2.6));
      break;
    case 'lighthouse': {
      const r = Math.min(w, h) * 0.42;
      shape(ctx, '#d6d2c8', circle(ctx, 0, 0, r), line);
      lines(ctx, '#b33a2e', Math.max(3, c / 6), () => ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2));
      shape(ctx, '#55585e', circle(ctx, 0, 0, r * 0.45), thin);
      glow(ctx, 0, 0, r * 1.2, 'rgba(255, 220, 130, 0.6)');
      shape(ctx, '#ffe9a8', circle(ctx, 0, 0, r * 0.22), thin);
      break;
    }
    // ---- A temple and magic ----
    case 'lectern':
      shape(ctx, '#7e5530', rect(ctx, -c * 0.26, -c * 0.2, c * 0.52, c * 0.4, c * 0.04), line);
      shape(ctx, '#efe7d3', rect(ctx, -c * 0.22, -c * 0.16, c * 0.44, c * 0.26, c * 0.02), thin);
      lines(ctx, '#7a5a34', thin, () => (ctx.moveTo(0, -c * 0.16), ctx.lineTo(0, c * 0.1)));
      break;
    case 'font':
      shape(ctx, '#bdb5a3', () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          ctx.lineTo(Math.cos(a) * c * 0.38, Math.sin(a) * c * 0.38);
        }
        ctx.closePath();
      }, line);
      shape(ctx, '#9fc3cc', circle(ctx, 0, 0, c * 0.24), thin);
      glow(ctx, 0, 0, c * 0.3, 'rgba(200, 240, 255, 0.5)');
      break;
    case 'mirror':
      shape(ctx, '#c9a442', () => ctx.ellipse(0, 0, c * 0.24, c * 0.34, 0, 0, Math.PI * 2), line);
      shape(ctx, '#b8d4dc', () => ctx.ellipse(0, 0, c * 0.17, c * 0.27, 0, 0, Math.PI * 2), thin);
      lines(ctx, 'rgba(255, 255, 255, 0.85)', thin, () => (ctx.moveTo(-c * 0.08, -c * 0.12), ctx.lineTo(c * 0.02, -c * 0.2)));
      break;
    case 'runes': {
      const col = tone(GLOW, t);
      glow(ctx, 0, 0, c * 0.5, `${col}55`);
      lines(ctx, col, Math.max(1.5, c / 16), () => {
        ctx.moveTo(-c * 0.2, -c * 0.25);
        ctx.lineTo(-c * 0.2, c * 0.25);
        ctx.lineTo(0, 0);
        ctx.moveTo(c * 0.08, -c * 0.25);
        ctx.lineTo(c * 0.25, -c * 0.05);
        ctx.lineTo(c * 0.08, c * 0.15);
        ctx.moveTo(c * 0.16, c * 0.12);
        ctx.lineTo(c * 0.16, c * 0.3);
      });
      break;
    }
    case 'orb': {
      const col = tone(GLOW, t);
      shape(ctx, '#5c4430', circle(ctx, 0, 0, c * 0.3), line);
      glow(ctx, 0, 0, c * 0.5, `${col}88`);
      shape(ctx, col, circle(ctx, 0, 0, c * 0.18), thin);
      shape(ctx, 'rgba(255, 255, 255, 0.7)', circle(ctx, -c * 0.06, -c * 0.06, c * 0.05), 0);
      break;
    }
    case 'portal': {
      const col = tone(GLOW, t);
      const r = Math.min(w, h) * 0.42;
      glow(ctx, 0, 0, r * 1.2, `${col}66`);
      shape(ctx, '#2a1f33', circle(ctx, 0, 0, r * 0.78), thin);
      lines(ctx, col, Math.max(2, c / 8), () => ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2));
      lines(ctx, col, thin, () => {
        for (let k = 0; k < 3; k++) {
          const a = k * 2.1;
          ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
          ctx.quadraticCurveTo(0, 0, Math.cos(a + 2) * r * 0.2, Math.sin(a + 2) * r * 0.2);
        }
      });
      for (let k = 0; k < 6; k++) shape(ctx, '#8a8174', circle(ctx, Math.cos((k * Math.PI) / 3) * r, Math.sin((k * Math.PI) / 3) * r, c * 0.12), thin);
      break;
    }
    // ---- A prison ----
    case 'bars':
      // Iron bars across a cell's opening: they go over a wall or a doorway.
      lines(ctx, IRON, Math.max(2, c / 12), () => {
        ctx.moveTo(L + c * 0.04, 0);
        ctx.lineTo(w / 2 - c * 0.04, 0);
      });
      for (let x = L + c * 0.12; x < w / 2 - c * 0.05; x += c * 0.16) shape(ctx, '#3a3d42', circle(ctx, x, 0, c * 0.05), 0);
      break;
    case 'torturerack':
      shape(ctx, tone(WOOD, 0.6), rect(ctx, L + c * 0.14, T + c * 0.06, w - c * 0.28, h - c * 0.12, c * 0.04), line);
      for (const y of [T + c * 0.14, h / 2 - c * 0.14]) {
        shape(ctx, '#5c3d22', circle(ctx, 0, y, c * 0.12), thin);
        lines(ctx, '#8a7046', thin, () => (ctx.moveTo(-c * 0.12, y), ctx.lineTo(c * 0.12, y)));
      }
      lines(ctx, '#b89a64', thin, () => (ctx.moveTo(0, T + c * 0.26), ctx.lineTo(0, h / 2 - c * 0.26)));
      break;
    case 'coffin':
      shape(ctx, '#4a3626', () => {
        ctx.moveTo(-w * 0.22, T + c * 0.08);
        ctx.lineTo(w * 0.22, T + c * 0.08);
        ctx.lineTo(w * 0.36, T + h * 0.3);
        ctx.lineTo(w * 0.24, h / 2 - c * 0.08);
        ctx.lineTo(-w * 0.24, h / 2 - c * 0.08);
        ctx.lineTo(-w * 0.36, T + h * 0.3);
        ctx.closePath();
      }, line);
      lines(ctx, '#8a7046', thin, () => {
        ctx.moveTo(0, T + h * 0.22);
        ctx.lineTo(0, T + h * 0.5);
        ctx.moveTo(-c * 0.1, T + h * 0.3);
        ctx.lineTo(c * 0.1, T + h * 0.3);
      });
      break;
    case 'slime': {
      const col = tone(SLIME, t);
      shape(ctx, `${col}cc`, () => {
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          const r = c * (0.32 + (k % 3) * 0.05);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, thin);
      for (const [x, y] of [[-0.1, -0.08], [0.12, 0.06]] as const) shape(ctx, 'rgba(255, 255, 255, 0.5)', circle(ctx, x * c, y * c, c * 0.05), 0);
      break;
    }
    case 'skeleton':
      // Bones in chains by a wall.
      lines(ctx, IRON, thin, () => (ctx.moveTo(-c * 0.3, -c * 0.36), ctx.lineTo(-c * 0.14, -c * 0.16), ctx.moveTo(c * 0.3, -c * 0.36), ctx.lineTo(c * 0.14, -c * 0.16)));
      shape(ctx, '#e8e2d0', circle(ctx, 0, -c * 0.18, c * 0.1), thin);
      lines(ctx, '#e8e2d0', Math.max(1.5, c / 16), () => {
        ctx.moveTo(0, -c * 0.08);
        ctx.lineTo(0, c * 0.18);
        for (const y of [-0.02, 0.05, 0.12]) (ctx.moveTo(-c * 0.1, y * c), ctx.lineTo(c * 0.1, y * c));
        ctx.moveTo(-c * 0.14, -c * 0.14);
        ctx.lineTo(-c * 0.22, c * 0.06);
        ctx.moveTo(c * 0.14, -c * 0.14);
        ctx.lineTo(c * 0.22, c * 0.06);
        ctx.moveTo(0, c * 0.18);
        ctx.lineTo(-c * 0.1, c * 0.38);
        ctx.moveTo(0, c * 0.18);
        ctx.lineTo(c * 0.12, c * 0.36);
      });
      break;
    case 'ironmaiden':
      shape(ctx, IRON, () => ctx.ellipse(0, 0, c * 0.28, c * 0.38, 0, 0, Math.PI * 2), line);
      lines(ctx, '#2b2a2e', thin, () => (ctx.moveTo(0, -c * 0.38), ctx.lineTo(0, c * 0.38)));
      shape(ctx, '#8d949c', circle(ctx, 0, -c * 0.2, c * 0.1), thin);
      for (const [x, y] of [[-0.14, 0.05], [0.14, 0.05], [-0.14, 0.2], [0.14, 0.2]] as const) shape(ctx, '#2b2a2e', circle(ctx, x * c, y * c, c * 0.03), 0);
      break;
    // ---- A village and a farm ----
    case 'coop':
      shape(ctx, '#a0582e', rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h * 0.55, c * 0.04), line);
      lines(ctx, 'rgba(50, 25, 10, 0.5)', thin, () => (ctx.moveTo(L + c * 0.1, T + c * 0.1 + h * 0.275), ctx.lineTo(w / 2 - c * 0.1, T + c * 0.1 + h * 0.275)));
      shape(ctx, 'rgba(200, 190, 160, 0.35)', rect(ctx, L + c * 0.1, T + c * 0.1 + h * 0.55, w - c * 0.2, h * 0.3), thin);
      lines(ctx, '#8a8174', thin, () => {
        for (let x = L + c * 0.2; x < w / 2 - c * 0.1; x += c * 0.14) (ctx.moveTo(x, T + c * 0.1 + h * 0.55), ctx.lineTo(x, h / 2 - c * 0.1));
      });
      break;
    case 'scarecrow':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.36, -c * 0.06), ctx.lineTo(c * 0.36, -c * 0.06)));
      shape(ctx, tone(CLOTH, 0.7), rect(ctx, -c * 0.16, -c * 0.16, c * 0.32, c * 0.34, c * 0.04), thin);
      shape(ctx, '#c9a24a', circle(ctx, 0, -c * 0.22, c * 0.16), thin);
      lines(ctx, '#e3cf7a', thin, () => {
        for (const sx of [-1, 1]) (ctx.moveTo(sx * c * 0.36, -c * 0.06), ctx.lineTo(sx * c * 0.44, c * 0.02));
      });
      break;
    case 'sheaf':
      for (const [x, y] of [[-0.18, 0], [0.16, -0.1], [0.04, 0.2]] as const) {
        shape(ctx, '#d9b75a', circle(ctx, x * c, y * c, c * 0.14), thin);
        lines(ctx, '#a8862f', thin, () => {
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            ctx.moveTo(x * c, y * c);
            ctx.lineTo(x * c + Math.cos(a) * c * 0.14, y * c + Math.sin(a) * c * 0.14);
          }
        });
      }
      break;
    case 'churn':
      shape(ctx, tone(WOOD, 0.3), circle(ctx, 0, 0, c * 0.24), line);
      lines(ctx, IRON, thin, () => ctx.arc(0, 0, c * 0.18, 0, Math.PI * 2));
      shape(ctx, '#7a5432', circle(ctx, 0, 0, c * 0.06), thin);
      break;
    case 'pumpkins':
      for (const [x, y, r] of [[-0.16, -0.1, 0.17], [0.18, 0.08, 0.15], [-0.06, 0.24, 0.12]] as const) {
        shape(ctx, '#d9772e', circle(ctx, x * c, y * c, r * c), thin);
        lines(ctx, '#a0501c', thin, () => (ctx.moveTo(x * c, (y - r) * c), ctx.lineTo(x * c, (y + r) * c)));
        shape(ctx, '#4f7d33', circle(ctx, x * c, (y - r * 0.8) * c, c * 0.04), 0);
      }
      lines(ctx, '#4f7d33', thin, () => (ctx.moveTo(-c * 0.3, -c * 0.3), ctx.quadraticCurveTo(0, -c * 0.1, c * 0.3, -c * 0.32)));
      break;
    case 'chickens':
      for (const [x, y, a] of [[-0.18, -0.12, 0.4], [0.16, 0.02, -0.6], [-0.04, 0.24, 1.8]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#efe7d3', () => ctx.ellipse(0, 0, c * 0.11, c * 0.08, 0, 0, Math.PI * 2), thin);
        shape(ctx, '#d9473a', circle(ctx, c * 0.11, 0, c * 0.03), 0);
        shape(ctx, '#e8c14a', circle(ctx, c * 0.15, 0, c * 0.02), 0);
        ctx.restore();
      }
      break;
    default:
      drawSets3(ctx, p, w, h, c);
  }
}
