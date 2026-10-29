import { afterEach, describe, expect, it } from 'vitest';
import { adventureHidden, currentSystem, inCurrentFamily, shownAdventures, systemFor, visibleIn, type AdventuresState } from '../src/shared/adventures';
import { scenesFor, type ScenesState } from '../src/modules/scenes/types';
import { entryFamily, parseEntry } from '../src/shared/compendium';
import { LEGACY_SYSTEM, enabledSystems, familyOf, isDnd, setSystemsOff, systems } from '../src/systems';
import { readFileSync } from 'node:fs';
import { validatePack, type SystemPack } from '../src/shared/syspack';
import { registerPacks } from '../src/systems/packs';

// Fate Core is a system pack: registered as the app does with an installed one.
registerPacks([validatePack(JSON.parse(readFileSync(new URL('../samples/systems/fate-core.json', import.meta.url), 'utf8'))) as SystemPack]);

const adv = (systems: Record<string, string> | undefined, current: string | null): AdventuresState => ({
  list: ['Страд', 'Дрезден'],
  current,
  initialized: true,
  systems,
});

describe('система приключения', () => {
  it('своя, иначе — хранилища, иначе — по умолчанию', () => {
    expect(currentSystem(adv(undefined, 'Страд'))).toBe(LEGACY_SYSTEM);
    expect(currentSystem(adv({ '': 'fate-core' }, 'Страд'))).toBe('fate-core');
    expect(currentSystem(adv({ '': 'fate-core', Страд: 'dnd5e-2014' }, 'Страд'))).toBe('dnd5e-2014');
    expect(currentSystem(adv({ Страд: 'dnd5e-2014' }, null))).toBe(LEGACY_SYSTEM);
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

describe('отключённые системы', () => {
  afterEach(() => setSystemsOff([]));

  it('не предлагаются; все сразу отключить нельзя, неизвестные id отбрасываются', () => {
    expect(setSystemsOff(['dnd5e-2014', 'нечто'])).toEqual(['dnd5e-2014']);
    expect(enabledSystems().map((s) => s.id)).not.toContain('dnd5e-2014');
    expect(setSystemsOff(systems.map((s) => s.id))).toEqual([]);
  });

  it('по умолчанию — первая включённая, если обычная отключена', () => {
    setSystemsOff(['dnd5e-2024']);
    expect(currentSystem(adv(undefined, null))).toBe('dnd5e-2014');
    // Выбранная явно система остаётся, даже отключённая.
    expect(systemFor(adv({ Страд: 'dnd5e-2024' }, null), 'Страд')).toBe('dnd5e-2024');
  });

  it('карточки отключённой системы скрыты всегда', () => {
    setSystemsOff(['dnd5e-2014']);
    expect(inCurrentFamily(adv({ Страд: 'dnd5e-2024' }, 'Страд'), 'dnd5e-2014')).toBe(false);
    expect(inCurrentFamily(adv({ Страд: 'dnd5e-2024' }, 'Страд'), 'dnd5e-2024')).toBe(true);
  });

  it('приключение отключённой системы скрыто вместе с папками, сценами и заготовками', () => {
    setSystemsOff(['dnd5e-2024', 'dnd5e-2014']);
    const a = adv({ Страд: 'dnd5e-2024', Дрезден: 'fate-core' }, null);
    expect(adventureHidden(a, 'Страд')).toBe(true);
    // Обычная папка — не приключение, не скрывается.
    expect(adventureHidden(a, 'maps')).toBe(false);
    expect(shownAdventures(a)).toEqual(['Дрезден']);
    expect(visibleIn(a, 'Страд/monsters/x.json')).toBe(false);
    expect(visibleIn(a, 'Дрезден/monsters/x.json')).toBe(true);
    expect(visibleIn(a, 'monsters/x.json')).toBe(true);
    const scenes = { scenes: [{ adventure: 'Страд' }, { adventure: 'Дрезден' }, { adventure: null }] } as unknown as ScenesState;
    expect(scenesFor(scenes, a).map((x) => x.adventure)).toEqual(['Дрезден', null]);
  });

  it('приключение без своей системы — D&D по умолчанию: отключили D&D — оно скрыто, хранилище берёт включённую', () => {
    setSystemsOff(['dnd5e-2024', 'dnd5e-2014']);
    const a = adv(undefined, null);
    expect(adventureHidden(a, 'Страд')).toBe(true);
    // The first system turned on (the order of the list: built-in ones, then packs).
    expect(currentSystem(a)).toBe(enabledSystems()[0]!.id);
    expect(isDnd(currentSystem(a))).toBe(false);
    // Система хранилища наследуется приключениями без своей.
    expect(adventureHidden(adv({ '': 'fate-core' }, null), 'Страд')).toBe(false);
  });
});
