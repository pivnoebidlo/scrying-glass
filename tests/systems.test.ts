import { describe, expect, it } from 'vitest';
import { currentSystem, inCurrentFamily, systemFor, type AdventuresState } from '../src/shared/adventures';
import { entryFamily, parseEntry } from '../src/shared/compendium';
import { DEFAULT_SYSTEM, familyOf, isDnd } from '../src/systems';

const adv = (systems: Record<string, string> | undefined, current: string | null): AdventuresState => ({
  list: ['Страд', 'Дрезден'],
  current,
  initialized: true,
  systems,
});

describe('система приключения', () => {
  it('своя, иначе — хранилища, иначе — по умолчанию', () => {
    expect(currentSystem(adv(undefined, 'Страд'))).toBe(DEFAULT_SYSTEM);
    expect(currentSystem(adv({ '': 'fate-core' }, 'Страд'))).toBe('fate-core');
    expect(currentSystem(adv({ '': 'fate-core', Страд: 'dnd5e-2014' }, 'Страд'))).toBe('dnd5e-2014');
    expect(currentSystem(adv({ Страд: 'dnd5e-2014' }, null))).toBe(DEFAULT_SYSTEM);
    expect(systemFor(adv({ Дрезден: 'fate-core' }, 'Страд'), 'Дрезден')).toBe('fate-core');
  });

  it('семейство: редакции D&D вместе, Fate отдельно; неизвестная система — сама себе семейство', () => {
    const dnd = adv({ Страд: 'dnd5e-2024' }, 'Страд');
    expect(inCurrentFamily(dnd, 'dnd5e-2014')).toBe(true);
    expect(inCurrentFamily(dnd, 'fate-core')).toBe(false);
    expect(inCurrentFamily(adv({ Страд: 'fate-core' }, 'Страд'), 'fate-core')).toBe(true);
    expect(familyOf('pf2e')).toBe('pf2e');
    expect(isDnd('dnd5e-2014') && !isDnd('fate-core')).toBe(true);
  });
});

describe('система записи справочника', () => {
  it('поле system важнее типа; правила и заметки — для любой системы', () => {
    expect(entryFamily(parseEntry('---\ntype: spell\n---\n', 'Огненный шар'))).toBe('dnd5e');
    expect(entryFamily(parseEntry('---\ntype: rule\n---\n', 'Отдых'))).toBeNull();
    expect(entryFamily(parseEntry('---\ntype: rule\nsystem: fate-core\n---\n', 'Конфликт'))).toBe('fate');
    expect(entryFamily(parseEntry('---\ntype: note\nsystem: fate\n---\n', 'Аспекты'))).toBe('fate');
  });
});
