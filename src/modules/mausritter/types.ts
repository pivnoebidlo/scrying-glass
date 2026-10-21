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

export interface MausAdventure {
  factions: Faction[];
  session: SessionRoll[];
  clock: Clock;
}

export interface MausState {
  // By adventure; '' — the whole vault.
  byAdventure: Record<string, MausAdventure>;
}

export const WATCHES = 4;

// The goal a faction works on: the first one not completed.
export const currentGoal = (f: Faction) => f.goals.find((g) => g.progress < g.marks);
export const blankClock = (): Clock => ({ turn: 0, watch: 1, day: 1, last: null });
export const blankAdventure = (): MausAdventure => ({ factions: [], session: [], clock: blankClock() });
