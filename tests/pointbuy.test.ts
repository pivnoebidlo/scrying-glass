import { describe, expect, it } from 'vitest';
import { bonusOptions, checkFinal, combine, costOf, isStandardArray, problemsOf, RACES_2014, spent, STANDARD_RULES, zero, type Scores } from '../src/systems/dnd5e/pointbuy';

const race = (id: string, sub?: string) => {
  const r = RACES_2014.find((x) => x.id === id)!;
  return combine(r, sub ? r.subraces.find((x) => x.id === sub) : null);
};

const S = (str: number, dex: number, con: number, int: number, wis: number, cha: number): Scores => ({ str, dex, con, int, wis, cha });

describe('покупка характеристик', () => {
  it('цены и бюджет', () => {
    expect([8, 9, 13, 14, 15].map(costOf)).toEqual([0, 1, 5, 7, 9]);
    expect(spent(S(15, 15, 15, 8, 8, 8))).toBe(27);
    expect(spent(S(15, 14, 13, 12, 10, 8))).toBe(27);
    expect(isStandardArray(S(8, 15, 13, 14, 12, 10))).toBe(true);
    expect(problemsOf(S(16, 8, 8, 8, 8, 8), STANDARD_RULES).map((p) => p.text)).toEqual(['Сила 16 до бонусов — больше 15']);
  });

  it('варианты бонусов: 2024 — 30 по +2/+1 и 20 по +1/+1/+1; полуэльф — +2 к харизме и два +1 на выбор', () => {
    expect(bonusOptions('2024')).toHaveLength(50);
    const he = bonusOptions(race('halfelf'));
    expect(he).toHaveLength(10);
    expect(he.every((b) => b.cha === 2 && Object.values(b).reduce((x, y) => x + y, 0) === 4)).toBe(true);
  });

  it('проверка персонажа 2024: бонусы подбираются сами', () => {
    // 15+2, 14+1, 13, 12, 10, 8 — законно, 27 очков.
    const c = checkFinal(S(17, 15, 13, 12, 10, 8), zero(), '2024', STANDARD_RULES);
    expect(c.problems).toEqual([]);
    expect(c.spent).toBe(27);
    expect(c.bonus).toEqual({ ...zero(), str: 2, dex: 1 });
  });

  it('нарушения видны: 18 на первом уровне без прочих увеличений', () => {
    const c = checkFinal(S(18, 14, 14, 10, 10, 8), zero(), '2024', STANDARD_RULES);
    expect(c.problems.length).toBeGreaterThan(0);
    // С увеличением характеристики (+2 к силе на 4 уровне) — законно.
    expect(checkFinal(S(18, 14, 14, 10, 10, 8), { ...zero(), str: 2 }, '2024', STANDARD_RULES).problems).toEqual([]);
  });

  it('подраса складывается с расой; своя подраса с «+1 на выбор»', () => {
    expect(race('halfling', 'lightfoot').fixed).toEqual({ dex: 2, cha: 1 });
    // Лесной эльф, добавленный пользователем: эльф +2 ловкость, подраса +1 мудрость.
    expect(combine(RACES_2014[1]!, { fixed: { wis: 1 } }).fixed).toEqual({ dex: 2, wis: 1 });
    expect(bonusOptions(combine({ fixed: {} }, { fixed: {}, choose: { count: 1, except: [] } }))).toHaveLength(6);
  });

  it('раса 2014: бонусы постоянные', () => {
    const c = checkFinal(S(10, 17, 13, 13, 12, 8), zero(), race('elf', 'high'), STANDARD_RULES);
    expect([c.base.dex, c.base.int, c.spent, c.problems.length]).toEqual([15, 12, 24, 0]);
  });
});
