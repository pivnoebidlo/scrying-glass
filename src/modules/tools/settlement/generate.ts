// Settlement generation: pure functions over the content of one language. Tavern names and people come from the
// tavern and NPC generators through callbacks (the page passes them in).
import { RACES } from '../../../shared/names';
import type { Person, Settlement, SettlementContent, SettlementPart, Size } from './types';

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;
function pickSome<T>(list: T[], n: number, r: Random): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return out;
}

const POPULATION: Record<Size, [number, number]> = { hamlet: [20, 80], village: [100, 900], town: [1000, 6000], city: [8000, 25000] };
const PLACES: Record<Size, number> = { hamlet: 1, village: 2, town: 4, city: 6 };
const PEOPLE: Record<Size, number> = { hamlet: 1, village: 2, town: 3, city: 4 };
const RACE_WEIGHTS: Record<string, number> = { human: 50, dwarf: 12, halfling: 12, elf: 10, gnome: 7, tiefling: 5, dragonborn: 4 };

export interface Helpers {
  tavernName: () => string;
  person: (race: string) => Person;
}

function weightedRace(r: Random, not: string[]): string {
  const list = RACES.filter((x) => !not.includes(x));
  const total = list.reduce((n, x) => n + (RACE_WEIGHTS[x] ?? 5), 0);
  let v = r() * total;
  for (const x of list) if ((v -= RACE_WEIGHTS[x] ?? 5) < 0) return x;
  return list[0]!;
}

export function generateSettlementPart(part: SettlementPart, s: Settlement, c: SettlementContent, h: Helpers, r: Random = Math.random): Partial<Settlement> {
  switch (part) {
    case 'name':
      return { name: c.name(r) };
    case 'overview': {
      const [lo, hi] = POPULATION[s.size];
      // Round to a believable number: tens in a village, hundreds in a town.
      const step = s.size === 'hamlet' ? 5 : s.size === 'village' ? 10 : 100;
      const population = Math.round((lo + r() * (hi - lo)) / step) * step;
      const races: string[] = [weightedRace(r, [])];
      const more = s.size === 'hamlet' ? (r() < 0.3 ? 1 : 0) : s.size === 'village' ? 1 : 2 + Math.floor(r() * 2);
      while (races.length < 1 + more) races.push(weightedRace(r, races));
      return {
        population,
        races,
        government: pick(c.governments[s.size], r),
        defense: pick(c.defenses[s.size], r),
        impression: pick(c.impressions[s.size], r),
      };
    }
    case 'knownFor':
      return { knownFor: pickSome(c.knownFor, s.size === 'city' || s.size === 'town' ? 2 : 1, r) };
    case 'trouble':
      return { trouble: pick(c.troubles, r) };
    case 'places': {
      const pool = s.size === 'town' || s.size === 'city' ? [...c.smallPlaces, ...c.bigPlaces] : c.smallPlaces;
      return { tavern: h.tavernName(), places: pickSome(pool, PLACES[s.size], r) };
    }
    case 'people':
      return { people: Array.from({ length: PEOPLE[s.size] }, () => h.person(r() < 0.6 ? s.races[0]! : pick(s.races, r))) };
  }
}

const ORDER: SettlementPart[] = ['name', 'overview', 'knownFor', 'places', 'people', 'trouble'];

export function generateSettlement(size: Size, c: SettlementContent, h: Helpers, r: Random = Math.random): Settlement {
  let s = { size } as Settlement;
  for (const part of ORDER) s = { ...s, ...generateSettlementPart(part, s, c, h, r) };
  return s;
}

export function rerollSettlement(s: Settlement, pinned: SettlementPart[], c: SettlementContent, h: Helpers, r: Random = Math.random): Settlement {
  let next = { ...s };
  for (const part of ORDER) if (!pinned.includes(part)) next = { ...next, ...generateSettlementPart(part, next, c, h, r) };
  return next;
}

// The trouble with the first notable person's name put in.
export const troubleText = (s: Settlement) => s.trouble.replace(/\{person\}/g, s.people[0]?.name ?? '…');

// A Russian name from a stem and a suffix: «Ольх» + «овка». A suffix starting with a consonant needs a vowel just
// before the stem's last letter (no «Соснск»).
export const fitsSuffix = (stem: string, suffix: string) =>
  /^[аеёиоуыэюя]/i.test(suffix) || /[аеёиоуыэюя]/i.test(stem.slice(-2, -1));
