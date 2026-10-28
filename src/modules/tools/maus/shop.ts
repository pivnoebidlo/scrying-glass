// The price list of the Mausritter SRD (Gear and prices) for Tools → Shop: its sections in the SRD order, the price of
// a row in pips, and the warband price — equipment costs 20 times as much for a warband (Warbands → Equipping).
import { SRD_TABLES } from './srd';
import type { TablesLang } from './text';

export const GEAR = ['gearMouse', 'gearHuman', 'gearWeapons', 'gearLight', 'gearClothing', 'gearLodging', 'gearTransport', 'gearHired'] as const;
export type GearSection = (typeof GEAR)[number];
// What a warband can be equipped with (food, lodging, transport and help are not equipment).
export const EQUIPMENT: readonly GearSection[] = ['gearMouse', 'gearHuman', 'gearWeapons', 'gearLight', 'gearClothing'];
export const WARBAND_PRICE = 20;
// Human-made tools are sold only near human settlements.
export const NEAR_HUMANS: GearSection = 'gearHuman';

export interface GearItem {
  section: GearSection;
  // The row number in its section: the same item in both languages.
  row: number;
  name: string;
  // Pips; null — not a price of its own («×10», «10%»): the text as it is.
  price: number | null;
  text: string;
}

// «10p», «1 000 п», «1000p» → 1000; anything else — null.
export function priceOf(cell: string): number | null {
  const m = /^\s*(\d[\d\s,]*)\s*(?:p|п)\s*$/i.exec(cell);
  return m ? Number(m[1]!.replace(/[\s,]/g, '')) : null;
}

export function gearItems(lang: TablesLang): GearItem[] {
  return GEAR.flatMap((section) =>
    SRD_TABLES[lang][section]!.rows.map((r, row) => ({ section, row, name: r[0]!, price: priceOf(r[1]!), text: r[1]! }))
  );
}

// The price to pay: for a warband — equipment 20 times as much.
export const priceFor = (item: GearItem, warband: boolean) =>
  item.price === null ? null : item.price * (warband && EQUIPMENT.includes(item.section) ? WARBAND_PRICE : 1);
