// More things for the map editor (0.104), in the same manner as draw-props.ts: centred in their frame, the front up.
import type { Prop } from './furnish';
import { circle, CLOTH, GLOW, glow, INK, lines, rect, shape, STONE, tone, WOOD, type Ctx } from './prop-paint';
import { drawSets } from './draw-sets';

export const MORE_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  cushion: CLOTH, circle: GLOW, crystal: GLOW, counter: WOOD, workbench: WOOD, fence: WOOD, stool: WOOD, urn: ['#b0663e', '#8d8a80', '#3f5d86', '#c9a442'],
};
// Drawn once a cell when stretched.
export const MORE_TILED: Prop['kind'][] = ['spikes', 'web', 'fern', 'woodpile'];

export function drawMore(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    case 'bathtub':
      shape(ctx, '#d6d2c8', rect(ctx, L + c * 0.12, T + c * 0.08, w - c * 0.24, h - c * 0.16, c * 0.3), line);
      shape(ctx, '#7fb0bd', rect(ctx, L + c * 0.22, T + c * 0.18, w - c * 0.44, h - c * 0.36, c * 0.22), thin);
      shape(ctx, '#b8a26a', circle(ctx, 0, T + c * 0.3, c * 0.05), thin);
      break;
    case 'chandelier': {
      lines(ctx, '#6b5a3a', line, () => {
        ctx.arc(0, 0, c * 0.3, 0, Math.PI * 2);
        for (let k = 0; k < 6; k++) (ctx.moveTo(0, 0), ctx.lineTo(Math.cos((k * Math.PI) / 3) * c * 0.3, Math.sin((k * Math.PI) / 3) * c * 0.3));
      });
      for (let k = 0; k < 6; k++) {
        const x = Math.cos((k * Math.PI) / 3) * c * 0.3;
        const y = Math.sin((k * Math.PI) / 3) * c * 0.3;
        glow(ctx, x, y, c * 0.14, 'rgba(255, 214, 120, 0.8)');
        shape(ctx, '#f0e6c8', circle(ctx, x, y, c * 0.05), thin);
      }
      break;
    }
    case 'counter':
      shape(ctx, tone(WOOD, t), rect(ctx, L + c * 0.04, T + c * 0.22, w - c * 0.08, h - c * 0.44, c * 0.04), line);
      lines(ctx, 'rgba(40, 25, 10, 0.4)', thin, () => (ctx.moveTo(L + c * 0.04, T + c * 0.36), ctx.lineTo(w / 2 - c * 0.04, T + c * 0.36)));
      for (let x = L + c * 0.5; x < w / 2; x += c) shape(ctx, '#d6cdb5', circle(ctx, x, 0, c * 0.08), thin);
      break;
    case 'stool':
      shape(ctx, tone(WOOD, t), circle(ctx, 0, 0, c * 0.2), line);
      break;
    case 'cushion':
      shape(ctx, tone(CLOTH, t), rect(ctx, -c * 0.32, -c * 0.32, c * 0.64, c * 0.64, c * 0.16), line);
      shape(ctx, '#c9a442', circle(ctx, 0, 0, c * 0.05), thin);
      break;
    case 'workbench':
      shape(ctx, tone(WOOD, t), rect(ctx, L + c * 0.06, T + c * 0.16, w - c * 0.12, h - c * 0.32), line);
      shape(ctx, '#7b7f87', rect(ctx, L + c * 0.2, -c * 0.1, c * 0.34, c * 0.08), thin);
      shape(ctx, '#5c3d22', rect(ctx, w / 2 - c * 0.5, -c * 0.16, c * 0.08, c * 0.3), thin);
      shape(ctx, '#7b7f87', rect(ctx, w / 2 - c * 0.56, -c * 0.2, c * 0.2, c * 0.1), thin);
      break;
    case 'woodpile':
      for (const [x, y] of [[-0.18, 0.14], [0.18, 0.14], [0, -0.16]] as const) {
        shape(ctx, '#8a5f35', circle(ctx, x * c, y * c, c * 0.17), line);
        lines(ctx, '#5c3d22', thin, () => ctx.arc(x * c, y * c, c * 0.08, 0, Math.PI * 2));
      }
      break;
    case 'bucket':
      shape(ctx, '#8a6a42', circle(ctx, 0, 0, c * 0.22), line);
      shape(ctx, '#5f8fa0', circle(ctx, 0, 0, c * 0.15), thin);
      lines(ctx, INK, thin, () => (ctx.moveTo(-c * 0.22, 0), ctx.quadraticCurveTo(0, -c * 0.4, c * 0.22, 0)));
      break;
    case 'urn':
      shape(ctx, tone(MORE_TINTS.urn!, t), circle(ctx, 0, 0, c * 0.3), line);
      shape(ctx, '#2b2420', circle(ctx, 0, 0, c * 0.13), thin);
      break;
    case 'grindstone':
      shape(ctx, '#8c857a', circle(ctx, 0, 0, c * 0.38), line);
      shape(ctx, '#a9a294', circle(ctx, 0, 0, c * 0.26), thin);
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.04, -c * 0.46, c * 0.08, c * 0.46), thin);
      break;
    case 'circle': {
      const col = tone(GLOW, t);
      const r = Math.min(w, h) / 2 - c * 0.12;
      glow(ctx, 0, 0, r * 1.15, `${col}55`);
      lines(ctx, col, Math.max(1.5, c / 14), () => {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.moveTo(r * 0.8, 0);
        ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
          const x = Math.cos(a) * r * 0.8;
          const y = Math.sin(a) * r * 0.8;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      });
      break;
    }
    case 'crystal': {
      const col = tone(GLOW, t);
      glow(ctx, 0, 0, c * 0.48, `${col}88`);
      shape(ctx, col, () => {
        ctx.moveTo(0, -c * 0.36);
        ctx.lineTo(c * 0.2, -c * 0.06);
        ctx.lineTo(c * 0.1, c * 0.32);
        ctx.lineTo(-c * 0.12, c * 0.32);
        ctx.lineTo(-c * 0.2, -c * 0.06);
        ctx.closePath();
      }, line);
      lines(ctx, 'rgba(255, 255, 255, 0.6)', thin, () => (ctx.moveTo(0, -c * 0.3), ctx.lineTo(-c * 0.02, c * 0.28)));
      break;
    }
    case 'pedestal':
      shape(ctx, '#bdb5a3', rect(ctx, -c * 0.34, -c * 0.34, c * 0.68, c * 0.68, c * 0.04), line);
      glow(ctx, 0, 0, c * 0.3, 'rgba(140, 200, 255, 0.7)');
      shape(ctx, '#bfe3ff', circle(ctx, 0, 0, c * 0.14), thin);
      break;
    case 'obelisk':
      shape(ctx, '#5f5a54', rect(ctx, -c * 0.3, -c * 0.3, c * 0.6, c * 0.6), line);
      shape(ctx, '#77716a', () => (ctx.moveTo(-c * 0.3, -c * 0.3), ctx.lineTo(0, 0), ctx.lineTo(-c * 0.3, c * 0.3), ctx.closePath()), thin);
      shape(ctx, '#4a4641', () => (ctx.moveTo(c * 0.3, -c * 0.3), ctx.lineTo(0, 0), ctx.lineTo(c * 0.3, c * 0.3), ctx.closePath()), thin);
      break;
    case 'idol':
      shape(ctx, '#a8862e', () => ctx.ellipse(0, c * 0.08, c * 0.28, c * 0.22, 0, 0, Math.PI * 2), line);
      shape(ctx, '#c9a442', circle(ctx, 0, -c * 0.18, c * 0.16), line);
      shape(ctx, '#e0523a', circle(ctx, -c * 0.06, -c * 0.2, c * 0.03), thin);
      shape(ctx, '#e0523a', circle(ctx, c * 0.06, -c * 0.2, c * 0.03), thin);
      break;
    case 'chains':
      lines(ctx, '#5b5e66', Math.max(1.5, c / 16), () => {
        for (let k = 0; k < 4; k++) {
          ctx.moveTo(-c * 0.3 + k * c * 0.2 + c * 0.1, T + c * 0.5);
          ctx.ellipse(-c * 0.3 + k * c * 0.2, T + c * 0.5, c * 0.1, c * 0.06, 0, 0, Math.PI * 2);
        }
      });
      shape(ctx, '#3e4046', circle(ctx, -c * 0.42, T + c * 0.5, c * 0.07), thin);
      break;
    case 'stocks':
      shape(ctx, '#8a5f35', rect(ctx, -c * 0.44, -c * 0.12, c * 0.88, c * 0.24), line);
      for (const x of [-0.26, 0, 0.26]) shape(ctx, '#2b2420', circle(ctx, x * c, 0, c * (x === 0 ? 0.08 : 0.05)), thin);
      break;
    case 'spikes':
      ctx.fillStyle = 'rgba(30, 26, 22, 0.35)';
      ctx.fillRect(-c * 0.46, -c * 0.46, c * 0.92, c * 0.92);
      for (const [x, y] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0, 0]] as const)
        shape(ctx, '#9aa0a8', () => (ctx.moveTo(x * c, y * c - c * 0.12), ctx.lineTo(x * c + c * 0.1, y * c + c * 0.08), ctx.lineTo(x * c - c * 0.1, y * c + c * 0.08), ctx.closePath()), thin);
      break;
    case 'web':
      lines(ctx, 'rgba(235, 235, 230, 0.75)', thin, () => {
        for (let k = 0; k < 8; k++) (ctx.moveTo(0, 0), ctx.lineTo(Math.cos((k * Math.PI) / 4) * c * 0.48, Math.sin((k * Math.PI) / 4) * c * 0.48));
        for (const r of [0.14, 0.26, 0.38]) {
          for (let k = 0; k <= 8; k++) {
            const x = Math.cos((k * Math.PI) / 4) * c * r;
            const y = Math.sin((k * Math.PI) / 4) * c * r;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
      });
      break;
    case 'lever':
      shape(ctx, '#5b5e66', rect(ctx, -c * 0.2, -c * 0.1, c * 0.4, c * 0.24, c * 0.04), line);
      lines(ctx, '#3e2a16', Math.max(2, c / 10), () => (ctx.moveTo(0, 0), ctx.lineTo(c * 0.18, -c * 0.32)));
      shape(ctx, '#b8473a', circle(ctx, c * 0.18, -c * 0.32, c * 0.07), thin);
      break;
    case 'torch':
      glow(ctx, 0, -c * 0.05, c * 0.5, 'rgba(255, 170, 60, 0.6)');
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.05, -c * 0.05, c * 0.1, c * 0.4), thin);
      shape(ctx, '#ffb03b', () => ctx.ellipse(0, -c * 0.12, c * 0.1, c * 0.16, 0, 0, Math.PI * 2), thin);
      break;
    case 'plate':
      shape(ctx, '#8c857a', rect(ctx, -c * 0.38, -c * 0.38, c * 0.76, c * 0.76, c * 0.04), thin);
      lines(ctx, 'rgba(40, 32, 24, 0.45)', thin, () => ctx.rect(-c * 0.28, -c * 0.28, c * 0.56, c * 0.56));
      break;
    case 'fence': {
      const col = tone(WOOD, t);
      lines(ctx, INK, Math.max(3, c / 7), () => (ctx.moveTo(L + c * 0.1, 0), ctx.lineTo(w / 2 - c * 0.1, 0)));
      lines(ctx, col, Math.max(1.5, c / 12), () => (ctx.moveTo(L + c * 0.1, 0), ctx.lineTo(w / 2 - c * 0.1, 0)));
      for (let x = L + c * 0.1; x <= w / 2 - c * 0.09; x += c / 2) shape(ctx, col, rect(ctx, x - c * 0.07, -c * 0.07, c * 0.14, c * 0.14), thin);
      break;
    }
    case 'signpost':
      shape(ctx, '#a87a45', rect(ctx, -c * 0.36, -c * 0.2, c * 0.6, c * 0.16), thin);
      shape(ctx, '#a87a45', rect(ctx, -c * 0.2, c * 0.04, c * 0.56, c * 0.16), thin);
      shape(ctx, '#5c3d22', circle(ctx, 0, 0, c * 0.08), thin);
      break;
    case 'lamppost':
      glow(ctx, 0, 0, c * 0.48, 'rgba(255, 214, 120, 0.55)');
      shape(ctx, '#2b2a2e', rect(ctx, -c * 0.14, -c * 0.14, c * 0.28, c * 0.28, c * 0.04), line);
      shape(ctx, '#ffd88a', rect(ctx, -c * 0.07, -c * 0.07, c * 0.14, c * 0.14), thin);
      break;
    case 'trough':
      shape(ctx, '#8a5f35', rect(ctx, -c * 0.42, -c * 0.2, c * 0.84, c * 0.4, c * 0.04), line);
      shape(ctx, '#5f8fa0', rect(ctx, -c * 0.34, -c * 0.12, c * 0.68, c * 0.24), thin);
      break;
    case 'gallows':
      shape(ctx, '#8a6a42', rect(ctx, -c * 0.44, -c * 0.44, c * 0.88, c * 0.88), line);
      lines(ctx, 'rgba(40, 25, 10, 0.5)', thin, () => {
        for (const y of [-0.22, 0, 0.22]) (ctx.moveTo(-c * 0.44, y * c), ctx.lineTo(c * 0.44, y * c));
      });
      shape(ctx, '#2b2420', rect(ctx, -c * 0.14, -c * 0.14, c * 0.28, c * 0.28), thin);
      shape(ctx, '#5c3d22', rect(ctx, -c * 0.44, -c * 0.44, c * 0.14, c * 0.88), thin);
      lines(ctx, '#c9b58a', thin, () => (ctx.moveTo(-c * 0.3, -c * 0.38), ctx.lineTo(0, -c * 0.38), ctx.lineTo(0, -c * 0.06)));
      break;
    case 'menhir':
      shape(ctx, 'rgba(15, 25, 12, 0.3)', () => ctx.ellipse(c * 0.08, c * 0.1, c * 0.24, c * 0.34, 0.2, 0, Math.PI * 2), 0);
      shape(ctx, '#8c857a', () => ctx.ellipse(0, 0, c * 0.22, c * 0.34, 0.2, 0, Math.PI * 2), line);
      lines(ctx, 'rgba(60, 120, 60, 0.6)', thin, () => (ctx.moveTo(-c * 0.08, -c * 0.1), ctx.lineTo(c * 0.06, c * 0.12)));
      break;
    case 'cairn':
      for (const [x, y, r] of [[-0.18, 0.12, 0.17], [0.18, 0.14, 0.16], [0, -0.14, 0.17], [0, 0.05, 0.14]] as const)
        shape(ctx, tone(STONE, (x + y + 1) / 2), circle(ctx, x * c, y * c, r * c), line);
      break;
    case 'totem':
      shape(ctx, '#7a4f24', circle(ctx, 0, 0, c * 0.3), line);
      shape(ctx, '#b8473a', () => (ctx.moveTo(-c * 0.44, 0), ctx.lineTo(-c * 0.24, -c * 0.12), ctx.lineTo(-c * 0.24, c * 0.12), ctx.closePath()), thin);
      shape(ctx, '#b8473a', () => (ctx.moveTo(c * 0.44, 0), ctx.lineTo(c * 0.24, -c * 0.12), ctx.lineTo(c * 0.24, c * 0.12), ctx.closePath()), thin);
      shape(ctx, '#e8d9a8', circle(ctx, -c * 0.1, -c * 0.06, c * 0.05), thin);
      shape(ctx, '#e8d9a8', circle(ctx, c * 0.1, -c * 0.06, c * 0.05), thin);
      break;
    case 'deadtree':
      shape(ctx, 'rgba(15, 25, 12, 0.3)', circle(ctx, c * 0.08, c * 0.1, c * 0.36), 0);
      lines(ctx, '#4a3626', Math.max(2, c / 9), () => {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + 0.4;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * c * 0.42, Math.sin(a) * c * 0.42);
        }
      });
      shape(ctx, '#5c4430', circle(ctx, 0, 0, c * 0.12), thin);
      break;
    case 'fern':
      lines(ctx, '#3f6a35', Math.max(1.5, c / 16), () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(Math.cos(a + 0.4) * c * 0.25, Math.sin(a + 0.4) * c * 0.25, Math.cos(a) * c * 0.4, Math.sin(a) * c * 0.4);
        }
      });
      break;
    case 'nest':
      shape(ctx, '#8a6a42', circle(ctx, 0, 0, c * 0.34), line);
      shape(ctx, '#5c4430', circle(ctx, 0, 0, c * 0.22), thin);
      for (const [x, y] of [[-0.07, -0.04], [0.08, 0.02], [0, 0.1]] as const) shape(ctx, '#e8e2d0', () => ctx.ellipse(x * c, y * c, c * 0.06, c * 0.08, 0, 0, Math.PI * 2), thin);
      break;
    default:
      drawSets(ctx, p, w, h, c);
  }
}
