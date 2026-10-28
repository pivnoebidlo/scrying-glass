import { describe, expect, it } from 'vitest';
import { gameEvents } from '../src/modules/compendium/events';
import type { AppState } from '../src/shared/types';
import type { Combatant } from '../src/modules/initiative/types';

const fighter = (id: string, hp: number | null, extra: Partial<Combatant> = {}) => ({ id, name: id, hp, ...extra }) as Combatant;
const state = (round: number, combatants: Combatant[], clock = { turn: 0, watch: 1, day: 1, last: null }, current: string | null = 'A') =>
  ({
    initiative: { round, combatants },
    mausritter: { byAdventure: { [current ?? '']: { factions: [], session: [], clock } } },
    adventures: { list: ['A', 'B'], current, initialized: true },
  }) as unknown as AppState;

describe('events roll tables are offered on', () => {
  it('a fight begins, then a new round; going back is nothing', () => {
    expect(gameEvents(state(0, []), state(1, [])).map((e) => e.on)).toEqual(['combat']);
    expect(gameEvents(state(1, []), state(2, []))).toEqual([{ on: 'round', who: '', n: 2 }]);
    expect(gameEvents(state(3, []), state(2, []))).toEqual([]);
    expect(gameEvents(state(2, []), state(0, []))).toEqual([]);
  });

  it('a participant goes down in a fight: no hit points, out, Mausritter STR 0', () => {
    const before = [fighter('Goblin', 5), fighter('Mouse', 3, { attrs: [{ id: 'str', value: 2, max: 8 }] } as Partial<Combatant>), fighter('Hero', 4)];
    const after = [fighter('Goblin', 0), fighter('Mouse', 3, { attrs: [{ id: 'str', value: 0, max: 8 }] } as Partial<Combatant>), fighter('Hero', 4, { out: true })];
    expect(gameEvents(state(2, before), state(2, after)).map((e) => e.who)).toEqual(['Goblin', 'Mouse', 'Hero']);
    // Already down, or no fight going: nothing.
    expect(gameEvents(state(2, after), state(2, after))).toEqual([]);
    expect(gameEvents(state(0, before), state(0, after))).toEqual([]);
  });

  it('a watch or a day passes on the clock of the same adventure', () => {
    const c = (watch: number, day: number) => ({ turn: 0, watch, day, last: null });
    expect(gameEvents(state(0, [], c(1, 1)), state(0, [], c(2, 1)))).toEqual([{ on: 'watch', who: '', n: 2, day: 1 }]);
    expect(gameEvents(state(0, [], c(4, 1)), state(0, [], c(1, 2)))).toEqual([{ on: 'watch', who: '', n: 1, day: 2 }]);
    expect(gameEvents(state(0, [], c(2, 1)), state(0, [], c(1, 1)))).toEqual([]);
    expect(gameEvents(state(0, [], c(1, 1), 'A'), state(0, [], c(3, 5), 'B'))).toEqual([]);
  });
});
