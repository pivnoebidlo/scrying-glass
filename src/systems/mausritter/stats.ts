// Mausritter card: one shape for creatures, NPC mice and player mice. A stat block (HP, STR, DEX, WIL, armour,
// attacks, critical damage, wants); a player mouse also has a sheet: level, XP, pips and inventory slots.
// Rules — Mausritter SRD 2.3.1 (CC BY 4.0, Losing Games and Isaac Williams).
import type { CardKind, CombatStats } from '../../shared/cards';
import { labels, t } from '../../shared/i18n';

export type MausAttr = 'str' | 'dex' | 'wil';
export const ATTRS: MausAttr[] = ['str', 'dex', 'wil'];
export const ATTR_SHORT = labels<MausAttr>(ATTRS, 'maus.attr');
export const ATTR_TITLES = labels<MausAttr>(ATTRS, 'maus.attrTitle');

export interface MausAttack {
  // Weapon die («d8», «d6/d8») and what it is («peck»).
  dice: string;
  name: string;
}

// An inventory slot: an item (with usage dots) or a Condition.
export interface MausSlot {
  name: string;
  condition?: boolean;
  // Marked usage dots, 0–3.
  usage?: number;
}

// The sheet of a player mouse (and of anyone the GM wants to track like one).
export interface MouseSheet {
  level: number;
  xp: number;
  pips: number;
  background: string;
  birthsign: string;
  coat: string;
  look: string;
  // Paw slots (main, off), body slots (2), pack slots (6); more than that — encumbered.
  slots: MausSlot[];
  // Conditions placed in the Grit space: they are ignored until cleared.
  grit: string[];
}

export interface MausStats {
  // Hit Protection and attribute maximums.
  hp: number | null;
  str: number | null;
  dex: number | null;
  wil: number | null;
  armour: number;
  attacks: MausAttack[];
  // Instead of the standard critical damage (Injured, incapacitated).
  critical: string;
  // Other lines of the stat block: «Flies 3x normal speed, knows two songs».
  abilities: string[];
  wants: string;
  // Warband scale: fights a whole warband, mice alone do it no harm.
  warband?: boolean;
  sheet?: MouseSheet;
}

export const SLOTS = { paw: 2, body: 2, pack: 6 };
export const SLOT_COUNT = SLOTS.paw + SLOTS.body + SLOTS.pack;
export const slotGroup = (i: number): 'paw' | 'body' | 'pack' => (i < SLOTS.paw ? 'paw' : i < SLOTS.paw + SLOTS.body ? 'body' : 'pack');

// Conditions of the SRD (names in the interface language: they are written into the tracker as text).
export const CONDITIONS = ['exhausted', 'frightened', 'hungry', 'injured', 'drained'] as const;
export const CONDITION_TITLES = labels([...CONDITIONS], 'maus.cond');
export const conditionList = () => CONDITIONS.map((c) => CONDITION_TITLES[c]!);

// Levels: hit dice, Grit and the total XP; past level 4 — another 5000 XP per level.
const LEVELS = [
  { level: 1, dice: '1d6', grit: 0, xp: 0 },
  { level: 2, dice: '2d6', grit: 1, xp: 1000 },
  { level: 3, dice: '3d6', grit: 2, xp: 3000 },
  { level: 4, dice: '4d6', grit: 2, xp: 6000 },
];
export const xpFor = (level: number) => (level <= 4 ? (LEVELS[Math.max(1, level) - 1]!.xp) : 6000 + (level - 4) * 5000);
export const gritFor = (level: number) => (level <= 4 ? LEVELS[Math.max(1, level) - 1]!.grit : 3);
export const hitDiceFor = (level: number) => (level <= 4 ? LEVELS[Math.max(1, level) - 1]!.dice : '4d6');
// The level the XP reaches.
export function levelFor(xp: number): number {
  let level = 1;
  while (xpFor(level + 1) <= xp) level++;
  return level;
}

// Items and Conditions beyond the slots make the mouse encumbered (no running, all saves with Disadvantage).
export const filledSlots = (s: MouseSheet) => s.slots.filter((x) => x.name.trim()).length;
export const encumbered = (s: MouseSheet) => s.slots.slice(SLOT_COUNT).some((x) => x.name.trim());
export const conditionsOf = (s: MouseSheet) => s.slots.filter((x) => x.condition && x.name.trim()).map((x) => x.name.trim());

