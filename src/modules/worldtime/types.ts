// Time in the game world: minutes since the start of day 1, for each adventure ('' — the whole vault). The GM moves
// it on (ten minutes of searching, a long rest, until morning); the players may see the day and the part of the day.
import type { Corner } from '../fate/types';

export interface WorldTime {
  minutes: number;
  shown: boolean;
}

export interface WorldTimeState {
  byAdventure: Record<string, WorldTime>;
  // Where it stands on the player screen.
  place: Corner;
}

export const DAY = 24 * 60;
// A new adventure starts on the morning of day 1.
export const START = 8 * 60;
export const MORNING = 6 * 60;

export type DayPart = 'night' | 'morning' | 'day' | 'evening';

// 1500 minutes -> day 2, 01:00.
export function clockOf(minutes: number) {
  const m = Math.max(0, Math.floor(minutes));
  return { day: Math.floor(m / DAY) + 1, hour: Math.floor((m % DAY) / 60), minute: m % 60 };
}

export const minutesOf = (day: number, hour: number, minute: number) => (Math.max(1, day) - 1) * DAY + hour * 60 + minute;

export function partOf(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// The next morning: 06:00 of the next day, or of this one if it is not 6 yet.
export function nextMorning(minutes: number) {
  const today = minutes - (minutes % DAY) + MORNING;
  return today > minutes ? today : today + DAY;
}

export const hhmm = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
