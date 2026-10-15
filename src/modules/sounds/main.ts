// Звуки (см. types.ts).
import { defineModule } from '../../shared/module';
import type { SoundsState } from './types';

const initialState: SoundsState = { last: { path: null, seq: 0 }, volume: 0.9 };

export default defineModule({
  id: 'sounds',
  persist: true,
  initialState,

  actions: {
    play(s, { path }: { path: string }) {
      return { ...s, last: { path, seq: s.last.seq + 1 } };
    },

    stop(s) {
      return { ...s, last: { path: null, seq: s.last.seq + 1 } };
    },

    setVolume(s, { value }: { value: number }) {
      return { ...s, volume: Math.min(1, Math.max(0, value)) };
    },
  },
});
