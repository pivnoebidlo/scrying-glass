// A player character in Pathfinder 2e (the card's `stats` of kind character): the numbers a GM needs at the table —
// made by the Pathbuilder import (pathbuilder.ts) or by hand. Only types and pure functions.
import type { Ability, Size, Spellcasting, Strike } from './stats';

// Proficiency ranks: untrained, trained, expert, master, legendary.
export const RANKS = ['U', 'T', 'E', 'M', 'L'] as const;

export interface Pf2eCharacter {
  sheet: 'pf2e-character';
  level: number;
  ancestry: string;
  heritage: string;
  background: string;
  class: string;
  keyAttribute: Ability;
  size: Size;
  languages: string[];
  // Attribute modifiers (the remaster's numbers).
  abilities: Record<Ability, number>;
  hp: number;
  ac: number;
  perception: number;
  saves: { fort: number; ref: number; will: number };
  classDC: number;
  speed: number;
  // rank — 0…4 (RANKS).
  skills: { name: string; mod: number; rank: number }[];
  strikes: Strike[];
  spellcasting: Spellcasting[];
  feats: { name: string; type: string; level: number }[];
  equipment: string[];
  money: { pp: number; gp: number; sp: number; cp: number };
}
