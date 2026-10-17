// Treasure generator: what is found in pockets, a stash or a lair, by the heroes' tier. Coins are rolled here;
// gems, art, goods, pocket things and trinkets are indexes into the content lists (content.ts); magic items are chosen
// by the page from the compendium (only in D&D) — here only how many and of what rarity.
export const SOURCES = ['pockets', 'stash', 'hoard'] as const;
export type Source = (typeof SOURCES)[number];
// Heroes' levels: 1–4, 5–10, 11–16, 17–20.
export const TIERS = [1, 2, 3, 4] as const;
export type Tier = (typeof TIERS)[number];
export const RARITIES = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];
export const COINS = ['cp', 'sp', 'gp', 'pp'] as const;
export type Coin = (typeof COINS)[number];
// Values of gems and art objects, in gold.
export const VALUES = [10, 50, 100, 500, 1000, 5000] as const;

export interface Valuable {
  value: (typeof VALUES)[number];
  // An index into the gems or the art of that value.
  index: number;
  art: boolean;
}
export interface Treasure {
  source: Source;
  tier: Tier;
  coins: Partial<Record<Coin, number>>;
  valuables: Valuable[];
  // Indexes into goods (a silver candlestick, a bolt of silk…), pocket things and trinkets.
  goods: number[];
  pockets: number[];
  trinkets: number[];
  // Magic items to choose: their rarities; the page picks the items and keeps them in `items` (titles).
  magic: Rarity[];
}
export type TreasurePart = 'coins' | 'valuables' | 'things' | 'magic';
export const PARTS: TreasurePart[] = ['coins', 'valuables', 'things', 'magic'];

export interface Sizes {
  gems: Record<number, number>;
  art: Record<number, number>;
  goods: number;
  pockets: number;
  trinkets: number;
}

type Random = () => number;
const roll = (n: number, sides: number, r: Random) => {
  let s = 0;
  for (let i = 0; i < n; i++) s += 1 + Math.floor(r() * sides);
  return s;
};
const some = (count: number, size: number, r: Random) => {
  const out: number[] = [];
  const all = Array.from({ length: size }, (_, i) => i);
  while (out.length < Math.min(count, size)) out.push(all.splice(Math.floor(r() * all.length), 1)[0]!);
  return out;
};

// Coins: [dice, sides, × multiplier] per coin.
const COIN_DICE: Record<Source, Record<Tier, Partial<Record<Coin, [number, number, number]>>>> = {
  pockets: {
    1: { cp: [2, 6, 1], sp: [1, 6, 1] },
    2: { sp: [2, 6, 1], gp: [1, 6, 1] },
    3: { gp: [2, 10, 1] },
    4: { gp: [4, 10, 1], pp: [1, 6, 1] },
  },
  stash: {
    1: { cp: [3, 6, 10], sp: [2, 6, 10], gp: [1, 6, 1] },
    2: { sp: [3, 6, 10], gp: [2, 6, 10] },
    3: { gp: [4, 6, 10], pp: [1, 6, 10] },
    4: { gp: [4, 6, 100], pp: [2, 6, 10] },
  },
  hoard: {
    1: { cp: [6, 6, 100], sp: [3, 6, 100], gp: [2, 6, 10] },
    2: { sp: [2, 6, 100], gp: [6, 6, 100], pp: [3, 6, 10] },
    3: { gp: [4, 6, 1000], pp: [5, 6, 100] },
    4: { gp: [12, 6, 1000], pp: [8, 6, 1000] },
  },
};
export function rollCoins(source: Source, tier: Tier, r: Random = Math.random): Treasure['coins'] {
  const out: Treasure['coins'] = {};
  for (const [coin, [n, sides, mul]] of Object.entries(COIN_DICE[source][tier]) as [Coin, [number, number, number]][]) out[coin] = roll(n, sides, r) * mul;
  return out;
}

// Gems and art: how many, of which values.
const VALUABLES: Record<Source, Record<Tier, { chance: number; count: [number, number]; values: (typeof VALUES)[number][] }>> = {
  pockets: {
    1: { chance: 0.15, count: [1, 1], values: [10] },
    2: { chance: 0.25, count: [1, 1], values: [10, 50] },
    3: { chance: 0.35, count: [1, 1], values: [50, 100] },
    4: { chance: 0.45, count: [1, 2], values: [100, 500] },
  },
  stash: {
    1: { chance: 0.6, count: [1, 3], values: [10, 50] },
    2: { chance: 0.7, count: [1, 4], values: [50, 100] },
    3: { chance: 0.8, count: [2, 4], values: [100, 500] },
    4: { chance: 0.9, count: [2, 4], values: [500, 1000] },
  },
  hoard: {
    1: { chance: 1, count: [2, 6], values: [10, 50] },
    2: { chance: 1, count: [2, 6], values: [50, 100, 500] },
    3: { chance: 1, count: [3, 8], values: [100, 500, 1000] },
    4: { chance: 1, count: [3, 8], values: [1000, 5000] },
  },
};
export function rollValuables(source: Source, tier: Tier, sizes: Sizes, r: Random = Math.random): Valuable[] {
  const v = VALUABLES[source][tier];
  if (r() >= v.chance) return [];
  const n = v.count[0] + Math.floor(r() * (v.count[1] - v.count[0] + 1));
  // One kind of thing at one value — like a pouch of the same gems — is more natural than a jumble.
  const value = v.values[Math.floor(r() * v.values.length)]!;
  const art = r() < 0.4;
  const size = (art ? sizes.art : sizes.gems)[value] ?? 0;
  if (!size) return [];
  const out: Valuable[] = [];
  for (const index of some(art ? Math.min(n, 2) : n, size, r)) out.push({ value, index, art });
  // Several gems of one kind: the same index repeats (2 × amethyst).
  while (!art && out.length < n) out.push({ ...out[Math.floor(r() * out.length)]! });
  return out.sort((a, b) => a.index - b.index);
}

