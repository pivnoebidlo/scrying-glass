// Game schedule (common to all vaults, like the Telegram tables): games with a repeat, the players' answers to the
// bot's announcement, reminders. Pure functions here; the core keeps <userData>/schedule.json (main/schedule.ts).
import { t } from './i18n';
import { markdownToTelegram } from './telegram';

export const REPEATS = ['none', 'week', '2weeks'] as const;
export type Repeat = (typeof REPEATS)[number];
// yes — taking part, maybe — in the reserve, no — can't come (the ids stay from the first «I'll come / Maybe / Can't»).
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
  // The announcement's optional lines (each goes only when filled): a picture on top (a vault path or
  // «library:…»), the kind of game, how many players, the price, the GM, the system, the characters' level, a
  // description (Markdown).
  image?: string;
  kind?: GameKind;
  players?: string;
  price?: string;
  gm?: string;
  system?: string;
  level?: string;
  description?: string;
  // Seats: how many players take part; more — in the reserve. None — the top number of `players` («3–5» → 5).
  seats?: number;
}

// The game's limit of players: its seats, else the largest number in «Players»; none — no limit.
export function seatsOf(g: Pick<Game, 'seats' | 'players'>): number | undefined {
  if (g.seats && g.seats > 0) return g.seats;
  const n = Math.max(0, ...(g.players?.match(/\d+/g) ?? []).map(Number));
  return n > 0 && n <= 99 ? n : undefined;
}

