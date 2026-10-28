import { describe, expect, it } from 'vitest';
import { build } from '../src/modules/tools/build/rules';

describe('Mausritter constructions', () => {
  it('materials per cube, upkeep 1% a month', () => {
    const r = build([{ room: 'tunnel', cubes: 4 }, { room: 'standard', cubes: 2 }, { room: 'grand', cubes: 1 }], 3);
    expect(r.materials).toBe(40 + 1000 + 2000);
    expect(r.upkeep).toBe(31);
  });

  it('three diggers dig a cube of soil a day, other materials take twice as long; 5p a day each', () => {
    expect(build([{ room: 'poor', cubes: 5 }], 3)).toMatchObject({ days: 5, wages: 75 });
    expect(build([{ room: 'poor', cubes: 5, hard: true }], 3)).toMatchObject({ days: 10, wages: 150 });
    expect(build([{ room: 'poor', cubes: 5 }], 6)).toMatchObject({ days: 3, wages: 90 });
    expect(build([{ room: 'poor', cubes: 1 }], 1)).toMatchObject({ days: 3, wages: 15 });
    expect(build([{ room: 'poor', cubes: 2 }], 0)).toMatchObject({ days: 0, wages: 0, total: 200 });
  });
});
