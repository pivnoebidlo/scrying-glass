// The parts of a guild and of a cult, in order: what it is first (its trade or entity brings names and goals).
import { pick, type PartSpec } from '../engine';
import type { OrgContent } from './types';

const leader = (kind: 'guild' | 'cult'): PartSpec<OrgContent> => ({
  id: 'leader',
  roll: (c, _now, h) => {
    const p = h.person();
    return { leader: `${p.name} — ${c.leaderTitle[kind]}`, leaderTrait: p.trait };
  },
});

export const guildParts: PartSpec<OrgContent>[] = [
  {
    id: 'what',
    roll: (c, _now, _h, r) => {
      const i = Math.floor(r() * c.trades.length);
      return { what: String(i), trade: c.trades[i]!.trade, name: pick(c.trades[i]!.names, r) };
    },
  },
  leader('guild'),
  { id: 'seat', roll: (c, _n, _h, r) => ({ seat: pick(c.seats, r) }) },
  { id: 'goal', roll: (c, now, _h, r) => ({ goal: pick(c.trades[Number(now['what'] ?? 0)]!.goals, r) }) },
  { id: 'custom', roll: (c, _n, _h, r) => ({ custom: pick(c.customs, r) }) },
  { id: 'rival', roll: (c, _n, _h, r) => ({ rival: pick(c.rivals, r) }) },
  { id: 'secret', roll: (c, _n, _h, r) => ({ secret: pick(c.guildSecrets, r) }) },
  { id: 'sign', roll: (c, _n, _h, r) => ({ sign: pick(c.signs, r) }) },
  { id: 'offer', roll: (c, now, _h, r) => ({ offer: pick(c.trades[Number(now['what'] ?? 0)]!.offers, r) }) },
];

export const cultParts: PartSpec<OrgContent>[] = [
  {
    id: 'what',
    roll: (c, _now, _h, r) => {
      const i = Math.floor(r() * c.entities.length);
      return { what: String(i), entity: c.entities[i]!.entity, name: pick(c.entities[i]!.names, r) };
    },
  },
  leader('cult'),
  { id: 'front', roll: (c, _n, _h, r) => ({ front: pick(c.fronts, r) }) },
  { id: 'rite', roll: (c, now, _h, r) => ({ rite: pick(c.entities[Number(now['what'] ?? 0)]!.rites, r) }) },
  { id: 'sign', roll: (c, _n, _h, r) => ({ sign: pick(c.signs, r) }) },
  { id: 'members', roll: (c, _n, _h, r) => ({ members: pick(c.members, r) }) },
  { id: 'goal', roll: (c, _n, _h, r) => ({ goal: pick(c.cultGoals, r) }) },
  { id: 'secret', roll: (c, _n, _h, r) => ({ secret: pick(c.cultSecrets, r) }) },
  {
    id: 'omens',
    roll: (c, _n, _h, r) => {
      const a = pick(c.omens, r);
      let b = pick(c.omens, r);
      for (let i = 0; i < 5 && b === a; i++) b = pick(c.omens, r);
      return { omens: a, omens2: b };
    },
  },
];
