// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// Science fiction (a lab, a city of the future, aliens), gothic horror (a manor and its crypt), noir (an office, a bar,
// a street).
import type { Prop } from './furnish';
import { circle, glow, lines, rect, shape, STONE, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const SCREEN = '#5fd3c9';
const NEON = ['#ff4fa8', '#4fd6ff', '#b4ff4f', '#ffb84f'];
const CARS = ['#2b2a2e', '#7a1f2b', '#2f4a6e', '#d6d2c8', '#5b6b3c'];
const ALIEN = ['#7ac74f', '#a36ee0', '#4fd6c7'];

export const SET3_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  hovercar: CARS, sedan: CARS, holosign: NEON, eggs: ALIEN, alienplant: ALIEN, xenocrystal: ALIEN, goo: ALIEN, cocoon: ALIEN,
  roses: ['#2b1d24', '#7a1f2b', '#e8e2d0'], tombstone: STONE,
};
// Drawn once a cell when stretched.
export const SET3_TILED: Prop['kind'][] = ['eggs', 'goo', 'bloodpool', 'bats', 'roses', 'xenocrystal'];

export function drawSets3(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A lab ----
    case 'medpod':
      shape(ctx, '#d6d6cf', rect(ctx, L + c * 0.1, T + c * 0.06, w - c * 0.2, h - c * 0.12, c * 0.36), line);
      shape(ctx, 'rgba(120, 220, 255, 0.55)', rect(ctx, L + c * 0.2, T + c * 0.3, w - c * 0.4, h - c * 0.6, c * 0.26), thin);
      shape(ctx, SCREEN, rect(ctx, -c * 0.12, T + c * 0.12, c * 0.24, c * 0.1, c * 0.03), 0);
      break;
    case 'labbench':
      shape(ctx, '#d6d6cf', rect(ctx, L + c * 0.04, T + c * 0.14, w - c * 0.08, h - c * 0.28, c * 0.03), line);
      for (const [x, col] of [[-0.6, '#7ac74f'], [-0.25, '#a36ee0'], [0.2, '#4fa8c7'], [0.55, '#e0523a']] as const) {
        shape(ctx, 'rgba(230, 240, 245, 0.8)', circle(ctx, x * c, 0, c * 0.1), thin);
        shape(ctx, col, circle(ctx, x * c, 0, c * 0.06), 0);
      }
      break;
    case 'tank':
      shape(ctx, IRON, circle(ctx, 0, 0, c * 0.4), line);
      shape(ctx, 'rgba(120, 255, 170, 0.6)', circle(ctx, 0, 0, c * 0.32), thin);
      glow(ctx, 0, 0, c * 0.5, 'rgba(120, 255, 170, 0.35)');
      shape(ctx, 'rgba(60, 40, 60, 0.7)', () => ctx.ellipse(0, 0, c * 0.1, c * 0.18, 0.3, 0, Math.PI * 2), 0);
      break;
    case 'servers':
      shape(ctx, DARK, rect(ctx, -c * 0.34, -c * 0.4, c * 0.68, c * 0.8, c * 0.03), line);
      for (let y = -0.3; y < 0.35; y += 0.15)
        for (const [x, col] of [[-0.2, '#5fcf7a'], [-0.1, '#e8c14a'], [0.1, '#5fcf7a']] as const) shape(ctx, col, circle(ctx, x * c, y * c, c * 0.03), 0);
      break;
    case 'robot':
      shape(ctx, '#8d949c', circle(ctx, 0, 0, c * 0.3), line);
      shape(ctx, '#55585e', circle(ctx, 0, 0, c * 0.18), thin);
      shape(ctx, '#e0523a', circle(ctx, 0, -c * 0.08, c * 0.06), 0);
      glow(ctx, 0, -c * 0.08, c * 0.14, 'rgba(255, 90, 60, 0.5)');
      lines(ctx, IRON, Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, 0), ctx.lineTo(-c * 0.42, c * 0.14), ctx.moveTo(c * 0.3, 0), ctx.lineTo(c * 0.42, c * 0.14)));
      break;
    case 'forcefield':
      // A wall of light: it goes over a doorway or across a corridor.
      glow(ctx, 0, 0, Math.max(w, h) * 0.6, 'rgba(95, 200, 255, 0.25)');
      lines(ctx, 'rgba(140, 220, 255, 0.9)', Math.max(2, c / 10), () => (ctx.moveTo(L + c * 0.08, 0), ctx.lineTo(w / 2 - c * 0.08, 0)));
      for (const x of [L + c * 0.08, w / 2 - c * 0.08]) shape(ctx, IRON, rect(ctx, x - c * 0.08, -c * 0.12, c * 0.16, c * 0.24, c * 0.03), thin);
      break;
    // ---- A city of the future ----
    case 'hovercar':
      ctx.fillStyle = 'rgba(95, 200, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.44, h * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      shape(ctx, tone(CARS, t), rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.4, h - c * 0.4, c * 0.4), line);
      shape(ctx, '#5fa8d3', rect(ctx, L + c * 0.36, T + c * 0.6, w - c * 0.72, h * 0.3, c * 0.16), thin);
      for (const x of [L + c * 0.4, w / 2 - c * 0.4]) shape(ctx, '#ffe9a8', circle(ctx, x, T + c * 0.28, c * 0.07), 0);
      break;
    case 'vending':
      shape(ctx, '#3f5170', rect(ctx, -c * 0.36, -c * 0.32, c * 0.72, c * 0.64, c * 0.04), line);
      shape(ctx, 'rgba(200, 240, 255, 0.85)', rect(ctx, -c * 0.28, -c * 0.24, c * 0.4, c * 0.4, c * 0.02), thin);
      for (let k = 0; k < 4; k++) shape(ctx, ['#e0523a', '#e8c14a', '#5fcf7a', '#4f9fe0'][k]!, circle(ctx, -c * 0.2 + (k % 2) * c * 0.16, -c * 0.14 + Math.floor(k / 2) * c * 0.18, c * 0.05), 0);
      shape(ctx, SCREEN, rect(ctx, c * 0.18, -c * 0.2, c * 0.1, c * 0.14), 0);
      break;
    case 'holosign': {
      const col = tone(NEON, t);
      glow(ctx, 0, 0, Math.max(w, h) * 0.6, `${col}55`);
      shape(ctx, 'rgba(20, 20, 30, 0.75)', rect(ctx, L + c * 0.08, -c * 0.22, w - c * 0.16, c * 0.44, c * 0.06), thin);
      lines(ctx, col, Math.max(1.5, c / 14), () => {
        ctx.roundRect(L + c * 0.14, -c * 0.16, w - c * 0.28, c * 0.32, c * 0.05);
        for (let x = L + c * 0.3; x < w / 2 - c * 0.25; x += c * 0.22) (ctx.moveTo(x, c * 0.08), ctx.lineTo(x + c * 0.08, -c * 0.08), ctx.lineTo(x + c * 0.14, c * 0.08));
      });
      break;
    }
    // ---- Aliens ----
    case 'eggs':
      for (const [x, y, r] of [[-0.16, -0.1, 0.15], [0.16, -0.04, 0.13], [0, 0.2, 0.14]] as const) {
        shape(ctx, tone(ALIEN, t), () => ctx.ellipse(x * c, y * c, r * c, r * c * 1.15, 0, 0, Math.PI * 2), thin);
        lines(ctx, 'rgba(30, 20, 30, 0.5)', thin, () => (ctx.moveTo(x * c - r * c * 0.5, y * c), ctx.lineTo(x * c + r * c * 0.5, y * c)));
      }
      break;
    case 'alienplant': {
      const col = tone(ALIEN, t);
      lines(ctx, col, Math.max(2, c / 10), () => {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(Math.cos(a) * c * 0.2, Math.sin(a) * c * 0.2, Math.cos(a + 0.8) * c * 0.35, Math.sin(a + 0.8) * c * 0.35, Math.cos(a + 0.4) * c * 0.42, Math.sin(a + 0.4) * c * 0.42);
        }
      });
      shape(ctx, '#3a2440', circle(ctx, 0, 0, c * 0.12), thin);
      shape(ctx, '#ffd84f', circle(ctx, 0, 0, c * 0.05), 0);
      break;
    }
    case 'saucer': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, 'rgba(40, 30, 20, 0.35)', () => ctx.ellipse(c * 0.2, c * 0.1, r * 1.1, r * 0.9, 0.3, 0, Math.PI * 2), 0);
      shape(ctx, '#a3a9ad', circle(ctx, 0, 0, r), line);
      shape(ctx, '#7d848a', circle(ctx, 0, 0, r * 0.7), thin);
      shape(ctx, 'rgba(140, 220, 200, 0.7)', circle(ctx, 0, 0, r * 0.38), thin);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        shape(ctx, k % 3 ? '#ffe9a8' : '#2b2a2e', circle(ctx, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, c * 0.06), 0);
      }
      // Broken: a crack and smoke.
      lines(ctx, DARK, Math.max(1.5, c / 14), () => (ctx.moveTo(r * 0.2, -r * 0.9), ctx.lineTo(r * 0.4, -r * 0.4), ctx.lineTo(r * 0.25, -r * 0.1)));
      break;
    }
    case 'cocoon':
      shape(ctx, tone(ALIEN, t), () => ctx.ellipse(0, 0, w * 0.32, h * 0.42, 0, 0, Math.PI * 2), line);
      lines(ctx, 'rgba(30, 20, 30, 0.45)', thin, () => {
        for (let k = -2; k <= 2; k++) (ctx.moveTo(-w * 0.3, (k * h) / 7), ctx.quadraticCurveTo(0, (k * h) / 7 + c * 0.1, w * 0.3, (k * h) / 7));
      });
      break;
    case 'xenocrystal': {
      const col = tone(ALIEN, t);
      glow(ctx, 0, 0, c * 0.45, `${col}66`);
      for (const [x, y, a, s] of [[0, 0, 0, 1], [-0.16, 0.1, -0.6, 0.7], [0.16, 0.08, 0.5, 0.75]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, col, () => {
          ctx.moveTo(0, -c * 0.32 * s);
          ctx.lineTo(c * 0.09 * s, 0);
          ctx.lineTo(0, c * 0.12 * s);
          ctx.lineTo(-c * 0.09 * s, 0);
          ctx.closePath();
        }, thin);
        ctx.restore();
      }
      break;
    }
    case 'goo': {
      const col = tone(ALIEN, t);
      glow(ctx, 0, 0, c * 0.5, `${col}55`);
      shape(ctx, `${col}bb`, () => {
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2;
          const r = c * (0.3 + ((k * 7) % 3) * 0.05);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, thin);
      for (const [x, y] of [[-0.1, -0.06], [0.12, 0.1]] as const) lines(ctx, 'rgba(255, 255, 255, 0.6)', thin, () => ctx.arc(x * c, y * c, c * 0.05, 0, Math.PI * 2));
      break;
    }
    // ---- A manor and its crypt ----
    case 'candelabra':
      lines(ctx, '#c9a442', Math.max(1.5, c / 14), () => (ctx.moveTo(-c * 0.28, 0), ctx.lineTo(c * 0.28, 0), ctx.moveTo(0, -c * 0.28), ctx.lineTo(0, c * 0.28)));
      for (const [x, y] of [[-0.28, 0], [0.28, 0], [0, -0.28], [0, 0.28], [0, 0]] as const) {
        glow(ctx, x * c, y * c, c * 0.16, 'rgba(255, 214, 120, 0.8)');
        shape(ctx, '#f0e6c8', circle(ctx, x * c, y * c, c * 0.05), thin);
      }
      break;
    case 'organ':
      shape(ctx, '#4a3626', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.04), line);
      for (let x = L + c * 0.16; x < w / 2 - c * 0.1; x += c * 0.13) shape(ctx, '#c9a442', rect(ctx, x, T + c * 0.12, c * 0.08, c * 0.3 + Math.abs(Math.sin(x * 3)) * c * 0.2, c * 0.04), thin);
      shape(ctx, '#e8e2d0', rect(ctx, L + c * 0.2, h / 2 - c * 0.34, w - c * 0.4, c * 0.16), thin);
      lines(ctx, DARK, thin, () => {
        for (let x = L + c * 0.26; x < w / 2 - c * 0.2; x += c * 0.08) (ctx.moveTo(x, h / 2 - c * 0.34), ctx.lineTo(x, h / 2 - c * 0.24));
      });
      break;
    case 'piano':
      // A grand piano from above: its curved body, the open lid, the keys at the front.
      shape(ctx, '#1d1b1e', () => {
        ctx.moveTo(L + c * 0.16, T + c * 0.22);
        ctx.lineTo(w / 2 - c * 0.16, T + c * 0.22);
        ctx.lineTo(w / 2 - c * 0.16, T + h * 0.6);
        ctx.quadraticCurveTo(w / 2 - c * 0.2, h / 2 - c * 0.08, c * 0.1, h / 2 - c * 0.1);
        ctx.quadraticCurveTo(L + c * 0.2, h / 2 - c * 0.2, L + c * 0.16, T + h * 0.5);
        ctx.closePath();
      }, line);
      shape(ctx, '#e8e2d0', rect(ctx, L + c * 0.2, T + c * 0.08, w - c * 0.4, c * 0.16), thin);
      lines(ctx, DARK, thin, () => {
        for (let x = L + c * 0.26; x < w / 2 - c * 0.2; x += c * 0.07) (ctx.moveTo(x, T + c * 0.08), ctx.lineTo(x, T + c * 0.18));
      });
      lines(ctx, 'rgba(255, 255, 255, 0.25)', thin, () => (ctx.moveTo(L + c * 0.3, T + c * 0.36), ctx.lineTo(w / 2 - c * 0.3, h / 2 - c * 0.4)));
      break;
    case 'gargoyle':
      shape(ctx, '#7d776d', () => ctx.ellipse(0, c * 0.06, c * 0.2, c * 0.24, 0, 0, Math.PI * 2), line);
      shape(ctx, '#6b665d', () => {
        for (const sx of [-1, 1]) {
          ctx.moveTo(sx * c * 0.12, -c * 0.06);
          ctx.lineTo(sx * c * 0.44, -c * 0.3);
          ctx.lineTo(sx * c * 0.36, c * 0.04);
          ctx.closePath();
        }
      }, thin);
      shape(ctx, '#7d776d', circle(ctx, 0, -c * 0.2, c * 0.12), thin);
      shape(ctx, '#e0523a', circle(ctx, -c * 0.04, -c * 0.22, c * 0.02), 0);
      shape(ctx, '#e0523a', circle(ctx, c * 0.04, -c * 0.22, c * 0.02), 0);
      break;
    case 'bloodpool':
      shape(ctx, 'rgba(122, 18, 24, 0.85)', () => {
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          const r = c * (0.24 + ((k * 5) % 3) * 0.06);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, 0);
      shape(ctx, 'rgba(255, 255, 255, 0.35)', circle(ctx, -c * 0.08, -c * 0.06, c * 0.04), 0);
      for (const [x, y] of [[0.36, -0.2], [-0.32, 0.28], [0.3, 0.32]] as const) shape(ctx, 'rgba(122, 18, 24, 0.85)', circle(ctx, x * c, y * c, c * 0.04), 0);
      break;
    case 'bats':
      for (const [x, y, s] of [[-0.18, -0.14, 1], [0.18, -0.02, 0.8], [-0.04, 0.22, 0.9]] as const) {
        shape(ctx, '#1d1b1e', () => {
          ctx.moveTo(x * c, y * c);
          ctx.quadraticCurveTo((x - 0.12 * s) * c, (y - 0.12 * s) * c, (x - 0.2 * s) * c, (y - 0.02) * c);
          ctx.lineTo((x - 0.12 * s) * c, y * c);
          ctx.lineTo(x * c, (y + 0.05) * c);
          ctx.lineTo((x + 0.12 * s) * c, y * c);
          ctx.lineTo((x + 0.2 * s) * c, (y - 0.02) * c);
          ctx.quadraticCurveTo((x + 0.12 * s) * c, (y - 0.12 * s) * c, x * c, y * c);
        }, 0);
      }
      break;
    case 'ironfence':
      lines(ctx, '#1d1b1e', Math.max(1.5, c / 16), () => (ctx.moveTo(L, 0), ctx.lineTo(w / 2, 0)));
      for (let x = L + c * 0.12; x < w / 2; x += c * 0.2) {
        shape(ctx, '#1d1b1e', () => {
          ctx.moveTo(x, -c * 0.12);
          ctx.lineTo(x + c * 0.05, -c * 0.04);
          ctx.lineTo(x - c * 0.05, -c * 0.04);
          ctx.closePath();
        }, 0);
      }
      break;
    case 'mausoleum':
      shape(ctx, '#8a8476', rect(ctx, L + c * 0.1, T + c * 0.1, w - c * 0.2, h - c * 0.2, c * 0.04), line);
      shape(ctx, '#6b665d', () => {
        ctx.moveTo(L + c * 0.1, T + c * 0.1);
        ctx.lineTo(0, 0);
        ctx.lineTo(w / 2 - c * 0.1, T + c * 0.1);
        ctx.moveTo(L + c * 0.1, h / 2 - c * 0.1);
        ctx.lineTo(0, 0);
        ctx.lineTo(w / 2 - c * 0.1, h / 2 - c * 0.1);
      }, thin);
      shape(ctx, '#4a463f', rect(ctx, -c * 0.24, h / 2 - c * 0.24, c * 0.48, c * 0.14), thin);
      shape(ctx, '#bdb5a3', () => (ctx.moveTo(0, -c * 0.3), ctx.lineTo(c * 0.06, 0), ctx.lineTo(0, c * 0.3), ctx.lineTo(-c * 0.06, 0), ctx.closePath()), thin);
      break;
    case 'goblet':
      shape(ctx, '#c9a442', circle(ctx, 0, 0, c * 0.16), line);
      shape(ctx, '#7a1218', circle(ctx, 0, 0, c * 0.11), 0);
      break;
    case 'roses':
      for (const [x, y] of [[-0.16, -0.12], [0.14, -0.06], [-0.02, 0.18], [0.24, 0.24]] as const) {
        shape(ctx, '#2f4a2a', circle(ctx, x * c, y * c, c * 0.12), 0);
        shape(ctx, tone(SET3_TINTS.roses!, t), circle(ctx, x * c, y * c, c * 0.07), thin);
      }
      break;
    case 'tombstone':
      shape(ctx, '#3d3a34', rect(ctx, -c * 0.22, -c * 0.04, c * 0.44, c * 0.4, c * 0.04), 0);
      shape(ctx, tone(STONE, t), () => {
        // A Celtic cross.
        ctx.rect(-c * 0.06, -c * 0.4, c * 0.12, c * 0.48);
        ctx.rect(-c * 0.2, -c * 0.28, c * 0.4, c * 0.1);
      }, thin);
      lines(ctx, '#8c857a', thin, () => ctx.arc(0, -c * 0.23, c * 0.12, 0, Math.PI * 2));
      break;
    // ---- An office and a bar ----
    case 'filing':
      shape(ctx, '#6b7360', rect(ctx, -c * 0.3, -c * 0.34, c * 0.6, c * 0.68, c * 0.03), line);
      for (const y of [-0.24, 0, 0.24]) {
        lines(ctx, 'rgba(20, 20, 20, 0.5)', thin, () => (ctx.moveTo(-c * 0.3, (y + 0.11) * c), ctx.lineTo(c * 0.3, (y + 0.11) * c)));
        shape(ctx, '#c9c2a8', rect(ctx, -c * 0.08, (y - 0.03) * c, c * 0.16, c * 0.05), 0);
      }
      break;
    case 'typewriter':
      shape(ctx, DARK, rect(ctx, -c * 0.3, -c * 0.16, c * 0.6, c * 0.36, c * 0.06), line);
      shape(ctx, '#efe7d3', rect(ctx, -c * 0.18, -c * 0.34, c * 0.36, c * 0.22), thin);
      for (let k = 0; k < 10; k++) shape(ctx, '#d6d2c8', circle(ctx, -c * 0.22 + (k % 5) * c * 0.11, c * 0.04 + Math.floor(k / 5) * c * 0.08, c * 0.03), 0);
      break;
    case 'phone':
      shape(ctx, DARK, rect(ctx, -c * 0.18, -c * 0.14, c * 0.36, c * 0.3, c * 0.08), line);
      shape(ctx, '#d6d2c8', circle(ctx, 0, c * 0.03, c * 0.08), thin);
      lines(ctx, DARK, Math.max(2, c / 10), () => (ctx.moveTo(-c * 0.22, -c * 0.18), ctx.quadraticCurveTo(0, -c * 0.3, c * 0.22, -c * 0.18)));
      break;
    case 'jukebox':
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.34, -c * 0.3, c * 0.68, c * 0.6, c * 0.3), line);
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.24, -c * 0.2, c * 0.48, c * 0.4, c * 0.22), thin);
      glow(ctx, 0, 0, c * 0.45, 'rgba(255, 184, 79, 0.45)');
      shape(ctx, DARK, circle(ctx, 0, 0, c * 0.1), thin);
      break;
    case 'pooltable':
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.08, T + c * 0.08, w - c * 0.16, h - c * 0.16, c * 0.08), line);
      shape(ctx, '#2f6a3a', rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.4, h - c * 0.4, c * 0.02), thin);
      for (const [x, y] of [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] as const)
        shape(ctx, DARK, circle(ctx, x * (w / 2 - c * 0.2), y * (h / 2 - c * 0.2), c * 0.07), 0);
      for (const [x, y, col] of [[0, -0.6, '#efe7d3'], [-0.1, 0.4, '#e0523a'], [0.1, 0.4, '#e8c14a'], [0, 0.55, DARK]] as const) shape(ctx, col, circle(ctx, x * c, y * c, c * 0.06), 0);
      break;
    case 'ceilingfan':
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.rotate((k * Math.PI) / 2 + 0.3);
        shape(ctx, tone(WOOD, 0.5), rect(ctx, c * 0.04, -c * 0.06, c * 0.38, c * 0.12, c * 0.06), thin);
        ctx.restore();
      }
      shape(ctx, '#c9a442', circle(ctx, 0, 0, c * 0.08), thin);
      break;
    // ---- A street ----
    case 'sedan':
      shape(ctx, 'rgba(20, 16, 10, 0.3)', rect(ctx, L + c * 0.22, T + c * 0.18, w - c * 0.3, h - c * 0.26, c * 0.3), 0);
      shape(ctx, tone(CARS, t), rect(ctx, L + c * 0.14, T + c * 0.1, w - c * 0.28, h - c * 0.2, c * 0.34), line);
      shape(ctx, '#3a4a58', rect(ctx, L + c * 0.24, T + h * 0.3, w - c * 0.48, h * 0.34, c * 0.12), thin);
      lines(ctx, 'rgba(255, 255, 255, 0.35)', thin, () => (ctx.moveTo(L + c * 0.3, T + h * 0.34), ctx.lineTo(w / 2 - c * 0.3, T + h * 0.34)));
      for (const x of [L + c * 0.32, w / 2 - c * 0.32]) shape(ctx, '#ffe9a8', circle(ctx, x, T + c * 0.2, c * 0.08), thin);
      shape(ctx, '#c9c2a8', rect(ctx, -c * 0.3, T + c * 0.06, c * 0.6, c * 0.08, c * 0.03), thin);
      break;
    case 'hydrant':
      shape(ctx, '#b33a2e', circle(ctx, 0, 0, c * 0.18), line);
      shape(ctx, '#8a2b22', circle(ctx, 0, 0, c * 0.09), thin);
      for (const a of [0, Math.PI]) shape(ctx, '#b33a2e', rect(ctx, Math.cos(a) * c * 0.22 - c * 0.06, -c * 0.05, c * 0.12, c * 0.1), thin);
      break;
    case 'newsstand':
      shape(ctx, '#2f4a3a', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, h - c * 0.12, c * 0.04), line);
      for (let x = L + c * 0.16; x < w / 2 - c * 0.2; x += c * 0.22) shape(ctx, ['#efe7d3', '#e8c14a', '#d6d2c8'][Math.floor((x - L) / (c * 0.22)) % 3]!, rect(ctx, x, h / 2 - c * 0.36, c * 0.18, c * 0.24), thin);
      lines(ctx, 'rgba(20, 20, 20, 0.6)', thin, () => {
        for (let x = L + c * 0.18; x < w / 2 - c * 0.2; x += c * 0.22) (ctx.moveTo(x + c * 0.03, h / 2 - c * 0.3), ctx.lineTo(x + c * 0.15, h / 2 - c * 0.3));
      });
      break;
    case 'trashcan':
      shape(ctx, '#8d949c', circle(ctx, 0, 0, c * 0.26), line);
      lines(ctx, '#55585e', thin, () => {
        ctx.arc(0, 0, c * 0.18, 0, Math.PI * 2);
        ctx.moveTo(-c * 0.08, 0);
        ctx.lineTo(c * 0.08, 0);
      });
      break;
    case 'phonebooth':
      shape(ctx, '#7a1f2b', rect(ctx, -c * 0.36, -c * 0.36, c * 0.72, c * 0.72, c * 0.04), line);
      shape(ctx, 'rgba(200, 230, 240, 0.6)', rect(ctx, -c * 0.26, -c * 0.26, c * 0.52, c * 0.52), thin);
      shape(ctx, DARK, rect(ctx, -c * 0.1, -c * 0.24, c * 0.2, c * 0.14, c * 0.03), 0);
      break;
    case 'chalk':
      // A body's outline in chalk.
      lines(ctx, 'rgba(245, 245, 240, 0.9)', Math.max(1.5, c / 18), () => {
        ctx.arc(0, -c * 0.3, c * 0.1, 0, Math.PI * 2);
        ctx.moveTo(-c * 0.1, -c * 0.18);
        ctx.lineTo(-c * 0.34, -c * 0.02);
        ctx.lineTo(-c * 0.24, c * 0.04);
        ctx.lineTo(-c * 0.08, -c * 0.04);
        ctx.lineTo(-c * 0.12, c * 0.4);
        ctx.lineTo(0, c * 0.4);
        ctx.lineTo(c * 0.02, c * 0.12);
        ctx.lineTo(c * 0.08, c * 0.4);
        ctx.lineTo(c * 0.2, c * 0.38);
        ctx.lineTo(c * 0.1, -c * 0.04);
        ctx.lineTo(c * 0.3, -c * 0.2);
        ctx.lineTo(c * 0.24, -c * 0.26);
        ctx.lineTo(c * 0.08, -c * 0.18);
      });
      break;
  }
}

