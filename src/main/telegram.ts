// The GM's Telegram bot: the core talks to the Bot API directly (no server of the app in between).
// - The token is kept in settings.json encrypted with the system keychain (safeStorage) when it is available.
// - While a token is set, the bot is polled (getUpdates): a player who writes /start or a group the bot is added to
//   becomes a known chat — off until the GM turns it on in the settings.
// - Sending: pictures (sendPhoto, large ones — sendDocument), text (HTML, split into 4096-character messages).
// - The inbox: what players write in enabled chats (and what the app sent) — <dir>/inbox.json, photos beside it;
//   the window is told of each new message (telegram:inbox).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { safeStorage } from 'electron';
import { t } from '../shared/i18n';
import { addToInbox, incoming, photoSize, splitMessage, type RawMessage, type TgChat, type TgMessage, type TgStatus } from '../shared/telegram';

export interface TgSettings {
  // The token: encrypted (base64, enc: true) or plain where the system has no keychain.
  token?: string;
  enc?: boolean;
  chats?: TgChat[];
  // Where getUpdates stopped (so old messages aren't read again).
  offset?: number;
}

interface Deps {
  get(): TgSettings;
  save(next: TgSettings): void;
  // The settings window is told when chats or the status change.
  changed(): void;
  // The inbox folder (inbox.json and photos) and the window to tell of a new message.
  dir: string;
  received(m: TgMessage): void;
}

let deps: Deps | null = null;
let bot: string | null = null;
let error: string | null = null;
let polling: AbortController | null = null;

const MAX_PHOTO = 10 * 1024 * 1024;

export function initTelegram(d: Deps) {
  deps = d;
  restart();
}

function token(): string | null {
  const s = deps?.get();
  if (!s?.token) return null;
  try {
    return s.enc ? safeStorage.decryptString(Buffer.from(s.token, 'base64')) : s.token;
  } catch {
    return null;
  }
}

export function status(): TgStatus {
  return { configured: !!token(), bot, error, chats: deps?.get().chats ?? [] };
}

export function setToken(value: string | null) {
  if (!deps) return status();
  const v = value?.trim() ?? '';
  const s = deps.get();
  if (!v) deps.save({ chats: s.chats ?? [] });
  else if (safeStorage.isEncryptionAvailable()) deps.save({ ...s, token: safeStorage.encryptString(v).toString('base64'), enc: true, offset: undefined });
  else deps.save({ ...s, token: v, enc: false, offset: undefined });
  bot = null;
  error = null;
  restart();
  return status();
}

