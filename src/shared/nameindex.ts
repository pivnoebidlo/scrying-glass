// Names that become links in text already drawn (any language) → how to write the link: a system fills it from the
// compendium, the player's page from the names its sheet may open. Knows no game.
import { searchKey } from './compendium';

let spells = new Map<string, string>();
let known: string[] = [];
let pattern: RegExp | null = null;
const listeners = new Set<() => void>();

// Все известные названия заклинаний (подсказки в редакторе статблока).
export const knownNames = () => [...known].sort((a, b) => a.localeCompare(b, 'ru'));

// aliases — other names of known spells → the name to link to (LSS's own Russian names → the English name: the
// Russian SRD is another translation, «Огненные ладони» there is «Огненные руки»). A known name wins over an alias.
export function setNameIndex(names: string[], aliases: Record<string, string> = {}) {
  const next = new Map<string, string>();
  const nextKnown: string[] = [];
  const texts: string[] = [];
  for (const n of names) if (n.trim().length > 2) next.set(searchKey(n.trim()), n.trim()), nextKnown.push(n.trim()), texts.push(n.trim());
  for (const [alias, to] of Object.entries(aliases)) {
    const key = searchKey(alias.trim());
    if (alias.trim().length > 2 && !next.has(key) && next.has(searchKey(to))) next.set(key, to), texts.push(alias.trim());
  }
  if (next.size === spells.size && [...next].every(([k, v]) => spells.get(k) === v)) return;
  spells = next;
  known = nextKnown;
  // Длинные названия — первыми: «Высшая невидимость» раньше «Невидимости».
  const alts = texts.sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  pattern = alts.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${alts.join('|')})(?![\\p{L}\\p{N}])`, 'giu') : null;
  for (const f of listeners) f();
}

export const linkedName = (text: string) => spells.get(searchKey(text.trim().replace(/[.,;:]$/, '')));
export const namePattern = () => pattern;
export function onNameIndex(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}
