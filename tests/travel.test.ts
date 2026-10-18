import { describe, expect, it } from 'vitest';
import { travel, type TravelInput } from '../src/modules/tools/travel/rules';

const base: TravelInput = { edition: '2024', distance: 60, by: 'land', pace: 'normal', terrain: 'grassland', road: false, difficult: false, hours: 8 };

describe('путь', () => {
  it('обычный темп: 24 мили за день, 60 миль — 2 дня и 4 часа', () => {
    const r = travel(base);
    expect(r.perDay).toBe(24);
    expect([r.days, r.hours]).toEqual([2, 4]);
    expect(r.saves).toEqual([]);
  });

  it('местность 2024 ограничивает темп, хорошая дорога поднимает его на ступень', () => {
    expect(travel({ ...base, pace: 'fast', terrain: 'mountain' })).toMatchObject({ pace: 'slow', capped: true, perDay: 18 });
    expect(travel({ ...base, pace: 'fast', terrain: 'mountain', road: true })).toMatchObject({ pace: 'normal', capped: true });
    expect(travel({ ...base, pace: 'fast', terrain: 'forest', road: true })).toMatchObject({ pace: 'fast', capped: false, perDay: 30 });
  });

  it('2014: трудная местность — вдвое медленнее, местность темп не ограничивает', () => {
    const r = travel({ ...base, edition: '2014', pace: 'fast', terrain: 'mountain', difficult: true });
    expect(r).toMatchObject({ pace: 'fast', perDay: 15, perHour: 2 });
  });

  it('долгий день: лишние часы по часовой скорости и спасброски СЛ 11, 12…', () => {
    const r = travel({ ...base, hours: 10 });
    expect(r.perDay).toBe(30);
    expect(r.saves).toEqual([11, 12]);
  });

  it('корабль: своя скорость, до 24 часов, без спасбросков', () => {
    const r = travel({ ...base, by: 'sailingShip', distance: 100, hours: 24 });
    expect(r).toMatchObject({ pace: null, perHour: 2, perDay: 48, days: 2, hours: 2, saves: [] });
  });

  it('последний день не длиннее дня: медленный темп, 17 миль — 8 часов', () => {
    const r = travel({ ...base, pace: 'slow', distance: 17 });
    expect([r.days, r.hours]).toEqual([0, 8]);
  });
});
