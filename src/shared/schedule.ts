// Game schedule (common to all vaults, like the Telegram tables): games with a repeat, the players' answers to the
// bot's announcement, reminders. Pure functions here; the core keeps <userData>/schedule.json (main/schedule.ts).

export const REPEATS = ['none', 'week', '2weeks'] as const;
export type Repeat = (typeof REPEATS)[number];
export const ANSWERS = ['yes', 'maybe', 'no'] as const;
export type Answer = (typeof ANSWERS)[number];

export interface Game {
  // Short (it goes into the bot's button data, 64 bytes at most).
  id: string;
  // '' — the adventure's name.
  title: string;
  // The first game (epoch ms, local time as entered) and how long it lasts.
  start: number;
  minutes: number;
  repeat: Repeat;
  // Repeats up to this day (inclusive), none — on and on; skipped games (their start).
  until?: number | null;
  skip?: number[];
  // The table that plays (Telegram tables); the adventure — of a vault (its folder path) and its plan (a journal note).
  table?: string;
  vault?: string;
  adventure?: string | null;
  plan?: string;
  // An address or a link to the online room.
  place?: string;
  // The bot reminds the table a day and two hours before.
  remind: boolean;
}

export interface Occurrence {
  game: Game;
  start: number;
  key: string;
}

export interface Reply {
  name: string;
  answer: Answer;
  at: number;
}

export interface ScheduleData {
  games: Game[];
  // Per game (occurrence key): who answered what (by Telegram user id).
  answers: Record<string, Record<string, Reply>>;
  // The announcements sent (to edit them as answers come) and the reminders already sent.
  announced: Record<string, { chat: number; mid: number }[]>;
  reminded: Record<string, Reminder[]>;
}
export type Reminder = 'day' | 'soon';
export const EMPTY_SCHEDULE: ScheduleData = { games: [], answers: {}, announced: {}, reminded: {} };

export const occKey = (g: Pick<Game, 'id'>, start: number) => `${g.id}:${Math.round(start / 60000).toString(36)}`;
export function parseKey(key: string): { id: string; start: number } | null {
  const m = /^([\w-]+):([0-9a-z]+)$/.exec(key);
  return m ? { id: m[1]!, start: parseInt(m[2]!, 36) * 60000 } : null;
}

// The games between from and to (by start), repeats expanded by local days (a week stays a week across DST).
export function occurrences(games: Game[], from: number, to: number): Occurrence[] {
  const out: Occurrence[] = [];
  for (const g of games) {
    const step = g.repeat === 'week' ? 7 : g.repeat === '2weeks' ? 14 : 0;
    const end = g.until ? endOfDay(g.until) : Infinity;
    const d = new Date(g.start);
    for (let i = 0; i < 1000; i++) {
      const start = d.getTime();
      if (start > to || start > end) break;
      if (start + g.minutes * 60000 >= from && !g.skip?.includes(start)) out.push({ game: g, start, key: occKey(g, start) });
      if (!step) break;
      d.setDate(d.getDate() + step);
    }
  }
  return out.sort((a, b) => a.start - b.start);
}
const endOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

// The next game: the one going on now or the first ahead.
export const nextGame = (games: Game[], now: number, horizonDays = 120) => occurrences(games, now, now + horizonDays * 86400000)[0] ?? null;

// Which reminder is due now: a day before (until two hours before), two hours before (until the start); none once
// it is sent or the game has begun. An app opened late still sends the one whose time is on.
export function reminderDue(o: Occurrence, now: number, sent: Reminder[] = []): Reminder | null {
  if (!o.game.remind || now >= o.start) return null;
  const left = o.start - now;
  if (left <= 2 * 3600000) return sent.includes('soon') ? null : 'soon';
  if (left <= 24 * 3600000) return sent.includes('day') || sent.includes('soon') ? null : 'day';
  return null;
}

export function tally(answers: Record<string, Reply> | undefined): Record<Answer, string[]> {
  const out: Record<Answer, string[]> = { yes: [], maybe: [], no: [] };
  for (const r of Object.values(answers ?? {}).sort((a, b) => a.at - b.at)) out[r.answer].push(r.name);
  return out;
}

// A short random id for a game.
export const gameId = () => Math.random().toString(36).slice(2, 10);
