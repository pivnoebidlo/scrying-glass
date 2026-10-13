import { describe, expect, it } from 'vitest';
import { die, diceText, parseBonus, parseDice, rollD20, rollDamage } from '../src/shared/dice';

describe('разбор кубов', () => {
  it('понимает латиницу, кириллицу и пробелы', () => {
    expect(parseDice('2d6+5')).toEqual({ dice: [{ count: 2, sides: 6 }], bonus: 5 });
    expect(parseDice('2к6 + 3 рубящий')).toEqual({ dice: [{ count: 2, sides: 6 }], bonus: 3 });
    expect(parseDice('1д8 + 1d6 − 1')).toEqual({ dice: [{ count: 1, sides: 8 }, { count: 1, sides: 6 }], bonus: -1 });
    expect(parseDice('d20')).toEqual({ dice: [{ count: 1, sides: 20 }], bonus: 0 });
  });

  it('без кубов — null; число до кубов не считается бонусом', () => {
    expect(parseDice('СЛ 13')).toBeNull();
    expect(parseDice('')).toBeNull();
    expect(parseDice('+3 1d4')).toEqual({ dice: [{ count: 1, sides: 4 }], bonus: 0 });
  });

  it('бонус берётся только из начала записи', () => {
    expect(parseBonus('+5')).toBe(5);
    expect(parseBonus('−1')).toBe(-1);
    expect(parseBonus('+3 (СЛ 13)')).toBe(3);
    expect(parseBonus('СЛ 13')).toBeNull();
    expect(parseBonus(4)).toBe(4);
  });

  it('запись обратно в текст', () => {
    expect(diceText({ dice: [{ count: 2, sides: 6 }], bonus: -2 })).toBe('2d6 − 2');
  });
});

describe('броски', () => {
  it('грани в пределах куба', () => {
    for (let i = 0; i < 2000; i++) {
      const v = die(6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('преимущество — больший, помеха — меньший из двух', () => {
    for (let i = 0; i < 200; i++) {
      const a = rollD20(2, 'advantage');
      expect(a.rolls).toHaveLength(2);
      expect(a.natural).toBe(Math.max(...a.rolls));
      expect(a.total).toBe(a.natural + 2);
      const d = rollD20(0, 'disadvantage');
      expect(d.natural).toBe(Math.min(...d.rolls));
    }
    expect(rollD20(0).rolls).toHaveLength(1);
  });

  it('крит удваивает кубы, но не бонус; урон не меньше нуля', () => {
    const e = parseDice('2d6+3')!;
    const r = rollDamage(e, true);
    expect(r.rolls[0]).toHaveLength(4);
    expect(r.total).toBe(r.rolls.flat().reduce((a, b) => a + b, 0) + 3);
    expect(rollDamage(parseDice('1d4-10')!).total).toBe(0);
  });
});