export function updateChat(id: number, patch: Partial<Pick<TgChat, 'enabled' | 'label'>>) {
  if (!deps) return status();
  const s = deps.get();
  deps.save({ ...s, chats: (s.chats ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  return status();
}

export function forgetChat(id: number) {
  if (!deps) return status();
  const s = deps.get();
  deps.save({ ...s, chats: (s.chats ?? []).filter((c) => c.id !== id) });
  return status();
}

async function api<T>(method: string, body?: FormData | Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const tk = token();
  if (!tk) throw new Error(t('tg.noToken'));
  const res = await fetch(`https://api.telegram.org/bot${tk}/${method}`, {
    method: 'POST',
    ...(body instanceof FormData ? { body } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) }),
    signal: signal ?? AbortSignal.timeout(30000),
  });
  const data = (await res.json().catch(() => null)) as { ok: boolean; result: T; description?: string } | null;
  if (!data?.ok) throw new Error(data?.description ?? `HTTP ${res.status}`);
  return data.result;
}

// ---------- Polling: learn chats ----------

interface Update {
  update_id: number;
  message?: RawMessage & { chat: RawChat };
  my_chat_member?: { chat: RawChat; new_chat_member: { status: string } };
}
interface RawChat {
  id: number;
  type: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

function restart() {
  polling?.abort();
  polling = null;
  if (!token()) {
    deps?.changed();
    return;
  }
  const ctl = new AbortController();
  polling = ctl;
  void (async () => {
    try {
      const me = await api<{ username: string }>('getMe', {}, ctl.signal);
      bot = me.username;
      error = null;
      // A webhook set earlier (another tool) would make getUpdates fail.
      await api('deleteWebhook', {}, ctl.signal).catch(() => undefined);
    } catch (e) {
      if (ctl.signal.aborted) return;
      error = String(e instanceof Error ? e.message : e);
      deps?.changed();
      return;
    }
    deps?.changed();
    while (!ctl.signal.aborted) {
      try {
        const updates = await api<Update[]>(
          'getUpdates',
          { offset: deps?.get().offset, timeout: 25, allowed_updates: ['message', 'my_chat_member'] },
          AbortSignal.any([ctl.signal, AbortSignal.timeout(40000)])
        );
        for (const u of updates) await handle(u);
        if (updates.length) deps?.save({ ...deps.get(), offset: updates.at(-1)!.update_id + 1 });
        if (error) {
          error = null;
          deps?.changed();
        }
      } catch (e) {
        if (ctl.signal.aborted) return;
        error = String(e instanceof Error ? e.message : e);
        deps?.changed();
        await new Promise((r) => setTimeout(r, 15000));
      }
    }
  })();
}

async function handle(u: Update) {
  if (!deps) return;
  const chat = u.message?.chat ?? u.my_chat_member?.chat;
  if (!chat) return;
  const left = u.my_chat_member && ['left', 'kicked'].includes(u.my_chat_member.new_chat_member.status);
  const s = deps.get();
  const known = (s.chats ?? []).find((c) => c.id === chat.id);
  if (left) {
    if (known) deps.save({ ...s, chats: (s.chats ?? []).filter((c) => c.id !== chat.id) });
    deps.changed();
    return;
  }
  const title = chat.title ?? ([chat.first_name, chat.last_name].filter(Boolean).join(' ') + (chat.username ? ` (@${chat.username})` : '') || String(chat.id));
  const kind: TgChat['kind'] = chat.type === 'private' ? 'private' : 'group';
  if (!known) {
    deps.save({ ...s, chats: [...(s.chats ?? []), { id: chat.id, kind, title, enabled: false }] });
    deps.changed();
  } else if (known.title !== title) {
    deps.save({ ...s, chats: (s.chats ?? []).map((c) => (c.id === chat.id ? { ...c, title } : c)) });
    deps.changed();
  }
  // A greeting on /start: the player knows the GM will see them.
  if (kind === 'private' && /^\/start\b/.test(u.message?.text ?? '')) {
    await api('sendMessage', { chat_id: chat.id, text: t('tg.hello') }).catch(() => undefined);
  }
  if (u.message) await receive(u.message);
}

// ---------- The inbox ----------

const inboxFile = () => path.join(deps!.dir, 'inbox.json');
export function readInbox(): TgMessage[] {
  if (!deps) return [];
  try {
    const v = JSON.parse(fs.readFileSync(inboxFile(), 'utf8'));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeInbox(list: TgMessage[]) {
  if (!deps) return;
  fs.mkdirSync(deps.dir, { recursive: true });
  // Photos no longer in the inbox go too.
  const keep = new Set(list.map((m) => m.photo).filter(Boolean));
  for (const f of fs.readdirSync(deps.dir)) if (/\.jpg$/.test(f) && !keep.has(f)) fs.rmSync(path.join(deps.dir, f), { force: true });
  fs.writeFileSync(inboxFile() + '.tmp', JSON.stringify(list));
  fs.renameSync(inboxFile() + '.tmp', inboxFile());
}
function remember(m: TgMessage) {
  writeInbox(addToInbox(readInbox(), m));
  deps?.received(m);
}

async function receive(raw: RawMessage) {
  if (!deps) return;
  const m = incoming(raw, deps.get().chats ?? []);
  if (!m) return;
  const size = raw.photo && photoSize(raw.photo);
  if (size) {
    try {
      const file = await api<{ file_path: string }>('getFile', { file_id: size.file_id });
      const res = await fetch(`https://api.telegram.org/file/bot${token()}/${file.file_path}`, { signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        const name = `${m.id.replace(/[^\w-]/g, '_')}.jpg`;
        fs.mkdirSync(deps.dir, { recursive: true });
        fs.writeFileSync(path.join(deps.dir, name), Buffer.from(await res.arrayBuffer()));
        m.photo = name;
      }
    } catch {
      /* the text still comes; the photo is lost */
    }
  }
  remember(m);
}

export function markRead(chat?: number): TgMessage[] {
  const list = readInbox().map((m) => (!m.mine && !m.read && (chat === undefined || m.chat === chat) ? { ...m, read: true } : m));
  writeInbox(list);
  return list;
}
export function clearInbox(chat?: number): TgMessage[] {
  const list = chat === undefined ? [] : readInbox().filter((m) => m.chat !== chat);
  writeInbox(list);
  return list;
}
// A photo of the inbox as a data: URL (the window shows it; the inbox folder is not served).
export function inboxPhoto(name: string): string | null {
  if (!deps || !/^[\w-]+\.jpg$/.test(name)) return null;
  try {
    return 'data:image/jpeg;base64,' + fs.readFileSync(path.join(deps.dir, name)).toString('base64');
  } catch {
    return null;
  }
}
// What the app sent goes into the conversation too (as text; a picture — by its name).
function sentToInbox(ids: number[], text: string) {
  const now = Date.now();
  for (const id of allowed(ids)) remember({ id: `${id}:out:${now}`, chat: id, from: '', text, date: now, mine: true, read: true });
}

export function stopTelegram() {
  polling?.abort();
  polling = null;
}

// ---------- Sending ----------

const allowed = (ids: number[]) => {
  const on = new Set((deps?.get().chats ?? []).filter((c) => c.enabled).map((c) => c.id));
  return ids.filter((id) => on.has(id));
};

// A result per chat: how many went, the errors.
export interface SendResult {
  sent: number;
  errors: string[];
}

async function each(ids: number[], send: (id: number) => Promise<unknown>): Promise<SendResult> {
  const out: SendResult = { sent: 0, errors: [] };
  for (const id of allowed(ids)) {
    try {
      await send(id);
      out.sent++;
    } catch (e) {
      const c = deps?.get().chats?.find((x) => x.id === id);
      out.errors.push(`${c?.title ?? id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return out;
}

export async function sendText(ids: number[], html: string, replyTo?: number): Promise<SendResult> {
  const parts = splitMessage(html);
  const res = await each(ids, async (id) => {
    for (const [i, text] of parts.entries()) {
      await api('sendMessage', { chat_id: id, text, parse_mode: 'HTML', ...(replyTo && i === 0 ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {}) });
    }
  });
  if (res.sent) sentToInbox(ids, html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
  return res;
}

// A picture: a file (vault or library) or the bytes of a capture (a note as the players see it).
export function sendPicture(ids: number[], picture: { file: string } | { png: Buffer; name: string }, caption?: string): Promise<SendResult> {
  const data = 'file' in picture ? fs.readFileSync(picture.file) : picture.png;
  const name = 'file' in picture ? path.basename(picture.file) : picture.name;
  const asDocument = data.length > MAX_PHOTO;
  return each(ids, async (id) => {
    const form = new FormData();
    form.append('chat_id', String(id));
    if (caption) {
      form.append('caption', caption.slice(0, 1024));
      form.append('parse_mode', 'HTML');
    }
    form.append(asDocument ? 'document' : 'photo', new Blob([new Uint8Array(data)]), name);
    await api(asDocument ? 'sendDocument' : 'sendPhoto', form);
  }).then((res) => {
    if (res.sent) sentToInbox(ids, `🖼 ${name.replace(/\.[^.]+$/, '')}`);
    return res;
  });
}
