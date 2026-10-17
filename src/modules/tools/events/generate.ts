// Random events generator: events for a terrain, day or night and a danger level. The events are one bilingual list
// (events.ts); a text may hold [[creature names]] — links to the SRD cards. Rumors come from the tavern generator.
import type { Terrain } from '../weather/generate';

export const EVENT_KINDS = ['encounter', 'discovery', 'obstacle', 'traveler', 'omen', 'rumor'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
export const DANGERS = ['calm', 'tense', 'dangerous'] as const;
export type Danger = (typeof DANGERS)[number];
export type Time = 'day' | 'night';

export interface EventDef {
  kind: Exclude<EventKind, 'rumor'>;
  en: string;
  ru: string;
  // Terrains where it fits; none — any outdoors (not the city, not underground).
  where?: Terrain[];
  when?: Time;
  // 0 — harmless, 1 — trouble, 2 — a real threat.
  danger: 0 | 1 | 2;
  // A D&D check and its DC: a skill key (systems/dnd5e — perception, survival…) or «save:<ability>» (save:wis).
  check?: [string, number];
}

export interface GeneratedEvent {
  kind: EventKind;
  // An index into the event list, or into the rumors for kind 'rumor'.
  index: number;
  // For a rumor: which intro.
  intro?: number;
  // Something that makes it harder (a dangerous road), an index into the complications.
  complication?: number;
}

export interface EventOptions {
  terrain: Terrain;
  time: Time;
  danger: Danger;
  count: number;
}

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;

const OUTDOORS = (t: Terrain) => t !== 'city' && t !== 'underground';
export const fits = (e: EventDef, o: Pick<EventOptions, 'terrain' | 'time' | 'danger'>) =>
  (e.where ? e.where.includes(o.terrain) : OUTDOORS(o.terrain)) &&
  (!e.when || e.when === o.time) &&
  e.danger <= DANGERS.indexOf(o.danger);

// How often each kind comes up, by danger level.
const WEIGHTS: Record<Danger, Record<EventKind, number>> = {
  calm: { encounter: 1, discovery: 3, obstacle: 2, traveler: 3, omen: 1, rumor: 2 },
  tense: { encounter: 3, discovery: 2, obstacle: 2, traveler: 2, omen: 1, rumor: 1 },
  dangerous: { encounter: 5, discovery: 1, obstacle: 3, traveler: 1, omen: 1, rumor: 1 },
};

export function generateEvent(
  events: EventDef[],
  rumors: number,
  intros: number,
  complications: number,
  o: Omit<EventOptions, 'count'>,
  r: Random = Math.random,
  avoid: number[] = []
): GeneratedEvent {
  const pool = events.map((e, i) => ({ e, i })).filter(({ e, i }) => fits(e, o) && !avoid.includes(i));
  const kinds = [...new Set(pool.map(({ e }) => e.kind))] as EventKind[];
  // Rumors need someone to tell them: not underground.
  if (rumors && o.terrain !== 'underground') kinds.push('rumor');
  const total = kinds.reduce((n, k) => n + WEIGHTS[o.danger][k], 0);
  let x = r() * total;
  let kind = kinds[0] ?? 'rumor';
  for (const k of kinds) if ((x -= WEIGHTS[o.danger][k]) < 0) {
    kind = k;
    break;
  }
  if (kind === 'rumor') return { kind, index: Math.floor(r() * rumors), intro: Math.floor(r() * intros) };
  const of = pool.filter(({ e }) => e.kind === kind);
  // On a dangerous road the real threats come first.
  const best = o.danger === 'dangerous' ? of.filter(({ e }) => e.danger === 2) : of;
  const { i } = pick(best.length && r() < 0.7 ? best : of, r);
  const complication = o.danger === 'dangerous' && complications && r() < 0.35 ? Math.floor(r() * complications) : undefined;
  return { kind, index: i, ...(complication !== undefined ? { complication } : {}) };
}

export function generateEvents(events: EventDef[], rumors: number, intros: number, complications: number, o: EventOptions, r: Random = Math.random): GeneratedEvent[] {
  const out: GeneratedEvent[] = [];
  for (let n = 0; n < Math.max(1, Math.min(o.count, 12)); n++) {
    const used = out.filter((e) => e.kind !== 'rumor').map((e) => e.index);
    out.push(generateEvent(events, rumors, intros, complications, o, r, used));
  }
  return out;
}

// «… a pack of [[Wolf|wolves]] …» -> pieces of text and links (name to look up, text to show).
export function splitLinks(text: string): ({ text: string } | { link: string; text: string })[] {
  const out: ({ text: string } | { link: string; text: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ link: m[1]!, text: m[2] ?? m[1]! });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
