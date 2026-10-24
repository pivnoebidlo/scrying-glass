// A generated mouse in words (the interface language): what it carries, the card for the bestiary and Markdown.
// The rules of an item (armour, a weapon's die, a hireling) are read from the English text of the same table row,
// so they don't depend on the translation.
import { labels, t } from '../../../shared/i18n';
import type { PackSlot } from '../../../shared/syspack';

// The Mausritter pack (samples/systems/mausritter.json): its inventory field — paws 2, body 2, pack 6.
export const SLOTS = { paw: 2, body: 2, pack: 6 };
export const SLOT_COUNT = SLOTS.paw + SLOTS.body + SLOTS.pack;
// STR, DEX, WIL and their names in the interface language.
export const ATTR_SHORT = labels<Attr>(['str', 'dex', 'wil'], 'maus.attr');
export const ATTR_TITLES = labels<Attr>(['str', 'dex', 'wil'], 'maus.attrTitle');
type MausSlot = PackSlot;
type MausAttack = { dice: string; name: string };
import { NAMES, WEAPONS } from './content';
import type { Attr, Mouse } from './generate';
import { TABLES } from './tables';

export type MouseLang = 'en' | 'ru';
export const mouseLang = (lang: string): MouseLang => (lang === 'ru' ? 'ru' : 'en');

interface Item {
  text: string;
  // Light armour — off paw and one body slot, heavy — two body slots.
  armour?: 'light' | 'heavy';
  attack?: MausAttack;
  // A hireling follows the mouse, it doesn't take a slot.
  hireling?: boolean;
  usage?: boolean;
}

const ru = (lang: MouseLang) => lang === 'ru';
const dieText = (dice: string, lang: MouseLang) => (ru(lang) ? dice.replace(/d/g, 'к') : dice);

// An item of a background: its text in the language, its rules from the English row.
function backgroundItem(index: number, which: 'a' | 'b', lang: MouseLang): Item {
  const text = TABLES[lang].backgrounds[index]![which];
  const en = TABLES.en.backgrounds[index]![which];
  const weapon = /\((?:Light|Medium|Heavy), (d\d+(?:\/d\d+)?)\)/.exec(en);
  return {
    text,
    ...(/Heavy armour/.test(en) ? { armour: 'heavy' as const } : /Light armour/.test(en) ? { armour: 'light' as const } : {}),
    ...(weapon ? { attack: { dice: weapon[1]!, name: text.replace(/\s*\(.*\)$/, '').toLowerCase() } } : {}),
    ...(/^Hireling:/.test(en) ? { hireling: true } : {}),
  };
}

export interface MouseView {
  name: string;
  background: string;
  weapon: string;
  // Starting items in order: torches, rations, background items, the weapon of choice.
  items: Item[];
  birthsign: string;
  disposition: string;
  coat: string;
  detail: string;
  weak: '' | 'one' | 'both';
}

export function mouseView(m: Mouse, lang: MouseLang): MouseView {
  const tb = TABLES[lang];
  const w = WEAPONS[lang][m.weapon]!;
  const weapon = `${w.name} (${dieText(w.dice, lang)})`;
  const items: Item[] = [
    { text: t('mouse.torches'), usage: true },
    { text: t('mouse.rations'), usage: true },
    backgroundItem(m.background, 'a', lang),
    backgroundItem(m.background, 'b', lang),
  ];
  if (m.extra) {
    if (m.extra.take !== 'b') items.push(backgroundItem(m.extra.background, 'a', lang));
    if (m.extra.take !== 'a') items.push(backgroundItem(m.extra.background, 'b', lang));
  }
  const sign = tb.birthsigns[m.sign]!;
  return {
    name: NAMES[lang][m.name]!,
    background: tb.backgrounds[m.background]!.name,
    weapon,
    items,
    birthsign: sign.sign,
    disposition: sign.disposition,
    coat: `${tb.colors[m.color]}, ${tb.patterns[m.pattern]!.toLowerCase()}`,
    detail: tb.details[m.detail]!,
    weak: !m.extra ? '' : m.extra.take === 'both' ? 'both' : 'one',
  };
}

