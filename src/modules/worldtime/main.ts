// Time in the game world of each adventure (see types.ts).
import { defineModule } from '../../shared/module';
import { CORNERS, type Corner } from '../fate/types';
import { nextMorning, START, type WorldTime, type WorldTimeState } from './types';

const initialState: WorldTimeState = { byAdventure: {}, place: 'top-left' };

const key = (adventure: string | null) => adventure ?? '';
const fresh: WorldTime = { minutes: START, shown: false };
const withTime = (s: WorldTimeState, adventure: string | null, fn: (w: WorldTime) => WorldTime): WorldTimeState => ({
  ...s,
  byAdventure: { ...s.byAdventure, [key(adventure)]: fn(s.byAdventure[key(adventure)] ?? fresh) },
});
const valid = (n: unknown) => typeof n === 'number' && isFinite(n);

export default defineModule({
  id: 'worldtime',
  persist: true,
  initialState,

  init: (s) => ({ ...initialState, ...s, byAdventure: s.byAdventure ?? {} }),

  actions: {
    // Forward (or back, with a negative step); never before the start of day 1.
    advance(s, { adventure, minutes }: { adventure: string | null; minutes: number }) {
      return valid(minutes) ? withTime(s, adventure, (w) => ({ ...w, minutes: Math.max(0, Math.round(w.minutes + minutes)) })) : s;
    },

    untilMorning(s, { adventure }: { adventure: string | null }) {
      return withTime(s, adventure, (w) => ({ ...w, minutes: nextMorning(w.minutes) }));
    },

    set(s, { adventure, minutes }: { adventure: string | null; minutes: number }) {
      return valid(minutes) ? withTime(s, adventure, (w) => ({ ...w, minutes: Math.max(0, Math.round(minutes)) })) : s;
    },

    show(s, { adventure, shown }: { adventure: string | null; shown: boolean }) {
      return withTime(s, adventure, (w) => ({ ...w, shown }));
    },

    // Start over: the adventure has no time of its own again.
    reset(s, { adventure }: { adventure: string | null }) {
      const { [key(adventure)]: _, ...rest } = s.byAdventure;
      return { ...s, byAdventure: rest };
    },

    setPlace(s, { place }: { place: Corner }) {
      return CORNERS.includes(place) ? { ...s, place } : s;
    },
  },
});
