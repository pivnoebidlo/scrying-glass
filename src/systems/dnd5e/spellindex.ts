// Названия заклинаний (свои записи и встроенные, русские и английские) → как писать в ссылке: для ссылок в
// статблоках и листах (links.ts) и подсказок в редакторе колдовства. Fills Background.svelte from the compendium.
import { searchKey } from '../../shared/compendium';

let spells = new Map<string, string>();
let pattern: RegExp | null = null;
const listeners = new Set<() => void>();

// Все известные названия заклинаний (подсказки в редакторе статблока).
export const knownSpells = () => [...spells.values()].sort((a, b) => a.localeCompare(b, 'ru'));

export function setSpellIndex(names: string[]) {
  const next = new Map<string, string>();
  for (const n of names) if (n.trim().length > 2) next.set(searchKey(n.trim()), n.trim());
  if (next.size === spells.size && [...next.keys()].every((k) => spells.has(k))) return;
  spells = next;
  // Длинные названия — первыми: «Высшая невидимость» раньше «Невидимости».
  const alts = [...next.values()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  pattern = alts.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${alts.join('|')})(?![\\p{L}\\p{N}])`, 'giu') : null;
  for (const f of listeners) f();
}

export const spellName = (text: string) => spells.get(searchKey(text.trim().replace(/[.,;:]$/, '')));
export const spellPattern = () => pattern;
export function onSpellIndex(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}
