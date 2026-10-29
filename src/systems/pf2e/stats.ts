// Pathfinder 2e (remaster): the stats of a creature — the card's `stats` (built by scripts/import-pf2e.ts from the
// ORC data of Monster Core, and the GM's own). Only types and pure functions: the core and the windows use it.
import type { CombatStats } from '../../shared/cards';

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

export const signed = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function blankStats(): Pf2eStats {
  return {
    level: 1, rarity: 'common', size: 'med', traits: [], perception: 5, senses: [], languages: [], skills: [],
    abilities: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }, items: [], ac: 15, saves: { fort: 5, ref: 5, will: 5 },
    hp: 20, immunities: [], weaknesses: [], resistances: [], speeds: ['25 feet'], strikes: [], interaction: [], defensive: [],
    offensive: [], spellcasting: [],
  };
}

// «Creature 3 · Medium goblin humanoid»: the level and the traits.
export const subtitle = (s: Pf2eStats, label: (key: string) => string) =>
  `${label('creature')} ${s.level} · ${[label(`size.${s.size}`), ...s.traits].join(' ')}`;

// The tracker takes initiative from Perception.
export const combatStats = (s: Pf2eStats): CombatStats => ({ hp: s.hp, ac: s.ac, initiative: s.perception });

// The multiple attack penalty: −5 / −10, an agile weapon −4 / −8.
export const mapOf = (s: Strike, attack: 1 | 2 | 3) => (attack === 1 ? 0 : (s.traits.includes('agile') ? -4 : -5) * (attack - 1));
