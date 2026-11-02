// Названия заклинаний (свои записи и встроенные, русские и английские) → как писать в ссылке: для ссылок в
// статблоках и листах (links.ts) и подсказок в редакторе колдовства. Fills Background.svelte from the compendium.
import { searchKey } from '../../shared/compendium';

let spells = new Map<string, string>();
let known: string[] = [];
let pattern: RegExp | null = null;
const listeners = new Set<() => void>();

// Все известные названия заклинаний (подсказки в редакторе статблока).
export const knownSpells = () => [...known].sort((a, b) => a.localeCompare(b, 'ru'));

// aliases — other names of known spells → the name to link to (LSS's own Russian names → the English name: the
// Russian SRD is another translation, «Огненные ладони» there is «Огненные руки»). A known name wins over an alias.
export function setSpellIndex(names: string[], aliases: Record<string, string> = {}) {
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

export const spellName = (text: string) => spells.get(searchKey(text.trim().replace(/[.,;:]$/, '')));
export const spellPattern = () => pattern;
export function onSpellIndex(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}
