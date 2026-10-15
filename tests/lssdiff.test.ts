import { describe, expect, it } from 'vitest';
import type { Dnd5eCharacter } from '../src/systems/dnd5e/character';
import { allIds, characterDiff, isEmptyDiff, lineId, mergeCharacter } from '../src/systems/dnd5e/diff';
import { fromLss } from '../src/systems/dnd5e/lss';

const base: Dnd5eCharacter = {
  classes: [{ name: 'Плут', level: 3 }],
  race: 'Полурослик',
  background: 'Беспризорник',
  alignment: 'хаотично-добрый',
  abilities: { str: 8, dex: 16, con: 14, int: 12, wis: 10, cha: 13 },
  saves: ['dex', 'int'],
  skills: { stealth: 2, perception: 1 },
  ac: 14,
  hpMax: 21,
  speed: 25,
  attacks: [{ name: 'Кинжал', bonus: '+5', damage: '1d4+3' }],
  text: { equipment: '- Кожаный доспех\n- Воровские инструменты' },
};

describe('что изменилось в листе персонажа', () => {
  it('без изменений — пусто', () => {
    expect(isEmptyDiff(characterDiff(base, structuredClone(base)))).toBe(true);
  });

  it('значения: было → стало; уровень, характеристики, хиты', () => {
    const next = { ...structuredClone(base), classes: [{ name: 'Плут', level: 4 }], abilities: { ...base.abilities, dex: 18 }, hpMax: 27 };
    const d = characterDiff(base, next);
    expect(d.changes.map(({ label, before, after }) => ({ label, before, after }))).toEqual(
      expect.arrayContaining([
        { label: 'Класс и уровень', before: 'Плут 3', after: 'Плут 4' },
        { label: 'ЛОВ', before: '16', after: '18' },
        { label: 'Хиты', before: '21', after: '27' },
      ])
    );
  });

  it('списки: что добавилось и что пропало; разметка списков не считается изменением', () => {
    const next: Dnd5eCharacter = {
      ...structuredClone(base),
      skills: { stealth: 1, acrobatics: 1, perception: 1 },
      attacks: [{ name: 'Короткий меч', bonus: '+5', damage: '1d6+3' }],
      text: { equipment: 'Кожаный доспех\nВоровские инструменты\n- Верёвка' },
      spellcasting: { ability: 'int', slots: { 1: 2 }, spells: { 1: 'Маскировка, Щит' } },
    };
    const d = characterDiff(base, next);
    const list = (label: string) => d.lists.find((l) => l.label === label);
    expect(list('Атаки')).toMatchObject({ added: ['Короткий меч · +5 · 1d6+3'], removed: ['Кинжал · +5 · 1d4+3'] });
    expect(list('Снаряжение')).toMatchObject({ added: ['Верёвка'], removed: [] });
    expect(list('Навыки')!.removed).toHaveLength(1);
    expect(list('Заклинания 1-го круга')!.added).toEqual(['Маскировка', 'Щит']);
  });
});

describe('слияние, как в git', () => {
  const next: Dnd5eCharacter = {
    ...structuredClone(base),
    classes: [{ name: 'Плут', level: 4 }],
    hpMax: 27,
    abilities: { ...base.abilities, dex: 18 },
    attacks: [{ name: 'Короткий меч', bonus: '+5', damage: '1d6+3' }],
    skills: { stealth: 2, perception: 1, acrobatics: 1 },
    text: { equipment: '- Кожаный доспех\n- Верёвка' },
    spellcasting: { ability: 'int', slots: { 1: 2 }, spells: { 1: 'Маскировка, Щит' } },
  };
  const d = characterDiff(base, next);

  it('всё принято — получается новая версия', () => {
    const m = mergeCharacter(base, d, new Set(allIds(d)));
    expect(m).toEqual(next);
  });

  it('ничего не принято — остаётся прежняя', () => {
    expect(mergeCharacter(base, d, new Set())).toEqual(base);
  });

  it('по пунктам: уровень и меч — да, хиты — нет; верёвку добавить, инструменты не убирать; одно заклинание из двух', () => {
    const atk = d.lists.find((l) => l.id === 'attacks')!;
    const eq = d.lists.find((l) => l.id === 'text.equipment')!;
    const sp = d.lists.find((l) => l.id === 'spellcasting.spells.1')!;
    const m = mergeCharacter(
      base,
      d,
      new Set([
        'classes',
        'spellcasting.ability',
        'spellcasting.slots.1',
        lineId(atk, true, 'Короткий меч · +5 · 1d6+3'),
        lineId(eq, true, 'Верёвка'),
        lineId(sp, true, 'Щит'),
      ])
    );
    expect(m.classes[0]!.level).toBe(4);
    expect(m.hpMax).toBe(21);
    expect(m.abilities.dex).toBe(16);
    // Кинжал не убирали — остаётся, меч добавился.
    expect(m.attacks.map((x) => x.name)).toEqual(['Кинжал', 'Короткий меч']);
    expect(m.text.equipment).toBe('- Кожаный доспех\n- Воровские инструменты\n- Верёвка');
    expect(m.spellcasting).toEqual({ ability: 'int', slots: { 1: 2 }, spells: { 1: 'Щит' } });
    expect(m.skills).toEqual(base.skills);
  });
});

describe('экспорт LSS: заклинания-карточки', () => {
  it('в экспорте только номера заклинаний — предупреждение, без названий', () => {
    const r = fromLss({ data: JSON.stringify({ name: { value: 'Флей' } }), edition: '2024', spells: { mode: 'cards', prepared: ['a1', 'b2'], book: [] } });
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain('(2)');
    expect(r.stats.spellcasting).toBeUndefined();
  });
});
