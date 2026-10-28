// Constructions of Mausritter (SRD 2.3.1, «Constructions»): what the rooms cost, the upkeep, how long the digging takes
// and what the diggers are paid. Materials per 6" cube (a tunnel — per 6"): tunnel 10p, poor room 100p, standard 500p,
// grand 2000p; upkeep — 1% of the total a month; a team of three tunnel diggers digs one 6" cube of soil a day, other
// materials take twice as long; a tunnel digger is paid 5p a day (Hirelings). Pure: the page and tests use it.

export const ROOMS = ['tunnel', 'poor', 'standard', 'grand'] as const;
export type Room = (typeof ROOMS)[number];
export const ROOM_COST: Record<Room, number> = { tunnel: 10, poor: 100, standard: 500, grand: 2000 };
export const DIGGER_WAGE = 5;
export const TEAM = 3;
export const UPKEEP = 0.01;

export interface BuildPart {
  room: Room;
  // 6" cubes (a tunnel — 6" lengths).
  cubes: number;
  // Not soil (rock, wood…): digging takes twice as long.
  hard?: boolean;
  // The GM's name for it: «Pantry».
  name?: string;
}

export interface BuildResult {
  materials: number;
  upkeep: number;
  // Days of digging with this many diggers, and their wages for it.
  days: number;
  wages: number;
  total: number;
}

const whole = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

export function build(parts: BuildPart[], diggers: number): BuildResult {
  const materials = parts.reduce((n, p) => n + whole(p.cubes) * ROOM_COST[p.room], 0);
  // Team-days of digging: a cube of soil is a day of a team of three.
  const work = parts.reduce((n, p) => n + whole(p.cubes) * (p.hard ? 2 : 1), 0);
  const d = whole(diggers);
  const days = work && d ? Math.ceil((work * TEAM) / d) : 0;
  const wages = days * d * DIGGER_WAGE;
  return { materials, upkeep: Math.ceil(materials * UPKEEP), days, wages, total: materials + wages };
}
