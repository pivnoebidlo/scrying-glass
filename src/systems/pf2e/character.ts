// A player character in Pathfinder 2e (the card's `stats` of kind character): the numbers a GM needs at the table —
// made by the Pathbuilder import (pathbuilder.ts) or by hand. Only types and pure functions.
import type { CombatStats } from '../../shared/cards';
import { ABILITIES, type Ability, type Size, type Spellcasting, type Strike } from './stats';

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

export const isCharacter = (s: unknown): s is Pf2eCharacter => !!s && typeof s === 'object' && (s as { sheet?: unknown }).sheet === 'pf2e-character';

export function blankCharacter(): Pf2eCharacter {
  return {
    sheet: 'pf2e-character', level: 1, ancestry: '', heritage: '', background: '', class: '', keyAttribute: 'str', size: 'med',
    languages: ['Common'], abilities: Object.fromEntries(ABILITIES.map((a) => [a, 0])) as Record<Ability, number>, hp: 10, ac: 10,
    perception: 0, saves: { fort: 0, ref: 0, will: 0 }, classDC: 10, speed: 25, skills: [], strikes: [], spellcasting: [], feats: [],
    equipment: [], money: { pp: 0, gp: 0, sp: 0, cp: 0 },
  };
}

// «Level 2 · Human Summoner».
export const characterSubtitle = (c: Pf2eCharacter, level: string) => `${level} ${c.level} · ${[c.ancestry, c.class].filter(Boolean).join(' ')}`;
export const characterCombat = (c: Pf2eCharacter): CombatStats => ({ hp: c.hp, ac: c.ac, initiative: c.perception });
