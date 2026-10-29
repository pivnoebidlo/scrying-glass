import { describe, expect, it } from 'vitest';
import { GOODS, HOOKS, QUIRKS, SHOP_LOOKS, SHOP_NAMES } from '../src/systems/dnd5e/tools/shop/content';
import { generateShop, isConsumable, MAGIC_VALUE, shopGoods, SHOP_TYPES, type ShopContext } from '../src/systems/dnd5e/tools/shop/generate';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const person = () => ({ name: 'Ann', race: 'human', gender: 'female' as const, occupation: 'smith', trait: 'haggles over everything' });
const ctx = (magic: ShopContext['magic']): ShopContext => ({ person, magic, curios: ['a ring that grows warm near a lie', 'a cloak that is always dry', 'a bell'] });

describe('лавки', () => {
  it('у каждого вида есть названия и вид изнутри; все строки на двух языках', () => {
    for (const type of SHOP_TYPES) {
      expect(SHOP_NAMES[type].length).toBeGreaterThan(3);
      expect(SHOP_LOOKS[type].length).toBeGreaterThan(1);
    }
    for (const p of [...Object.values(SHOP_NAMES).flat(), ...Object.values(SHOP_LOOKS).flat(), ...QUIRKS, ...HOOKS]) expect(p[0] && p[1]).toBeTruthy();
    for (const g of Object.values(GOODS).flat()) expect(g[0] && g[1] && g[2] > 0, g[0]).toBeTruthy();
  });

  it('бедная лавка не держит дорогого, богатая — больше товаров; цены по возрастанию', () => {
    const r = seeded(3);
    for (let i = 0; i < 30; i++) {
      const poor = shopGoods('smith', 'poor', 'en', ctx(null), r);
      const rich = shopGoods('smith', 'wealthy', 'ru', ctx(null), r);
      expect(poor.every((g) => g.cp! <= 2500 * 1.1)).toBe(true);
      expect(rich.length).toBeGreaterThan(poor.length);
      expect(rich.map((g) => g.cp)).toEqual([...rich.map((g) => g.cp)].sort((a, b) => a! - b!));
    }
  });

  it('магическая лавка: в D&D — предметы справочника по цене SRD (зелья — вдвое дешевле), иначе — диковины без цен', () => {
    const magic = [
      { title: 'Potion of Healing', rarity: 'common' as const, consumable: true },
      { title: 'Bag of Holding', rarity: 'uncommon' as const, consumable: false },
      { title: 'Flame Tongue', rarity: 'rare' as const, consumable: false },
    ];
    const goods = shopGoods('magic', 'modest', 'en', ctx(magic), seeded(1));
    expect(goods.map((g) => g.name).sort()).toEqual(['Bag of Holding', 'Potion of Healing']);
    const potion = goods.find((g) => g.name === 'Potion of Healing')!;
    expect(potion.cp!).toBeGreaterThanOrEqual(MAGIC_VALUE.common * 50 * 0.9);
    expect(potion.cp!).toBeLessThanOrEqual(MAGIC_VALUE.common * 50 * 1.1);
    const s = generateShop('magic', 'poor', 'en', ctx(null), seeded(2));
    expect(s.goods.every((g) => g.cp === null)).toBe(true);
    expect(s.owner.name).toBe('Ann');
    expect(isConsumable('Зелье')).toBe(true);
    expect(isConsumable('Wondrous Item')).toBe(false);
  });
});
