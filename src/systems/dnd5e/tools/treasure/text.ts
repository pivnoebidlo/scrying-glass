// Treasure as text: lines of each part in the result's language and the whole find as Markdown.
import { ART, GEMS, GOODS, POCKETS, TRINKETS } from './content';
import { COINS, totalGold, type Treasure, type Valuable } from './generate';

export type TreasureLang = 'en' | 'ru';
export const treasureLang = (lang: string): TreasureLang => (lang === 'ru' ? 'ru' : 'en');
const at = (lang: TreasureLang) => (lang === 'ru' ? 1 : 0);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (n: number, lang: TreasureLang) => n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');

export interface TreasureWords {
  // Coin abbreviations: cp, sp, gp, pp.
  coin: (c: string) => string;
  // «{n} gp each» / «по {n} зм».
  each: (value: string) => string;
}

export function coinsLine(t: Treasure, lang: TreasureLang, w: TreasureWords): string {
  return COINS.filter((c) => t.coins[c]).map((c) => `${num(t.coins[c]!, lang)} ${w.coin(c)}`).join(', ');
}

// «3 × amethyst (100 gp each)», «a silver ewer (50 gp)»; without values when `values` is off (not D&D).
export function valuableLines(t: Treasure, lang: TreasureLang, w: TreasureWords, values: boolean): string[] {
  const groups = new Map<string, { v: Valuable; n: number }>();
  for (const v of t.valuables) {
    const key = `${v.art}|${v.value}|${v.index}`;
    const g = groups.get(key);
    if (g) g.n++;
    else groups.set(key, { v, n: 1 });
  }
  return [...groups.values()].map(({ v, n }) => {
    const name = cap((v.art ? ART : GEMS)[v.value]?.[v.index]?.[at(lang)] ?? '');
    const price = `${num(v.value, lang)} ${w.coin('gp')}`;
    const head = n > 1 ? `${n} × ${name}` : name;
    return values ? `${head} (${n > 1 ? w.each(price) : price})` : head;
  });
}

export function thingLines(t: Treasure, lang: TreasureLang): string[] {
  return [...t.goods.map((i) => GOODS[i]), ...t.pockets.map((i) => POCKETS[i]), ...t.trinkets.map((i) => TRINKETS[i])]
    .filter(Boolean)
    .map((p) => cap(p![at(lang)]));
}

export interface TreasureHeads {
  coins: string;
  valuables: string;
  things: string;
  magic: string;
  total: (gold: string) => string;
}

// The find as Markdown: magic items as [[links]] (for the journal) when `links`.
export function treasureMarkdown(
  t: Treasure,
  items: string[],
  lang: TreasureLang,
  w: TreasureWords,
  h: TreasureHeads,
  o: { values: boolean; links: boolean; title?: string }
): string {
  const out: string[] = o.title ? [`# ${o.title}`, ''] : [];
  const coins = coinsLine(t, lang, w);
  if (coins) out.push(`**${h.coins}:** ${coins}`, '');
  const sections: [string, string[]][] = [
    [h.valuables, valuableLines(t, lang, w, o.values)],
    [h.things, thingLines(t, lang)],
    [h.magic, items.map((i) => (o.links ? `[[${i}]]` : i))],
  ];
  for (const [head, lines] of sections) if (lines.length) out.push(`**${head}:**`, ...lines.map((l) => `- ${l}`), '');
  if (o.values) out.push(`*${h.total(`${num(totalGold(t), lang)} ${w.coin('gp')}`)}*`);
  return out.join('\n').trim();
}
