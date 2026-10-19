// Telegram in the window: the bot's status and chats (from the core, refreshed on its event) and the send dialog.
import { unreadCount, type TgChat, type TgMessage, type TgStatus } from '../../../shared/telegram';

export const tg = $state({
  status: null as TgStatus | null,
  // The inbox (what players wrote and what the app sent), the newest message to toast, whether the page is open.
  inbox: [] as TgMessage[],
  toast: null as TgMessage | null,
  reading: false,
});
export const unread = (chat?: number) => unreadCount(tg.inbox, chat);
export const enabledChats = (): TgChat[] => tg.status?.chats.filter((c) => c.enabled) ?? [];
// There is somewhere to send: a bot and at least one chat turned on.
export const tgReady = () => !!tg.status?.configured && enabledChats().length > 0;

let hooked = false;
export async function loadTg() {
  if (!hooked) {
    hooked = true;
    window.api.onTelegramChanged(() => void loadTg());
    window.api.onTelegramMessage((m) => {
      void loadInbox();
      if (!m.mine && !tg.reading) tg.toast = m;
    });
    void loadInbox();
  }
  tg.status = await window.api.telegramStatus();
}
export async function loadInbox() {
  tg.inbox = await window.api.telegramInbox();
}
export async function markRead(chat?: number) {
  if (unread(chat)) tg.inbox = await window.api.telegramMarkRead(chat);
}
export async function clearInbox(chat?: number) {
  tg.inbox = await window.api.telegramClearInbox(chat);
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
  | { kind: 'text'; title: string; html: string }
  | { kind: 'note'; path: string; title: string };

export const sending = $state({ job: null as SendJob | null });
export const sendToTelegram = (job: SendJob) => (sending.job = job);

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
