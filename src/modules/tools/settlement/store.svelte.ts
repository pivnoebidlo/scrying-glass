// Settlement generator in the control window: the size, the current settlement with its pinned parts (remembered by
// the window), the content in the interface language; tavern names and people from the tavern and NPC generators.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { fullBook, loadOwn } from '../names/store.svelte';
import { en as npcEn } from '../npc/content/en';
import { ru as npcRu } from '../npc/content/ru';
import { generateNpc } from '../npc/generate';
import { en as tavernEn } from '../tavern/content/en';
import { ru as tavernRu } from '../tavern/content/ru';
import { generatePart as tavernPart } from '../tavern/generate';
import type { Tavern, TavernOptions } from '../tavern/types';
import { en } from './content/en';
import { ru } from './content/ru';
import { generateSettlement, generateSettlementPart, rerollSettlement, type Helpers } from './generate';
import type { Settlement, SettlementContent, SettlementPart, Size } from './types';

const CONTENT: Record<string, { settlement: SettlementContent; npc: typeof npcEn; tavern: typeof tavernEn }> = {
  en: { settlement: en, npc: npcEn, tavern: tavernEn },
  ru: { settlement: ru, npc: npcRu, tavern: tavernRu },
};
const contentLang = () => (CONTENT[locale.lang] ? locale.lang : 'en');

const KEY = 'settlement.state';
interface Saved {
  size: Size | 'random';
  settlement: Settlement | null;
  pinned: SettlementPart[];
  lang: string;
}
function load(): Saved {
  const empty: Saved = { size: 'village', settlement: null, pinned: [], lang: '' };
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null) };
  } catch {
    return empty;
  }
}
export const towns = $state(load());
export const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(towns)));
  } catch {
    /* not remembered — not a problem */
  }
};

let ownLoaded = false;
async function helpers(lang: string): Promise<Helpers> {
  if (!ownLoaded) {
    ownLoaded = true;
    await loadOwn();
  }
  const book = fullBook(lang);
  const c = CONTENT[lang]!;
  return {
    tavernName: () => tavernPart('name', {} as Tavern, c.tavern, book, {} as TavernOptions).name ?? '',
    person: (race) => {
      const n = generateNpc(c.npc, book, { race, gender: 'random', importance: 'common' });
      return { name: [n.name, n.surname].filter(Boolean).join(' '), race: n.race, gender: n.gender, occupation: n.occupation, trait: n.trait };
    },
  };
}

const SIZES_RANDOM: Size[] = ['hamlet', 'village', 'village', 'town', 'town', 'city'];
export async function createSettlement() {
  const lang = contentLang();
  const size = towns.size === 'random' ? SIZES_RANDOM[Math.floor(Math.random() * SIZES_RANDOM.length)]! : towns.size;
  towns.settlement = generateSettlement(size, CONTENT[lang]!.settlement, await helpers(lang));
  towns.lang = lang;
  towns.pinned = [];
  save();
}
export async function rerollUnpinned() {
  if (!towns.settlement) return;
  const lang = towns.lang || contentLang();
  towns.settlement = rerollSettlement($state.snapshot(towns.settlement) as Settlement, towns.pinned, CONTENT[lang]!.settlement, await helpers(lang));
  save();
}
export async function rerollPart(part: SettlementPart) {
  if (!towns.settlement) return;
  const lang = towns.lang || contentLang();
  const s = $state.snapshot(towns.settlement) as Settlement;
  towns.settlement = { ...s, ...generateSettlementPart(part, s, CONTENT[lang]!.settlement, await helpers(lang)) };
  save();
}
export function togglePin(part: SettlementPart) {
  towns.pinned = towns.pinned.includes(part) ? towns.pinned.filter((p) => p !== part) : [...towns.pinned, part];
  save();
}
export const tavernPlace = (s: Settlement) => CONTENT[towns.lang || contentLang()]!.settlement.tavern.replace('{name}', s.tavern);
