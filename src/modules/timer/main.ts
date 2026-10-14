// Таймер на экране игроков (см. types.ts). Время — от часов ядра, окна только пересчитывают остаток.
import { defineModule } from '../../shared/module';
import type { TimerPosition, TimerState, TimerStyle } from './types';

const initialState: TimerState = {
  active: false,
  label: '',
  duration: 0,
  endsAt: null,
  remaining: null,
  style: 'hourglass',
  position: 'top-right',
  sound: true,
  shown: true,
};

const MAX = 24 * 3600 * 1000;

export default defineModule({
  id: 'timer',
  persist: true,
  initialState,

  actions: {
    start(s, { duration, label }: { duration: number; label?: string }) {
      const d = Math.min(MAX, Math.max(1000, Math.round(duration)));
      return { ...s, active: true, label: label?.trim() ?? s.label, duration: d, endsAt: Date.now() + d, remaining: null };
    },

    pause(s) {
      if (s.endsAt === null) return s;
      return { ...s, remaining: Math.max(0, s.endsAt - Date.now()), endsAt: null };
    },

    resume(s) {
      if (s.endsAt !== null || s.remaining === null || s.remaining <= 0) return s;
      return { ...s, endsAt: Date.now() + s.remaining, remaining: null };
    },

    // Добавить время (отрицательное — убавить). Вышедший таймер снова идёт.
    add(s, { ms }: { ms: number }) {
      if (!s.active) return s;
      const left = s.endsAt !== null ? Math.max(0, s.endsAt - Date.now()) : (s.remaining ?? 0);
      const next = Math.min(MAX, Math.max(0, left + ms));
      const duration = Math.max(next, s.duration + Math.max(0, ms));
      if (s.endsAt !== null || left === 0) return { ...s, duration, endsAt: Date.now() + next, remaining: null };
      return { ...s, duration, remaining: next };
    },

    stop(s) {
      return { ...s, active: false, endsAt: null, remaining: null };
    },

    setLabel(s, { label }: { label: string }) {
      return { ...s, label };
    },

    setView(s, changes: { style?: TimerStyle; position?: TimerPosition; sound?: boolean; shown?: boolean }) {
      return { ...s, ...changes };
    },
  },
});
