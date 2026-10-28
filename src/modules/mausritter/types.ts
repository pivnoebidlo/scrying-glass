import type { CardRef } from '../../shared/cards';

// Mausritter play aids kept with the adventure: factions with their goals (Hexcrawl toolbox → Factions) and the
// exploration clock (turns, watches, days — encounter rolls by the SRD). Shared by the core and the windows.

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

// An encounter roll: d6 — 1 an encounter, 2 an omen; in the wilderness the hour comes with it (d12).
export interface EncounterRoll {
  at: 'turn' | 'watch' | 'manual';
  roll: number;
  // The turn it was rolled on.
  turn?: number;
  hour?: number;
}

export interface Clock {
  // Turns of exploration (10 minutes each): every third — an encounter roll, every sixth — torches mark usage.
  turn: number;
  // The watch of the day (1 — morning … 4 — night) and the day.
  watch: number;
  day: number;
  last: EncounterRoll | null;
}

// A warband of the party (Recruiting help → Warbands): 20+ fighting mice and their followers, formed in a town or a
// city for a WIL save or 1000p. Its numbers live on its card (a Mausritter creature of warband scale, `card`); here —
// the upkeep: 1000p a week from the day it was formed, `paid` — weeks paid.
export interface Warband {
  id: string;
  name: string;
  // The clock's day it was formed.
  formed: number;
  paid: number;
  card?: CardRef;
}

export interface MausAdventure {
  factions: Faction[];
  session: SessionRoll[];
  clock: Clock;
  warbands?: Warband[];
}

export interface MausState {
  // By adventure; '' — the whole vault.
  byAdventure: Record<string, MausAdventure>;
}

export const WATCHES = 4;

export const WARBAND_UPKEEP = 1000;
// The upkeep of a warband is due for each week begun since it was formed: day 1–7 — the first week, and so on.
export const weeksDue = (w: Warband, day: number) => Math.max(0, Math.floor((day - w.formed) / 7) + 1);
export const weeksOwed = (w: Warband, day: number) => Math.max(0, weeksDue(w, day) - w.paid);

// The goal a faction works on: the first one not completed.
export const currentGoal = (f: Faction) => f.goals.find((g) => g.progress < g.marks);
export const blankClock = (): Clock => ({ turn: 0, watch: 1, day: 1, last: null });
export const blankAdventure = (): MausAdventure => ({ factions: [], session: [], clock: blankClock() });
