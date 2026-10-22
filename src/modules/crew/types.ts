// Forged in the Dark: the crew sheet of each adventure — tier and hold, rep and turf, heat and wanted level, coin,
// crew xp, special abilities, upgrades, claims, cohorts and the factions the crew deals with. The rules here are pure
// functions (the Blades in the Dark SRD, CC BY 3.0), shared by the core and the windows.
import type { PoolRoll } from '../../shared/dice';

export const MAX_TIER = 6;
export const REP_TRACK = 12;
export const MAX_TURF = 6;
export const MAX_HEAT = 9;
export const MAX_WANTED = 4;
export const CREW_XP = 8;
// Coin the lair holds: no vault, a vault, a second vault upgrade.
export const VAULTS = [4, 8, 16] as const;

export type Hold = 'weak' | 'strong';

export interface CrewAbility {
  name: string;
  text: string;
}

// A gang (type: Thugs, Skulks…; quality and scale = tier) or an expert (quality = tier + 1).
export interface Cohort {
  id: string;
  name: string;
  kind: 'gang' | 'expert';
  type: string;
  edges: string;
  flaws: string;
  // 0 — fine, 1 weakened, 2 impaired, 3 broken, 4 dead.
  harm: number;
}
export const COHORT_HARM = 4;

export interface CrewFaction {
  id: string;
  name: string;
  tier: number;
  hold: Hold;
  // −3 (war) … +3 (allies).
  status: number;
}

// What the last entanglement roll gave: the dice and the two entanglements to choose from (ids of ENTANGLEMENTS).
export interface EntanglementRoll {
  roll: PoolRoll;
  heat: number;
  options: string[];
}

export interface Crew {
  name: string;
  // Crew type (Assassins, Smugglers…), reputation, lair, hunting grounds — free text.
  type: string;
  reputation: string;
  lair: string;
  grounds: string;
  tier: number;
  hold: Hold;
  rep: number;
  turf: number;
  heat: number;
  wanted: number;
  coin: number;
  // 0–2: vault upgrades (see VAULTS).
  vault: number;
  xp: number;
  abilities: CrewAbility[];
  upgrades: string[];
  claims: string[];
  contacts: string;
  cohorts: Cohort[];
  factions: CrewFaction[];
  last: EntanglementRoll | null;
}

export interface CrewState {
  // By adventure; '' — the whole vault.
  byAdventure: Record<string, Crew>;
}

export const blankCrew = (): Crew => ({
  name: '',
  type: '',
  reputation: '',
  lair: '',
  grounds: '',
  tier: 0,
  hold: 'strong',
  rep: 0,
  turf: 0,
  heat: 0,
  wanted: 0,
  coin: 2,
  vault: 0,
  xp: 0,
  abilities: [],
  upgrades: [],
  claims: [],
  contacts: '',
  cohorts: [],
  factions: [],
  last: null,
});

const clamp = (n: unknown, min: number, max: number, or = min) =>
  typeof n === 'number' && isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : or;

// Rep that fills the tracker: 12 minus turf (each turf takes one box).
export const repNeeded = (c: Pick<Crew, 'turf'>) => REP_TRACK - clamp(c.turf, 0, MAX_TURF);
export const coinCap = (c: Pick<Crew, 'vault'>) => VAULTS[clamp(c.vault, 0, VAULTS.length - 1)]!;
export const repFull = (c: Crew) => c.rep >= repNeeded(c);
// The price of the next tier: new tier × 8 coin.
export const tierCost = (c: Pick<Crew, 'tier'>) => (c.tier + 1) * 8;

