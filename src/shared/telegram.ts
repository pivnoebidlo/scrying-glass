// Sending to players through the GM's own Telegram bot (made with @BotFather): types and pure functions.
// The core (main/telegram.ts) talks to the Telegram Bot API directly; there is no server of the app in between.
import { entrySubtitle, fieldText, type Entry, type TypeDef } from './compendium';

// A chat the bot knows: a group the bot was added to, or a player who wrote /start to it. A new chat is off until the
// GM turns it on — whoever finds the bot can write to it, but gets nothing.
export interface TgChat {
  id: number;
  kind: 'group' | 'private';
  // As Telegram names it: the group title or the person's name (@username).
  title: string;
  enabled: boolean;
  // The GM's label: the character of this player («Гилберт»).
  label?: string;
}

export interface TgStatus {
  // A token is saved; bot — its @username once Telegram has confirmed it.
  configured: boolean;
  bot: string | null;
  // The last error talking to Telegram (bad token, no network).
  error: string | null;
  chats: TgChat[];
}

export const chatName = (c: TgChat) => (c.label ? `${c.label} (${c.title})` : c.title);

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Markdown of a compendium entry or a journal note -> the HTML subset Telegram accepts (b, i, code, blockquote):
// headings and **bold** — bold, *italic* — italic, «- » lists — bullets, «> » — a quote, [[Link|Alias]] — its text.
export function markdownToTelegram(md: string): string {
  const out: string[] = [];
  let quote: string[] = [];
  const flush = () => {
    if (quote.length) out.push(`<blockquote>${quote.join('\n')}</blockquote>`);
    quote = [];
  };
  for (const raw of md.replace(/\r\n/g, '\n').split('\n')) {
    const q = /^\s*>\s?(.*)$/.exec(raw);
    if (q) {
      quote.push(inline(q[1]!));
      continue;
    }
    flush();
    const h = /^\s*#{1,6}\s+(.*)$/.exec(raw);
    if (h) out.push(`<b>${inline(h[1]!)}</b>`);
    else if (/^\s*([-*+]|\d+[.)])\s+\[[ xX]\]\s+/.test(raw)) out.push(`☐ ${inline(raw.replace(/^\s*([-*+]|\d+[.)])\s+\[[ xX]\]\s+/, ''))}`);
    else if (/^\s*[-*+]\s+/.test(raw)) out.push(`• ${inline(raw.replace(/^\s*[-*+]\s+/, ''))}`);
    else if (/^\s*\|?\s*:?-{3,}/.test(raw)) continue;
    else if (/^\s*\|/.test(raw)) out.push(inline(raw.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).join(' — ')));
    else if (/^\s*---+\s*$/.test(raw)) out.push('');
    else out.push(inline(raw));
  }
  flush();
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function inline(s: string): string {
  return escape(s)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// Telegram takes up to 4096 characters per message: split by paragraphs, then by lines, then hard.
export function splitMessage(text: string, max = 4000): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let cur = '';
  const push = (piece: string, sep: string) => {
    if (cur && cur.length + sep.length + piece.length > max) {
      parts.push(cur);
      cur = '';
    }
    cur = cur ? cur + sep + piece : piece;
  };
  for (const para of text.split('\n\n')) {
    if (para.length <= max) push(para, '\n\n');
    else for (const line of para.split('\n')) for (let i = 0; i < line.length; i += max) push(line.slice(i, i + max), '\n');
  }
  if (cur) parts.push(cur);
  return parts;
}

export const titleHtml = (title: string) => `<b>${escape(title)}</b>`;

// Fields already said in the line under the title (built-in types) — not repeated as rows.
const IN_SUBTITLE: Record<string, string[]> = {
  spell: ['level', 'school', 'ritual', 'concentration'],
  item: ['category', 'rarity', 'attunement'],
  feat: ['category', 'prerequisite'],
};

