// Draws the things of a layout (furnish.ts) in the map's own manner: flat colours seen from above, a dark outline, like
// the doors and the houses. Each is drawn in its own frame: centred, its front up, then turned to its facing.
import type { Layout } from './layout';
import type { Prop } from './furnish';

import { circle, CLOTH, INK, rect, shape, tone, WOOD, type Ctx } from './prop-paint';
import { drawMore, MORE_TINTS, MORE_TILED } from './draw-more';
import { SET_TILED, SET_TINTS } from './draw-sets';
import { SET2_TILED, SET2_TINTS } from './draw-sets2';
import { SET3_TILED, SET3_TINTS } from './draw-sets3';
import { SET4_TILED, SET4_TINTS } from './draw-sets4';
import { SET5_TILED, SET5_TINTS } from './draw-sets5';
import { SET6_TILED, SET6_TINTS } from './draw-sets6';
import { SET7_TILED, SET7_TINTS } from './draw-sets7';
import { SET8_TILED, SET8_TINTS } from './draw-sets8';


// The colours a thing can be painted in, as the editor offers them: a tint picks one of them (i + 0.5) / n.
export const TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  rug: CLOTH, bed: CLOTH, bedroll: CLOTH, stall: CLOTH, tent: CLOTH, throne: CLOTH,
  cart: WOOD, table: WOOD, roundtable: WOOD, wardrobe: WOOD, boat: WOOD,
  mushrooms: ['#b8473a', '#c9a46a', '#7fa1b8'], bush: ['#4f7a3a', '#5d8a42'], rubble: ['#8c857a', '#77706a'],
  ...MORE_TINTS,
  ...SET_TINTS,
  ...SET2_TINTS,
  ...SET3_TINTS,
  ...SET4_TINTS,
  ...SET5_TINTS,
  ...SET6_TINTS,
  ...SET7_TINTS,
  ...SET8_TINTS,
};
export const tintOf = (i: number, n: number) => (i + 0.5) / n;
// Scattered things drawn once a cell when stretched: a field of rubble, a bed of flowers.
const TILED = new Set<Prop['kind']>(['rubble', 'flowers', 'reeds', 'bones', 'coins', 'mushrooms', ...MORE_TILED, ...SET_TILED, ...SET2_TILED, ...SET3_TILED, ...SET4_TILED, ...SET5_TILED, ...SET6_TILED, ...SET7_TILED, ...SET8_TILED]);


