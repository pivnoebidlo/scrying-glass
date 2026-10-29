// Shop generation: a pure function over the content (content.ts) in one language. The owner comes from the NPC
// generator and the magic goods from the compendium — both through `ShopContext` (the page passes them in).
import type { Person } from '../../../../modules/tools/settlement/types';
import { type Rarity } from '../treasure/generate';
import { GOODS, HOOKS, QUIRKS, SHOP_LOOKS, SHOP_NAMES } from './content';

export const SHOP_TYPES = ['general', 'smith', 'alchemist', 'magic', 'books', 'curios'] as const;
export type ShopType = (typeof SHOP_TYPES)[number];
export const SHOP_WEALTH = ['poor', 'modest', 'wealthy'] as const;
export type ShopWealth = (typeof SHOP_WEALTH)[number];
export type ShopLang = 'en' | 'ru';

export interface ShopItem {
  name: string;
  // Price in copper; null — no price (curiosities outside D&D).
  cp: number | null;
  stock: number;
  // A compendium magic item: its rarity (the name is a link to the entry).
  rarity?: Rarity;
}
export interface Shop {
  type: ShopType;
  wealth: ShopWealth;
  lang: ShopLang;
  name: string;
  owner: Person;
  look: string;
  quirk: string;
  goods: ShopItem[];
  hook: string;
}
export const SHOP_PARTS = ['name', 'look', 'goods', 'hook'] as const;
export type ShopPart = (typeof SHOP_PARTS)[number];

export interface MagicGood {
  title: string;
  rarity: Rarity;
  // Potions and other consumables cost half (SRD).
  consumable: boolean;
}
export interface ShopContext {
  person: () => Person;
  // Compendium magic items (D&D) or null — then curiosities without prices.
  magic: MagicGood[] | null;
  curios: string[];
}

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;
function pickSome<T>(list: T[], n: number, r: Random): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return out;
}
const at = (lang: ShopLang) => (lang === 'ru' ? 1 : 0);

const COUNT: Record<ShopWealth, number> = { poor: 5, modest: 8, wealthy: 11 };
// The dearest thing a shop of this level keeps, in copper.
const MAX_CP: Record<ShopWealth, number> = { poor: 2500, modest: 20000, wealthy: Infinity };
const MARKUP: Record<ShopWealth, number> = { poor: 0.9, modest: 1, wealthy: 1.2 };
// SRD values of magic items by rarity, in gold.
export const MAGIC_VALUE: Record<Rarity, number> = { common: 100, uncommon: 400, rare: 4000, veryRare: 40000, legendary: 200000 };
const MAGIC_RARITIES: Record<ShopWealth, Rarity[]> = { poor: ['common'], modest: ['common', 'uncommon'], wealthy: ['common', 'uncommon', 'rare'] };
const MAGIC_COUNT: Record<ShopWealth, number> = { poor: 3, modest: 5, wealthy: 7 };

// A price around the base: ±10 %, rounded so it reads like a price.
function price(cp: number, wealth: ShopWealth, r: Random): number {
  const v = cp * MARKUP[wealth] * (0.9 + r() * 0.2);
  return v >= 10000 ? Math.round(v / 1000) * 1000 : v >= 1000 ? Math.round(v / 100) * 100 : v >= 30 ? Math.round(v / 10) * 10 : Math.max(1, Math.round(v));
}
const stockOf = (cp: number, r: Random) => (cp >= 5000 ? 1 : cp >= 500 ? 1 + Math.floor(r() * 3) : 2 + Math.floor(r() * 9));

export function shopGoods(type: ShopType, wealth: ShopWealth, lang: ShopLang, ctx: ShopContext, r: Random = Math.random): ShopItem[] {
  if (type === 'magic') {
    if (!ctx.magic) return pickSome(ctx.curios, MAGIC_COUNT[wealth], r).map((name) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), cp: null, stock: 1 }));
    const pool = ctx.magic.filter((m) => MAGIC_RARITIES[wealth].includes(m.rarity));
    return pickSome(pool, MAGIC_COUNT[wealth], r)
      .map((m) => ({ name: m.title, rarity: m.rarity, stock: 1, cp: price(MAGIC_VALUE[m.rarity] * 100 * (m.consumable ? 0.5 : 1), wealth, r) }))
      .sort((a, b) => a.cp - b.cp);
  }
  const list = GOODS[type].filter((g) => g[2] <= MAX_CP[wealth]);
  return pickSome(list, COUNT[wealth], r)
    .map((g) => ({ name: g[at(lang)], cp: price(g[2], wealth, r), stock: stockOf(g[2], r) }))
    .sort((a, b) => a.cp - b.cp);
}

export function generateShopPart(part: ShopPart, s: Shop, ctx: ShopContext, r: Random = Math.random): Partial<Shop> {
  const i = at(s.lang);
  switch (part) {
    case 'name':
      return { name: pick(SHOP_NAMES[s.type], r)[i], owner: ctx.person() };
    case 'look':
      return { look: pick(SHOP_LOOKS[s.type], r)[i], quirk: pick(QUIRKS, r)[i] };
    case 'goods':
      return { goods: shopGoods(s.type, s.wealth, s.lang, ctx, r) };
    case 'hook':
      return { hook: pick(HOOKS, r)[i] };
  }
}

export function generateShop(type: ShopType, wealth: ShopWealth, lang: ShopLang, ctx: ShopContext, r: Random = Math.random): Shop {
  let s = { type, wealth, lang } as Shop;
  for (const part of SHOP_PARTS) s = { ...s, ...generateShopPart(part, s, ctx, r) };
  return s;
}

// Category of a compendium item that is used up (SRD: such items cost half).
export const isConsumable = (category: unknown) => typeof category === 'string' && /^(potion|зелье)/i.test(category.trim());
