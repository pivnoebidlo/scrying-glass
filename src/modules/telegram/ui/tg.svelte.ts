// Telegram in the window: the bot's status and chats (from the core, refreshed on its event) and the send dialog.
import type { TgChat, TgStatus } from '../../../shared/telegram';

export const tg = $state({ status: null as TgStatus | null });
export const enabledChats = (): TgChat[] => tg.status?.chats.filter((c) => c.enabled) ?? [];
// There is somewhere to send: a bot and at least one chat turned on.
export const tgReady = () => !!tg.status?.configured && enabledChats().length > 0;

let hooked = false;
export async function loadTg() {
  if (!hooked) {
    hooked = true;
    window.api.onTelegramChanged(() => void loadTg());
  }
  tg.status = await window.api.telegramStatus();
}

// What to send: a picture of the vault or library, text (Telegram HTML) or a capture of an element of this window.
export type SendJob =
  | { kind: 'file'; path: string; title: string }
  | { kind: 'text'; title: string; html: string }
  | { kind: 'capture'; element: HTMLElement; title: string };

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
