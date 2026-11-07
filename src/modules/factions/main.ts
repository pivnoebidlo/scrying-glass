// Factions and the exploration clock of each adventure (see types.ts). The window passes the rules of the package.
import { randomUUID } from 'node:crypto';
import { die } from '../../shared/dice';
import type { ExplorationRules, GoalRoll } from '../../shared/generators';
import { defineModule } from '../../shared/module';
import { blankAdventure, blankClock, currentGoal, WATCHES, type Clock, type EncounterRoll, type Faction, type FactionGoal, type FactionsAdventure, type FactionsState, type Warband } from './types';

const initialState: FactionsState = { byAdventure: {} };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));
const key = (adventure: string | null) => adventure ?? '';

const withAdventure = (s: FactionsState, adventure: string | null, fn: (a: FactionsAdventure) => FactionsAdventure): FactionsState => ({
  ...s,
  byAdventure: { ...s.byAdventure, [key(adventure)]: fn(s.byAdventure[key(adventure)] ?? blankAdventure()) },
});
const withFaction = (s: FactionsState, adventure: string | null, id: string, fn: (f: Faction) => Faction) =>
  withAdventure(s, adventure, (a) => ({ ...a, factions: a.factions.map((f) => (f.id === id ? fn(f) : f)) }));
const goal = (g: Partial<FactionGoal>): FactionGoal => ({
  id: randomUUID(),
  text: g.text?.trim() ?? '',
  marks: clamp(g.marks ?? 3, 1, 10),
  progress: clamp(g.progress ?? 0, 0, g.marks ?? 3),
  relevant: clamp(g.relevant ?? 0, 0, 10),
  rival: clamp(g.rival ?? 0, 0, 10),
});

// An encounter roll, if the game has one; on a watch — with the hour, if the rules give it.
const encounter = (rules: ExplorationRules | undefined, at: EncounterRoll['at'], roll: (n: number) => number, turn?: number): EncounterRoll | null => {
  const e = rules?.encounter;
  if (!e) return null;
  const r = roll(e.die);
  return { at, roll: r, ...(turn ? { turn } : {}), ...(at === 'watch' && e.hour && r <= e.hour.upTo ? { hour: roll(e.hour.die) } : {}) };
};

