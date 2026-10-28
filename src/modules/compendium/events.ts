// Roll tables offered on an event of the game (shared/rolltable.ts, TABLE_EVENTS): what happened between two states
// of the app. A fight began (round 0 → 1), a new round, a participant of the fight went down (no hit points left,
// Mausritter — STR 0), a watch or a day passed on the Mausritter exploration clock. Natural 20 and 1 are seen by the
// roll log itself. Pure: the compendium's background part compares states, tests check.
import type { AppState } from '../../shared/types';
import type { TableEvent } from '../../shared/rolltable';
import { down } from '../initiative/order';

export interface GameEvent {
  on: TableEvent;
  // For the roll log line: who (a participant) and what happened.
  who: string;
  // A number to tell what it was: the round, the watch.
  n?: number;
  day?: number;
}

type Slice = Pick<AppState, 'initiative' | 'mausritter' | 'adventures'>;

export function gameEvents(before: Slice, after: Slice): GameEvent[] {
  const out: GameEvent[] = [];
  const a = before.initiative;
  const b = after.initiative;
  if (a.round === 0 && b.round === 1) out.push({ on: 'combat', who: '' });
  else if (a.round > 0 && b.round > a.round) out.push({ on: 'round', who: '', n: b.round });
  if (b.round > 0) {
    const was = new Map(a.combatants.map((c) => [c.id, down(c)]));
    for (const c of b.combatants) if (was.get(c.id) === false && down(c)) out.push({ on: 'down', who: c.name });
  }
  // The clock of the same adventure only: switching adventures is not a watch passing.
  const adv = after.adventures.current ?? '';
  if ((before.adventures.current ?? '') === adv) {
    const x = before.mausritter.byAdventure[adv]?.clock;
    const y = after.mausritter.byAdventure[adv]?.clock;
    if (x && y && y.day * 10 + y.watch > x.day * 10 + x.watch) out.push({ on: 'watch', who: '', n: y.watch, day: y.day });
  }
  return out;
}
