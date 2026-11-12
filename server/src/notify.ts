// Sends a Telegram message to the admin when a new pack is committed to the catalog.
import { request } from 'node:https';
import type { RepoEntry } from '../../src/shared/repo.ts';

const ICON: Record<string, string> = {
  adventure: '📖',
  system: '⚙️',
  bestiary: '🐉',
  supplement: '📚',
  content: '📦',
  assets: '🗺️',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function entryText(e: RepoEntry): string {
  const kind = e.kind ?? 'adventure';
  const icon = ICON[kind] ?? '📦';
  const key = `${e.author.slice(0, 8)}…`;
  const name = e.authorName ? `${esc(e.authorName)} (${key})` : key;
  return [
    `${icon} New pack: <b>${esc(e.title)}</b>`,
    `${esc(kind)} · v${e.version}`,
    `Author: ${name}`,
    `<code>${esc(e.id)}</code>`,
  ].join('\n');
}

export function makeTelegramNotify(
  token: string,
  chatId: string,
  log: (data: Record<string, unknown>) => void,
): (e: RepoEntry) => void {
  return (e) => {
    const payload = JSON.stringify({ chat_id: chatId, text: entryText(e), parse_mode: 'HTML' });
    const req = request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.resume();
        if (res.statusCode !== 200) log({ event: 'notify_fail', status: res.statusCode });
      },
    );
    req.on('error', (err) => log({ event: 'notify_fail', error: String(err) }));
    req.end(payload);
  };
}