// A compendium entry as a message: the title, the line under it, the fields as «Label: value», the text.
export function entryToTelegram(e: Entry, def: TypeDef): string {
  const skip = new Set(IN_SUBTITLE[e.type] ?? []);
  const rows = def.fields
    .filter((f) => !skip.has(f.key) && !f.subtitle && e.fields[f.key] !== undefined && e.fields[f.key] !== '' && e.fields[f.key] !== false)
    .map((f) => `<b>${escape(f.title)}:</b> ${escape(fieldText(e.fields[f.key]!))}`);
  const sub = entrySubtitle(e, def);
  return [titleHtml(e.title), sub ? `<i>${escape(sub)}</i>` : '', rows.join('\n'), markdownToTelegram(e.body)].filter(Boolean).join('\n\n');
}

// ---------- Inbox: what the players write back ----------

// A message in the inbox: from a player (incoming) or sent from the app (mine) — the conversation is shown whole.
export interface TgMessage {
  // «<chat>:<message id>» (Telegram's ids; the app's own — «<chat>:out:<time>»).
  id: string;
  chat: number;
  // Who wrote it: the sender's name in a group, the chat's name in private; '' for mine.
  from: string;
  text: string;
  // What else came with it: a photo (its file in the inbox folder), or a kind without text.
  photo?: string;
  kind?: 'sticker' | 'voice' | 'video' | 'document' | 'other';
  date: number;
  mine?: boolean;
  read?: boolean;
}

// The part of a Telegram message the inbox reads.
export interface RawMessage {
  message_id: number;
  date: number;
  chat: { id: number };
  from?: { first_name?: string; last_name?: string; username?: string; is_bot?: boolean };
  text?: string;
  caption?: string;
  photo?: { file_id: string; width: number; height: number }[];
  sticker?: { emoji?: string };
  voice?: unknown;
  audio?: unknown;
  video?: unknown;
  video_note?: unknown;
  document?: { file_name?: string };
}

export const INBOX_MAX = 300;

// A Telegram message → an inbox message, or null: not from an enabled chat, a command (/start), from a bot, or
// nothing to show.
export function incoming(m: RawMessage, chats: TgChat[]): TgMessage | null {
  const chat = chats.find((c) => c.id === m.chat.id);
  if (!chat?.enabled || m.from?.is_bot) return null;
  const text = (m.text ?? m.caption ?? '').trim();
  if (/^\/\w+/.test(text) && !m.photo) return null;
  const kind: TgMessage['kind'] = m.sticker
    ? 'sticker'
    : m.voice || m.audio || m.video_note
      ? 'voice'
      : m.video
        ? 'video'
        : m.document
          ? 'document'
          : !text && !m.photo
            ? 'other'
            : undefined;
  const name = [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' ') || (m.from?.username ? `@${m.from.username}` : '');
  return {
    id: `${m.chat.id}:${m.message_id}`,
    chat: m.chat.id,
    from: chat.kind === 'group' ? name : chat.label || name || chat.title,
    text: text || (m.sticker?.emoji ?? '') || (m.document?.file_name ?? ''),
    ...(kind ? { kind } : {}),
    date: m.date * 1000,
  };
}

// Add to the inbox (no repeats), keeping the last INBOX_MAX.
export function addToInbox(list: TgMessage[], m: TgMessage): TgMessage[] {
  if (list.some((x) => x.id === m.id)) return list;
  return [...list, m].sort((a, b) => a.date - b.date).slice(-INBOX_MAX);
}

export const unreadCount = (list: TgMessage[], chat?: number) => list.filter((m) => !m.mine && !m.read && (chat === undefined || m.chat === chat)).length;

// The largest photo size that is not huge (≤ 1600 px on the long side), or the smallest one.
export function photoSize<T extends { width: number; height: number }>(sizes: T[]): T | undefined {
  const bySize = [...sizes].sort((a, b) => a.width * a.height - b.width * b.height);
  const fit = bySize.filter((s) => Math.max(s.width, s.height) <= 1600);
  return fit.at(-1) ?? bySize[0];
}
