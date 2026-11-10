// The parts of a ship, in order: the kind first (the crew's size depends on it).
import { between, pick, type PartSpec } from '../engine';
import type { ShipContent } from './types';

export const shipParts: PartSpec<ShipContent>[] = [
  {
    id: 'kind',
    roll: (c, _now, _h, r) => {
      const i = Math.floor(r() * c.kinds.length);
      return { kind: String(i), kindName: c.kinds[i]!.name, kindAbout: c.kinds[i]!.about };
    },
  },
  {
    id: 'name',
    roll: (c, _now, _h, r) => {
      const noun = pick(c.nouns, r);
      return { name: c.nameOf(pick(c.adjectives, r)[noun.g], noun.word) };
    },
  },
  {
    id: 'captain',
    roll: (c, _now, h) => {
      const p = h.person();
      return { captain: `${c.captainTitle} ${p.name}`, captainTrait: p.trait };
    },
  },
  {
    id: 'crew',
    roll: (c, now, _h, r) => {
      const [lo, hi] = c.kinds[Number(now['kind'] ?? 0)]?.crew ?? [5, 10];
      return { crewSize: String(between(lo, hi, r)), crewMood: pick(c.moods, r) };
    },
  },
  { id: 'cargo', roll: (c, _n, _h, r) => ({ cargo: pick(c.cargo, r) }) },
  { id: 'quirk', roll: (c, _n, _h, r) => ({ quirk: pick(c.quirks, r) }) },
  { id: 'secret', roll: (c, _n, _h, r) => ({ secret: pick(c.secrets, r) }) },
  { id: 'trouble', roll: (c, _n, _h, r) => ({ trouble: pick(c.troubles, r) }) },
];
