import { describe, expect, it } from 'vitest';
import { ART, GEMS, GOODS, POCKETS, SIZES, TRINKETS } from '../src/modules/tools/treasure/content';
import { generateTreasure, pickItems, rarityOf, rerollPart, SOURCES, TIERS, totalGold, VALUES } from '../src/modules/tools/treasure/generate';
import { treasureMarkdown, valuableLines } from '../src/modules/tools/treasure/text';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const words = { coin: (c: string) => c, each: (v: string) => `${v} each` };
const heads = { coins: 'Coins', valuables: 'Valuables', things: 'Things', magic: 'Magic', total: (g: string) => `Total ${g}` };

describe('сокровища', () => {
  it('у каждой цены есть самоцветы и украшения; все строки на двух языках', () => {
    for (const v of VALUES) {
      expect(GEMS[v]?.length, `gems ${v}`).toBeGreaterThan(2);
      expect(ART[v]?.length, `art ${v}`).toBeGreaterThan(2);
    }
    for (const p of [...Object.values(GEMS).flat(), ...Object.values(ART).flat(), ...GOODS, ...POCKETS, ...TRINKETS]) {
      expect(p[0] && p[1], p.join('|')).toBeTruthy();
    }
  });

  it('логово богаче карманов, и чем выше уровень — тем богаче', () => {
    const avg = (source: (typeof SOURCES)[number], tier: (typeof TIERS)[number]) => {
      const r = seeded(7);
      let s = 0;
      for (let i = 0; i < 200; i++) s += totalGold(generateTreasure(source, tier, SIZES, r));
      return s / 200;
    };
    for (const tier of TIERS) expect(avg('hoard', tier)).toBeGreaterThan(avg('stash', tier));
    for (const tier of TIERS) expect(avg('stash', tier)).toBeGreaterThan(avg('pockets', tier));
    for (const source of SOURCES) for (const tier of [1, 2, 3] as const) expect(avg(source, (tier + 1) as 2)).toBeGreaterThan(avg(source, tier));
  });

  it('в логове всегда есть магические предметы; переброс меняет только свою часть', () => {
    const r = seeded(3);
    const t = generateTreasure('hoard', 2, SIZES, r);
    expect(t.magic.length).toBeGreaterThan(0);
    const again = rerollPart(t, 'coins', SIZES, r);
    expect(again.valuables).toEqual(t.valuables);
    expect(again.magic).toEqual(t.magic);
  });

  it('редкость из поля справочника; предметы — без повторов, нет нужной редкости — ближайшая', () => {
    expect(rarityOf('Very Rare')).toBe('veryRare');
    expect(rarityOf('Очень редкий')).toBe('veryRare');
    expect(rarityOf('Uncommon (+1), Rare (+2), or Very Rare (+3)')).toBe('uncommon');
    expect(rarityOf('Редкость варьируется')).toBeNull();
    expect(rarityOf('Rarity Varies')).toBeNull();
    expect(rarityOf('Обычный')).toBe('common');
    const pool = [
      { title: 'Bag of Holding', rarity: 'uncommon' as const },
      { title: 'Cloak of Elvenkind', rarity: 'uncommon' as const },
      { title: 'Flame Tongue', rarity: 'rare' as const },
    ];
    const items = pickItems(['common', 'uncommon', 'uncommon'], pool, seeded(5));
    expect(items).toHaveLength(3);
    expect(new Set(items).size).toBe(3);
  });

  it('одинаковые самоцветы складываются; Markdown со ссылками и итогом', () => {
    const t = { source: 'stash' as const, tier: 2 as const, coins: { sp: 30, gp: 12 }, valuables: [{ value: 100 as const, index: 1, art: false }, { value: 100 as const, index: 1, art: false }], goods: [0], pockets: [], trinkets: [], magic: ['rare' as const] };
    expect(valuableLines(t, 'en', words, true)).toEqual(['2 × Amethyst (100 gp each)']);
    expect(valuableLines(t, 'ru', words, false)).toEqual(['2 × Аметист']);
    const md = treasureMarkdown(t, ['Flame Tongue'], 'en', words, heads, { values: true, links: true });
    expect(md).toContain('**Coins:** 30 sp, 12 gp');
    expect(md).toContain('- [[Flame Tongue]]');
    expect(md).toContain('*Total 215 gp*');
  });
});
