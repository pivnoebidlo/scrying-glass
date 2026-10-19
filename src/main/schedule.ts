// The game schedule in the core: <userData>/schedule.json (common to all vaults), the bot's announcement with
// «I'll come / Maybe / Can't» buttons (answers edit the announcement and reach the window), reminders a day and two
// hours before (checked every minute while the app is open; one whose time is on goes when the app opens).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getLang, t } from '../shared/i18n';
import { announceDiff, announcementText, changesText, rekey } from '../shared/schedule';
import { EMPTY_SCHEDULE, occurrences, parseKey, reminderDue, type Announced, type Answer, type Game, type Occurrence, type ScheduleData } from '../shared/schedule';
import { editButtons, editCaption, sendButtons, sendPhotoButtons, sendPlain, sendReply, tableChats, type Buttons } from './telegram';

interface Deps {
  file: string;
  changed(): void;
  // The adventure's name for a game without a title.
  adventureName(g: Game): string;
  // The announcement's picture on disk (a path of the game's vault or of the library), or null.
  imageFile(g: Game): string | null;
}
let deps: Deps | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

export function readSchedule(): ScheduleData {
  if (!deps) return EMPTY_SCHEDULE;
  try {
    return { ...EMPTY_SCHEDULE, ...(JSON.parse(fs.readFileSync(deps.file, 'utf8')) as Partial<ScheduleData>) };
  } catch {
    return EMPTY_SCHEDULE;
  }
}
function write(data: ScheduleData) {
  if (!deps) return;
  fs.mkdirSync(path.dirname(deps.file), { recursive: true });
  fs.writeFileSync(deps.file + '.tmp', JSON.stringify(data, null, 1));
  fs.renameSync(deps.file + '.tmp', deps.file);
  deps.changed();
}

// The games, as the window edits them (answers and the sent marks stay; a game whose time moved takes them along).
export function saveGames(games: Game[]): ScheduleData {
  let data = readSchedule();
  for (const g of games) {
    const old = data.games.find((x) => x.id === g.id);
    if (old) data = rekey(data, old, g);
  }
  data = { ...data, games };
  write(data);
  return data;
}

export function initSchedule(d: Deps) {
  deps = d;
  timer = setInterval(() => void remind(), 60000);
  setTimeout(() => void remind(), 15000);
}
export const stopSchedule = () => timer && clearInterval(timer);

// ---------- Texts ----------

const fmt = (start: number, opts: Intl.DateTimeFormatOptions) => new Date(start).toLocaleString(getLang(), opts);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const titleOf = (g: Game) => g.title || deps?.adventureName(g) || t('sched.game');

const announcement = (o: Occurrence, data: ScheduleData) => announcementText(o, data.answers[o.key], getLang());
// One answer per row: long words are not cut.
const buttons = (key: string): Buttons => [
  [{ text: `✅ ${t('sched.btn.yes')}`, data: `rsvp:${key}:yes` }],
  [{ text: `🤔 ${t('sched.btn.maybe')}`, data: `rsvp:${key}:maybe` }],
  [{ text: `❌ ${t('sched.btn.no')}`, data: `rsvp:${key}:no` }],
];
// Telegram's limit for a picture's caption.
const CAPTION_MAX = 1024;

function occurrenceOf(key: string, data: ScheduleData): Occurrence | null {
  const k = parseKey(key);
  const g = k && data.games.find((x) => x.id === k.id);
  return g && k ? { game: g, start: k.start, key } : null;
}

// ---------- Announce, answers ----------