export const GAME_KINDS = ['', 'oneshot', 'campaign', 'session'] as const;
export type GameKind = (typeof GAME_KINDS)[number];

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
  // caption — the announcement is a picture's caption (edited as a caption); announcedAs — the game as announced
  // (to tell what changed since).
  announced: Record<string, Announced[]>;
  announcedAs?: Record<string, Game>;
  reminded: Record<string, Reminder[]>;
}
export interface Announced {
  chat: number;
  mid: number;
  caption?: boolean;
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

// Who takes part, who is in the reserve and who can't come, in the order they answered (by Telegram user id).
// With seats: the first «yes» up to the limit take part, the later ones (the limit was lowered) wait in the reserve
// ahead of those who chose it.
export interface Entry extends Reply {
  id: string;
}
export function roster(answers: Record<string, Reply> | undefined, seats?: number): Record<'going' | 'reserve' | 'out', Entry[]> {
  const all = Object.entries(answers ?? {})
    .map(([id, r]) => ({ ...r, id }))
    .sort((a, b) => a.at - b.at);
  const yes = all.filter((r) => r.answer === 'yes');
  const cut = seats ? seats : yes.length;
  return { going: yes.slice(0, cut), reserve: [...yes.slice(cut), ...all.filter((r) => r.answer === 'maybe')], out: all.filter((r) => r.answer === 'no') };
}
export const isFull = (answers: Record<string, Reply> | undefined, seats?: number) => !!seats && roster(answers, seats).going.length >= seats;

// Names by answer, as the announcement and the window show them.
export function tally(answers: Record<string, Reply> | undefined, seats?: number): Record<Answer, string[]> {
  const r = roster(answers, seats);
  return { yes: r.going.map((x) => x.name), maybe: r.reserve.map((x) => x.name), no: r.out.map((x) => x.name) };
}

// A short random id for a game.
export const gameId = () => Math.random().toString(36).slice(2, 10);

// ---------- The announcement ----------

// A clock face for the time: 🕐…🕛, half-hours 🕜…🕧.
export function clockEmoji(start: number): string {
  const d = new Date(start);
  const h = d.getHours() % 12 || 12;
  const half = d.getMinutes() >= 15 && d.getMinutes() < 45;
  const base = half ? 0x1f55c : 0x1f550;
  // 45+ minutes round up to the next hour.
  const hour = !half && d.getMinutes() >= 45 ? (h % 12) + 1 : h;
  return String.fromCodePoint(base + hour - 1);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = (n: number) => String(n).padStart(2, '0');
export const dateLine = (start: number, lang: string) => {
  const d = new Date(start);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} (${d.toLocaleDateString(lang, { weekday: 'short' })})`;
};
const hm = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const gameTitle = (g: Game) => g.title || g.adventure || t('sched.game');

// The lines of the announcement by field (Telegram HTML), only the filled ones.
function fieldLines(o: Occurrence, lang: string): Partial<Record<AnnounceField, string>> {
  const g = o.game;
  const line = (icon: string, key: string, v?: string) => (v?.trim() ? `${icon} ${t(key as never)}: ${esc(v.trim())}` : undefined);
  return {
    start: `📅 ${dateLine(o.start, lang)}\n${clockEmoji(o.start)} ${hm(o.start)}–${hm(o.start + g.minutes * 60000)}`,
    players: line('👥', 'sched.a.players', g.players),
    // Shown in the list of who takes part (n/seats); a line of its own only in «what changed».
    seats: line('🪑', 'sched.a.seats', g.seats ? String(g.seats) : undefined),
    price: line('💰', 'sched.a.price', g.price),
    gm: line('💬', 'sched.a.gm', g.gm),
    place: line('📍', 'sched.a.place', g.place),
    system: line('🎲', 'sched.a.system', g.system),
    level: line('⚔️', 'sched.a.level', g.level),
    title: `📌 ${g.kind ? `${t(`sched.kind.${g.kind}` as never)} «${esc(gameTitle(g))}»` : `<b>${esc(gameTitle(g))}</b>`}`,
    description: g.description?.trim() ? `📝 ${markdownToTelegram(g.description.trim())}` : undefined,
  };
}

// The whole announcement (with the answers so far).
export function announcementText(o: Occurrence, answers: Record<string, Reply> | undefined, lang: string): string {
  const f = fieldLines(o, lang);
  const head = [f.start, f.players, f.price, f.gm, f.place, f.system, f.level].filter(Boolean);
  const blocks = [head.join('\n'), f.title, f.description].filter(Boolean) as string[];
  const seats = seatsOf(o.game);
  const tl = tally(answers, seats);
  const rows = [
    tl.yes.length || seats ? `✅ ${t('sched.coming')}${seats ? ` (${tl.yes.length}/${seats})` : ''}: ${tl.yes.length ? esc(tl.yes.join(', ')) : '—'}` : '',
    tl.maybe.length ? `🕓 ${t('sched.maybe')}: ${esc(tl.maybe.join(', '))}` : '',
    tl.no.length ? `❌ ${t('sched.notComing')}: ${esc(tl.no.join(', '))}` : '',
  ].filter(Boolean);
  if (rows.length) blocks.push(rows.join('\n'));
  return blocks.join('\n\n');
}

// What a game's announcement shows; a change in any of them makes the sent announcement outdated.
export const ANNOUNCE_FIELDS = ['start', 'players', 'seats', 'price', 'gm', 'place', 'system', 'level', 'title', 'description', 'image'] as const;
export type AnnounceField = (typeof ANNOUNCE_FIELDS)[number];

// What changed between the game as announced and as it is now (a moved time moves every repeat alike).
export function announceDiff(before: Game, after: Game): AnnounceField[] {
  const same = (a?: string, b?: string) => (a ?? '').trim() === (b ?? '').trim();
  const out: AnnounceField[] = [];
  if (before.start !== after.start || before.minutes !== after.minutes) out.push('start');
  for (const k of ['players', 'price', 'gm', 'place', 'system', 'level', 'description', 'image'] as const) if (!same(before[k], after[k])) out.push(k);
  if ((before.seats ?? 0) !== (after.seats ?? 0)) out.push('seats');
  if (gameTitle(before) !== gameTitle(after) || (before.kind ?? '') !== (after.kind ?? '')) out.push('title');
  return out.sort((a, b) => ANNOUNCE_FIELDS.indexOf(a) - ANNOUNCE_FIELDS.indexOf(b));
}

// «What changed» for the players: the new values of the changed lines (a reply to the announcement).
export function changesText(o: Occurrence, fields: AnnounceField[], lang: string): string {
  const f = fieldLines(o, lang);
  const lines = fields.flatMap((k) =>
    k === 'description' ? [`📝 ${t('sched.a.descriptionChanged')}`] : k === 'image' ? [`🖼 ${t('sched.a.imageChanged')}`] : f[k] ? [f[k]!] : [`${t('sched.a.removed', { what: t(`sched.a.${k}` as never) })}`]
  );
  return [`✏️ <b>${esc(t('sched.changes', { title: gameTitle(o.game) }))}</b>`, ...lines].join('\n');
}

// A game's time moved: its announcements, answers and reminders move with it (each occurrence by the same shift);
// reminders are sent anew for the new time.
export function rekey(data: ScheduleData, before: Game, after: Game): ScheduleData {
  const shift = after.start - before.start;
  if (!shift || before.id !== after.id) return data;
  const move = <T>(rec: Record<string, T> | undefined, keep = true): Record<string, T> => {
    const out: Record<string, T> = {};
    for (const [k, v] of Object.entries(rec ?? {})) {
      const p = parseKey(k);
      if (p && p.id === before.id) {
        if (keep) out[occKey(after, p.start + shift)] = v;
      } else out[k] = v;
    }
    return out;
  };
  return { ...data, announced: move(data.announced), announcedAs: move(data.announcedAs), answers: move(data.answers), reminded: move(data.reminded, false) };
}
