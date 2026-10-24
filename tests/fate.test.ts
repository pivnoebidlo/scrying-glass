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
import { die, rollFate } from '../src/shared/dice';
import { evalFormula, fieldMap, loc, rollPack, validatePack, type SystemPack } from '../src/shared/syspack';
import { systemOf } from '../src/systems';
import { registerPacks } from '../src/systems/packs';
import { dndTracker } from '../src/systems/dnd5e/tracker';
import { fromFields } from '../src/systems/tracker';
import { run } from './helpers';
import fate from '../src/modules/fate/main';
import type { FateState } from '../src/modules/fate/types';

// Fate Core is a system pack now (samples/systems/fate-core.json, published in the Community).
const pack = validatePack(JSON.parse(readFileSync(new URL('../samples/systems/fate-core.json', import.meta.url), 'utf8'))) as SystemPack;
registerPacks([pack]);
const fateSys = () => systemOf('fate-core');
const skillTitles = (lang: string) => pack.sections.find((x) => x.id === 'skills')!.fields.map((f) => loc(f.title, lang));

const S0 = initiative.initialState;
const act = (s: InitiativeState, a: string, p?: unknown) => run(initiative, s, a, p);
const fight = (list: Partial<Combatant>[]) => list.reduce((s, c) => act(s, 'add', { c }), S0);
// A Fate combatant as the tracker makes it: two stress tracks, three consequences.
const fateNumbers = (): Partial<Combatant> => ({
  ...fromFields(fateSys().tracker.fields, { physical: 2, mental: 2 }),
  consequences: [2, 4, 6].map((shift) => ({ shift, text: '' })),
});
const words = { success: 'Успех', failure: 'Провал', successes: (n: number) => `${n}`, critical: 'Крит' };

describe('кубы и лестница Fate', () => {
  it('4dF: четыре грани от −1 до +1, итог — сумма и навык', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollFate(3);
      expect(r.faces).toHaveLength(4);
      expect(r.faces.every((f) => f >= -1 && f <= 1)).toBe(true);
      expect(r.total).toBe(r.faces.reduce((a, b) => a + b, 0) + 3);
    }
  });

  it('бросок навыка называет итог по лестнице', () => {
    const roll = fieldMap(pack).get('fight')!.roll!;
    const at = (total: number) => {
      for (;;) {
        const r = rollPack(roll, () => 0, 'ru', words, die);
        if (r.total === total) return r.outcome;
      }
    };
    expect(at(3)).toBe('Хорошо');
    expect(at(0)).toBe('Посредственно');
    expect(at(-2)).toBe('Ужасно');
    expect(at(-4)).toBe('Ужасно');
  });
});

describe('трекер системы', () => {
  it('у Fate — трекер пакета, неизвестная система — как D&D', () => {
    expect(fateSys().tracker).not.toBe(dndTracker);
    expect(fateSys().family).toBe('fate');
    expect(systemOf('dnd5e-2014').tracker).toBe(dndTracker);
    expect(systemOf('нечто').tracker).toBe(dndTracker);
  });

  it('поля Fate: дорожки стресса, не затирают друг друга; последствия пишутся в трекере', () => {
    const c = fromFields(fateSys().tracker.fields, { physical: 3, mental: 2 });
    expect(c.stress).toEqual([
      { id: 'physical', boxes: [false, false, false] },
      { id: 'mental', boxes: [false, false] },
    ]);
    expect(fateSys().tracker.fields.map((f) => f.key)).toEqual(['physical', 'mental']);
  });

  it('смена числа клеток сохраняет отмеченные', () => {
    const c = { stress: [{ id: 'physical', boxes: [true, false] }, { id: 'mental', boxes: [false, false] }] } as Combatant;
    const next = fromFields([fateSys().tracker.fields[0]!], { physical: 4 }, c);
    expect(next.stress).toEqual([
      { id: 'mental', boxes: [false, false] },
      { id: 'physical', boxes: [true, false, false, false] },
    ]);
  });

  it('поля D&D: хиты и КД', () => {
    expect(fromFields(dndTracker.fields, { hp: 12, ac: 15 })).toEqual({ maxHp: 12, hp: 12, ac: 15 });
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

describe('карточка Fate (пакет)', () => {
  it('стресс по Телосложению и Воле: 2, при Средне и Неплохо — 3, от Хорошо — 4', () => {
    const boxes = (physique: number) => evalFormula(pack, { physique }, 'physical_boxes');
    expect([0, 1, 2, 3, 5].map(boxes)).toEqual([2, 3, 3, 4, 4]);
  });

  it('в бой: очерёдность — Внимательность, дорожки по навыкам, последствия — ячейками трекера', () => {
    const c = fateSys().tracker.fromCard(fateSys().combat({ notice: 2, physique: 3, will: 1 }));
    expect(c.bonus).toBe(2);
    expect(c.maxHp).toBeNull();
    expect(c.stress!.map((t) => [t.id, t.boxes.length])).toEqual([['physical', 4], ['mental', 3]]);
  });

  it('строка под названием — концепция; сортировка — лучший навык', () => {
    expect(fateSys().subtitle({ high_concept: 'Сыщица из Ист-Энда' }, 'ru')).toBe('Сыщица из Ист-Энда');
    expect(fateSys().rank({ fight: 2, lore: 4 })).toBe(4);
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
  const book = JSON.parse(readFileSync(new URL('../resources/compendium/fate-core.ru.json', import.meta.url), 'utf8')) as BuiltinBook;

  it('навыки — те же, что в пакете Fate; типы записей известны и привязаны к Fate или общие', () => {
    expect(book.system).toBe('fate-core');
    const skills = book.entries.filter((e) => e.type === 'skill');
    expect(skills.map((e) => e.title).sort()).toEqual(skillTitles('ru').sort());
    expect(skills.map((e) => e.en).sort()).toEqual(skillTitles('en').sort());
    for (const e of book.entries) {
      expect(TYPES[e.type], e.title).toBeDefined();
      expect([null, 'fate']).toContain(entryFamily(e));
    }
  });

  it('английская книга: навыки из карточки, у каждой записи — русская пара', () => {
    const en = JSON.parse(readFileSync(new URL('../resources/compendium/fate-core.en.json', import.meta.url), 'utf8')) as BuiltinBook;
    expect(en.lang).toBe('en');
    expect(en.entries.filter((e) => e.type === 'skill').map((e) => e.title).sort()).toEqual(skillTitles('en').sort());
    expect(en.entries.length).toBe(book.entries.length);
    for (const e of en.entries) expect(e.ru, e.title).toBeTruthy();
  });
});
