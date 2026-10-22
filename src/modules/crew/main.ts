// Forged in the Dark: the crew of each adventure (see types.ts). Shown in Forged in the Dark adventures.
import { randomUUID } from 'node:crypto';
import { rollPool, type PoolRoll } from '../../shared/dice';
import { defineModule } from '../../shared/module';
import { blankCrew, develop, entanglementsFor, normalize, withHeat, withRep, type Cohort, type Crew, type CrewFaction, type CrewState } from './types';

const initialState: CrewState = { byAdventure: {} };

const key = (adventure: string | null) => adventure ?? '';
const withCrew = (s: CrewState, adventure: string | null, fn: (c: Crew) => Crew): CrewState => ({
  ...s,
  byAdventure: { ...s.byAdventure, [key(adventure)]: normalize(fn(s.byAdventure[key(adventure)] ?? blankCrew())) },
});
const lines = (list: string[]) => list.map((x) => x.trim()).filter(Boolean);

type Fields = Omit<Crew, 'cohorts' | 'factions' | 'last'>;

export default defineModule({
  id: 'crew',
  persist: true,
  initialState,

  actions: {
    // Any of the plain fields; numbers are kept in range.
    update(s, { adventure, changes }: { adventure: string | null; changes: Partial<Fields> }) {
      return withCrew(s, adventure, (c) => ({
        ...c,
        ...changes,
        ...(changes.upgrades ? { upgrades: lines(changes.upgrades) } : {}),
        ...(changes.claims ? { claims: lines(changes.claims) } : {}),
      }));
    },

    // Heat over 9 becomes a wanted level (the excess rolls over).
    heat(s, { adventure, delta }: { adventure: string | null; delta: number }) {
      return withCrew(s, adventure, (c) => withHeat(c, delta));
    },

    rep(s, { adventure, delta }: { adventure: string | null; delta: number }) {
      return withCrew(s, adventure, (c) => withRep(c, delta));
    },

    // A full rep tracker: strengthen hold, or pay for the next tier.
    develop(s, { adventure }: { adventure: string | null }) {
      return withCrew(s, adventure, (c) => develop(c) ?? c);
    },

    // After a score: rep, coin and heat at once.
    payoff(s, { adventure, rep, coin, heat }: { adventure: string | null; rep: number; coin: number; heat: number }) {
      return withCrew(s, adventure, (c) => withHeat({ ...withRep(c, rep), coin: c.coin + Math.max(0, Math.round(coin)) }, heat));
    },

    // Entanglements: dice = the wanted level (0 — two, the lowest), the column — the current heat.
    entanglement(s, { adventure }: { adventure: string | null }, _ctx, pool: (n: number) => PoolRoll = rollPool) {
      return withCrew(s, adventure, (c) => {
        const roll = pool(c.wanted);
        return { ...c, last: { roll, heat: c.heat, options: [...entanglementsFor(c.heat, roll.result)] } };
      });
    },

    clearLast(s, { adventure }: { adventure: string | null }) {
      return withCrew(s, adventure, (c) => ({ ...c, last: null }));
    },

    addCohort(s, { adventure, kind }: { adventure: string | null; kind: Cohort['kind'] }) {
      const x: Cohort = { id: randomUUID(), name: '', kind, type: '', edges: '', flaws: '', harm: 0 };
      return withCrew(s, adventure, (c) => ({ ...c, cohorts: [...c.cohorts, x] }));
    },

    updateCohort(s, { adventure, id, changes }: { adventure: string | null; id: string; changes: Partial<Omit<Cohort, 'id'>> }) {
      return withCrew(s, adventure, (c) => ({ ...c, cohorts: c.cohorts.map((x) => (x.id === id ? { ...x, ...changes } : x)) }));
    },

    removeCohort(s, { adventure, id }: { adventure: string | null; id: string }) {
      return withCrew(s, adventure, (c) => ({ ...c, cohorts: c.cohorts.filter((x) => x.id !== id) }));
    },

    addFaction(s, { adventure, name, tier, status }: { adventure: string | null; name: string; tier?: number; status?: number }) {
      const f: CrewFaction = { id: randomUUID(), name: name.trim(), tier: tier ?? 1, hold: 'strong', status: status ?? 0 };
      return withCrew(s, adventure, (c) => ({ ...c, factions: [...c.factions, f] }));
    },

    updateFaction(s, { adventure, id, changes }: { adventure: string | null; id: string; changes: Partial<Omit<CrewFaction, 'id'>> }) {
      return withCrew(s, adventure, (c) => ({
        ...c,
        factions: c.factions.map((f) => (f.id === id ? { ...f, ...changes, name: changes.name !== undefined ? changes.name.trim() || f.name : f.name } : f)),
      }));
    },

    removeFaction(s, { adventure, id }: { adventure: string | null; id: string }) {
      return withCrew(s, adventure, (c) => ({ ...c, factions: c.factions.filter((f) => f.id !== id) }));
    },
  },
});
