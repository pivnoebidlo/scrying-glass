import type { CardRef } from '../../shared/cards';

// Play aids kept with the adventure: factions with their goals and the exploration clock (turns, watches, days).
// The rules are the package's (GeneratorFile.exploration, goalRoll). Shared by the core and the windows.

// A goal of a faction: progress marks (2–5, ○○○), how many are marked, and the numbers for the between-sessions roll:
// how many of the faction's resources help and how many a rival's resources stand against it.
export interface FactionGoal {
  id: string;
  text: string;
  marks: number;
  progress: number;
  relevant: number;
  rival: number;
}

export interface Faction {
  id: string;
  name: string;
  resources: string[];
  goals: FactionGoal[];
}

// What a between-sessions roll did for a faction.
export interface SessionRoll {
  faction: string;
  goal: string;
  roll: number;
  total: number;
  gained: number;
  completed: boolean;
}

// An encounter roll; what its face means is in the package's rules.
export interface EncounterRoll {
  at: 'turn' | 'watch' | 'manual';
  roll: number;
  // The turn it was rolled on.
  turn?: number;
  hour?: number;
}

export interface Clock {
  // Turns of exploration.
  turn: number;
  // The watch of the day, from 1, and the day.
  watch: number;
  day: number;
  last: EncounterRoll | null;
}

// A warband of the party. Its numbers live on its card (`card`, made from the package's template); here — the upkeep
// counted from the day it was formed, `paid` — weeks paid. What a week costs is the package's (`warbandUpkeep`).
export interface Warband {
  id: string;
  name: string;
  // The clock's day it was formed.
  formed: number;
  paid: number;
  card?: CardRef;
}

export interface FactionsAdventure {
  factions: Faction[];
  session: SessionRoll[];
  clock: Clock;
  warbands?: Warband[];
}

export interface FactionsState {
  // By adventure; '' — the whole vault.
  byAdventure: Record<string, FactionsAdventure>;
}

// Watches in a day when the package names none.
export const WATCHES = 4;

// The upkeep of a warband is due for each week begun since it was formed: day 1–7 — the first week, and so on.
export const weeksDue = (w: Warband, day: number) => Math.max(0, Math.floor((day - w.formed) / 7) + 1);
export const weeksOwed = (w: Warband, day: number) => Math.max(0, weeksDue(w, day) - w.paid);

// The goal a faction works on: the first one not completed.
export const currentGoal = (f: Faction) => f.goals.find((g) => g.progress < g.marks);
export const blankClock = (): Clock => ({ turn: 0, watch: 1, day: 1, last: null });
export const blankAdventure = (): FactionsAdventure => ({ factions: [], session: [], clock: blankClock() });