// Announce a game to its table: a message with buttons in each of its chats. How many went, or an error.
export async function announce(key: string): Promise<{ sent: number; error?: string }> {
  const data = readSchedule();
  const o = occurrenceOf(key, data);
  if (!o) return { sent: 0 };
  const chats = tableChats(o.game.table);
  if (!chats.length) return { sent: 0, error: t('sched.noChats') };
  const sent: Announced[] = [];
  let error: string | undefined;
  const text = announcement(o, data);
  const file = deps?.imageFile(o.game);
  const picture = file && fs.existsSync(file) ? { data: fs.readFileSync(file), name: path.basename(file) } : null;
  for (const chat of chats) {
    try {
      // A picture on top: the announcement as its caption, or — too long for a caption — the picture first.
      if (picture && text.length <= CAPTION_MAX) sent.push({ chat, mid: await sendPhotoButtons(chat, picture.data, picture.name, text, buttons(key)), caption: true });
      else {
        if (picture) await sendPhotoButtons(chat, picture.data, picture.name, '');
        sent.push({ chat, mid: await sendButtons(chat, text, buttons(key)) });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  const now = readSchedule();
  write({
    ...now,
    announced: { ...now.announced, [key]: [...(now.announced[key] ?? []), ...sent] },
    announcedAs: { ...now.announcedAs, [key]: o.game },
  });
  return { sent: sent.length, ...(error ? { error } : {}) };
}

// A button of an announcement: the answer is kept, every copy of the announcement shows the new tally.
export async function pressed(data: string, from: { id: number; name: string }): Promise<string | undefined> {
  const m = /^rsvp:(.+):(yes|maybe|no)$/.exec(data);
  if (!m) return undefined;
  const key = m[1]!;
  const answer = m[2] as Answer;
  const cur = readSchedule();
  const o = occurrenceOf(key, cur);
  if (!o) return t('sched.gone');
  const next: ScheduleData = { ...cur, answers: { ...cur.answers, [key]: { ...cur.answers[key], [String(from.id)]: { name: from.name, answer, at: Date.now() } } } };
  write(next);
  await refresh(o, next);
  return t(`sched.got.${answer}` as never);
}

// Edit every copy of a game's announcement to what it is now.
async function refresh(o: Occurrence, data: ScheduleData) {
  const text = announcement(o, data);
  for (const a of data.announced[o.key] ?? []) {
    if (a.caption && text.length <= CAPTION_MAX) await editCaption(a.chat, a.mid, text, buttons(o.key));
    else if (!a.caption) await editButtons(a.chat, a.mid, text, buttons(o.key));
  }
}

// The game changed after its announcement: edit the announcement; notify — also tell the players what changed (a
// reply to the announcement).
export async function updateAnnouncement(key: string, notify: boolean): Promise<{ error?: string }> {
  const data = readSchedule();
  const o = occurrenceOf(key, data);
  if (!o) return {};
  const before = data.announcedAs?.[key];
  await refresh(o, data);
  let error: string | undefined;
  if (notify && before) {
    const fields = announceDiff(before, o.game);
    if (fields.length) {
      for (const a of data.announced[key] ?? []) {
        try {
          await sendReply(a.chat, changesText(o, fields, getLang()), a.mid);
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
      }
    }
  }
  const now = readSchedule();
  write({ ...now, announcedAs: { ...now.announcedAs, [key]: o.game } });
  return error ? { error } : {};
}

// ---------- Reminders ----------

async function remind() {
  const data = readSchedule();
  const now = Date.now();
  for (const o of occurrences(data.games, now, now + 25 * 3600000)) {
    const due = reminderDue(o, now, data.reminded[o.key]);
    if (!due) continue;
    const text = [
      `⏰ <b>${esc(titleOf(o.game))}</b>`,
      t(due === 'day' ? 'sched.remindDay' : 'sched.remindSoon', { time: fmt(o.start, { hour: '2-digit', minute: '2-digit' }) }),
      ...(o.game.place ? [`📍 ${esc(o.game.place)}`] : []),
    ].join('\n');
    await sendPlain(tableChats(o.game.table), text);
    // Marked even if nothing went (no bot, no chats): it is not tried every minute.
    const cur = readSchedule();
    write({ ...cur, reminded: { ...cur.reminded, [o.key]: [...(cur.reminded[o.key] ?? []), due] } });
  }
}
