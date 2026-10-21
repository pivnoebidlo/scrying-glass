import { describe, expect, it } from 'vitest';
import maps from '../src/modules/maps/main';
import { hexCenters, hexCorners, nearestHex, periodOf, stepOf } from '../src/modules/maps/grid';
import { snap } from '../src/modules/maps/tokens';
import { dataOf } from '../src/modules/maps/data';
import type { Grid, MapsState } from '../src/modules/maps/types';
import { run } from './helpers';

const img = { w: 1000, h: 800 };
const pointy: Grid = { on: true, cells: 20, shape: 'hex-pointy' };
const flat: Grid = { on: true, cells: 20, shape: 'hex-flat' };
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe('hex grid', () => {
  it('the step and the period: one step across neighbours, √3 steps for the staggered axis', () => {
    expect(stepOf(pointy, img.w)).toBe(50);
    close(periodOf(pointy, img.w).py, 50 * Math.sqrt(3));
    close(periodOf(flat, img.w).px, 50 * Math.sqrt(3));
    expect(periodOf({ on: true, cells: 20 }, img.w)).toEqual({ px: 50, py: 50 });
  });

  it('neighbouring centres are one step apart; a corner is step/√3 from the centre', () => {
    for (const g of [pointy, flat]) {
      const cs = hexCenters(g, img);
      const c = cs.find((p) => p.x > 300 && p.y > 300)!;
      const near = cs.filter((p) => p !== c).map((p) => Math.hypot(p.x - c.x, p.y - c.y)).sort((a, b) => a - b);
      for (const d of near.slice(0, 6)) close(d, 50);
      for (const p of hexCorners(c, g, img.w)) close(Math.hypot(p.x - c.x, p.y - c.y), 50 / Math.sqrt(3));
    }
  });

  it('the hexes cover the whole map', () => {
    const cs = hexCenters(pointy, img);
    for (const [x, y] of [[0, 0], [999, 799], [500, 400], [0, 799]] as const) {
      const d = Math.min(...cs.map((c) => Math.hypot(c.x - x, c.y - y)));
      expect(d).toBeLessThanOrEqual(50 / Math.sqrt(3) + 1e-9);
    }
  });

  it('a point goes to the centre of its hex; tokens snap there whatever their size', () => {
    const cs = hexCenters(flat, img);
    const c = cs.find((p) => p.x > 400 && p.y > 300)!;
    expect(nearestHex(c.x + 10, c.y - 12, flat, img)).toEqual(c);
    const s = snap((c.x + 5) / img.w, (c.y + 5) / img.h, 2, flat, img);
    close(s.x * img.w, c.x);
    close(s.y * img.h, c.y);
  });

  it('the offset moves the centres by a fraction of the period', () => {
    const shifted: Grid = { ...pointy, ox: 0.5, oy: 0.5 };
    const a = nearestHex(0, 0, pointy, img);
    const b = nearestHex(25, 25 * Math.sqrt(3), shifted, img);
    close(b.x - a.x, 25);
    close(b.y - a.y, 25 * Math.sqrt(3));
  });

  it('setGrid keeps a known shape only', () => {
    const P = 'a/maps/x.png';
    let s = run(maps, maps.initialState as MapsState, 'setGrid', { path: P, grid: { shape: 'hex-flat' } });
    expect(dataOf(s, P).grid.shape).toBe('hex-flat');
    s = run(maps, s, 'setGrid', { path: P, grid: { shape: 'triangles' } });
    expect(dataOf(s, P).grid.shape).toBe('square');
  });
});
