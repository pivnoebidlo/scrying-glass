import { describe, expect, it } from 'vitest';
import mausritter from '../src/modules/mausritter/main';
import type { MausState } from '../src/modules/mausritter/types';
import { currentGoal } from '../src/modules/mausritter/types';
import { hirelings } from '../src/modules/tools/maus/generate';
import { lineText } from '../src/modules/tools/maus/text';
import { EXAMPLE_FACTIONS } from '../src/modules/tools/maus/srd';
import { ctx, run } from './helpers';

const S0 = mausritter.initialState;
const A = 'Forest';
const act = (s: MausState, a: string, p?: unknown) => run(mausritter, s, a, { adventure: A, ...(p as object) });
// An action with fixed rolls (the fourth argument of the rolling actions).
const rolled = (s: MausState, a: string, rolls: number[], p?: unknown) => {
  let i = 0;
  const fn = mausritter.actions[a as 'turn'] as unknown as (s: MausState, p: unknown, c: unknown, r: () => number) => MausState;
  return fn(s, { adventure: A, ...(p as object) }, ctx(), () => rolls[i++] ?? 6);
};
const of = (s: MausState) => s.byAdventure[A]!;

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

describe('Mausritter hirelings', () => {
  const seq = (...v: number[]) => {
    let i = 0;
    return () => v[i++] ?? 1;
  };
  it('a failed WIL save — nobody; paid — Number of them with SRD numbers', () => {
    expect(hirelings({ hireling: 0, paid: false, wil: 8 }, seq(15)).lines).toHaveLength(1);
    // Torchbearer: d6 → 2; each: name, HP, STR 2d6, DEX 2d6, WIL 2d6.
    const r = hirelings({ hireling: 0, paid: true, wil: 8 }, seq(2, 1, 3, 1, 1, 2, 2, 3, 3, 0));
    expect(r.lines).toHaveLength(3);
    expect(lineText(r.lines[1]!, 'en')).toBe('Bramble (torchbearer) — HP 3, STR 2, DEX 4, WIL 6');
  });
});
