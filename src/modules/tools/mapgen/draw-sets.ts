// Sets of things for the map editor (0.108), in the same manner as draw-props.ts: centred in their frame, the front up.
// A tavern's kitchen and taproom (fantasy); a ship and a colony (science fiction, brass and rivets as much as chrome).
import type { Prop } from './furnish';
import { circle, CLOTH, glow, lines, rect, shape, tone, WOOD, type Ctx } from './prop-paint';

const METAL = ['#8d949c', '#6f7882', '#a3a9ad'];
const BRASS = '#b8913e';
const SCREEN = '#5fd3c9';
// Paint of a ship's things: grey, olive, rust, white, navy.
const HULL = ['#8d949c', '#6f7a52', '#9a5a3a', '#d6d6cf', '#3f5170'];

export const SET_TINTS: Partial<Record<Prop['kind'], readonly string[]>> = {
  cargo: HULL, locker: HULL, bunk: CLOTH, rover: HULL, pod: HULL, kegs: WOOD, banner: CLOTH, curtain: CLOTH,
};
// Drawn once a cell when stretched.
export const SET_TILED: Prop['kind'][] = ['flour', 'tankards', 'banner', 'trophy', 'painting'];

export function drawSets(ctx: Ctx, p: Prop, w: number, h: number, c: number) {
  const line = Math.max(1, c / 18);
  const thin = Math.max(1, c / 28);
  const L = -w / 2;
  const T = -h / 2;
  const t = p.tint ?? 0;
  const rivets = (x0: number, y0: number, x1: number, y1: number) => {
    for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]] as const) shape(ctx, '#4a4f55', circle(ctx, x, y, c * 0.03), 0);
  };
  switch (p.kind) {
    // ---- A tavern's kitchen and taproom ----
    case 'oven':
      // A brick bread oven: a dome, its mouth at the front, the fire inside.
      shape(ctx, '#9a5a3a', () => ctx.ellipse(0, c * 0.08, w * 0.42, h * 0.4, 0, 0, Math.PI * 2), line);
      lines(ctx, 'rgba(60, 25, 12, 0.5)', thin, () => {
        for (let k = 1; k < 4; k++) ctx.ellipse(0, c * 0.08, w * 0.42 * (k / 4), h * 0.4 * (k / 4), 0, 0, Math.PI * 2);
      });
      shape(ctx, '#2a1a10', rect(ctx, -c * 0.3, T + c * 0.12, c * 0.6, c * 0.36, c * 0.18), thin);
      glow(ctx, 0, T + c * 0.32, c * 0.4, 'rgba(255, 150, 50, 0.7)');
      break;
    case 'spit':
      // Meat on a spit over the fire.
      shape(ctx, '#3a2a1c', () => ctx.ellipse(0, 0, w * 0.32, c * 0.3, 0, 0, Math.PI * 2), line);
      glow(ctx, 0, 0, c * 0.45, 'rgba(255, 140, 40, 0.75)');
      lines(ctx, '#55585e', Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.1, 0), ctx.lineTo(w / 2 - c * 0.1, 0)));
      shape(ctx, '#55585e', rect(ctx, L + c * 0.06, -c * 0.12, c * 0.08, c * 0.24), thin);
      shape(ctx, '#55585e', rect(ctx, w / 2 - c * 0.14, -c * 0.12, c * 0.08, c * 0.24), thin);
      shape(ctx, '#a0582e', () => ctx.ellipse(0, 0, c * 0.36, c * 0.18, 0, 0, Math.PI * 2), line);
      break;
    case 'kegs':
      // Kegs lying on a stand, their taps to the front.
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.06, T + c * 0.12, w - c * 0.12, h - c * 0.24), thin);
      for (let x = L + c * 0.5; x < w / 2; x += c) {
        shape(ctx, tone(WOOD, t), rect(ctx, x - c * 0.3, -c * 0.32, c * 0.6, c * 0.64, c * 0.12), line);
        lines(ctx, '#4a4f55', thin, () => {
          ctx.moveTo(x - c * 0.3, -c * 0.12);
          ctx.lineTo(x + c * 0.3, -c * 0.12);
          ctx.moveTo(x - c * 0.3, c * 0.12);
          ctx.lineTo(x + c * 0.3, c * 0.12);
        });
        shape(ctx, BRASS, rect(ctx, x - c * 0.04, -c * 0.44, c * 0.08, c * 0.12), thin);
      }
      break;
    case 'flour':
      for (const [x, y, r] of [[-0.14, 0.1, 0.22], [0.16, 0.08, 0.2], [0, -0.16, 0.2]] as const) {
        shape(ctx, '#e6dcc2', () => ctx.ellipse(x * c, y * c, r * c, r * c * 0.85, 0, 0, Math.PI * 2), line);
        lines(ctx, '#a89a78', thin, () => (ctx.moveTo(x * c - r * c * 0.4, y * c), ctx.lineTo(x * c + r * c * 0.4, y * c)));
      }
      shape(ctx, 'rgba(255, 255, 255, 0.6)', circle(ctx, c * 0.3, c * 0.3, c * 0.08), 0);
      break;
    case 'dishes':
      // A shelf with plates and bowls.
      shape(ctx, tone(WOOD, 0.5), rect(ctx, L + c * 0.04, T + c * 0.1, w - c * 0.08, c * 0.36), line);
      for (let x = L + c * 0.25; x < w / 2 - c * 0.1; x += c * 0.3) {
        shape(ctx, x % 0.6 > 0.2 ? '#d8d2c2' : '#c9a24a', circle(ctx, x, T + c * 0.28, c * 0.11), thin);
      }
      break;
    case 'washtub':
      shape(ctx, tone(WOOD, 0.3), circle(ctx, 0, 0, c * 0.38), line);
      lines(ctx, '#4a4f55', thin, () => ctx.arc(0, 0, c * 0.3, 0, Math.PI * 2));
      shape(ctx, '#9fc3cc', circle(ctx, 0, 0, c * 0.26), thin);
      shape(ctx, 'rgba(255, 255, 255, 0.7)', circle(ctx, c * 0.08, -c * 0.06, c * 0.06), 0);
      break;
    case 'block':
      // A butcher's block with a cleaver in it.
      shape(ctx, '#8a5f35', circle(ctx, 0, 0, c * 0.34), line);
      lines(ctx, 'rgba(60, 35, 15, 0.5)', thin, () => {
        ctx.arc(0, 0, c * 0.22, 0, Math.PI * 2);
        ctx.moveTo(c * 0.1, 0);
        ctx.arc(0, 0, c * 0.1, 0, Math.PI * 2);
      });
      shape(ctx, '#b9bec4', rect(ctx, -c * 0.06, -c * 0.3, c * 0.22, c * 0.16, c * 0.02), thin);
      shape(ctx, '#5c3d22', rect(ctx, c * 0.02, -c * 0.14, c * 0.06, c * 0.2), thin);
      break;
    case 'hams':
      // Hams and sausages on a rail.
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(L + c * 0.08, T + c * 0.16), ctx.lineTo(w / 2 - c * 0.08, T + c * 0.16)));
      for (let x = L + c * 0.3; x < w / 2 - c * 0.1; x += c * 0.4) {
        shape(ctx, '#9c4a32', () => ctx.ellipse(x, T + c * 0.4, c * 0.12, c * 0.2, 0, 0, Math.PI * 2), thin);
        shape(ctx, '#e8d6b8', circle(ctx, x, T + c * 0.24, c * 0.05), thin);
      }
      break;
    case 'tankards':
      for (const [x, y] of [[-0.18, -0.12], [0.16, -0.1], [0, 0.18]] as const) {
        shape(ctx, '#8d949c', circle(ctx, x * c, y * c, c * 0.13), thin);
        shape(ctx, '#e6c25a', circle(ctx, x * c, y * c, c * 0.09), 0);
        lines(ctx, '#55585e', thin, () => ctx.arc(x * c + c * 0.16, y * c, c * 0.05, -1.2, 1.2));
      }
      break;
    // ---- A ship and a colony ----
    case 'console': {
      shape(ctx, '#3a4048', rect(ctx, L + c * 0.06, T + c * 0.1, w - c * 0.12, h - c * 0.3, c * 0.08), line);
      shape(ctx, '#123238', rect(ctx, L + c * 0.16, T + c * 0.18, w - c * 0.32, c * 0.26, c * 0.04), thin);
      glow(ctx, 0, T + c * 0.31, c * 0.5, 'rgba(95, 211, 201, 0.35)');
      lines(ctx, SCREEN, thin, () => {
        for (let x = L + c * 0.24; x < w / 2 - c * 0.3; x += c * 0.22) (ctx.moveTo(x, T + c * 0.36), ctx.lineTo(x + c * 0.1, T + c * 0.26));
      });
      for (let x = L + c * 0.3; x < w / 2 - c * 0.2; x += c * 0.25) shape(ctx, x % 0.5 > 0.2 ? '#e0523a' : '#e8c14a', circle(ctx, x, h / 2 - c * 0.38, c * 0.04), 0);
      break;
    }
    case 'locker':
      shape(ctx, tone(HULL, t), rect(ctx, -c * 0.34, -c * 0.3, c * 0.68, c * 0.6, c * 0.04), line);
      lines(ctx, 'rgba(20, 20, 25, 0.6)', thin, () => {
        ctx.moveTo(0, -c * 0.3);
        ctx.lineTo(0, c * 0.3);
        for (const y of [-0.18, -0.12]) (ctx.moveTo(-c * 0.26, y * c), ctx.lineTo(-c * 0.08, y * c), ctx.moveTo(c * 0.08, y * c), ctx.lineTo(c * 0.26, y * c));
      });
      break;
    case 'cargo':
      shape(ctx, tone(HULL, t), rect(ctx, -c * 0.4, -c * 0.4, c * 0.8, c * 0.8, c * 0.04), line);
      lines(ctx, 'rgba(20, 20, 25, 0.45)', thin, () => {
        for (let k = -2; k <= 2; k++) (ctx.moveTo(k * c * 0.14, -c * 0.4), ctx.lineTo(k * c * 0.14, c * 0.4));
      });
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.16, -c * 0.08, c * 0.32, c * 0.16), thin);
      rivets(-c * 0.32, -c * 0.32, c * 0.32, c * 0.32);
      break;
    case 'hatch':
      shape(ctx, '#6f7882', circle(ctx, 0, 0, c * 0.42), line);
      shape(ctx, '#55585e', circle(ctx, 0, 0, c * 0.3), thin);
      lines(ctx, '#e8c14a', Math.max(1.5, c / 14), () => {
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2 + Math.PI / 4;
          ctx.moveTo(Math.cos(a) * c * 0.32, Math.sin(a) * c * 0.32);
          ctx.lineTo(Math.cos(a) * c * 0.4, Math.sin(a) * c * 0.4);
        }
      });
      shape(ctx, '#8d949c', circle(ctx, 0, 0, c * 0.1), thin);
      break;
    case 'bunk':
      shape(ctx, '#6f7882', rect(ctx, L + c * 0.08, T + c * 0.04, w - c * 0.16, h - c * 0.08, c * 0.04), line);
      shape(ctx, tone(CLOTH, t), rect(ctx, L + c * 0.14, T + c * 0.36, w - c * 0.28, h - c * 0.46, c * 0.04), thin);
      shape(ctx, '#d6d6cf', rect(ctx, L + c * 0.16, T + c * 0.1, w - c * 0.32, c * 0.22, c * 0.06), thin);
      break;
    case 'terminal':
      shape(ctx, '#3a4048', rect(ctx, -c * 0.3, -c * 0.3, c * 0.6, c * 0.5, c * 0.06), line);
      shape(ctx, '#123238', rect(ctx, -c * 0.22, -c * 0.24, c * 0.44, c * 0.28, c * 0.03), thin);
      glow(ctx, 0, -c * 0.1, c * 0.34, 'rgba(95, 211, 201, 0.4)');
      lines(ctx, SCREEN, thin, () => {
        for (const y of [-0.18, -0.11, -0.04]) (ctx.moveTo(-c * 0.16, y * c), ctx.lineTo(c * 0.12, y * c));
      });
      break;
    case 'holo':
      shape(ctx, '#3a4048', circle(ctx, 0, 0, Math.min(w, h) * 0.42), line);
      shape(ctx, '#1d2a30', circle(ctx, 0, 0, Math.min(w, h) * 0.34), thin);
      glow(ctx, 0, 0, Math.min(w, h) * 0.5, 'rgba(95, 200, 255, 0.45)');
      lines(ctx, '#8fe0ff', thin, () => {
        const r = Math.min(w, h) * 0.24;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.moveTo(-r, 0);
        ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.moveTo(0, -r);
        ctx.ellipse(0, 0, r * 0.4, r, 0, 0, Math.PI * 2);
      });
      break;
    case 'reactor': {
      const r = Math.min(w, h) * 0.44;
      shape(ctx, '#55585e', circle(ctx, 0, 0, r), line);
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        shape(ctx, '#3a4048', rect(ctx, Math.cos(a) * r * 0.82 - c * 0.06, Math.sin(a) * r * 0.82 - c * 0.06, c * 0.12, c * 0.12), thin);
      }
      shape(ctx, '#1d2a30', circle(ctx, 0, 0, r * 0.6), thin);
      glow(ctx, 0, 0, r * 1.1, 'rgba(120, 255, 170, 0.55)');
      shape(ctx, '#b8ffd4', circle(ctx, 0, 0, r * 0.28), thin);
      break;
    }
    case 'pipes':
      // Pipes along the floor, with valves: stretch them along a wall.
      for (const y of [-0.16, 0.16]) {
        shape(ctx, y < 0 ? '#8d949c' : BRASS, rect(ctx, L, y * c - c * 0.09, w, c * 0.18), thin);
      }
      for (let x = L + c * 0.5; x < w / 2; x += c) {
        shape(ctx, '#55585e', rect(ctx, x - c * 0.06, -c * 0.3, c * 0.12, c * 0.6), thin);
        shape(ctx, '#e0523a', circle(ctx, x, -c * 0.16, c * 0.07), thin);
      }
      break;
    case 'rayguns':
      // A rack of ray guns: fins, coils and a brass bell, the way they were dreamt a century ago.
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.06, T + c * 0.12, w - c * 0.12, c * 0.18), line);
      for (let x = L + c * 0.35; x < w / 2 - c * 0.2; x += c * 0.45) {
        shape(ctx, BRASS, () => {
          ctx.moveTo(x - c * 0.07, T + c * 0.3);
          ctx.lineTo(x + c * 0.07, T + c * 0.3);
          ctx.lineTo(x + c * 0.12, h / 2 - c * 0.12);
          ctx.lineTo(x - c * 0.12, h / 2 - c * 0.12);
          ctx.closePath();
        }, thin);
        lines(ctx, '#7a5a2a', thin, () => {
          for (let y = T + c * 0.38; y < h / 2 - c * 0.2; y += c * 0.08) (ctx.moveTo(x - c * 0.08, y), ctx.lineTo(x + c * 0.08, y));
        });
        shape(ctx, '#e0523a', circle(ctx, x, T + c * 0.3, c * 0.05), 0);
      }
      break;
    case 'rover':
      shape(ctx, tone(HULL, t), rect(ctx, L + c * 0.2, T + c * 0.14, w - c * 0.4, h - c * 0.28, c * 0.18), line);
      for (const sx of [-1, 1])
        for (const fy of [0.22, 0.5, 0.78]) shape(ctx, '#2b2a2e', rect(ctx, sx < 0 ? L + c * 0.04 : w / 2 - c * 0.24, T + h * fy - c * 0.18, c * 0.2, c * 0.36, c * 0.06), thin);
      shape(ctx, '#5fa8d3', rect(ctx, L + c * 0.36, T + c * 0.26, w - c * 0.72, c * 0.4, c * 0.12), thin);
      shape(ctx, '#55585e', circle(ctx, 0, h / 2 - c * 0.5, c * 0.14), thin);
      break;
    case 'dish':
      shape(ctx, '#d6d6cf', circle(ctx, 0, 0, c * 0.4), line);
      lines(ctx, '#8d949c', thin, () => {
        ctx.arc(0, 0, c * 0.26, 0, Math.PI * 2);
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI * 2) / 3 - Math.PI / 2;
          ctx.moveTo(Math.cos(a) * c * 0.38, Math.sin(a) * c * 0.38);
          ctx.lineTo(0, 0);
        }
      });
      shape(ctx, '#e0523a', circle(ctx, 0, 0, c * 0.06), thin);
      break;
    case 'solar':
      shape(ctx, '#2c3e66', rect(ctx, L + c * 0.06, T + c * 0.12, w - c * 0.12, h - c * 0.24, c * 0.02), line);
      lines(ctx, '#7f9ac8', thin, () => {
        for (let x = L + c * 0.06 + c * 0.22; x < w / 2 - c * 0.1; x += c * 0.22) (ctx.moveTo(x, T + c * 0.12), ctx.lineTo(x, h / 2 - c * 0.12));
        ctx.moveTo(L + c * 0.06, 0);
        ctx.lineTo(w / 2 - c * 0.06, 0);
      });
      break;
    case 'pod':
      shape(ctx, tone(HULL, t), () => ctx.ellipse(0, 0, w * 0.38, h * 0.44, 0, 0, Math.PI * 2), line);
      shape(ctx, '#5fa8d3', () => ctx.ellipse(0, -h * 0.18, w * 0.2, h * 0.14, 0, 0, Math.PI * 2), thin);
      lines(ctx, 'rgba(20, 20, 25, 0.5)', thin, () => (ctx.moveTo(-w * 0.36, h * 0.06), ctx.lineTo(w * 0.36, h * 0.06)));
      shape(ctx, '#e8c14a', rect(ctx, -c * 0.12, h * 0.2, c * 0.24, c * 0.08), thin);
      break;
    // ---- On the walls: put on a wall cell; the room is below (turn it for another wall) ----
    case 'window':
      shape(ctx, '#5c3d22', rect(ctx, L + c * 0.04, -c * 0.17, w - c * 0.08, c * 0.34), line);
      for (let x = L + c * 0.12; x < w / 2 - c * 0.1; x += c / 2) shape(ctx, '#a9d3e0', rect(ctx, x, -c * 0.09, c * 0.36, c * 0.18), thin);
      lines(ctx, 'rgba(255, 255, 255, 0.8)', thin, () => {
        for (let x = L + c * 0.18; x < w / 2 - c * 0.1; x += c / 2) (ctx.moveTo(x, c * 0.04), ctx.lineTo(x + c * 0.1, -c * 0.05));
      });
      break;
    case 'curtain':
      // Drapes falling into the room, gathered to the sides.
      for (const side of [-1, 1]) {
        shape(ctx, tone(CLOTH, t), () => {
          const x0 = side < 0 ? L + c * 0.04 : w / 2 - c * 0.04;
          const x1 = side < 0 ? L + w * 0.42 : w / 2 - w * 0.42;
          ctx.moveTo(x0, -c * 0.1);
          ctx.lineTo(x1, -c * 0.1);
          ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.4, c * 0.1, x0 + (x1 - x0) * 0.2, c * 0.42);
          ctx.lineTo(x0, c * 0.42);
          ctx.closePath();
        }, thin);
      }
      lines(ctx, BRASS, Math.max(1.5, c / 14), () => (ctx.moveTo(L + c * 0.02, -c * 0.12), ctx.lineTo(w / 2 - c * 0.02, -c * 0.12)));
      break;
    case 'banner':
      lines(ctx, '#5c3d22', Math.max(2, c / 12), () => (ctx.moveTo(-c * 0.34, -c * 0.06), ctx.lineTo(c * 0.34, -c * 0.06)));
      shape(ctx, tone(CLOTH, t), () => {
        ctx.moveTo(-c * 0.24, -c * 0.06);
        ctx.lineTo(c * 0.24, -c * 0.06);
        ctx.lineTo(c * 0.24, c * 0.44);
        ctx.lineTo(0, c * 0.32);
        ctx.lineTo(-c * 0.24, c * 0.44);
        ctx.closePath();
      }, thin);
      shape(ctx, '#d6a84a', circle(ctx, 0, c * 0.14, c * 0.08), thin);
      break;
    case 'painting':
      shape(ctx, '#c9a442', rect(ctx, -c * 0.36, c * 0.04, c * 0.72, c * 0.2, c * 0.02), line);
      shape(ctx, '#4f7a8e', rect(ctx, -c * 0.3, c * 0.08, c * 0.6, c * 0.12), thin);
      shape(ctx, '#7f9a48', rect(ctx, -c * 0.3, c * 0.14, c * 0.6, c * 0.06), 0);
      break;
    case 'trophy':
      // An antlered head on a shield.
      shape(ctx, '#5c3d22', () => ctx.ellipse(0, c * 0.02, c * 0.16, c * 0.1, 0, 0, Math.PI * 2), thin);
      lines(ctx, '#e3d6b4', Math.max(1.5, c / 16), () => {
        for (const sx of [-1, 1]) {
          ctx.moveTo(sx * c * 0.08, c * 0.06);
          ctx.quadraticCurveTo(sx * c * 0.32, c * 0.02, sx * c * 0.4, c * 0.3);
          ctx.moveTo(sx * c * 0.24, c * 0.1);
          ctx.lineTo(sx * c * 0.2, c * 0.28);
        }
      });
      shape(ctx, '#7a5432', () => ctx.ellipse(0, c * 0.2, c * 0.1, c * 0.16, 0, 0, Math.PI * 2), thin);
      break;
    case 'wallshelf':
      shape(ctx, tone(WOOD, 0.4), rect(ctx, L + c * 0.04, c * 0.02, w - c * 0.08, c * 0.22), line);
      for (let x = L + c * 0.14; x < w / 2 - c * 0.12; x += c * 0.12) {
        ctx.fillStyle = CLOTH[Math.floor(((x + w) / c) * 7) % CLOTH.length]!;
        ctx.fillRect(x, c * 0.05, c * 0.09, c * 0.16);
      }
      break;
    case 'beacon':
      shape(ctx, '#55585e', circle(ctx, 0, 0, c * 0.24), line);
      glow(ctx, 0, 0, c * 0.5, 'rgba(255, 70, 50, 0.6)');
      shape(ctx, '#ff5a3c', circle(ctx, 0, 0, c * 0.1), thin);
      break;
  }
}