// w and h: the frame, the front up; c: a cell.
function drawOne(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    case 'barrel':
      shape(ctx, '#8a5a2b', circle(ctx, 0, 0, c * 0.36), line);
      ctx.strokeStyle = '#4e321a';
      ctx.lineWidth = line;
      ctx.beginPath();
      ctx.arc(0, 0, c * 0.24, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'crate': {
      const s = c * 0.74;
      shape(ctx, '#a87a45', rect(ctx, -s / 2, -s / 2, s, s), line);
      ctx.strokeStyle = '#6e4a24';
      ctx.beginPath();
      ctx.moveTo(-s / 2, -s / 2);
      ctx.lineTo(s / 2, s / 2);
      ctx.moveTo(s / 2, -s / 2);
      ctx.lineTo(-s / 2, s / 2);
      ctx.stroke();
      break;
    }
    case 'sack':
      shape(ctx, '#c9b58a', () => ctx.ellipse(0, c * 0.04, c * 0.3, c * 0.34, 0, 0, Math.PI * 2), line);
      shape(ctx, '#a8935f', circle(ctx, 0, -c * 0.28, c * 0.08), line);
      break;
    case 'bed':
      shape(ctx, '#6b4a2e', rect(ctx, L + c * 0.1, T + c * 0.06, w - c * 0.2, h - c * 0.12, c * 0.06), line);
      shape(ctx, tone(CLOTH, t), rect(ctx, L + c * 0.14, T + c * 0.1, w - c * 0.28, h * 0.6), line);
      shape(ctx, '#ece4d2', rect(ctx, L + c * 0.2, h / 2 - c * 0.5, w - c * 0.4, c * 0.3, c * 0.08), line);
      break;
    case 'chest':
    case 'mimic':
      shape(ctx, '#7a4f24', rect(ctx, -c * 0.34, -c * 0.24, c * 0.68, c * 0.48, c * 0.05), line);
      ctx.strokeStyle = '#4a2f14';
      ctx.beginPath();
      ctx.moveTo(-c * 0.34, -c * 0.02);
      ctx.lineTo(c * 0.34, -c * 0.02);
      ctx.stroke();
      shape(ctx, '#d4a640', rect(ctx, -c * 0.06, -c * 0.08, c * 0.12, c * 0.12), line);
      break;
    case 'table':
    case 'desk': {
      const inset = c * 0.1;
      shape(ctx, p.kind === 'desk' ? '#7e5530' : '#9a6b3c', rect(ctx, L + inset, T + inset, w - inset * 2, h - inset * 2, c * 0.04), line);
      ctx.strokeStyle = 'rgba(60, 38, 18, 0.45)';
      ctx.lineWidth = Math.max(1, c / 30);
      ctx.beginPath();
      for (let i = 1; i < 3; i++) {
        ctx.moveTo(L + inset, T + inset + ((h - inset * 2) * i) / 3);
        ctx.lineTo(w / 2 - inset, T + inset + ((h - inset * 2) * i) / 3);
      }
      ctx.stroke();
      if (p.kind === 'desk') {
        shape(ctx, '#efe7d3', rect(ctx, -c * 0.2, -c * 0.16, c * 0.26, c * 0.32), line);
        shape(ctx, '#1f1a14', circle(ctx, c * 0.22, -c * 0.12, c * 0.06), line);
      }
      break;
    }
    case 'chair':
      shape(ctx, '#7d5631', rect(ctx, -c * 0.22, -c * 0.2, c * 0.44, c * 0.44, c * 0.04), line);
      shape(ctx, '#5e3f22', rect(ctx, -c * 0.24, c * 0.16, c * 0.48, c * 0.1), line);
      break;
    case 'bench': {
      const long = Math.max(w, h);
      const wide = w >= h;
      const s = c * 0.3;
      shape(ctx, '#86603a', rect(ctx, wide ? -long / 2 + c * 0.1 : -s / 2, wide ? -s / 2 : -long / 2 + c * 0.1, wide ? long - c * 0.2 : s, wide ? s : long - c * 0.2, c * 0.04), line);
      break;
    }
    case 'shelf': {
      const deep = c * 0.42;
      shape(ctx, '#5e3f22', rect(ctx, L + c * 0.04, h / 2 - deep, w - c * 0.08, deep), line);
      const n = 6;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = tone(CLOTH, (i * 0.37 + t) % 1);
        ctx.fillRect(L + c * 0.1 + ((w - c * 0.2) * i) / n, h / 2 - deep + c * 0.08, (w - c * 0.2) / n - 1, deep - c * 0.16);
      }
      break;
    }
    case 'altar':
      shape(ctx, '#bdb5a3', rect(ctx, L + c * 0.08, T + c * 0.24, w - c * 0.16, h - c * 0.48, c * 0.04), line);
      shape(ctx, '#8e2f2a', rect(ctx, -c * 0.12, T + c * 0.24, c * 0.24, h - c * 0.48), line);
      break;
    case 'candle': {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.45);
      glow.addColorStop(0, 'rgba(255, 200, 90, 0.55)');
      glow.addColorStop(1, 'rgba(255, 200, 90, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-c / 2, -c / 2, c, c);
      shape(ctx, '#efe2c2', circle(ctx, 0, 0, c * 0.1), line);
      ctx.fillStyle = '#f2a33a';
      ctx.beginPath();
      ctx.arc(0, 0, c * 0.04, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rug': {
      const inset = c * 0.18;
      shape(ctx, tone(CLOTH, t), rect(ctx, L + inset, T + inset, w - inset * 2, h - inset * 2), line);
      ctx.strokeStyle = 'rgba(240, 220, 170, 0.7)';
      ctx.lineWidth = Math.max(1, c / 20);
      ctx.strokeRect(L + inset * 1.8, T + inset * 1.8, w - inset * 3.6, h - inset * 3.6);
      break;
    }
    case 'sarcophagus':
      shape(ctx, '#a9a294', rect(ctx, L + c * 0.12, T + c * 0.08, w - c * 0.24, h - c * 0.16, c * 0.18), line);
      ctx.strokeStyle = '#6f695d';
      ctx.lineWidth = line;
      ctx.beginPath();
      ctx.moveTo(0, T + c * 0.35);
      ctx.lineTo(0, h / 2 - c * 0.35);
      ctx.moveTo(-c * 0.16, T + c * 0.62);
      ctx.lineTo(c * 0.16, T + c * 0.62);
      ctx.stroke();
      break;
    case 'rack':
      shape(ctx, '#5e3f22', rect(ctx, L + c * 0.06, h / 2 - c * 0.24, w - c * 0.12, c * 0.18), line);
      for (let k = 0, n = Math.max(3, Math.round((w / c) * 3)); k < n; k++) {
        const dx = (L + c * 0.2 + ((w - c * 0.4) * k) / Math.max(1, n - 1)) / c;
        shape(ctx, '#6b4a2e', rect(ctx, dx * c - c * 0.035, T + c * 0.2, c * 0.07, h - c * 0.44), line * 0.6);
        shape(ctx, '#b9bec4', () => {
          ctx.moveTo(dx * c, T + c * 0.06);
          ctx.lineTo(dx * c + c * 0.08, T + c * 0.22);
          ctx.lineTo(dx * c - c * 0.08, T + c * 0.22);
          ctx.closePath();
        }, line * 0.6);
      }
      break;
    case 'rubble':
      for (const [dx, dy, s] of [[-0.18, -0.1, 0.2], [0.14, 0.04, 0.16], [-0.04, 0.2, 0.12], [0.2, -0.2, 0.1]] as const)
        shape(ctx, t < 0.5 ? '#8c857a' : '#77706a', () => {
          ctx.moveTo((dx - s) * c, dy * c);
          ctx.lineTo(dx * c, (dy - s) * c);
          ctx.lineTo((dx + s) * c, (dy + s * 0.3) * c);
          ctx.lineTo((dx + s * 0.2) * c, (dy + s) * c);
          ctx.closePath();
        }, line);
      break;
    case 'bones':
      ctx.strokeStyle = '#e8e1cf';
      ctx.lineWidth = Math.max(1.5, c / 14);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-c * 0.28, c * 0.2);
      ctx.lineTo(c * 0.1, -c * 0.06);
      ctx.moveTo(-c * 0.06, c * 0.26);
      ctx.lineTo(c * 0.26, c * 0.12);
      ctx.stroke();
      shape(ctx, '#e8e1cf', circle(ctx, c * 0.16, -c * 0.2, c * 0.12), line);
      break;
    case 'hearth': {
      shape(ctx, '#77706a', rect(ctx, L + c * 0.02, h / 2 - c * 0.5, w - c * 0.04, c * 0.5), line);
      const fire = ctx.createRadialGradient(0, h / 2 - c * 0.26, 0, 0, h / 2 - c * 0.26, c * 0.24);
      fire.addColorStop(0, '#ffd35a');
      fire.addColorStop(1, '#c2410c');
      ctx.fillStyle = fire;
      ctx.beginPath();
      ctx.arc(0, h / 2 - c * 0.26, c * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'coins':
      for (const [dx, dy] of [[-0.12, 0], [0.1, -0.08], [0.04, 0.12], [-0.02, -0.16], [0.18, 0.1]] as const) shape(ctx, '#e0b23f', circle(ctx, dx * c, dy * c, c * 0.09), line * 0.7);
      break;
    case 'stalagmite':
      shape(ctx, '#6e665b', circle(ctx, 0, 0, c * (0.28 + t * 0.12)), line);
      shape(ctx, '#8a8174', circle(ctx, -c * 0.04, -c * 0.04, c * (0.14 + t * 0.06)), line * 0.6);
      break;
    case 'mushrooms':
      for (const [dx, dy, s] of [[-0.15, 0.05, 0.12], [0.12, -0.08, 0.1], [0.05, 0.18, 0.08]] as const)
        shape(ctx, t < 0.4 ? '#b8473a' : t < 0.7 ? '#c9a46a' : '#7fa1b8', circle(ctx, dx * c, dy * c, s * c), line * 0.7);
      break;
    case 'puddle':
      ctx.fillStyle = 'rgba(70, 110, 140, 0.55)';
      ctx.beginPath();
      if (w > c || h > c) ctx.ellipse(0, 0, w / 2 - c * 0.12, h / 2 - c * 0.12, 0, 0, Math.PI * 2);
      else ctx.ellipse(0, 0, c * (0.34 + t * 0.1), c * 0.24, t * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'campfire': {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        shape(ctx, '#7a736a', circle(ctx, Math.cos(a) * c * 0.3, Math.sin(a) * c * 0.3, c * 0.08), line * 0.7);
      }
      const fire = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.22);
      fire.addColorStop(0, '#ffe08a');
      fire.addColorStop(1, '#d9480f');
      ctx.fillStyle = fire;
      ctx.beginPath();
      ctx.arc(0, 0, c * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bedroll':
      shape(ctx, tone(CLOTH, t), rect(ctx, -w / 2 + c * 0.18, T + c * 0.12, w - c * 0.36, h - c * 0.24, c * 0.12), line);
      shape(ctx, '#d8cdb3', rect(ctx, -w / 2 + c * 0.22, h / 2 - c * 0.42, w - c * 0.44, c * 0.24, c * 0.08), line);
      break;
    case 'stall': {
      shape(ctx, '#7e5530', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12), line);
      const stripes = Math.max(3, Math.round(w / (c * 0.25)));
      ctx.save();
      ctx.beginPath();
      ctx.rect(L + c * 0.06, T + c * 0.06, w - c * 0.12, h * 0.62);
      ctx.clip();
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 ? '#efe6d2' : tone(CLOTH, t);
        ctx.fillRect(L + c * 0.06 + ((w - c * 0.12) * i) / stripes, T, (w - c * 0.12) / stripes + 1, h);
      }
      ctx.restore();
      ctx.strokeStyle = INK;
      ctx.lineWidth = line;
      ctx.strokeRect(L + c * 0.06, T + c * 0.06, w - c * 0.12, h * 0.62);
      break;
    }
    case 'cart': {
      for (const sy of [-1, 1]) shape(ctx, '#3b3026', rect(ctx, sy * c * 0.42 - c * 0.07, -c * 0.32, c * 0.14, c * 0.64, c * 0.04), line);
      shape(ctx, tone(WOOD, t), rect(ctx, -c * 0.36, T + c * 0.4, c * 0.72, h - c * 0.6), line);
      ctx.strokeStyle = '#5e3f22';
      ctx.lineWidth = Math.max(1.5, c / 16);
      ctx.beginPath();
      ctx.moveTo(-c * 0.16, T + c * 0.4);
      ctx.lineTo(-c * 0.16, T + c * 0.04);
      ctx.moveTo(c * 0.16, T + c * 0.4);
      ctx.lineTo(c * 0.16, T + c * 0.04);
      ctx.stroke();
      break;
    }
    case 'log':
      shape(ctx, '#6b4a2e', rect(ctx, L + c * 0.1, -c * 0.2, w - c * 0.2, c * 0.4, c * 0.2), line);
      shape(ctx, '#b48a5a', () => ctx.ellipse(w / 2 - c * 0.2, 0, c * 0.1, c * 0.19, 0, 0, Math.PI * 2), line * 0.8);
      break;
    case 'stump':
      shape(ctx, '#6b4a2e', circle(ctx, 0, 0, c * 0.3), line);
      shape(ctx, '#b48a5a', circle(ctx, 0, 0, c * 0.22), line * 0.6);
      ctx.strokeStyle = '#8a6a44';
      ctx.lineWidth = Math.max(1, c / 34);
      ctx.beginPath();
      ctx.arc(0, 0, c * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'bush': {
      const g = t < 0.5 ? '#4f7a3a' : '#5d8a42';
      for (const [dx, dy, s] of [[-0.14, 0.06, 0.24], [0.14, 0.04, 0.22], [0, -0.14, 0.24]] as const) shape(ctx, g, circle(ctx, dx * c, dy * c, s * c), line * 0.6);
      break;
    }
    case 'flowers':
      for (const [dx, dy] of [[-0.2, -0.1], [0.12, -0.2], [0.18, 0.14], [-0.08, 0.2], [0.02, 0]] as const) {
        ctx.fillStyle = tone(['#e8d34a', '#e07ba0', '#f2efe6', '#8f7fd6'], (t + dx + 1) % 1);
        ctx.beginPath();
        ctx.arc(dx * c, dy * c, c * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'reeds':
      ctx.strokeStyle = '#7d7a3e';
      ctx.lineWidth = Math.max(1, c / 26);
      ctx.beginPath();
      for (const dx of [-0.2, -0.08, 0.04, 0.16, 0.26]) {
        ctx.moveTo(dx * c, c * 0.3);
        ctx.lineTo((dx + 0.06) * c, -c * 0.28);
      }
      ctx.stroke();
      ctx.fillStyle = '#5b3d22';
      for (const dx of [-0.08, 0.16]) ctx.fillRect((dx + 0.03) * c, -c * 0.28, c * 0.06, c * 0.14);
      break;
    case 'stairs': {
      // Steps down from the top: each a little darker.
      shape(ctx, '#8c857a', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12), line);
      const n = Math.max(4, Math.round((h / c) * 4));
      for (let k = 0; k < n; k++) {
        ctx.fillStyle = `rgba(20, 16, 10, ${0.05 + (k / n) * 0.45})`;
        ctx.fillRect(L + c * 0.06, T + c * 0.06 + ((h - c * 0.12) * k) / n, w - c * 0.12, (h - c * 0.12) / n);
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1, c / 26);
      ctx.beginPath();
      for (let k = 1; k < n; k++) {
        const y = T + c * 0.06 + ((h - c * 0.12) * k) / n;
        ctx.moveTo(L + c * 0.06, y);
        ctx.lineTo(w / 2 - c * 0.06, y);
      }
      ctx.stroke();
      break;
    }
    case 'trapdoor':
      shape(ctx, '#6b4a2e', rect(ctx, -c * 0.38, -c * 0.38, c * 0.76, c * 0.76), line);
      ctx.strokeStyle = '#4a2f14';
      ctx.lineWidth = Math.max(1, c / 26);
      ctx.beginPath();
      for (const k of [-0.13, 0.13]) (ctx.moveTo(k * c, -c * 0.38), ctx.lineTo(k * c, c * 0.38));
      ctx.stroke();
      ctx.strokeStyle = '#2b2a2e';
      ctx.lineWidth = Math.max(1.5, c / 16);
      ctx.beginPath();
      ctx.arc(0, c * 0.2, c * 0.09, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'throne':
      shape(ctx, '#c9a442', rect(ctx, -c * 0.4, -c * 0.36, c * 0.8, c * 0.78, c * 0.08), line);
      shape(ctx, tone(CLOTH, t), rect(ctx, -c * 0.26, -c * 0.24, c * 0.52, c * 0.42, c * 0.05), line);
      shape(ctx, '#a8862e', rect(ctx, -c * 0.44, c * 0.18, c * 0.88, c * 0.24, c * 0.06), line);
      break;
    case 'statue':
      shape(ctx, '#a9a294', rect(ctx, -c * 0.42, -c * 0.42, c * 0.84, c * 0.84, c * 0.04), line);
      shape(ctx, '#cfc8b8', () => ctx.ellipse(0, c * 0.06, c * 0.26, c * 0.16, 0, 0, Math.PI * 2), line);
      shape(ctx, '#cfc8b8', circle(ctx, 0, -c * 0.12, c * 0.13), line);
      break;
    case 'brazier': {
      shape(ctx, '#3b3632', circle(ctx, 0, 0, c * 0.32), line);
      const fire = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.26);
      fire.addColorStop(0, '#ffe08a');
      fire.addColorStop(1, '#d9480f');
      ctx.fillStyle = fire;
      ctx.beginPath();
      ctx.arc(0, 0, c * 0.24, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cauldron':
      shape(ctx, '#232220', circle(ctx, 0, 0, c * 0.36), line);
      shape(ctx, '#5f9a3c', circle(ctx, 0, 0, c * 0.26), line * 0.6);
      ctx.fillStyle = '#9fd36a';
      for (const [dx, dy] of [[-0.08, -0.06], [0.1, 0.05], [0.0, 0.12]] as const) {
        ctx.beginPath();
        ctx.arc(dx * c, dy * c, c * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'anvil':
      shape(ctx, '#5b5e66', () => {
        ctx.moveTo(-c * 0.4, -c * 0.12);
        ctx.lineTo(c * 0.2, -c * 0.14);
        ctx.lineTo(c * 0.42, 0);
        ctx.lineTo(c * 0.2, c * 0.14);
        ctx.lineTo(-c * 0.4, c * 0.12);
        ctx.closePath();
      }, line);
      shape(ctx, '#4a2f14', rect(ctx, -c * 0.22, c * 0.16, c * 0.3, c * 0.2), line * 0.7);
      break;
    case 'cage': {
      shape(ctx, 'rgba(60, 60, 64, 0.25)', rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8), line);
      ctx.strokeStyle = '#3b3632';
      ctx.lineWidth = Math.max(1.5, c / 16);
      ctx.beginPath();
      for (const k of [-0.2, 0, 0.2]) (ctx.moveTo(k * c, -c * 0.4), ctx.lineTo(k * c, c * 0.4), ctx.moveTo(-c * 0.4, k * c), ctx.lineTo(c * 0.4, k * c));
      ctx.stroke();
      break;
    }
    case 'roundtable': {
      shape(ctx, tone(WOOD, t), () => ctx.ellipse(0, 0, w / 2 - c * 0.12, h / 2 - c * 0.12, 0, 0, Math.PI * 2), line);
      ctx.strokeStyle = 'rgba(60, 38, 18, 0.4)';
      ctx.lineWidth = Math.max(1, c / 30);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, w / 2 - c * 0.32), Math.max(1, h / 2 - c * 0.32), 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'wardrobe':
      shape(ctx, tone(WOOD, t), rect(ctx, L + c * 0.06, h / 2 - c * 0.56, w - c * 0.12, c * 0.5, c * 0.03), line);
      ctx.strokeStyle = 'rgba(40, 25, 10, 0.6)';
      ctx.lineWidth = Math.max(1, c / 26);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - c * 0.56);
      ctx.lineTo(0, h / 2 - c * 0.06);
      ctx.stroke();
      break;
    case 'fountain':
      shape(ctx, '#a9a294', () => ctx.ellipse(0, 0, w / 2 - c * 0.08, h / 2 - c * 0.08, 0, 0, Math.PI * 2), line);
      shape(ctx, '#4f8fa8', () => ctx.ellipse(0, 0, w / 2 - c * 0.26, h / 2 - c * 0.26, 0, 0, Math.PI * 2), line * 0.6);
      shape(ctx, '#cfc8b8', circle(ctx, 0, 0, c * 0.2), line);
      break;
    case 'tent':
      shape(ctx, tone(CLOTH, t), rect(ctx, L + c * 0.12, T + c * 0.12, w - c * 0.24, h - c * 0.24, c * 0.06), line);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, T + c * 0.12, w / 2 - c * 0.12, h - c * 0.24);
      ctx.strokeStyle = INK;
      ctx.lineWidth = line;
      ctx.beginPath();
      ctx.moveTo(0, T + c * 0.12);
      ctx.lineTo(0, h / 2 - c * 0.12);
      ctx.stroke();
      break;
    case 'boat':
      shape(ctx, tone(WOOD, t), () => {
        ctx.moveTo(0, T + c * 0.06);
        ctx.quadraticCurveTo(w / 2 - c * 0.08, T + h * 0.35, w / 2 - c * 0.12, h / 2 - c * 0.12);
        ctx.lineTo(L + c * 0.12, h / 2 - c * 0.12);
        ctx.quadraticCurveTo(L + c * 0.08, T + h * 0.35, 0, T + c * 0.06);
        ctx.closePath();
      }, line);
      ctx.strokeStyle = 'rgba(40, 25, 10, 0.6)';
      ctx.lineWidth = Math.max(1, c / 20);
      ctx.beginPath();
      for (const k of [0.35, 0.65]) (ctx.moveTo(L + c * 0.16, T + h * k), ctx.lineTo(w / 2 - c * 0.16, T + h * k));
      ctx.stroke();
      break;
    case 'haystack':
      shape(ctx, '#d6b54e', circle(ctx, 0, 0, c * 0.42), line);
      ctx.strokeStyle = '#a8862e';
      ctx.lineWidth = Math.max(1, c / 30);
      ctx.beginPath();
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        ctx.moveTo(Math.cos(a) * c * 0.1, Math.sin(a) * c * 0.1);
        ctx.lineTo(Math.cos(a) * c * 0.36, Math.sin(a) * c * 0.36);
      }
      ctx.stroke();
      break;
    case 'grave':
      shape(ctx, '#6b5a43', rect(ctx, -c * 0.26, -c * 0.1, c * 0.52, c * 0.48, c * 0.14), line);
      shape(ctx, '#a9a294', rect(ctx, -c * 0.3, -c * 0.4, c * 0.6, c * 0.26, c * 0.1), line);
      break;
    case 'well':
      shape(ctx, '#7d7a72', circle(ctx, 0, 0, c * 0.42), line);
      shape(ctx, '#2c5566', circle(ctx, 0, 0, c * 0.26), line * 0.6);
      break;
    case 'asset': {
      const img = p.asset ? assetPicture?.(p.asset) : null;
      if (img) ctx.drawImage(img, L, T, w, h);
      else {
        // Not loaded yet, or the file is gone: a dashed frame with a question.
        ctx.save();
        ctx.strokeStyle = 'rgba(180, 160, 255, 0.9)';
        ctx.setLineDash([c / 8, c / 10]);
        ctx.lineWidth = Math.max(1, c / 24);
        ctx.strokeRect(L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16);
        ctx.fillStyle = 'rgba(180, 160, 255, 0.9)';
        ctx.font = `bold ${c * 0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
        ctx.restore();
      }
      break;
    }
    default:
      drawMore(ctx, p, w, h, c);
  }
}

// The pictures of the GM's assets: the window loads them and says where they are (none — the frame with a question).
let assetPicture: ((path: string) => CanvasImageSource | null) | null = null;
export function setAssetPictures(fn: ((path: string) => CanvasImageSource | null) | null) {
  assetPicture = fn;
}

export function drawProps(ctx: Ctx, l: Layout, c: number) {
  // Rugs first: everything else stands on them, whenever it was put down.
  const all = l.props ?? [];
  for (const p of [...all.filter((q) => q.kind === 'rug'), ...all.filter((q) => q.kind !== 'rug')]) {
    const f = p.face ?? 0;
    const turned = f % 2 === 1;
    ctx.save();
    ctx.translate((p.x + p.w / 2) * c, (p.y + p.h / 2) * c);
    ctx.rotate((f * Math.PI) / 2);
    ctx.lineJoin = 'round';
    if (TILED.has(p.kind) && (p.w > 1 || p.h > 1)) {
      ctx.restore();
      // Once a cell, each a little different.
      for (let y = 0; y < p.h; y++)
        for (let x = 0; x < p.w; x++) {
          ctx.save();
          ctx.translate((p.x + x + 0.5) * c, (p.y + y + 0.5) * c);
          ctx.rotate(((x * 3 + y * 7) % 4) * (Math.PI / 2));
          drawOne(ctx, { ...p, tint: p.tint ?? ((x * 13 + y * 7) % 10) / 10 }, c, c, c);
          ctx.restore();
        }
      continue;
    }
    drawOne(ctx, p, (turned ? p.h : p.w) * c, (turned ? p.w : p.h) * c, c);
    ctx.restore();
  }
}
