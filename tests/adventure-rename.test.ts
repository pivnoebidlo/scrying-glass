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

import { isSupplement, missingFolders, placeTitle, visibleIn, type AdventuresState } from '../src/shared/adventures';
import type { VaultFolder } from '../src/shared/vault';

describe('supplements', () => {
  const adv: AdventuresState = { list: ['Страд', 'Мои монстры', 'Чужие монстры'], current: 'Страд', initialized: true, supplements: { 'Мои монстры': 'bestiary', 'Чужие монстры': 'collection' }, uses: { Страд: ['Мои монстры'] } };

  it('an adventure sees the supplements it uses, not the others', () => {
    expect(isSupplement(adv, 'Мои монстры')).toBe(true);
    expect(isSupplement(adv, 'Страд')).toBe(false);
    expect(visibleIn(adv, 'Мои монстры/monsters/огр.json')).toBe(true);
    expect(visibleIn(adv, 'Чужие монстры/monsters/гоблин.json')).toBe(false);
    expect(visibleIn({ ...adv, current: 'Мои монстры' }, 'Страд/monsters/x.json')).toBe(false);
    expect(placeTitle(adv, 'Мои монстры/monsters', 'Хранилище')).toBe('Мои монстры / monsters');
  });

  it('a supplement gets its monsters and compendium folders', () => {
    const empty: VaultFolder = { path: 'Мои монстры', name: 'Мои монстры', folders: [], files: [] };
    expect(missingFolders(empty, true)).toEqual(['monsters', 'compendium']);
    expect(missingFolders(empty).length).toBeGreaterThan(1);
  });
});
