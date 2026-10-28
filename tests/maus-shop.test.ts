import { describe, expect, it } from 'vitest';
import { gearItems, priceFor, priceOf } from '../src/modules/tools/maus/shop';

describe('Mausritter shop', () => {
  it('reads prices', () => {
    expect(priceOf('10p')).toBe(10);
    expect(priceOf('1000p')).toBe(1000);
    expect(priceOf('1 000 п')).toBe(1000);
    expect(priceOf('x10p')).toBeNull();
    expect(priceOf('10%')).toBeNull();
  });

  it('the same items in both languages, each with a price or its text', () => {
    const en = gearItems('en');
    const ru = gearItems('ru');
    expect(ru.map((i) => [i.section, i.price])).toEqual(en.map((i) => [i.section, i.price]));
    expect(en.filter((i) => i.price === null).map((i) => i.text)).toEqual(['x10p', '10%']);
  });

  it('a warband pays 20 times as much for equipment, not for food or help', () => {
    const en = gearItems('en');
    const sword = en.find((i) => i.name.startsWith('**Medium**'))!;
    const meal = en.find((i) => i.name === '**Meal**')!;
    expect([priceFor(sword, false), priceFor(sword, true)]).toEqual([20, 400]);
    expect(priceFor(meal, true)).toBe(2);
  });
});
