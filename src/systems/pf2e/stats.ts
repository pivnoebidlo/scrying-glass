// Pathfinder 2e (remaster): the old shape of a creature's stats. A card has the pack's fields beside it (pf2eFields in
// shared/oldcards.ts); scripts/import-pf2e.ts and the Pathbuilder import still build this shape first.

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type Ability = (typeof ABILITIES)[number];
export const SIZES = ['tiny', 'sm', 'med', 'lg', 'huge', 'grg'] as const;
export type Size = (typeof SIZES)[number];
export type Rarity = 'common' | 'uncommon' | 'rare' | 'unique';

// How many actions an ability takes: 1–3, a reaction, a free action; null — passive (no icon).
export type ActionCost = 1 | 2 | 3 | 'reaction' | 'free' | null;

export interface Strike {
  name: string;
  ranged: boolean;
  bonus: number;
  traits: string[];
  // «1d10+1 piercing», several parts — «2d6+4 fire plus 1d6 persistent fire»; dice in {braces} roll.
  damage: string;
  // What else the hit does («plus Grab»).
  effects: string[];
}

export interface Feature {
  name: string;
  actions: ActionCost;
  traits: string[];
  // Markdown: [[links]] to the compendium, {2d6} dice.
  text: string;
}

export interface SpellRank {
  // 0 — cantrips; constant ones are marked by `constant`.
  rank: number;
  constant?: boolean;
  // Slots of a prepared or spontaneous caster at this rank.
  slots?: number;
  spells: string[];
}

export interface Spellcasting {
  name: string;
  dc: number;
  attack: number | null;
  ranks: SpellRank[];
}

export interface Pf2eStats {
  level: number;
  rarity: Rarity;
  size: Size;
  traits: string[];
  perception: number;
  senses: string[];
  languages: string[];
  skills: { name: string; mod: number }[];
  abilities: Record<Ability, number>;
  items: string[];
  ac: number;
  saves: { fort: number; ref: number; will: number; note?: string };
  hp: number;
  hpNote?: string;
  immunities: string[];
  weaknesses: string[];
  resistances: string[];
  speeds: string[];
  strikes: Strike[];
  // In the order of the stat block: interaction (above AC), defensive (after HP), offensive (after strikes).
  interaction: Feature[];
  defensive: Feature[];
  offensive: Feature[];
  spellcasting: Spellcasting[];
}