// Inventory: the weapon in the main paw (a two-paw one — in both), armour where it is worn, the rest — in the pack;
// what doesn't fit goes past the ten slots (the mouse is encumbered).
export function mouseSlots(m: Mouse, lang: MouseLang): MausSlot[] {
  const v = mouseView(m, lang);
  const w = WEAPONS[lang][m.weapon]!;
  const slots: MausSlot[] = Array.from({ length: SLOT_COUNT }, () => ({ name: '' }));
  const extra: MausSlot[] = [];
  const free = (i: number) => !slots[i]!.name;
  const put = (name: string, at: number[]) => at.every(free) && (at.forEach((i) => (slots[i] = { name })), true);
  const pack = Array.from({ length: SLOTS.pack }, (_, i) => SLOTS.paw + SLOTS.body + i);
  const [main, off, body1, body2] = [0, 1, 2, 3];
  put(v.weapon, w.both ? [main, off] : [main]);
  for (const item of v.items) {
    if (item.hireling) continue;
    if (item.armour === 'heavy' && put(item.text, [body1, body2])) continue;
    if (item.armour === 'light' && (put(item.text, [off, body1]) || put(item.text, [body1, body2]))) continue;
    const at = pack.find(free);
    if (at !== undefined) slots[at] = { name: item.text, ...(item.usage ? { usage: 0 } : {}) };
    else extra.push({ name: item.text });
  }
  return [...slots, ...extra];
}

export const ATTR_ORDER: Attr[] = ['str', 'dex', 'wil'];

// The mouse's card: the fields of the Mausritter pack, the sheet filled in; hirelings go to the notes.
export function mouseCard(m: Mouse, lang: MouseLang): { name: string; notes: string; stats: Record<string, unknown> } {
  const v = mouseView(m, lang);
  const w = WEAPONS[lang][m.weapon]!;
  const attacks = [{ dice: w.dice, name: w.name.toLowerCase() }, ...v.items.flatMap((i) => (i.attack ? [i.attack] : []))];
  return {
    name: v.name,
    notes: v.items.filter((i) => i.hireling).map((i) => i.text).join('\n'),
    stats: {
      hp: m.hp,
      str: m.str,
      dex: m.dex,
      wil: m.wil,
      armour: v.items.some((i) => i.armour) ? 1 : 0,
      attacks: attacks.map((a) => ({ name: a.name, dice: a.dice })),
      critical: '',
      abilities: '',
      wants: '',
      level: 1,
      xp: 0,
      pips: m.pips,
      background: v.background,
      birthsign: `${v.birthsign} (${v.disposition.toLowerCase()})`,
      coat: v.coat,
      look: v.detail,
      inventory: mouseSlots(m, lang),
      grit: [],
    },
  };
}

export interface MouseLabels {
  attr: Record<Attr, string>;
  hp: string;
  pips: string;
  background: string;
  items: string;
  birthsign: string;
  coat: string;
  detail: string;
}

export function mouseMarkdown(m: Mouse, lang: MouseLang, l: MouseLabels): string {
  const v = mouseView(m, lang);
  const items = [v.weapon, ...v.items.map((i) => i.text)];
  return [
    `## ${v.name}`,
    '',
    `${ATTR_ORDER.map((a) => `**${l.attr[a]}** ${m[a]}`).join(', ')}, **${l.hp}** ${m.hp}, **${l.pips}** ${m.pips}`,
    '',
    `**${l.background}:** ${v.background}`,
    `**${l.items}:** ${items.join(', ')}`,
    `**${l.birthsign}:** ${v.birthsign} (${v.disposition.toLowerCase()})`,
    `**${l.coat}:** ${v.coat}`,
    `**${l.detail}:** ${v.detail}`,
  ].join('\n');
}