export const combatStats = (s: MausStats): CombatStats => ({
  hp: s.hp,
  ac: s.armour,
  // Turn order: a DEX save; ties — by DEX.
  initiative: s.dex ?? 10,
  attrs: ATTRS.filter((a) => s[a] !== null).map((id) => ({ id, value: s[id]! })),
});

export const statLine = (s: MausStats) =>
  [
    s.hp !== null ? `${s.hp} ${t('maus.hp')}` : '',
    ...ATTRS.filter((a) => s[a] !== null).map((a) => `${ATTR_SHORT[a]} ${s[a]}`),
    s.armour ? `${t('maus.armour')} ${s.armour}` : '',
  ]
    .filter(Boolean)
    .join(', ');

// The line under the name: a mouse — level and background, a creature — its stat line.
export function subtitle(s: MausStats): string {
  if (s.sheet) return [t('maus.levelN', { n: s.sheet.level }), s.sheet.background].filter(Boolean).join(' · ');
  return [s.warband ? t('maus.warband') : '', statLine(s)].filter(Boolean).join(' · ');
}

export const rank = (s: MausStats) => (s.sheet ? s.sheet.level : s.hp);

export const blankSheet = (): MouseSheet => ({
  level: 1,
  xp: 0,
  pips: 0,
  background: '',
  birthsign: '',
  coat: '',
  look: '',
  slots: Array.from({ length: SLOT_COUNT }, () => ({ name: '' })),
  grit: [],
});

export function blankStats(kind?: CardKind): MausStats {
  return {
    hp: kind === 'character' ? 3 : null,
    str: 10,
    dex: 10,
    wil: 10,
    armour: 0,
    attacks: [],
    critical: '',
    abilities: [],
    wants: '',
    ...(kind === 'character' ? { sheet: blankSheet() } : {}),
  };
}

// The stats block looks like a Mausritter card (not something else).
export const isMaus = (s: unknown): s is MausStats =>
  !!s && typeof s === 'object' && Array.isArray((s as MausStats).attacks) && 'wil' in s && 'armour' in s;

// «d6 swipe, d8 bite», «d10 spear or d6 tongue», «ghostly power, d8 chilling touch (damages WIL)» — an attack
// without a die is kept with an empty one. Commas inside brackets don't split.
export function parseAttacks(text: string): MausAttack[] {
  return text
    .split(/,\s*(?![^(]*\))|\s+or\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(d\d+(?:\/d\d+)?)\s*(.*)$/i);
      return m ? { dice: m[1]!.toLowerCase(), name: m[2]!.trim() } : { dice: '', name: part };
    });
}

// «12hp, STR 12, DEX 15, WIL 15, Armour 1 / Attacks: d8 peck, d6 bite / Critical damage: … / other lines» —
// the stat block of the SRD (and how GMs write it). Unknown lines go to abilities.
export function parseStatBlock(text: string): MausStats {
  const s = blankStats();
  s.str = s.dex = s.wil = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\*\*/g, '').trim();
    if (!line) continue;
    if (/^warband scale$/i.test(line)) {
      s.warband = true;
      continue;
    }
    const attacks = line.match(/^attacks?:\s*(.+)$/i);
    if (attacks) {
      s.attacks = parseAttacks(attacks[1]!);
      continue;
    }
    const crit = line.match(/^critical damage:\s*(.+)$/i);
    if (crit) {
      s.critical = crit[1]!.trim();
      continue;
    }
    const hp = line.match(/(\d+)\s*hp\b/i);
    if (hp && /\b(STR|DEX|WIL)\s+\d+/.test(line)) {
      s.hp = Number(hp[1]);
      for (const a of ATTRS) {
        const m = line.match(new RegExp(`\\b${a}\\s+(\\d+)`, 'i'));
        if (m) s[a] = Number(m[1]);
      }
      const armour = line.match(/armou?r\s+(\d+)/i);
      s.armour = armour ? Number(armour[1]) : 0;
      continue;
    }
    s.abilities.push(line);
  }
  return s;
}
