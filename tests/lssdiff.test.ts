import { describe, expect, it } from 'vitest';
import type { Dnd5eCharacter } from '../src/systems/dnd5e/character';
import { characterDiff, isEmptyDiff } from '../src/systems/dnd5e/diff';

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
    expect(d.changes).toEqual(
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
    expect(list('Атаки')).toEqual({ label: 'Атаки', added: ['Короткий меч · +5 · 1d6+3'], removed: ['Кинжал · +5 · 1d4+3'] });
    expect(list('Снаряжение')).toEqual({ label: 'Снаряжение', added: ['Верёвка'], removed: [] });
    expect(list('Навыки')!.removed).toHaveLength(1);
    expect(list('Заклинания 1-го круга')!.added).toEqual(['Маскировка', 'Щит']);
  });
});
