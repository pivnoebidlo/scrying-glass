import { describe, expect, it } from 'vitest';
import { renameAdventurePaths } from '../src/shared/adventures';

describe('renaming an adventure', () => {
  it('paths, keys and the name as a value move; texts stay', () => {
    const state = {
      adventures: { list: ['Страд', 'Другое'], current: 'Страд', systems: { Страд: 'dnd5e-2024', '': 'fate-core' } },
      scenes: [{ id: 's', name: 'Страд', adventure: 'Страд', map: { path: 'Страд/maps/замок.png' } }],
      maps: { 'Страд/maps/замок.png': { pins: [] } },
      order: { 'monsters:Страд/monsters': ['Страд/monsters/a.json'], 'Другое/x': ['Другое/x/b.png'] },
      repo: { published: { Страд: { id: 'abc', version: 2 } } },
      byAdventure: { Страд: { factions: [] } },
      strange: { title: 'Страдание', other: 'Страд2/x' },
    };
    const out = renameAdventurePaths(state, 'Страд', 'Проклятие Страда');
    expect(out.adventures).toEqual({ list: ['Проклятие Страда', 'Другое'], current: 'Проклятие Страда', systems: { 'Проклятие Страда': 'dnd5e-2024', '': 'fate-core' } });
    expect(out.scenes[0]).toEqual({ id: 's', name: 'Страд', adventure: 'Проклятие Страда', map: { path: 'Проклятие Страда/maps/замок.png' } });
    expect(Object.keys(out.maps)).toEqual(['Проклятие Страда/maps/замок.png']);
    expect(out.order).toEqual({ 'monsters:Проклятие Страда/monsters': ['Проклятие Страда/monsters/a.json'], 'Другое/x': ['Другое/x/b.png'] });
    expect(out.repo.published).toEqual({ 'Проклятие Страда': { id: 'abc', version: 2 } });
    expect(Object.keys(out.byAdventure)).toEqual(['Проклятие Страда']);
    expect(out.strange).toEqual({ title: 'Страдание', other: 'Страд2/x' });
  });
});
