// Magic item generation: a name, a look, a creator and a history, a minor property, a quirk and sometimes a curse,
// from the content lists in one language. In D&D the item can stand on an SRD item of the power's rarity (the page
// passes the compendium items in).
import { type Rarity } from '../treasure/generate';
import { CREATORS, CURSES, DETAILS, HISTORIES, MATERIALS, OBJECTS, OWNERS, PROPERTIES, QUIRKS } from './content';

export const RELIC_KINDS = ['weapon', 'armor', 'jewelry', 'wand', 'clothing', 'wondrous'] as const;
export type RelicKind = (typeof RELIC_KINDS)[number];
export const POWERS = ['curio', 'minor', 'major', 'legendary'] as const;
export type Power = (typeof POWERS)[number];
export type RelicLang = 'en' | 'ru';

export interface Relic {
  kind: RelicKind;
  power: Power;
  lang: RelicLang;
  name: string;
  look: string;
  // A compendium item it is built on (D&D, not a curio) and its rarity.
  base?: string;
  rarity?: Rarity;
  property: string;
  creator: string;
  history: string;
  quirk: string;
  curse?: string;
}
export const RELIC_PARTS = ['name', 'look', 'magic', 'history', 'quirk'] as const;
export type RelicPart = (typeof RELIC_PARTS)[number];

export interface BaseItem {
  title: string;
  rarity: Rarity;
  // The compendium category (Weapon, Ring, Wondrous Item…; Russian too).
  category: string;
}

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;
const at = (lang: RelicLang) => (lang === 'ru' ? 1 : 0);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const POWER_RARITIES: Record<Power, Rarity[]> = { curio: [], minor: ['common', 'uncommon'], major: ['rare', 'veryRare'], legendary: ['legendary'] };
const CURSE_CHANCE: Record<Power, number> = { curio: 0.05, minor: 0.1, major: 0.2, legendary: 0.3 };
// Which compendium categories fit a kind (English and Russian).
const CATEGORY: Record<RelicKind, RegExp> = {
  weapon: /^(weapon|оружие)/i,
  armor: /^(armor|доспех)/i,
  jewelry: /^(ring|кольцо)/i,
  wand: /^(wand|staff|rod|волшебная палочка|посох|жезл)/i,
  clothing: /^(wondrous|чудесный)/i,
  wondrous: /^(wondrous|чудесный)/i,
};

export function pickBase(kind: RelicKind, power: Power, items: BaseItem[], r: Random = Math.random): BaseItem | undefined {
  const rarities = POWER_RARITIES[power];
  if (!rarities.length) return undefined;
  const of = items.filter((i) => rarities.includes(i.rarity));
  const fit = of.filter((i) => CATEGORY[kind].test(i.category.trim()));
  const list = fit.length ? fit : of;
  return list.length ? pick(list, r) : undefined;
}

export function generateRelicPart(part: RelicPart, x: Relic, items: BaseItem[] | null, r: Random = Math.random): Partial<Relic> {
  const i = at(x.lang);
  switch (part) {
    case 'name': {
      const object = pick(OBJECTS[x.kind], r)[i];
      return { name: `${object} ${pick(OWNERS, r)[i]}` };
    }
    case 'look':
      return { look: `${cap(pick(MATERIALS, r)[i])}; ${pick(DETAILS, r)[i]}.` };
    case 'magic': {
      const base = items ? pickBase(x.kind, x.power, items, r) : undefined;
      return { base: base?.title, rarity: base?.rarity, property: pick(PROPERTIES, r)[i] };
    }
    case 'history':
      return { creator: pick(CREATORS, r)[i], history: pick(HISTORIES, r)[i] };
    case 'quirk':
      return { quirk: pick(QUIRKS, r)[i], curse: r() < CURSE_CHANCE[x.power] ? pick(CURSES, r)[i] : undefined };
  }
}

export function generateRelic(kind: RelicKind, power: Power, lang: RelicLang, items: BaseItem[] | null, r: Random = Math.random): Relic {
  let x = { kind, power, lang } as Relic;
  for (const part of RELIC_PARTS) x = { ...x, ...generateRelicPart(part, x, items, r) };
  return x;
}
