// More sets for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A graveyard; a harbour; an eastern bazaar; a dragon's lair; a dwarven mine; an elven wood; the sewers.
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const IRON = '#55585e';
const DARK = '#2b2a2e';
const BONE = '#e8e2d0';
const SPICES = ['#c9772e', '#b33a2e', '#e8c14a', '#7f9a48', '#8a4a2a'];
const EGGS = ['#b33a2e', '#3f7d97', '#5f8f3c', '#c9a442'];

export const SET10_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  dragoneggs: EGGS, rugstall: CLOTH, galleon: ['#5c3d22', '#3a2a1c', '#7a5432'], glowflowers: ['#8fe0ff', '#f0b8ff', '#ffe9a8'], wreath: ['#3f6a35', '#2b1d24'],
};
// Drawn once a cell when stretched.
export const SET10_TILED: Prop['kind'][] = ['fishbasket', 'spicesacks', 'brasslamps', 'scorch', 'ore', 'glowflowers', 'sludge', 'rats'];

export function drawSets10(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  switch (p.kind) {
    // ---- A graveyard ----
    case 'freshgrave':
      shape(ctx, '#5c4a36', rect(ctx, -c * 0.3, T + c * 0.16, c * 0.6, h - c * 0.28, c * 0.14), line);
      lines(ctx, 'rgba(30, 22, 12, 0.45)', thin, () => {
        for (let y = T + c * 0.4; y < h / 2 - c * 0.2; y += c * 0.2) (ctx.moveTo(-c * 0.2, y), ctx.lineTo(c * 0.2, y + c * 0.04));
      });
      shape(ctx, '#8c857a', rect(ctx, -c * 0.24, T + c * 0.02, c * 0.48, c * 0.14, c * 0.06), thin);
      break;
    case 'angelstatue':
      shape(ctx, '#a39d90', rect(ctx, -c * 0.34, -c * 0.34, c * 0.68, c * 0.68, c * 0.04), line);
      for (const sx of [-1, 1]) shape(ctx, '#d6d2c8', () => {
        ctx.moveTo(sx * c * 0.06, -c * 0.04);
        ctx.quadraticCurveTo(sx * c * 0.36, -c * 0.34, sx * c * 0.32, c * 0.06);
        ctx.quadraticCurveTo(sx * c * 0.2, c * 0.04, sx * c * 0.06, c * 0.08);
        ctx.closePath();
      }, thin);
      shape(ctx, '#e3ded4', () => ctx.ellipse(0, c * 0.04, c * 0.1, c * 0.16, 0, 0, Math.PI * 2), thin);
      shape(ctx, '#e3ded4', circle(ctx, 0, -c * 0.16, c * 0.07), thin);
      break;
    case 'gravelantern':
      shape(ctx, DARK, rect(ctx, -c * 0.14, -c * 0.14, c * 0.28, c * 0.28, c * 0.04), line);
      glow(ctx, 0, 0, c * 0.4, 'rgba(255, 214, 120, 0.7)');
      shape(ctx, '#ffe9a8', circle(ctx, 0, 0, c * 0.07), 0);
      lines(ctx, DARK, thin, () => (ctx.moveTo(0, -c * 0.14), ctx.lineTo(0, -c * 0.3)));
      break;
    case 'shovel':
      lines(ctx, '#7a5432', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.3, c * 0.3), ctx.lineTo(c * 0.14, -c * 0.14)));
      shape(ctx, IRON, () => (ctx.moveTo(c * 0.1, -c * 0.1), ctx.lineTo(c * 0.34, -c * 0.2), ctx.lineTo(c * 0.24, -c * 0.38), ctx.lineTo(c * 0.02, -c * 0.24), ctx.closePath()), thin);
      shape(ctx, '#5c4a36', () => ctx.ellipse(c * 0.22, c * 0.2, c * 0.16, c * 0.1, 0.4, 0, Math.PI * 2), 0);
      break;
    case 'wreath': {
      lines(ctx, tone(SET10_TINTS.wreath!, t), Math.max(4, c / 6), () => ctx.arc(0, 0, c * 0.24, 0, Math.PI * 2));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        shape(ctx, k % 2 ? '#e8e2d0' : '#b33a2e', circle(ctx, Math.cos(a) * c * 0.24, Math.sin(a) * c * 0.24, c * 0.05), 0);
      }
      shape(ctx, '#2b2a2e', () => (ctx.moveTo(0, c * 0.2), ctx.lineTo(-c * 0.08, c * 0.42), ctx.lineTo(c * 0.08, c * 0.42), ctx.closePath()), 0);
      break;
    }
    // ---- A harbour ----
    case 'galleon': {
      // A ship from above: the hull to a bow at the front, three masts with yards, a raised stern.
      const hull = tone(SET10_TINTS.galleon!, t);
      shape(ctx, 'rgba(20, 30, 40, 0.3)', () => ctx.ellipse(c * 0.2, c * 0.2, w * 0.46, h * 0.48, 0, 0, Math.PI * 2), 0);
      shape(ctx, hull, () => {
        ctx.moveTo(0, T + c * 0.05);
        ctx.quadraticCurveTo(w * 0.46, T + h * 0.2, w * 0.44, T + h * 0.55);
        ctx.lineTo(w * 0.38, h / 2 - c * 0.05);
        ctx.lineTo(-w * 0.38, h / 2 - c * 0.05);
        ctx.lineTo(-w * 0.44, T + h * 0.55);
        ctx.quadraticCurveTo(-w * 0.46, T + h * 0.2, 0, T + c * 0.05);
      }, line);
      shape(ctx, '#a87a4a', () => {
        ctx.moveTo(0, T + c * 0.3);
        ctx.quadraticCurveTo(w * 0.36, T + h * 0.22, w * 0.34, T + h * 0.55);
        ctx.lineTo(w * 0.3, h / 2 - c * 0.2);
        ctx.lineTo(-w * 0.3, h / 2 - c * 0.2);
        ctx.lineTo(-w * 0.34, T + h * 0.55);
        ctx.quadraticCurveTo(-w * 0.36, T + h * 0.22, 0, T + c * 0.3);
      }, thin);
      lines(ctx, 'rgba(60, 35, 15, 0.35)', thin, () => {
        for (let x = -w * 0.26; x < w * 0.3; x += c * 0.2) (ctx.moveTo(x, T + h * 0.2), ctx.lineTo(x, h / 2 - c * 0.2));
      });
      shape(ctx, '#8a5f35', rect(ctx, -w * 0.32, h / 2 - c * 1.3, w * 0.64, c * 1.1, c * 0.06), thin);
      for (const y of [T + h * 0.28, T + h * 0.48, T + h * 0.68]) {
        lines(ctx, '#3a2a1c', Math.max(2, c / 10), () => (ctx.moveTo(-w * 0.44, y), ctx.lineTo(w * 0.44, y)));
        shape(ctx, '#efe7d3', () => ctx.ellipse(0, y + c * 0.12, w * 0.38, c * 0.16, 0, Math.PI, 0), thin);
        shape(ctx, '#3a2a1c', circle(ctx, 0, y, c * 0.09), 0);
      }
      lines(ctx, '#3a2a1c', Math.max(1.5, c / 14), () => (ctx.moveTo(0, T + c * 0.05), ctx.lineTo(0, T - c * 0.5)));
      break;
    }
    case 'harborcrane':
      shape(ctx, tone(WOOD, 0.3), rect(ctx, L + c * 0.2, T + c * 0.2, w - c * 0.4, h - c * 0.4, c * 0.04), line);
      lines(ctx, '#5c3d22', Math.max(3, c / 8), () => (ctx.moveTo(0, 0), ctx.lineTo(w * 0.48, -h * 0.48)));
      shape(ctx, '#8a7046', circle(ctx, 0, 0, c * 0.2), thin);
      lines(ctx, '#b89a64', thin, () => (ctx.moveTo(w * 0.48, -h * 0.48), ctx.lineTo(w * 0.48, -h * 0.2)));
      shape(ctx, IRON, rect(ctx, w * 0.42, -h * 0.22, c * 0.12, c * 0.1), 0);
      break;
    case 'fishbasket':
      shape(ctx, '#a8823a', circle(ctx, 0, 0, c * 0.32), line);
      lines(ctx, '#7a5a2a', thin, () => {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * c * 0.24, Math.sin(a) * c * 0.24);
          ctx.lineTo(Math.cos(a) * c * 0.32, Math.sin(a) * c * 0.32);
        }
      });
      for (const [x, y, a] of [[-0.08, -0.06, 0.5], [0.08, 0.04, -0.4], [0, 0.12, 1.4]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#a3b4bd', () => (ctx.ellipse(0, 0, c * 0.14, c * 0.05, 0, 0, Math.PI * 2), ctx.moveTo(-c * 0.14, 0), ctx.lineTo(-c * 0.2, -c * 0.05), ctx.lineTo(-c * 0.2, c * 0.05), ctx.closePath()), thin);
        ctx.restore();
      }
      break;
    // ---- An eastern bazaar ----
    case 'rugstall':
      // Rugs hung and laid out for sale, a pole and its awning.
      shape(ctx, '#d6c69a', rect(ctx, L + c * 0.06, T + c * 0.06, w - c * 0.12, c * 0.3, c * 0.04), thin);
      for (const [x, y, k] of [[-0.5, 0.2, 0], [0.5, 0.2, 3], [0, 0.5, 5]] as const) {
        shape(ctx, CLOTH[(k + Math.floor(t * 8)) % CLOTH.length]!, rect(ctx, x * c - c * 0.36, y * c - c * 0.26, c * 0.72, c * 0.52, c * 0.02), thin);
        lines(ctx, '#d6a84a', thin, () => ctx.rect(x * c - c * 0.3, y * c - c * 0.2, c * 0.6, c * 0.4));
        shape(ctx, '#d6a84a', () => (ctx.moveTo(x * c, y * c - c * 0.12), ctx.lineTo(x * c + c * 0.12, y * c), ctx.lineTo(x * c, y * c + c * 0.12), ctx.lineTo(x * c - c * 0.12, y * c), ctx.closePath()), 0);
      }
      break;
    case 'spicesacks':
      for (const [x, y, k] of [[-0.2, -0.16, 0], [0.18, -0.14, 1], [-0.18, 0.18, 2], [0.2, 0.18, 3]] as const) {
        shape(ctx, '#d6c69a', circle(ctx, x * c, y * c, c * 0.17), thin);
        shape(ctx, SPICES[(k + Math.floor(t * 5)) % SPICES.length]!, circle(ctx, x * c, y * c, c * 0.12), 0);
      }
      break;
    case 'hookah':
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.5;
        lines(ctx, '#7a1f2b', Math.max(1.5, c / 18), () => (ctx.moveTo(0, 0), ctx.quadraticCurveTo(Math.cos(a + 0.6) * c * 0.3, Math.sin(a + 0.6) * c * 0.3, Math.cos(a) * c * 0.42, Math.sin(a) * c * 0.42)));
      }
      shape(ctx, '#3f7d97', circle(ctx, 0, 0, c * 0.18), line);
      shape(ctx, '#c9a442', circle(ctx, 0, 0, c * 0.09), thin);
      glow(ctx, 0, 0, c * 0.14, 'rgba(255, 140, 60, 0.6)');
      break;
    case 'brasslamps':
      for (const [x, y] of [[-0.2, -0.14], [0.18, -0.06], [0, 0.2]] as const) {
        glow(ctx, x * c, y * c, c * 0.24, 'rgba(255, 200, 110, 0.6)');
        shape(ctx, '#c9a442', () => {
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const r = (k % 2 ? 0.07 : 0.11) * c;
            ctx.lineTo(x * c + Math.cos(a) * r, y * c + Math.sin(a) * r);
          }
          ctx.closePath();
        }, thin);
      }
      break;
    // ---- A dragon's lair ----
    case 'dragonskull':
      // A huge horned skull: jaws to the front, sockets, horns swept back.
      shape(ctx, BONE, () => {
        ctx.moveTo(-w * 0.18, -h * 0.2);
        ctx.quadraticCurveTo(0, -h * 0.34, w * 0.18, -h * 0.2);
        ctx.lineTo(w * 0.12, h * 0.42);
        ctx.quadraticCurveTo(0, h * 0.48, -w * 0.12, h * 0.42);
        ctx.closePath();
      }, line);
      for (const sx of [-1, 1]) {
        shape(ctx, DARK, () => ctx.ellipse(sx * w * 0.09, -h * 0.06, w * 0.06, h * 0.08, sx * 0.3, 0, Math.PI * 2), 0);
        lines(ctx, '#d6cdb5', Math.max(4, c / 6), () => (ctx.moveTo(sx * w * 0.14, -h * 0.22), ctx.quadraticCurveTo(sx * w * 0.42, -h * 0.3, sx * w * 0.46, -h * 0.48)));
      }
      lines(ctx, 'rgba(60, 50, 40, 0.6)', thin, () => {
        for (let y = h * 0.16; y < h * 0.42; y += c * 0.12) (ctx.moveTo(-w * 0.1, y), ctx.lineTo(w * 0.1, y));
      });
      break;
    case 'dragoneggs':
      glow(ctx, 0, 0, Math.min(w, h) * 0.5, 'rgba(255, 150, 60, 0.35)');
      shape(ctx, '#6b5a3a', circle(ctx, 0, 0, Math.min(w, h) * 0.42), line);
      for (const [x, y, k] of [[-0.3, -0.25, 0], [0.3, -0.2, 1], [0, 0.28, 2], [-0.05, -0.02, 3]] as const) {
        const col = EGGS[(k + Math.floor(t * 4)) % EGGS.length]!;
        shape(ctx, col, () => ctx.ellipse(x * c, y * c, c * 0.2, c * 0.26, x, 0, Math.PI * 2), thin);
        lines(ctx, 'rgba(0, 0, 0, 0.3)', thin, () => (ctx.moveTo(x * c - c * 0.1, y * c - c * 0.08), ctx.lineTo(x * c + c * 0.08, y * c + c * 0.04)));
      }
      break;
    case 'ribcage':
      lines(ctx, BONE, Math.max(4, c / 6), () => (ctx.moveTo(L + c * 0.1, 0), ctx.lineTo(w / 2 - c * 0.1, 0)));
      for (let x = L + c * 0.4; x < w / 2 - c * 0.2; x += c * 0.4) {
        lines(ctx, BONE, Math.max(3, c / 8), () => {
          ctx.moveTo(x, 0);
          ctx.quadraticCurveTo(x - c * 0.3, -h * 0.3, x - c * 0.1, -h * 0.46);
          ctx.moveTo(x, 0);
          ctx.quadraticCurveTo(x - c * 0.3, h * 0.3, x - c * 0.1, h * 0.46);
        });
      }
      break;
    case 'scorch':
      shape(ctx, 'rgba(30, 20, 12, 0.6)', () => {
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2;
          const r = c * (0.28 + ((k * 7) % 4) * 0.05);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, 0);
      shape(ctx, 'rgba(255, 120, 40, 0.5)', circle(ctx, c * 0.06, -c * 0.04, c * 0.05), 0);
      break;
    // ---- A dwarven mine ----
    case 'minecart':
      shape(ctx, IRON, rect(ctx, -c * 0.32, T + c * 0.16, c * 0.64, h - c * 0.32, c * 0.06), line);
      for (const [x, y] of [[-0.12, -0.2], [0.12, -0.1], [0, 0.12], [-0.14, 0.26], [0.14, 0.3]] as const) shape(ctx, y > 0.2 ? '#c9a442' : '#5c574d', circle(ctx, x * c, y * c, c * 0.1), thin);
      for (const y of [T + c * 0.26, h / 2 - c * 0.26]) for (const x of [-0.38, 0.38]) shape(ctx, DARK, rect(ctx, x * c - c * 0.04, y - c * 0.1, c * 0.08, c * 0.2), 0);
      break;
    case 'rails':
      // Rails along its length, sleepers across.
      for (let y = T + c * 0.12; y < h / 2; y += c * 0.25) shape(ctx, '#5c3d22', rect(ctx, -c * 0.36, y, c * 0.72, c * 0.1), 0);
      lines(ctx, '#8d949c', Math.max(2, c / 14), () => {
        for (const x of [-0.24, 0.24]) (ctx.moveTo(x * c, T), ctx.lineTo(x * c, h / 2));
      });
      break;
    case 'ore':
      for (const [x, y, r] of [[-0.16, -0.1, 0.18], [0.16, 0.06, 0.15], [-0.04, 0.22, 0.13]] as const) {
        shape(ctx, '#5c574d', circle(ctx, x * c, y * c, r * c), thin);
        for (const [dx, dy] of [[-0.05, -0.04], [0.05, 0.03]] as const) shape(ctx, '#e8c14a', circle(ctx, (x + dx) * c, (y + dy) * c, c * 0.03), 0);
      }
      break;
    case 'minesupport':
      // Mine props: two posts and a cap beam across a tunnel.
      lines(ctx, '#7a5432', Math.max(4, c / 6), () => (ctx.moveTo(-c * 0.46, 0), ctx.lineTo(c * 0.46, 0)));
      for (const x of [-0.4, 0.4]) shape(ctx, '#5c3d22', rect(ctx, x * c - c * 0.08, -c * 0.12, c * 0.16, c * 0.24, c * 0.03), thin);
      break;
    case 'runedoor':
      shape(ctx, '#6b665d', rect(ctx, L + c * 0.04, -c * 0.2, w - c * 0.08, c * 0.4, c * 0.04), line);
      lines(ctx, DARK, thin, () => (ctx.moveTo(0, -c * 0.2), ctx.lineTo(0, c * 0.2)));
      lines(ctx, '#8fe0ff', Math.max(1.5, c / 18), () => {
        for (const x of [-0.6, -0.3, 0.3, 0.6]) (ctx.moveTo(x * c, -c * 0.1), ctx.lineTo(x * c, c * 0.1), ctx.moveTo(x * c, 0), ctx.lineTo(x * c + c * 0.08, -c * 0.08));
      });
      glow(ctx, 0, 0, Math.max(w, c) * 0.4, 'rgba(140, 220, 255, 0.25)');
      break;
    // ---- An elven wood ----
    case 'treehouse': {
      // A round platform in a great tree, a rope ladder down, branches all round.
      const r = Math.min(w, h) * 0.46;
      shape(ctx, '#355a2e', circle(ctx, 0, 0, r), 0);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        shape(ctx, '#3f6a35', circle(ctx, Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, r * 0.32), 0);
      }
      shape(ctx, '#a87a4a', circle(ctx, 0, 0, r * 0.52), line);
      lines(ctx, 'rgba(60, 35, 15, 0.4)', thin, () => {
        for (let y = -r * 0.4; y < r * 0.5; y += c * 0.2) (ctx.moveTo(-r * 0.5, y), ctx.lineTo(r * 0.5, y));
      });
      shape(ctx, '#5c3d22', circle(ctx, 0, 0, r * 0.16), thin);
      lines(ctx, '#b89a64', thin, () => (ctx.moveTo(-c * 0.1, r * 0.5), ctx.lineTo(-c * 0.1, r), ctx.moveTo(c * 0.1, r * 0.5), ctx.lineTo(c * 0.1, r)));
      break;
    }
    case 'moonwell': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#d6d2c8', circle(ctx, 0, 0, r), line);
      shape(ctx, '#8fd0e8', circle(ctx, 0, 0, r * 0.74), thin);
      glow(ctx, 0, 0, r * 1.2, 'rgba(180, 230, 255, 0.5)');
      shape(ctx, 'rgba(255, 255, 255, 0.8)', () => (ctx.arc(-r * 0.2, -r * 0.1, r * 0.22, 0.6, 4.3), ctx.arc(-r * 0.08, -r * 0.14, r * 0.18, 4.1, 0.9, true)), 0);
      break;
    }
    case 'elvenarch':
      // Two living trees whose boughs grow into an arch.
      for (const x of [L + c * 0.3, w / 2 - c * 0.3]) shape(ctx, '#5c4430', circle(ctx, x, 0, c * 0.2), line);
      lines(ctx, '#4f7d33', Math.max(3, c / 8), () => (ctx.moveTo(L + c * 0.3, 0), ctx.quadraticCurveTo(0, -c * 0.4, w / 2 - c * 0.3, 0)));
      for (let x = L + c * 0.5; x < w / 2 - c * 0.4; x += c * 0.22) shape(ctx, '#7fbf5a', () => ctx.ellipse(x, -c * 0.2 + Math.abs(x) * 0.15, c * 0.08, c * 0.05, x, 0, Math.PI * 2), 0);
      break;
    case 'glowflowers': {
      const col = tone(SET10_TINTS.glowflowers!, t);
      for (const [x, y] of [[-0.2, -0.16], [0.16, -0.1], [0, 0.14], [-0.22, 0.22], [0.24, 0.24]] as const) {
        glow(ctx, x * c, y * c, c * 0.16, `${col}aa`);
        shape(ctx, col, circle(ctx, x * c, y * c, c * 0.05), 0);
      }
      break;
    }
    // ---- The sewers ----
    case 'grate':
      shape(ctx, IRON, rect(ctx, -c * 0.34, -c * 0.34, c * 0.68, c * 0.68, c * 0.04), line);
      shape(ctx, '#1a1c1e', rect(ctx, -c * 0.28, -c * 0.28, c * 0.56, c * 0.56), 0);
      lines(ctx, '#6f7882', Math.max(1.5, c / 16), () => {
        for (let x = -0.2; x < 0.25; x += 0.1) (ctx.moveTo(x * c, -c * 0.28), ctx.lineTo(x * c, c * 0.28));
      });
      break;
    case 'outflow':
      // A pipe out of a wall pouring into the channel: put its end on the wall.
      shape(ctx, '#6b665d', circle(ctx, 0, T + c * 0.4, c * 0.34), line);
      shape(ctx, '#1a1c1e', circle(ctx, 0, T + c * 0.4, c * 0.24), thin);
      shape(ctx, 'rgba(110, 120, 70, 0.8)', () => (ctx.moveTo(-c * 0.16, T + c * 0.5), ctx.quadraticCurveTo(0, h / 2, c * 0.16, T + c * 0.5), ctx.closePath()), 0);
      break;
    case 'sludge':
      shape(ctx, 'rgba(90, 100, 50, 0.85)', () => {
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          const r = c * (0.32 + ((k * 5) % 3) * 0.05);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
      }, 0);
      for (const [x, y] of [[-0.1, -0.06], [0.14, 0.1]] as const) lines(ctx, 'rgba(180, 190, 120, 0.7)', thin, () => ctx.arc(x * c, y * c, c * 0.04, 0, Math.PI * 2));
      break;
    case 'rats':
      for (const [x, y, a] of [[-0.18, -0.12, 0.6], [0.16, 0.02, -0.8], [-0.02, 0.22, 2.2]] as const) {
        ctx.save();
        ctx.translate(x * c, y * c);
        ctx.rotate(a);
        shape(ctx, '#6b5f55', () => ctx.ellipse(0, 0, c * 0.1, c * 0.06, 0, 0, Math.PI * 2), thin);
        lines(ctx, '#a08a7a', thin, () => (ctx.moveTo(-c * 0.1, 0), ctx.quadraticCurveTo(-c * 0.2, c * 0.06, -c * 0.26, 0)));
        shape(ctx, DARK, circle(ctx, c * 0.08, -c * 0.02, c * 0.012), 0);
        ctx.restore();
      }
      break;
    case 'manhole':
      shape(ctx, '#5c574d', circle(ctx, 0, 0, c * 0.32), line);
      lines(ctx, '#3a3530', thin, () => {
        ctx.arc(0, 0, c * 0.24, 0, Math.PI * 2);
        for (let y = -0.16; y <= 0.17; y += 0.08) (ctx.moveTo(-c * 0.2, y * c), ctx.lineTo(c * 0.2, y * c));
      });
      break;
  }
}
