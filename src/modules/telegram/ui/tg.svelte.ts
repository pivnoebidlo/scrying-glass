// Telegram in the window: the bot's status and chats (from the core, refreshed on its event) and the send dialog.
import { chatsAt, type TgChat, type TgMessage, type TgStatus } from '../../../shared/telegram';

export const tg = $state({
  status: null as TgStatus | null,
  // The inbox (what players wrote and what the app sent), the newest message to toast, whether the page is open.
  inbox: [] as TgMessage[],
  toast: null as TgMessage | null,
  reading: false,
});
// The table played at now ('' — all tables): chats, the send dialog, unread counts and toasts show only its chats
// (and those of no table). Kept by the window; an adventure remembers its table (per vault).
const readJson = <T>(key: string, fallback: T): T => {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* not remembered — not a problem */
  }
};
export const table = $state({ id: readJson<string>('tg.table', ''), adventure: '' });
export function setTable(id: string) {
  table.id = id;
  writeJson('tg.table', id);
  if (table.adventure) writeJson('tg.tableFor', { ...readJson<Record<string, string>>('tg.tableFor', {}), [table.adventure]: id });
}
// The adventure changed: its table, if it has one, becomes current.
export function followAdventure(key: string) {
  table.adventure = key;
  const id = readJson<Record<string, string>>('tg.tableFor', {})[key];
  if (id !== undefined && id !== table.id) {
    table.id = id;
    writeJson('tg.table', id);
  }
}
const tableId = () => (table.id && tg.status?.tables.some((x) => x.id === table.id) ? table.id : '');
export const enabledChats = (): TgChat[] => chatsAt(tg.status?.chats.filter((c) => c.enabled) ?? [], tableId());
export const visibleChat = (id: number) => enabledChats().some((c) => c.id === id);
export const unread = (chat?: number) =>
  tg.inbox.filter((m) => !m.mine && !m.read && (chat === undefined ? visibleChat(m.chat) : m.chat === chat)).length;
// There is somewhere to send: a bot and at least one chat turned on.
export const tgReady = () => !!tg.status?.configured && enabledChats().length > 0;

let hooked = false;
export async function loadTg() {
  if (!hooked) {
    hooked = true;
    window.api.onTelegramChanged(() => void loadTg());
    window.api.onTelegramMessage((m) => {
      void loadInbox();
      if (!m.mine && !tg.reading && visibleChat(m.chat)) tg.toast = m;
    });
    void loadInbox();
  }
  tg.status = await window.api.telegramStatus();
}
export async function loadInbox() {
  tg.inbox = await window.api.telegramInbox();
}
// One chat, or every chat of the current table.
export async function markRead(chat?: number) {
  for (const id of chat === undefined ? enabledChats().map((c) => c.id) : [chat]) {
    if (unread(id)) tg.inbox = await window.api.telegramMarkRead(id);
  }
}
export async function clearInbox(chat?: number) {
  for (const id of chat === undefined ? enabledChats().map((c) => c.id) : [chat]) tg.inbox = await window.api.telegramClearInbox(id);
}

// Photos of the inbox as data: URLs, loaded once.
// (Asked for while rendering: the request is remembered outside the state, the answer lands in it later.)
const photos = $state<Record<string, string | null>>({});
const asked = new Set<string>();
export function photoUrl(name: string): string | null {
  if (!asked.has(name)) {
    asked.add(name);
    void window.api.telegramPhoto(name).then((url) => (photos[name] = url));
  }
  return photos[name] ?? null;
}

// What to send: a picture of the vault or library, text (Telegram HTML) or a note — as a picture, the way the players
// see it (the dialog draws it large for a moment and captures it).
export type SendJob =
  | { kind: 'file'; path: string; title: string }
  | { kind: 'image'; title: string; data: Uint8Array; name: string; caption?: string }
  | { kind: 'text'; title: string; html: string }
  | { kind: 'note'; path: string; title: string };

export const sending = $state({ job: null as SendJob | null });
export const sendToTelegram = (job: SendJob) => (sending.job = job);

// How a message goes from the conversation: Enter (Shift+Enter — a new line) or ⌘/Ctrl+Enter (Enter — a new line).
// Kept by the window.
function readEnterSends() {
  try {
    return localStorage.getItem('tg.enterSends') !== 'false';
  } catch {
    return true;
  }
}
export const prefs = $state({ enterSends: readEnterSends() });
export function setEnterSends(on: boolean) {
  prefs.enterSends = on;
  try {
    localStorage.setItem('tg.enterSends', String(on));
  } catch {
    /* not remembered — not a problem */
  }
}

// Recipients chosen last time (per window).
const KEY = 'tg.selected';
export function lastSelected(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}
export function rememberSelected(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* not remembered — not a problem */
  }
}
