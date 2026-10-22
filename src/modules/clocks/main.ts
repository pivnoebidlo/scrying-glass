// Progress clocks of each adventure (see types.ts).
import { randomUUID } from 'node:crypto';
import { defineModule } from '../../shared/module';
import { CLOCK_TONES, MAX_SEGMENTS, type Clock, type ClocksState, type ClockTone } from './types';
import { CORNERS, type Corner } from '../fate/types';

const initialState: ClocksState = { byAdventure: {}, place: 'top-right', size: 'medium' };

const key = (adventure: string | null) => adventure ?? '';
const segs = (n: unknown) => (typeof n === 'number' && isFinite(n) ? Math.min(MAX_SEGMENTS, Math.max(2, Math.round(n))) : 4);
const tone = (t: unknown): ClockTone => (CLOCK_TONES.includes(t as ClockTone) ? (t as ClockTone) : 'danger');

const withClocks = (s: ClocksState, adventure: string | null, fn: (list: Clock[]) => Clock[]): ClocksState => ({
  ...s,
  byAdventure: { ...s.byAdventure, [key(adventure)]: fn(s.byAdventure[key(adventure)] ?? []) },
});
const withClock = (s: ClocksState, adventure: string | null, id: string, fn: (c: Clock) => Clock) =>
  withClocks(s, adventure, (list) => list.map((c) => (c.id === id ? fn(c) : c)));

export default defineModule({
  id: 'clocks',
  persist: true,
  initialState,

  // Old saves: fill in what is missing.
  init: (s) => ({ ...initialState, ...s, byAdventure: s.byAdventure ?? {} }),

  actions: {
    add(s, { adventure, title, segments, tone: t, shown }: { adventure: string | null; title: string; segments?: number; tone?: ClockTone; shown?: boolean }) {
      const c: Clock = { id: randomUUID(), title: title.trim(), segments: segs(segments), filled: 0, tone: tone(t), shown: shown ?? true };
      return withClocks(s, adventure, (list) => [...list, c]);
    },

    update(s, { adventure, id, changes }: { adventure: string | null; id: string; changes: Partial<Omit<Clock, 'id'>> }) {
      return withClock(s, adventure, id, (c) => {
        const segments = changes.segments !== undefined ? segs(changes.segments) : c.segments;
        return {
          ...c,
          title: changes.title !== undefined ? changes.title.trim() || c.title : c.title,
          segments,
          filled: Math.min(segments, Math.max(0, Math.round(changes.filled ?? c.filled))),
          tone: changes.tone !== undefined ? tone(changes.tone) : c.tone,
          shown: changes.shown ?? c.shown,
        };
      });
    },

    // A tick forward (or back, with a negative step), within the clock.
    tick(s, { adventure, id, by }: { adventure: string | null; id: string; by: number }) {
      return withClock(s, adventure, id, (c) => ({ ...c, filled: Math.min(c.segments, Math.max(0, c.filled + Math.round(by))) }));
    },

    remove(s, { adventure, id }: { adventure: string | null; id: string }) {
      return withClocks(s, adventure, (list) => list.filter((c) => c.id !== id));
    },

    // Drag order in the right panel.
    reorder(s, { adventure, ids }: { adventure: string | null; ids: string[] }) {
      return withClocks(s, adventure, (list) => [...ids.flatMap((id) => list.filter((c) => c.id === id)), ...list.filter((c) => !ids.includes(c.id))]);
    },

    setPlace(s, { place }: { place: Corner }) {
      return CORNERS.includes(place) ? { ...s, place } : s;
    },

    setSize(s, { size }: { size: ClocksState['size'] }) {
      return ['small', 'medium', 'large'].includes(size) ? { ...s, size } : s;
    },
  },
});
