// Связь справочника с остальным окном: выдвижная панель записи (открыть её можно откуда угодно — из статблока,
// листа персонажа, трекера инициативы) и указатель названий заклинаний для ссылок. Панель рисует и указатель
// заполняет фоновый компонент справочника (modules/compendium); здесь только общее состояние без зависимостей.
import { searchKey } from '../../../shared/compendium';

// Что открыто в панели: названия, по которым искать запись (первое найденное; «Ослеплён» → «Ослеплённый», «Blinded»).
// path — когда известна сама запись (из поиска ⌘K): одинаковые названия бывают в разных местах.
export const entryPeek = $state({ names: null as string[] | null, path: null as string | null });

export function peekEntry(names: string | string[]) {
  const list = Array.isArray(names) ? names : [names];
  const same = entryPeek.names && entryPeek.names.join('|') === list.join('|');
  // Повторное нажатие на ту же ссылку закрывает панель, как у карточек.
  entryPeek.names = same ? null : list;
  entryPeek.path = null;
}
export function peekEntryAt(path: string, title: string) {
  entryPeek.names = [title];
  entryPeek.path = path;
}
export function closeEntryPeek() {
  entryPeek.names = null;
  entryPeek.path = null;
}

// Названия заклинаний (свои записи и встроенные, русские и английские) → как писать в ссылке.
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
