import { describe, expect, it } from 'vitest';
import maps from '../src/modules/maps/main';
import { dataOf } from '../src/modules/maps/data';
import { snap, tokenViews } from '../src/modules/maps/tokens';
import type { MapPin, MapsState, MapToken } from '../src/modules/maps/types';
import initiative from '../src/modules/initiative/main';
import { ctx, run, tree } from './helpers';

const P = 'adv/maps/город.png';
const S0 = maps.initialState;
const act = (s: MapsState, a: string, p?: unknown) => run(maps, s, a, p);

const pin = (id: string, extra: Partial<MapPin> = {}): MapPin => ({ id, x: 0.5, y: 0.5, title: '', note: '', color: 'red', shown: false, ...extra });
const token = (id: string, extra: Partial<MapToken> = {}): MapToken => ({ id, x: 0.5, y: 0.5, size: 1, name: 'Гоблин', portrait: null, side: 'enemy', hidden: false, ...extra });

describe('карты: метки', () => {
  it('добавить, изменить, удалить', () => {
    let s = act(S0, 'addPin', { path: P, pin: pin('a') });
    s = act(s, 'addPin', { path: P, pin: pin('b') });
    s = act(s, 'updatePin', { path: P, id: 'a', changes: { title: 'Таверна', shown: true, icon: 'beer' } });
    s = act(s, 'removePin', { path: P, id: 'b' });
    expect(dataOf(s, P).pins).toEqual([pin('a', { title: 'Таверна', shown: true, icon: 'beer' })]);
  });

  it('карты из старых сохранений получают пустые метки и жетоны', () => {
    const old = { ...S0, maps: { [P]: { fog: { base: 'hidden', ops: [] }, view: { x: 0, y: 0, w: 1, h: 1 }, grid: { on: false, cells: 30 } } } } as unknown as MapsState;
    const s = maps.init!(old, ctx(tree([P])));
    expect(s.maps[P]!.pins).toEqual([]);
    expect(s.maps[P]!.tokens).toEqual([]);
  });

  it('карта, файла которой больше нет, забывается', () => {
    let s = act(S0, 'show', { path: P });
    s = maps.onTreeChange!(s, ctx(tree(['adv/maps/другая.png'])));
    expect(s.maps[P]).toBeUndefined();
    expect(s.current).toBeNull();
  });
});

describe('карты: сетка', () => {
  it('сдвиг — дробная часть клетки, число клеток в пределах', () => {
    let s = act(S0, 'setGrid', { path: P, grid: { on: true, ox: 1.25, oy: -0.25 } });
    expect(dataOf(s, P).grid).toMatchObject({ on: true, ox: 0.25, oy: 0.75 });
    s = act(s, 'setGrid', { path: P, grid: { cells: 1000 } });
    expect(dataOf(s, P).grid.cells).toBe(200);
  });

  it('жетон встаёт по клеткам: нечётный — в центр клетки, чётный — на угол', () => {
    const img = { w: 800, h: 600 };
    const grid = { on: true, cells: 20, ox: 13 / 40, oy: 27 / 40 }; // клетка 40 точек, линии на 13 и 27
    // Центры клеток по x — 33, 73, 113…, по y — 47, 87, 127…: ближайший к (100, 100) — (113, 87).
    const a = snap(100 / 800, 100 / 600, 1, grid, img);
    expect([Math.round(a.x * 800), Math.round(a.y * 600)]).toEqual([113, 87]);
    // Пересечения линий: x — 53, 93, 133…, y — 67, 107…
    const b = snap(100 / 800, 100 / 600, 2, grid, img);
    expect([Math.round(b.x * 800), Math.round(b.y * 600)]).toEqual([93, 107]);
  });
});

describe('карты: жетоны', () => {
  it('жетон из боя берёт имя, ход, ранения и «спрятан» из инициативы', () => {
    let ini = run(initiative, initiative.initialState, 'add', { c: { name: 'Вождь', maxHp: 40, init: 12 } });
    const c = ini.combatants[0]!;
    ini = run(initiative, ini, 'changeHp', { id: c.id, amount: -30 });
    ini = run(initiative, ini, 'start');
    ini = run(initiative, ini, 'update', { id: c.id, changes: { hidden: true } });
    const [v] = tokenViews([token('t', { combatant: c.id, name: 'старое имя' })], ini);
    expect(v).toMatchObject({ name: 'Вождь', turn: true, down: false, hidden: true, wound: 0.75 });
  });

  it('участника больше нет — жетон остаётся со своими полями', () => {
    const [v] = tokenViews([token('t', { combatant: 'нет такого' })], initiative.initialState);
    expect(v).toMatchObject({ name: 'Гоблин', turn: false, wound: 0 });
  });

  it('убрать один или все', () => {
    let s = act(S0, 'addTokens', { path: P, tokens: [token('a'), token('b')] });
    s = act(s, 'updateToken', { path: P, id: 'a', changes: { size: 2 } });
    expect(dataOf(s, P).tokens.map((t) => [t.id, t.size])).toEqual([['a', 2], ['b', 1]]);
    s = act(s, 'removeToken', { path: P, id: 'a' });
    expect(dataOf(s, P).tokens.map((t) => t.id)).toEqual(['b']);
    s = act(s, 'removeToken', { path: P });
    expect(dataOf(s, P).tokens).toEqual([]);
  });
});
