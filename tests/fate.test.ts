import { describe, expect, it } from 'vitest';
import initiative from '../src/modules/initiative/main';
import { defeated, ordered, refreshed, woundOf } from '../src/modules/initiative/order';
import type { Combatant, InitiativeState } from '../src/modules/initiative/types';
import { rollFate } from '../src/shared/dice';
import { systemOf } from '../src/systems';
import { ladderText } from '../src/systems/fate/ladder';
import { fateTracker } from '../src/systems/fate/tracker';
import { dndTracker } from '../src/systems/dnd5e/tracker';
import { fromFields } from '../src/systems/tracker';
import { run } from './helpers';

const S0 = initiative.initialState;
const act = (s: InitiativeState, a: string, p?: unknown) => run(initiative, s, a, p);
const fight = (list: Partial<Combatant>[]) => list.reduce((s, c) => act(s, 'add', { c }), S0);
const fateNumbers = (values: Record<string, number | null> = {}) => fromFields(fateTracker.fields, values);

describe('кубы и лестница Fate', () => {
  it('4dF: четыре грани от −1 до +1, итог — сумма и навык', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollFate(3);
      expect(r.faces).toHaveLength(4);
      expect(r.faces.every((f) => f >= -1 && f <= 1)).toBe(true);
      expect(r.total).toBe(r.faces.reduce((a, b) => a + b, 0) + 3);
    }
  });

  it('названия ступеней и числа за краем лестницы', () => {
    expect(ladderText(3)).toBe('Хорошо (+3)');
    expect(ladderText(0)).toBe('Посредственно (0)');
    expect(ladderText(-2)).toBe('Ужасно (−2)');
    expect(ladderText(10)).toBe('+10');
  });
});

describe('трекер системы', () => {
  it('у Fate и D&D свой трекер, неизвестная система — как D&D', () => {
    expect(systemOf('fate-core').tracker).toBe(fateTracker);
    expect(systemOf('dnd5e-2014').tracker).toBe(dndTracker);
    expect(systemOf('нечто').tracker).toBe(dndTracker);
  });

  it('поля Fate: пусто — по две клетки и три последствия, дорожки не затирают друг друга', () => {
    const c = fateNumbers();
    expect(c.stress).toEqual([
      { id: 'physical', boxes: [false, false] },
      { id: 'mental', boxes: [false, false] },
    ]);
    expect(c.consequences!.map((q) => q.shift)).toEqual([2, 4, 6]);
    const mook = fateNumbers({ physical: 1, mental: 0, consequences: 0 });
    expect(mook.stress!.map((t) => t.boxes.length)).toEqual([1, 0]);
    expect(mook.consequences).toEqual([]);
  });

  it('смена числа клеток сохраняет отмеченные', () => {
    const c = { ...fateNumbers(), stress: [{ id: 'physical', boxes: [true, false] }, { id: 'mental', boxes: [false, false] }] } as Combatant;
    const next = fromFields([fateTracker.fields[0]!], { physical: 4 }, c);
    expect(next.stress).toEqual([
      { id: 'physical', boxes: [true, false, false, false] },
      { id: 'mental', boxes: [false, false] },
    ]);
  });

  it('поля D&D: хиты и КД', () => {
    expect(fromFields(dndTracker.fields, { hp: 12, ac: 15 })).toEqual({ maxHp: 12, hp: 12, ac: 15 });
  });

  it('из карточки Fate: навык очерёдности, без хитов', () => {
    const c = fateTracker.fromCard({ hp: null, ac: null, initiative: 3, stress: [{ id: 'physical', boxes: 3 }], consequences: [2] });
    expect(c).toMatchObject({ bonus: 3, maxHp: null, stress: [{ id: 'physical', boxes: [false, false, false] }], consequences: [{ shift: 2, text: '' }] });
  });
});

describe('бой в Fate', () => {
  it('очерёдность NPC — значение навыка без броска, партия не трогается', () => {
    let s = fight([
      { name: 'Громила', bonus: 2 },
      { name: 'Сыщица', bonus: 4, side: 'party' },
    ]);
    s = act(s, 'rollNpcs', { system: 'fate-core' });
    expect(s.combatants.map((c) => c.init)).toEqual([2, null]);
  });

  it('стресс и последствия: отметка, ранение для игроков, вывод из боя', () => {
    let s = fight([{ name: 'Громила', ...fateNumbers() }]);
    const id = s.combatants[0]!.id;
    s = act(s, 'toggleStress', { id, track: 'physical', box: 1 });
    expect(s.combatants[0]!.stress![0]!.boxes).toEqual([false, true]);
    // Всего 1+2 + 1+2 клетки и 2+4+6 последствий = 18; отмечена клетка 2.
    expect(woundOf(s.combatants[0]!)).toBeCloseTo(2 / 18);
    s = act(s, 'setConsequence', { id, index: 1, text: '  Сломанная рука ' });
    expect(s.combatants[0]!.consequences![1]!.text).toBe('Сломанная рука');
    expect(woundOf(s.combatants[0]!)).toBeCloseTo(6 / 18);
    s = act(s, 'update', { id, changes: { out: true } });
    expect(defeated(s.combatants[0]!)).toBe(true);
  });

  it('выведенный пропускает ход', () => {
    let s = fight([
      { name: 'А', init: 5, side: 'party' },
      { name: 'Б', init: 3 },
      { name: 'В', init: 1 },
    ]);
    s = act(s, 'start');
    s = act(s, 'update', { id: ordered(s.combatants)[1]!.id, changes: { out: true } });
    s = act(s, 'next');
    expect(s.combatants.find((c) => c.id === s.turn)!.name).toBe('В');
  });

  it('заготовка в бой — чистый стресс и последствия', () => {
    const c = { ...fateNumbers(), stress: [{ id: 'physical', boxes: [true] }], consequences: [{ shift: 2, text: 'Синяк' }], out: true } as Combatant;
    const r = refreshed(c);
    expect(r.stress![0]!.boxes).toEqual([false]);
    expect(r.consequences![0]!.text).toBe('');
    expect(r.out).toBe(false);
  });
});
