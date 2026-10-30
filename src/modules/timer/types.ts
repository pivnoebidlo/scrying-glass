// Таймер на экране игроков: «пока горит факел», «до обрушения потолка». Время считается от часов компьютера:
// идёт — известен момент окончания (endsAt), на паузе — сколько осталось (remaining).
export type TimerStyle = 'hourglass' | 'digits';
export type TimerPosition = 'top-right' | 'bottom-right' | 'center';
// The timer for the GM alone: a bar at the top of the GM window — when time is up, or all the time while it runs.
export type TimerGm = 'off' | 'end' | 'always';
export const TIMER_GM: TimerGm[] = ['off', 'end', 'always'];

export interface TimerState {
  // Таймер есть (идёт, на паузе или время вышло); false — убран.
  active: boolean;
  label: string;
  // Сколько всего было на таймере (с добавками), мс.
  duration: number;
  endsAt: number | null;
  remaining: number | null;
  style: TimerStyle;
  position: TimerPosition;
  // Сигнал в окне мастера, когда время вышло.
  sound: boolean;
  // Показывать ли таймер игрокам (можно засечь время только для себя).
  shown: boolean;
  // The bar in the GM window (none before 0.73 — 'end').
  gm?: TimerGm;
}

export const timeLeft = (s: TimerState, now: number) => (s.endsAt !== null ? Math.max(0, s.endsAt - now) : (s.remaining ?? 0));

// «4:05», «1:02:30».
export function clock(ms: number): string {
  const t = Math.ceil(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