export default defineModule({
  id: 'factions',
  persist: true,
  initialState,

  actions: {
    // ---- Factions ----

    addFaction(s, { adventure, name, resources, goals }: { adventure: string | null; name: string; resources?: string[]; goals?: Partial<FactionGoal>[] }) {
      const f: Faction = { id: randomUUID(), name: name.trim(), resources: (resources ?? []).map((r) => r.trim()).filter(Boolean), goals: (goals ?? []).map(goal) };
      return withAdventure(s, adventure, (a) => ({ ...a, factions: [...a.factions, f] }));
    },

    updateFaction(s, { adventure, id, changes }: { adventure: string | null; id: string; changes: Partial<Pick<Faction, 'name' | 'resources'>> }) {
      return withFaction(s, adventure, id, (f) => ({
        ...f,
        ...(changes.name !== undefined ? { name: changes.name.trim() || f.name } : {}),
        ...(changes.resources ? { resources: changes.resources.map((r) => r.trim()).filter(Boolean) } : {}),
      }));
    },

    removeFaction(s, { adventure, id }: { adventure: string | null; id: string }) {
      return withAdventure(s, adventure, (a) => ({ ...a, factions: a.factions.filter((f) => f.id !== id), session: a.session.filter((r) => r.faction !== id) }));
    },

    addGoal(s, { adventure, id, text, marks }: { adventure: string | null; id: string; text: string; marks?: number }) {
      return withFaction(s, adventure, id, (f) => ({ ...f, goals: [...f.goals, goal({ text, marks })] }));
    },

    updateGoal(s, { adventure, id, goal: gid, changes }: { adventure: string | null; id: string; goal: string; changes: Partial<Omit<FactionGoal, 'id'>> }) {
      return withFaction(s, adventure, id, (f) => ({
        ...f,
        goals: f.goals.map((g) => {
          if (g.id !== gid) return g;
          const marks = changes.marks !== undefined ? clamp(changes.marks, 1, 10) : g.marks;
          return {
            ...g,
            text: changes.text !== undefined ? changes.text.trim() || g.text : g.text,
            marks,
            progress: clamp(changes.progress ?? g.progress, 0, marks),
            relevant: changes.relevant !== undefined ? clamp(changes.relevant, 0, 10) : g.relevant,
            rival: changes.rival !== undefined ? clamp(changes.rival, 0, 10) : g.rival,
          };
        }),
      }));
    },

    removeGoal(s, { adventure, id, goal: gid }: { adventure: string | null; id: string; goal: string }) {
      return withFaction(s, adventure, id, (f) => ({ ...f, goals: f.goals.filter((g) => g.id !== gid) }));
    },

    // Between sessions every faction works on its current goal: a die + its relevant resources − the rival's; the
    // rules say what the total gives. A completed goal is the GM's cue to add a resource (the result says so).
    betweenSessions(s, { adventure, rules }: { adventure: string | null; rules?: GoalRoll }, _ctx, roll: (n: number) => number = die) {
      if (!rules) return s;
      return withAdventure(s, adventure, (a) => {
        const session: FactionsAdventure['session'] = [];
        const factions = a.factions.map((f) => {
          const g = currentGoal(f);
          if (!g) return f;
          const r = roll(rules.die);
          const total = r + g.relevant - g.rival;
          const gained = [...rules.steps].sort((x, y) => y.from - x.from).find((x) => total >= x.from)?.gained ?? 0;
          const progress = Math.min(g.marks, g.progress + gained);
          session.push({ faction: f.id, goal: g.id, roll: r, total, gained, completed: progress >= g.marks });
          return { ...f, goals: f.goals.map((x) => (x.id === g.id ? { ...x, progress } : x)) };
        });
        return { ...a, factions, session };
      });
    },

    // ---- Warbands ----

    // A warband formed today (the clock's day); its card is made by the window and remembered with `updateWarband`.
    formWarband(s, { adventure, name, card }: { adventure: string | null; name: string; card?: Warband['card'] }) {
      return withAdventure(s, adventure, (a) => {
        const w: Warband = { id: randomUUID(), name: name.trim(), formed: a.clock.day, paid: 0, ...(card ? { card } : {}) };
        return { ...a, warbands: [...(a.warbands ?? []), w] };
      });
    },

    updateWarband(s, { adventure, id, changes }: { adventure: string | null; id: string; changes: Partial<Pick<Warband, 'name' | 'card'>> }) {
      return withAdventure(s, adventure, (a) => ({
        ...a,
        warbands: (a.warbands ?? []).map((w) => (w.id === id ? { ...w, ...(changes.name?.trim() ? { name: changes.name.trim() } : {}), ...(changes.card !== undefined ? { card: changes.card } : {}) } : w)),
      }));
    },

    // A week of upkeep paid (step −1 — taken back).
    payWarband(s, { adventure, id, step = 1 }: { adventure: string | null; id: string; step?: 1 | -1 }) {
      return withAdventure(s, adventure, (a) => ({ ...a, warbands: (a.warbands ?? []).map((w) => (w.id === id ? { ...w, paid: Math.max(0, w.paid + step) } : w)) }));
    },

    disbandWarband(s, { adventure, id }: { adventure: string | null; id: string }) {
      return withAdventure(s, adventure, (a) => ({ ...a, warbands: (a.warbands ?? []).filter((w) => w.id !== id) }));
    },

    // ---- Exploration clock ----

    // A major action in an adventure site: a turn. The rules say which turns roll an encounter.
    turn(s, { adventure, step = 1, rules }: { adventure: string | null; step?: 1 | -1; rules?: ExplorationRules }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => {
        const t = Math.max(0, a.clock.turn + step);
        const every = rules?.turn?.every;
        const last = step > 0 && every && t % every === 0 ? encounter(rules, 'turn', roll, t) : step > 0 ? a.clock.last : null;
        return { ...a, clock: { ...a.clock, turn: t, last } };
      });
    },

    // A watch of travel; the last one ends the day. The rules say which watches start with an encounter roll.
    watch(s, { adventure, rules }: { adventure: string | null; rules?: ExplorationRules }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => {
        const over = a.clock.watch >= (rules?.watch?.names?.length ?? WATCHES);
        const next = over ? 1 : a.clock.watch + 1;
        const clock: Clock = { ...a.clock, watch: next, day: a.clock.day + (over ? 1 : 0), last: rules?.watch?.rolls?.includes(next) ? encounter(rules, 'watch', roll) : null };
        return { ...a, clock };
      });
    },

    rollEncounter(s, { adventure, rules }: { adventure: string | null; rules?: ExplorationRules }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => ({ ...a, clock: { ...a.clock, last: encounter(rules, 'manual', roll, a.clock.turn || undefined) ?? a.clock.last } }));
    },

    // A new adventure site: the turns start over (the day and the watch stay).
    resetTurns(s, { adventure }: { adventure: string | null }) {
      return withAdventure(s, adventure, (a) => ({ ...a, clock: { ...a.clock, turn: 0, last: null } }));
    },

    resetClock(s, { adventure }: { adventure: string | null }) {
      return withAdventure(s, adventure, (a) => ({ ...a, clock: blankClock() }));
    },
  },
});