export function rollThings(source: Source, sizes: Sizes, r: Random = Math.random): Pick<Treasure, 'goods' | 'pockets' | 'trinkets'> {
  if (source === 'pockets') return { goods: [], pockets: some(1 + Math.floor(r() * 2), sizes.pockets, r), trinkets: r() < 0.3 ? some(1, sizes.trinkets, r) : [] };
  if (source === 'stash') return { goods: some(1 + Math.floor(r() * 2), sizes.goods, r), pockets: [], trinkets: r() < 0.5 ? some(1, sizes.trinkets, r) : [] };
  return { goods: some(1 + Math.floor(r() * 3), sizes.goods, r), pockets: [], trinkets: some(1 + Math.floor(r() * 2), sizes.trinkets, r) };
}

// Magic items: how many and of what rarity, by tier (each tier mostly its two rarities).
const RARITY_BY_TIER: Record<Tier, Rarity[]> = {
  1: ['common', 'common', 'uncommon'],
  2: ['uncommon', 'uncommon', 'rare'],
  3: ['rare', 'rare', 'veryRare'],
  4: ['veryRare', 'veryRare', 'legendary'],
};
const MAGIC: Record<Source, [chance: number, max: number]> = { pockets: [0.05, 1], stash: [0.35, 1], hoard: [1, 3] };
export function rollMagic(source: Source, tier: Tier, r: Random = Math.random): Rarity[] {
  const [chance, max] = MAGIC[source];
  if (r() >= chance) return [];
  const n = 1 + Math.floor(r() * max);
  return Array.from({ length: n }, () => RARITY_BY_TIER[tier][Math.floor(r() * 3)]!);
}

export function generateTreasure(source: Source, tier: Tier, sizes: Sizes, r: Random = Math.random): Treasure {
  return {
    source,
    tier,
    coins: rollCoins(source, tier, r),
    valuables: rollValuables(source, tier, sizes, r),
    ...rollThings(source, sizes, r),
    magic: rollMagic(source, tier, r),
  };
}

export function rerollPart(t: Treasure, part: TreasurePart, sizes: Sizes, r: Random = Math.random): Treasure {
  if (part === 'coins') return { ...t, coins: rollCoins(t.source, t.tier, r) };
  if (part === 'valuables') return { ...t, valuables: rollValuables(t.source, t.tier, sizes, r) };
  if (part === 'things') return { ...t, ...rollThings(t.source, sizes, r) };
  return { ...t, magic: rollMagic(t.source, t.tier, r) };
}

// The total value in gold: coins and valuables (magic items and goods are not counted).
const RATE: Record<Coin, number> = { cp: 0.01, sp: 0.1, gp: 1, pp: 10 };
export const totalGold = (t: Treasure) =>
  Math.floor(
    (Object.entries(t.coins) as [Coin, number][]).reduce((s, [c, n]) => s + n * RATE[c], 0) + t.valuables.reduce((s, v) => s + v.value, 0)
  );

// Rarity of a compendium item from its «rarity» field (English or Russian; «Uncommon (+1), Rare (+2)…» — the first).
export function rarityOf(field: unknown): Rarity | null {
  const s = typeof field === 'string' ? field.trim().toLowerCase() : '';
  if (/^(very rare|очень редк)/.test(s)) return 'veryRare';
  if (/^(uncommon|необычн)/.test(s)) return 'uncommon';
  if (/^(common|обычн)/.test(s)) return 'common';
  if (/^(rare|редк)/.test(s) && !/^(rarity|редкость)/.test(s)) return 'rare';
  if (/^(legendary|легендарн)/.test(s)) return 'legendary';
  return null;
}

// Magic items for the rarities: from the pool (compendium items with a rarity), without repeats; no item of that
// rarity — the nearest one, lower first.
export function pickItems(rarities: Rarity[], pool: { title: string; rarity: Rarity }[], r: Random = Math.random): string[] {
  const used = new Set<string>();
  const out: string[] = [];
  for (const want of rarities) {
    const at = RARITIES.indexOf(want);
    const order = [0, -1, 1, -2, 2, -3, 3, -4, 4].map((d) => RARITIES[at + d]).filter(Boolean) as Rarity[];
    for (const rarity of order) {
      const of = pool.filter((p) => p.rarity === rarity && !used.has(p.title));
      if (!of.length) continue;
      const p = of[Math.floor(r() * of.length)]!;
      used.add(p.title);
      out.push(p.title);
      break;
    }
  }
  return out;
}
