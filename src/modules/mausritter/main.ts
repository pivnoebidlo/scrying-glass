// Mausritter: factions and the exploration clock of each adventure (see types.ts). Shown in Mausritter adventures.
import { randomUUID } from 'node:crypto';
import { die } from '../../shared/dice';
import { defineModule } from '../../shared/module';
import { blankAdventure, blankClock, currentGoal, WATCHES, type Clock, type EncounterRoll, type Faction, type FactionGoal, type MausAdventure, type MausState, type Warband } from './types';

const initialState: MausState = { byAdventure: {} };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));
const key = (adventure: string | null) => adventure ?? '';

const withAdventure = (s: MausState, adventure: string | null, fn: (a: MausAdventure) => MausAdventure): MausState => ({
  ...s,
  byAdventure: { ...s.byAdventure, [key(adventure)]: fn(s.byAdventure[key(adventure)] ?? blankAdventure()) },
});
const withFaction = (s: MausState, adventure: string | null, id: string, fn: (f: Faction) => Faction) =>
  withAdventure(s, adventure, (a) => ({ ...a, factions: a.factions.map((f) => (f.id === id ? fn(f) : f)) }));
const goal = (g: Partial<FactionGoal>): FactionGoal => ({
  id: randomUUID(),
  text: g.text?.trim() ?? '',
  marks: clamp(g.marks ?? 3, 1, 10),
  progress: clamp(g.progress ?? 0, 0, g.marks ?? 3),
  relevant: clamp(g.relevant ?? 0, 0, 10),
  rival: clamp(g.rival ?? 0, 0, 10),
});

// An encounter roll; in the wilderness — with the hour.
const encounter = (at: EncounterRoll['at'], roll: (n: number) => number, turn?: number): EncounterRoll => {
  const r = roll(6);
  return { at, roll: r, ...(turn ? { turn } : {}), ...(at === 'watch' && r <= 2 ? { hour: roll(12) } : {}) };
};

export default defineModule({
  id: 'mausritter',
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

    // Between sessions every faction works on its current goal: d6 + its relevant resources − the rival's;
    // 4–5 — one mark, 6+ — two. A completed goal is the GM's cue to add a resource (the result says so).
    betweenSessions(s, { adventure }: { adventure: string | null }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => {
        const session: MausAdventure['session'] = [];
        const factions = a.factions.map((f) => {
          const g = currentGoal(f);
          if (!g) return f;
          const r = roll(6);
          const total = r + g.relevant - g.rival;
          const gained = total >= 6 ? 2 : total >= 4 ? 1 : 0;
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

    // A major action in an adventure site: a turn. Every third turn — an encounter roll.
    turn(s, { adventure, step = 1 }: { adventure: string | null; step?: 1 | -1 }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => {
        const t = Math.max(0, a.clock.turn + step);
        const last = step > 0 && t % 3 === 0 ? encounter('turn', roll, t) : step > 0 ? a.clock.last : null;
        return { ...a, clock: { ...a.clock, turn: t, last } };
      });
    },

    // A watch of travel: four make a day; the morning and the evening watch start with an encounter roll.
    watch(s, { adventure }: { adventure: string | null }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => {
        const next = a.clock.watch >= WATCHES ? 1 : a.clock.watch + 1;
        const day = a.clock.watch >= WATCHES ? a.clock.day + 1 : a.clock.day;
        const clock: Clock = { ...a.clock, watch: next, day, last: next === 1 || next === 3 ? encounter('watch', roll) : null };
        return { ...a, clock };
      });
    },

    rollEncounter(s, { adventure }: { adventure: string | null }, _ctx, roll: (n: number) => number = die) {
      return withAdventure(s, adventure, (a) => ({ ...a, clock: { ...a.clock, last: encounter('manual', roll, a.clock.turn || undefined) } }));
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
