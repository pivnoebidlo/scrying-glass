import { describe, expect, it } from 'vitest';
import { partyBudget, rate } from '../src/systems/dnd5e/difficulty';
import { analyze } from '../src/systems/dnd5e/encounter/analyze';
import type { Combatant } from '../src/modules/initiative/types';

const c = (name: string, side: Combatant['side'], card?: string) => ({ name, side, card: card ? { scope: 'vault', id: card } : null }) as Combatant;

describe('бюджет сложности (правила 2024)', () => {
  it('сумма бюджетов героев по уровням', () => {
    expect(partyBudget([1, 1, 1, 1])).toEqual({ low: 200, moderate: 300, high: 400 });
    expect(partyBudget([5, 3])).toEqual({ low: 650, moderate: 975, high: 1500 });
    // Уровни вне 1–20 прижимаются к краям.
    expect(partyBudget([0, 25])).toEqual(partyBudget([1, 20]));
  });

  it('оценка по опыту противников', () => {
    const b = partyBudget([1, 1, 1, 1]); // 200 / 300 / 400
    expect([50, 100, 200, 250, 300, 400, 401].map((x) => rate(x, b))).toEqual(['trivial', 'low', 'low', 'moderate', 'moderate', 'high', 'beyond']);
  });
});

describe('сложность боя', () => {
  const cards: Record<string, { level?: number; xp?: number }> = { pal: { level: 3 }, gob: { xp: 50 }, boss: { xp: 200 } };
  const info = (x: Combatant) => (x.card ? cards[x.card.id] : undefined);
  const fallback = { size: 4, level: 2 };

  it('партия из боя; герой без листа — уровень из настройки; союзники не считаются', () => {
    const a = analyze([c('Паладин', 'party', 'pal'), c('Бард', 'party'), c('Гоблин', 'enemy', 'gob'), c('Гоблин', 'enemy', 'gob'), c('Стражник', 'ally', 'gob')], info, [], fallback);
    expect(a.partyFrom).toBe('fight');
    expect(a.levels).toEqual([3, 2]);
    expect(a.xp).toBe(100);
    expect(a.heroes[1]!.level).toBeNull();
    // Тот же бард есть среди листов приключения — уровень берётся оттуда.
    expect(analyze([c('Бард', 'party'), c('Гоблин', 'enemy', 'gob')], info, [{ name: 'бард', level: 4 }], fallback).levels).toEqual([4]);
  });

  it('заготовка без героев — партия приключения, без неё — из настройки; противник без карточки отмечается', () => {
    const list = [c('Вождь', 'enemy', 'boss'), c('Кто-то', 'enemy')];
    const adv = analyze(list, info, [{ name: 'Амадеус', level: 5 }], fallback);
    expect([adv.partyFrom, adv.levels, adv.unknown]).toEqual(['adventure', [5], ['Кто-то']]);
    const none = analyze(list, info, [], fallback);
    expect([none.partyFrom, none.levels]).toEqual(['settings', [2, 2, 2, 2]]);
    // 200 ОО при бюджете 400 / 600 / 800 — в пределах низкой.
    expect(none.rating).toBe('low');
  });
});