// Every number in range (old saves, hand edits).
export function normalize(c: Partial<Crew>): Crew {
  const b = { ...blankCrew(), ...c };
  const turf = clamp(b.turf, 0, MAX_TURF);
  return {
    ...b,
    tier: clamp(b.tier, 0, MAX_TIER),
    hold: b.hold === 'weak' ? 'weak' : 'strong',
    turf,
    rep: clamp(b.rep, 0, REP_TRACK - turf),
    heat: clamp(b.heat, 0, MAX_HEAT - 1),
    wanted: clamp(b.wanted, 0, MAX_WANTED),
    coin: clamp(b.coin, 0, 999),
    vault: clamp(b.vault, 0, VAULTS.length - 1),
    xp: clamp(b.xp, 0, CREW_XP),
    cohorts: (b.cohorts ?? []).map((x) => ({ ...x, harm: clamp(x.harm, 0, COHORT_HARM) })),
    factions: (b.factions ?? []).map((f) => ({ ...f, tier: clamp(f.tier, 0, MAX_TIER), hold: f.hold === 'weak' ? 'weak' : 'strong', status: clamp(f.status, -3, 3, 0) })),
  };
}

// Heat: at 9 the crew gains a wanted level and the excess rolls over (7 + 4 → wanted +1, heat 2). Heat taken off never
// lowers the wanted level (only incarceration does).
export function withHeat(c: Crew, delta: number): Crew {
  let heat = c.heat + Math.round(delta);
  let wanted = c.wanted;
  while (heat >= MAX_HEAT) {
    heat -= MAX_HEAT;
    wanted = Math.min(MAX_WANTED, wanted + 1);
  }
  return { ...c, heat: Math.max(0, heat), wanted };
}

// Rep fills up to the tracker (no new rep while it is full).
export const withRep = (c: Crew, delta: number): Crew => ({ ...c, rep: clamp(c.rep + Math.round(delta), 0, repNeeded(c)) });

// A full rep tracker: weak hold becomes strong; strong hold pays for the next tier (hold becomes weak). Null — not
// possible yet (the tracker isn't full, not enough coin, the top tier).
export function develop(c: Crew): Crew | null {
  if (!repFull(c)) return null;
  if (c.hold === 'weak') return { ...c, hold: 'strong', rep: 0 };
  if (c.tier >= MAX_TIER || c.coin < tierCost(c)) return null;
  return { ...c, tier: c.tier + 1, hold: 'weak', rep: 0, coin: c.coin - tierCost(c) };
}

// Payoff rep: 2, +1 per tier the target is above the crew, −1 per tier below (min 0); a quiet score — none.
export const repFor = (crewTier: number, targetTier: number) => Math.max(0, 2 + targetTier - crewTier);

// Heat of a score: exposure 0 / 2 / 4 / 6, +1 a high-profile target, +1 hostile turf, +1 at war, +2 killing.
export const EXPOSURE = [0, 2, 4, 6] as const;
export interface HeatFactors {
  exposure: number;
  profile?: boolean;
  hostile?: boolean;
  war?: boolean;
  killing?: boolean;
}
export const heatFor = (f: HeatFactors) => f.exposure + (f.profile ? 1 : 0) + (f.hostile ? 1 : 0) + (f.war ? 1 : 0) + (f.killing ? 2 : 0);
// At war with anyone: −3 status.
export const atWar = (c: Crew) => c.factions.some((f) => f.status <= -3);

// Entanglements, by the column of heat (0–3, 4–5, 6+) and the roll (1–3, 4–5, 6): two to choose from, or one.
export const ENTANGLEMENTS = ['gangTrouble', 'usualSuspects', 'rivals', 'unquietDead', 'cooperation', 'questioning', 'reprisals', 'showOfForce', 'flipped', 'interrogation', 'demonicNotice', 'arrest'] as const;
export type Entanglement = (typeof ENTANGLEMENTS)[number];
const TABLE: Entanglement[][][] = [
  [['gangTrouble', 'usualSuspects'], ['rivals', 'unquietDead'], ['cooperation']],
  [['gangTrouble', 'questioning'], ['reprisals', 'unquietDead'], ['showOfForce']],
  [['flipped', 'interrogation'], ['demonicNotice', 'showOfForce'], ['arrest']],
];
export const entanglementsFor = (heat: number, result: number): Entanglement[] =>
  TABLE[heat >= 6 ? 2 : heat >= 4 ? 1 : 0]![result >= 6 ? 2 : result >= 4 ? 1 : 0]!;

// Tiers are written in Roman numerals: 0, I … VI.
export const roman = (n: number) => ['0', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] ?? String(n);
