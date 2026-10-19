// How a game's time reads: «Thu, 24 Oct, 19:00–23:00» and «in 2 days» / «going on now».
import type { Occurrence } from '../../../shared/schedule';

export function whenText(o: Occurrence, lang: string): string {
  const d = new Date(o.start);
  const end = new Date(o.start + o.game.minutes * 60000);
  const day = d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
  const hm = (x: Date) => x.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${hm(d)}–${hm(end)}`;
}

// null — going on now.
export function untilText(o: Occurrence, now: number, lang: string): string | null {
  const ms = o.start - now;
  if (ms <= 0) return null;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const min = Math.round(ms / 60000);
  if (min < 60) return rtf.format(min, 'minute');
  const h = Math.round(min / 60);
  if (h < 24) return rtf.format(h, 'hour');
  const days = Math.round((new Date(o.start).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000);
  return rtf.format(days, 'day');
}
