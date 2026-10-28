import { describe, expect, it } from 'vitest';
import adventures from '../src/modules/adventures/main';
import { recentAdventures, renameAdventurePaths, type AdventuresState } from '../src/shared/adventures';
import { ctx, run, tree } from './helpers';

const base: AdventuresState = {
  list: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Monsters'],
  current: null,
  initialized: true,
  supplements: { Monsters: 'bestiary' },
};

describe('recent adventures', () => {
  it('opening puts the adventure first; supplements and the whole vault are not kept', () => {
    let s = run(adventures, base, 'select', { path: 'C' });
    s = run(adventures, s, 'select', { path: 'F' });
    s = run(adventures, s, 'select', { path: 'C' });
    s = run(adventures, s, 'select', { path: 'Monsters' });
    s = run(adventures, s, 'select', { path: null });
    expect(s.recent).toEqual(['C', 'F']);
  });

  it('the switcher: current first (even a supplement), then recent, then the rest by name — five of them', () => {
    const s = { ...base, current: 'Monsters', recent: ['F', 'G'] };
    expect(recentAdventures(s)).toEqual(['Monsters', 'F', 'G', 'A', 'B']);
    expect(recentAdventures({ ...base, current: 'B', recent: ['F', 'B'] })).toEqual(['B', 'F', 'A', 'C', 'D']);
    expect(recentAdventures(base)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('a folder that is no longer an adventure leaves the list; renaming moves it', () => {
    const s = run(adventures, { ...base, recent: ['F', 'A'] }, 'unmark', { path: 'F' });
    expect(s.recent).toEqual(['A']);
    const t = adventures.onTreeChange!({ ...base, recent: ['F', 'A'] }, ctx(tree(['A/maps/x.png'])));
    expect(t.recent).toEqual(['A']);
    expect(renameAdventurePaths({ ...base, recent: ['F', 'A'] }, 'F', 'Ф').recent).toEqual(['Ф', 'A']);
  });
});
