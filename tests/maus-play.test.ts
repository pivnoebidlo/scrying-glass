import { describe, expect, it } from 'vitest';
import factions from '../src/modules/factions/main';
import type { FactionsState } from '../src/modules/factions/types';
import { currentGoal } from '../src/modules/factions/types';
import { warbandUpkeep } from '../src/shared/generators';
import { readFileSync } from 'node:fs';
import { ctx, run } from './helpers';

const EXAMPLE_FACTIONS = JSON.parse(readFileSync('content/mausritter/generators/mausritter.json', 'utf8')).factions as Record<'en' | 'ru', { name: string; resources: string[]; goals: { text: string; marks: number }[] }[]>;
const S0 = factions.initialState;
const A = 'Forest';
const act = (s: FactionsState, a: string, p?: unknown) => run(factions, s, a, { adventure: A, ...(p as object) });
// An action with fixed rolls (the fourth argument of the rolling actions).
const rolled = (s: FactionsState, a: string, rolls: number[], p?: unknown) => {
  let i = 0;
  const fn = factions.actions[a as 'turn'] as unknown as (s: FactionsState, p: unknown, c: unknown, r: () => number) => FactionsState;
  return fn(s, { adventure: A, ...(p as object) }, ctx(), () => rolls[i++] ?? 6);
};
const of = (s: FactionsState) => s.byAdventure[A]!;

describe('Mausritter factions', () => {
  it('ten example factions in both languages with the same goals', () => {
    expect(EXAMPLE_FACTIONS.en).toHaveLength(10);
    expect(EXAMPLE_FACTIONS.ru[0]!.name).toBe('Кошачий владыка');
    expect(EXAMPLE_FACTIONS.ru.map((f) => f.goals.map((g) => g.marks))).toEqual(EXAMPLE_FACTIONS.en.map((f) => f.goals.map((g) => g.marks)));
  });

  it('between sessions: d6 + relevant − rival; 4–5 one mark, 6+ two; the next goal becomes current', () => {
    const cat = EXAMPLE_FACTIONS.en[0]!;
    let s = act(S0, 'addFaction', { name: cat.name, resources: cat.resources, goals: cat.goals });
    const f = of(s).factions[0]!;
    s = act(s, 'updateGoal', { id: f.id, goal: f.goals[0]!.id, changes: { relevant: 2, rival: 1 } });
    s = rolled(s, 'betweenSessions', [4]);
    expect(of(s).session[0]).toMatchObject({ roll: 4, total: 5, gained: 1, completed: false });
    s = rolled(s, 'betweenSessions', [6]);
    expect(of(s).session[0]).toMatchObject({ total: 7, gained: 2, completed: true });
    expect(currentGoal(of(s).factions[0]!)!.text).toBe('Kidnap mouse servants');
    s = rolled(s, 'betweenSessions', [3]);
    expect(of(s).session[0]!.gained).toBe(0);
  });

  it('progress stays within the marks; a removed faction leaves the session log', () => {
    let s = act(S0, 'addFaction', { name: 'Rats', goals: [{ text: 'Rob', marks: 2 }] });
    const f = of(s).factions[0]!;
    s = act(s, 'updateGoal', { id: f.id, goal: f.goals[0]!.id, changes: { progress: 9 } });
    expect(of(s).factions[0]!.goals[0]!.progress).toBe(2);
    s = rolled(s, 'betweenSessions', [6]);
    s = act(s, 'removeFaction', { id: f.id });
    expect(of(s).factions).toEqual([]);
  });
});

describe('Mausritter clock', () => {
  it('every third turn rolls an encounter; going back clears it', () => {
    let s = rolled(S0, 'turn', []);
    s = rolled(s, 'turn', []);
    expect(of(s).clock).toMatchObject({ turn: 2, last: null });
    s = rolled(s, 'turn', [1]);
    expect(of(s).clock.last).toEqual({ at: 'turn', roll: 1, turn: 3 });
    s = rolled(s, 'turn', [], { step: -1 });
    expect(of(s).clock).toMatchObject({ turn: 2, last: null });
  });

  it('watches: four a day; morning and evening roll an encounter with its hour', () => {
    let s = rolled(S0, 'watch', []);
    expect(of(s).clock).toMatchObject({ watch: 2, day: 1, last: null });
    s = rolled(s, 'watch', [2, 7]);
    expect(of(s).clock.last).toEqual({ at: 'watch', roll: 2, hour: 7 });
    s = rolled(s, 'watch', []);
    s = rolled(s, 'watch', [5]);
    expect(of(s).clock).toMatchObject({ watch: 1, day: 2, last: { roll: 5 } });
  });
});

describe('Mausritter warbands', () => {
  it('upkeep for each week begun since it was formed, by the days of the clock', async () => {
    const { weeksDue, weeksOwed } = await import('../src/modules/factions/types');
    let s = act(S0, 'formWarband', { name: ' Red Guard ', card: { scope: 'vault', id: 'w1' } });
    const w = of(s).warbands![0]!;
    expect(w).toMatchObject({ name: 'Red Guard', formed: 1, paid: 0, card: { scope: 'vault', id: 'w1' } });
    expect([weeksDue(w, 1), weeksDue(w, 7), weeksDue(w, 8), weeksDue(w, 15)]).toEqual([1, 1, 2, 3]);
    s = act(s, 'payWarband', { id: w.id });
    expect(weeksOwed(of(s).warbands![0]!, 7)).toBe(0);
    expect(weeksOwed(of(s).warbands![0]!, 8)).toBe(1);
    s = act(act(s, 'payWarband', { id: w.id, step: -1 }), 'payWarband', { id: w.id, step: -1 });
    expect(of(s).warbands![0]!.paid).toBe(0);
    s = act(s, 'updateWarband', { id: w.id, changes: { name: '  ' } });
    expect(of(s).warbands![0]!.name).toBe('Red Guard');
    expect(of(act(s, 'disbandWarband', { id: w.id })).warbands).toEqual([]);
  });

  it('formed on the day of the clock', () => {
    let s = S0;
    for (let i = 0; i < 8; i++) s = rolled(s, 'watch', [6]);
    expect(of(s).clock.day).toBe(3);
    expect(of(act(s, 'formWarband', { name: 'B' })).warbands![0]!.formed).toBe(3);
  });
});

describe('the upkeep of a warband is the package\'s', () => {
  it('reads the price and shows it in the package\'s money', () => {
    const { warband } = JSON.parse(readFileSync('content/mausritter/generators/mausritter.json', 'utf8'));
    expect(warbandUpkeep(warband, 'en')!.money(2)).toBe((2000).toLocaleString('en') + 'p');
  });
  it('a game without one, or a bad number, has no upkeep', () => {
    const base = { description: '', stats: {} };
    expect(warbandUpkeep(base, 'en')).toBeNull();
    expect(warbandUpkeep({ ...base, upkeep: { amount: 'a' as unknown as number, money: '{n}' } }, 'en')).toBeNull();
    expect(warbandUpkeep(undefined, 'en')).toBeNull();
  });
});
