// NPC generator: what the content of one language holds (content/<lang>.ts) and what a generated NPC is.
import type { Gendered } from '../tavern/types';

// How important the NPC is: the more, the more details (a nickname, an epithet, fame, a magic trinket).
export const IMPORTANCE = ['common', 'uncommon', 'rare', 'veryRare', 'legendary', 'unique'] as const;
export type Importance = (typeof IMPORTANCE)[number];

export interface NpcContent {
  occupations: Gendered[];
  // Written to fit any gender (Russian — in the present tense, noun phrases).
  appearance: string[];
  traits: string[];
  manners: string[];
  desires: string[];
  secrets: string[];
  items: string[];
  magicItems: string[];
  // What people say about them (rare and up).
  fame: string[];
}

export interface Npc {
  race: string;
  gender: 'male' | 'female';
  importance: Importance;
  name: string;
  surname: string;
  nickname: string;
  epithet: string;
  occupation: string;
  appearance: string[];
  trait: string;
  manner: string;
  desire: string;
  secret: string;
  item: string;
  fame: string;
}

export const NPC_PARTS = ['name', 'occupation', 'appearance', 'trait', 'manner', 'desire', 'secret', 'item'] as const;
export type NpcPart = (typeof NPC_PARTS)[number];

export interface NpcOptions {
  // '' — a random race (weighted: mostly humans).
  race: string;
  gender: 'random' | 'male' | 'female';
  importance: Importance | 'random';
}
