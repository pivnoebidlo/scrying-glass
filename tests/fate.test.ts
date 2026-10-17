import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setLang } from '../src/shared/i18n';

// Labels are checked in Russian.
beforeAll(() => setLang('ru'));
afterAll(() => setLang('en'));
import { readFileSync } from 'node:fs';
import { entryFamily, TYPES, type BuiltinBook } from '../src/shared/compendium';
import initiative from '../src/modules/initiative/main';
import { defeated, ordered, refreshed, woundOf } from '../src/modules/initiative/order';
import type { Combatant, InitiativeState } from '../src/modules/initiative/types';
import { rollFate } from '../src/shared/dice';
import { systemOf } from '../src/systems';
import { ladderText } from '../src/systems/fate/ladder';
import { fateTracker } from '../src/systems/fate/tracker';
import { dndTracker } from '../src/systems/dnd5e/tracker';
import { fromFields } from '../src/systems/tracker';
import { blankStats, consequencesOf, DEFAULT_SKILLS, pyramid, stressOf, type FateStats } from '../src/systems/fate/stats';
import { run } from './helpers';
import fate from '../src/modules/fate/main';
import type { FateState } from '../src/modules/fate/types';

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

describe('карточка Fate', () => {
  const card = (over: Partial<FateStats> = {}): FateStats => ({ ...blankStats('npc'), ...over });

  it('стресс по Телосложению и Воле, последствия по важности', () => {
    const s = card({ skills: [{ name: 'Телосложение', rating: 3 }, { name: 'Воля', rating: 1 }] });
    expect(stressOf(s)).toEqual([{ id: 'physical', boxes: 4 }, { id: 'mental', boxes: 3 }]);
    expect(consequencesOf(s)).toEqual([2, 4, 6]);
    expect(consequencesOf(card({ skills: [{ name: 'Will', rating: 5 }] }))).toEqual([2, 4, 6, 2]);
    expect(consequencesOf(card({ tier: 'supporting' }))).toEqual([2, 4]);
  });

  it('безымянный NPC: клетки по лучшему навыку, без последствий', () => {
    const s = card({ tier: 'nameless', skills: [{ name: 'Драка', rating: 2 }] });
    expect(stressOf(s)).toEqual([{ id: 'physical', boxes: 1 }]);
    expect(consequencesOf(s)).toEqual([]);
  });

  it('заданные вручную стресс и последствия важнее правил', () => {
    const s = card({ stress: [{ id: 'physical', boxes: 1 }], consequences: [2] });
    expect(stressOf(s)).toEqual([{ id: 'physical', boxes: 1 }]);
    expect(consequencesOf(s)).toEqual([2]);
  });

  it('очерёдность — Внимательность или выбранный навык; в бой — через систему', () => {
    const s = card({ skills: [{ name: 'Внимательность', rating: 2 }, { name: 'Эмпатия', rating: 4 }] });
    expect(systemOf('fate-core').combat(s).initiative).toBe(2);
    expect(systemOf('fate-core').combat({ ...s, initiativeSkill: 'эмпатия' }).initiative).toBe(4);
    const c = fateTracker.fromCard(systemOf('fate-core').combat(s));
    expect(c.bonus).toBe(2);
    expect(c.stress!.map((t) => t.boxes.length)).toEqual([2, 2]);
  });

  it('пирамида навыков — ступенями сверху вниз; строка под названием — концепция', () => {
    const s = card({ highConcept: 'Сыщица', skills: [{ name: 'А', rating: 1 }, { name: 'Б', rating: 3 }, { name: 'В', rating: 1 }] });
    expect(pyramid(s).map(([r, l]) => [r, l.map((x) => x.name)])).toEqual([[3, ['Б']], [1, ['А', 'В']]]);
    expect(systemOf('fate-core').subtitle(s, 'ru')).toBe('Сыщица');
    expect(systemOf('fate-core').subtitle(card(), 'ru')).toBe('Главный');
  });
});

describe('аспекты сцены и жетоны судьбы', () => {
  const F0 = fate.initialState;
  const fa = (s: FateState, a: string, p?: unknown) => run(fate, s, a, p);

  it('аспект: пустой не добавляется, призывы от 0 до 9, скрытый — по флагу', () => {
    let s = fa(F0, 'addAspect', { text: '  ' });
    expect(s.aspects).toEqual([]);
    s = fa(s, 'addAspect', { text: ' Горящий склад ', hidden: true });
    const id = s.aspects[0]!.id;
    expect(s.aspects[0]).toMatchObject({ text: 'Горящий склад', invokes: 0, hidden: true });
    s = fa(s, 'updateAspect', { id, changes: { invokes: 15, text: ' ' } });
    expect(s.aspects[0]).toMatchObject({ text: 'Горящий склад', invokes: 9 });
    s = fa(s, 'updateAspect', { id, changes: { invokes: -1 } });
    expect(s.aspects[0]!.invokes).toBe(0);
  });

  it('жетоны: партия без повторов, новая сессия — до восстановления, мастер — по жетону на персонажа', () => {
    const ref = { scope: 'vault' as const, id: 'a' };
    let s = fa(F0, 'addHolders', { list: [{ name: 'Сыщица', portrait: null, card: ref, refresh: 3 }] });
    s = fa(s, 'addHolders', { list: [{ name: 'Сыщица Мор', portrait: 'p.png', card: ref, refresh: 2 }, { name: 'Громила', portrait: null, refresh: 1 }] });
    expect(s.holders.map((h) => [h.name, h.points, h.refresh])).toEqual([['Сыщица Мор', 3, 2], ['Громила', 1, 1]]);
    const [a, b] = s.holders;
    s = fa(s, 'points', { id: a!.id, delta: -3 });
    s = fa(s, 'points', { id: b!.id, delta: 4 });
    s = fa(s, 'newSession');
    expect(s.holders.map((h) => h.points)).toEqual([2, 5]);
    s = fa(s, 'newScene');
    expect(s.gm).toBe(2);
    s = fa(s, 'gm', { delta: -5 });
    expect(s.gm).toBe(0);
  });
});

describe('углы аспектов и жетонов', () => {
  it('по умолчанию — слева и справа внизу; неизвестный угол не принимается; старое сохранение дополняется', () => {
    let s = fate.initialState;
    expect(s.place).toEqual({ aspects: 'bottom-left', points: 'bottom-right' });
    s = run(fate, s, 'setPlace', { aspects: 'top-right', points: 'середина' });
    expect(s.place).toEqual({ aspects: 'top-right', points: 'bottom-right' });
    const old = { ...fate.initialState, place: undefined } as unknown as FateState;
    expect(fate.init!(old, {} as never).place).toEqual(fate.initialState.place);
  });
});

describe('встроенный справочник Fate', () => {
  const book = JSON.parse(readFileSync(new URL('../resources/compendium/fate-core.json', import.meta.url), 'utf8')) as BuiltinBook;

  it('навыки — те же, что в карточке Fate; типы записей известны и привязаны к Fate или общие', () => {
    expect(book.system).toBe('fate-core');
    const skills = book.entries.filter((e) => e.type === 'skill');
    expect(skills.map((e) => e.title).sort()).toEqual([...DEFAULT_SKILLS['ru']!].sort());
    expect(skills.map((e) => e.en).sort()).toEqual([...DEFAULT_SKILLS['en']!].sort());
    for (const e of book.entries) {
      expect(TYPES[e.type], e.title).toBeDefined();
      expect([null, 'fate']).toContain(entryFamily(e));
    }
  });
});
