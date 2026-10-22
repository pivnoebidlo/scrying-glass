import { describe, expect, it } from 'vitest';
import clocks from '../src/modules/clocks/main';
import { clockWedges } from '../src/modules/clocks/draw';
import type { ClocksState } from '../src/modules/clocks/types';
import { run } from './helpers';

const act = (s: ClocksState, a: string, p?: unknown) => run(clocks, s, a, p);
const S0 = clocks.initialState;

describe('progress clocks', () => {
  it('belong to their adventure and tick within their segments', () => {
    let s = act(S0, 'add', { adventure: 'Strahd', title: '  The guards raise the alarm ', segments: 6 });
    s = act(s, 'add', { adventure: null, title: 'Winter comes', segments: 99, tone: 'progress' });
    const [c] = s.byAdventure['Strahd']!;
    expect(c).toMatchObject({ title: 'The guards raise the alarm', segments: 6, filled: 0, tone: 'danger', shown: true });
    expect(s.byAdventure['']![0]).toMatchObject({ segments: 12, tone: 'progress' });

    s = act(s, 'tick', { adventure: 'Strahd', id: c!.id, by: 1 });
    s = act(s, 'tick', { adventure: 'Strahd', id: c!.id, by: 10 });
    expect(s.byAdventure['Strahd']![0]!.filled).toBe(6);
    s = act(s, 'tick', { adventure: 'Strahd', id: c!.id, by: -9 });
    expect(s.byAdventure['Strahd']![0]!.filled).toBe(0);
  });

  it('fewer segments cut the filled ones; a blank title keeps the old one', () => {
    let s = act(S0, 'add', { adventure: null, title: 'Ritual', segments: 8 });
    const id = s.byAdventure['']![0]!.id;
    s = act(s, 'update', { adventure: null, id, changes: { filled: 7 } });
    s = act(s, 'update', { adventure: null, id, changes: { segments: 4, title: '  ', shown: false } });
    expect(s.byAdventure['']![0]).toMatchObject({ title: 'Ritual', segments: 4, filled: 4, shown: false });
    s = act(s, 'remove', { adventure: null, id });
    expect(s.byAdventure['']).toEqual([]);
  });

  it('draws a wedge per filled segment, a whole circle when full', () => {
    expect(clockWedges(6, 0)).toHaveLength(0);
    expect(clockWedges(6, 2)).toHaveLength(2);
    expect(clockWedges(4, 4)).toHaveLength(1);
  });
});
