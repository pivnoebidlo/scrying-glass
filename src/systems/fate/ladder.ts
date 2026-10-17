// The Fate ladder: result numbers and their names (Russian names are our own: there is no open Russian Fate Core).
import { labels } from '../../shared/i18n';

export const LADDER: Record<number, string> = labels([8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2], 'fcore.ladder');

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

// «Хорошо (+3)»; выше и ниже лестницы — просто число.
export const ladderText = (n: number) => (LADDER[n] ? `${LADDER[n]} (${signed(n)})` : signed(n));
