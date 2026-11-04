// Trap generation: a mechanism (with its clue and how to disarm it), a trigger, a way past, a complication and who set
// it. Everything is indexes into the content lists (content.ts), so the trap shows in the interface language. The
// numbers are the SRD's: save DC and attack bonus by severity, damage by severity and level.
import { BYPASSES, COMPLICATIONS, MAKERS, MECHANISMS, REMAINS, TRIGGERS } from './content';
import type { Tier } from '../treasure/generate';

export const TRAP_KINDS = ['mechanical', 'magical'] as const;
export type TrapKind = (typeof TRAP_KINDS)[number];
export const TRAP_PLACES = ['corridor', 'door', 'room', 'treasure'] as const;
export type TrapPlace = (typeof TRAP_PLACES)[number];
export const SEVERITIES = ['setback', 'dangerous', 'deadly'] as const;
export type Severity = (typeof SEVERITIES)[number];
export const TRAP_PARTS = ['mechanism', 'trigger', 'bypass', 'complication', 'story'] as const;
export type TrapPart = (typeof TRAP_PARTS)[number];

export interface Trap {
  tier: Tier;
  severity: Severity;
  kind: TrapKind;
  place: TrapPlace;
  // Indexes: mechanism into MECHANISMS, trigger into TRIGGERS[kind][place], the rest into their lists.
  mechanism: number;
  trigger: number;
  bypass: number;
  complication: number;
  maker: number;
  remains: number;
  // Rolled in the range of the severity.
  saveDc: number;
  attack: number;
  detectDc: number;
  disarmDc: number;
}

// SRD «damage severity by level» and «trap save DCs and attack bonuses».
export const TRAP_DAMAGE: Record<Severity, Record<Tier, string>> = {
  setback: { 1: '1d10', 2: '2d10', 3: '4d10', 4: '10d10' },
  dangerous: { 1: '2d10', 2: '4d10', 3: '10d10', 4: '18d10' },
  deadly: { 1: '4d10', 2: '10d10', 3: '18d10', 4: '24d10' },
};
const DCS: Record<Severity, [number, number]> = { setback: [10, 11], dangerous: [12, 15], deadly: [16, 20] };
const ATTACKS: Record<Severity, [number, number]> = { setback: [3, 5], dangerous: [6, 8], deadly: [9, 12] };

type Random = () => number;
const index = (n: number, r: Random) => Math.floor(r() * n);
const between = ([lo, hi]: [number, number], r: Random) => lo + index(hi - lo + 1, r);
// Another index than the current one, when there is another.
function other(n: number, now: number, r: Random) {
  if (n < 2) return 0;
  const i = index(n - 1, r);
  return i >= now ? i + 1 : i;
}

export const mechanismsFor = (kind: TrapKind, place: TrapPlace) => MECHANISMS.flatMap((m, i) => (m.kind === kind && m.places.includes(place) ? [i] : []));

const numbers = (severity: Severity, r: Random) => ({
  saveDc: between(DCS[severity], r),
  attack: between(ATTACKS[severity], r),
  detectDc: between(DCS[severity], r),
  disarmDc: between(DCS[severity], r),
});

export const trapDice = (x: Pick<Trap, 'severity' | 'tier'>) => TRAP_DAMAGE[x.severity][x.tier];

export function generateTrapPart(part: TrapPart, x: Trap, r: Random = Math.random): Partial<Trap> {
  switch (part) {
    case 'mechanism': {
      const list = mechanismsFor(x.kind, x.place);
      const now = list.indexOf(x.mechanism);
      return { mechanism: list[now < 0 ? index(list.length, r) : other(list.length, now, r)]!, ...numbers(x.severity, r) };
    }
    case 'trigger':
      return { trigger: other(TRIGGERS[x.kind][x.place].length, x.trigger, r) };
    case 'bypass':
      return { bypass: other(BYPASSES.length, x.bypass, r) };
    case 'complication':
      return { complication: other(COMPLICATIONS.length, x.complication, r) };
    case 'story':
      return { maker: other(MAKERS.length, x.maker, r), remains: other(REMAINS.length, x.remains, r) };
  }
}

export interface TrapOptions {
  tier: Tier;
  severity: Severity;
  kind: TrapKind | 'random';
  place: TrapPlace | 'random';
}

export function generateTrap(o: TrapOptions, r: Random = Math.random): Trap {
  const kind = o.kind === 'random' ? TRAP_KINDS[index(TRAP_KINDS.length, r)]! : o.kind;
  const place = o.place === 'random' ? TRAP_PLACES[index(TRAP_PLACES.length, r)]! : o.place;
  const list = mechanismsFor(kind, place);
  return {
    tier: o.tier,
    severity: o.severity,
    kind,
    place,
    mechanism: list[index(list.length, r)]!,
    trigger: index(TRIGGERS[kind][place].length, r),
    bypass: index(BYPASSES.length, r),
    complication: index(COMPLICATIONS.length, r),
    maker: index(MAKERS.length, r),
    remains: index(REMAINS.length, r),
    ...numbers(o.severity, r),
  };
}
