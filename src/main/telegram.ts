// The GM's Telegram bot: the core talks to the Bot API directly (no server of the app in between).
// - The token is kept in settings.json encrypted with the system keychain (safeStorage) when it is available.
// - While a token is set, the bot is polled (getUpdates): a player who writes /start or a group the bot is added to
//   becomes a known chat — off until the GM turns it on in the settings.
// - Sending: pictures (sendPhoto, large ones — sendDocument), text (HTML, split into 4096-character messages).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { safeStorage } from 'electron';
import { t } from '../shared/i18n';
import { splitMessage, type TgChat, type TgStatus } from '../shared/telegram';

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
  message?: { chat: RawChat; text?: string; from?: { language_code?: string } };
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

export function sendText(ids: number[], html: string): Promise<SendResult> {
  const parts = splitMessage(html);
  return each(ids, async (id) => {
    for (const text of parts) await api('sendMessage', { chat_id: id, text, parse_mode: 'HTML' });
  });
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
  });
}
