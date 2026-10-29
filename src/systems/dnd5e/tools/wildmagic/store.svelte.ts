// Wild magic in the control window: the tables (ours, the Wand of Wonder of the adventure's edition from the
// compendium, the GM's own from the library — wild-magic.json, common to all campaigns), the chosen table and the
// rolls of this window (localStorage).
import { locale, t } from '../../../../renderer/lib/i18n.svelte';
import { store } from '../../../../renderer/lib/store.svelte';
import { currentSystem } from '../../../../shared/adventures';
import { BUILTIN } from '../../../../shared/compendium';
import { book, entryAt } from '../../../../modules/compendium/ui/store.svelte';
import { dieOf, parseOwnTables, parseTable, surgeRows, SURGE_ID, type OwnTable, type SurgeTable } from './tables';

export const WAND_ID = 'wand';

export interface Rolled {
  table: string;
  title: string;
  roll: number;
  text: string;
}

const KEY = 'wildmagic.state';
const HISTORY_MAX = 30;
function load(): { table: string; history: Rolled[] } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { table?: string; history?: Rolled[] };
    return { table: v.table ?? SURGE_ID, history: Array.isArray(v.history) ? v.history : [] };
  } catch {
    return { table: SURGE_ID, history: [] };
  }
}
export const wm = $state(load());
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(wm)));
  } catch {
    /* not remembered — not a problem */
  }
}
export function remember(r: Rolled) {
  wm.history = [r, ...wm.history].slice(0, HISTORY_MAX);
  save();
}

// The Wand of Wonder of the adventure's edition, in the interface language if there is such a book (else English);
// the GM's edit of the built-in entry wins (entryAt).
function wandTable(): SurgeTable | null {
  const system = currentSystem(store.state.adventures);
  const of = book.builtin.filter((e) => e.path.startsWith(`${BUILTIN}${system}/`) && (e.en ?? e.entry.title) === 'Wand of Wonder');
  const found = of.find((e) => e.lang === locale.lang) ?? of.find((e) => e.lang === 'en');
  const entry = found && (entryAt(found.path) ?? found);
  if (!entry) return null;
  // Only the table: the text around it is the wand's rules.
  const rows = parseTable(entry.entry.body.split('\n').filter((l) => l.trim().startsWith('|')).join('\n'));
  return rows.length ? { id: WAND_ID, title: `${entry.entry.title} (${system.endsWith('2014') ? 'SRD 5.1' : 'SRD 5.2'})`, die: dieOf(rows), rows } : null;
}

// ---------- The GM's tables ----------

export const own = $state({ list: [] as OwnTable[], loaded: false });
let loading: Promise<void> | null = null;
export function loadOwn() {
  loading ??= window.api.readLibraryData('wild-magic.json').then((d) => {
    own.list = parseOwnTables(d);
    own.loaded = true;
  });
  return loading;
}
const saveOwn = () => window.api.writeLibraryData('wild-magic.json', { tables: $state.snapshot(own.list) });

export function putOwn(table: OwnTable) {
  const i = own.list.findIndex((x) => x.id === table.id);
  if (i >= 0) own.list[i] = table;
  else own.list.push(table);
  void saveOwn();
}
export function removeOwn(id: string) {
  own.list = own.list.filter((x) => x.id !== id);
  if (wm.table === id) wm.table = SURGE_ID;
  save();
  void saveOwn();
}
export const newOwnId = () => `own-${Math.random().toString(36).slice(2, 10)}`;

// All tables: ours, the wand (once the compendium is loaded), the GM's.
export function tables(): SurgeTable[] {
  const surge = surgeRows(locale.lang);
  const wand = wandTable();
  return [
    { id: SURGE_ID, title: t('wild.surge'), die: dieOf(surge), rows: surge },
    ...(wand ? [wand] : []),
    ...own.list.flatMap((o) => {
      const rows = parseTable(o.text);
      return rows.length ? [{ id: o.id, title: o.title, die: dieOf(rows), rows }] : [];
    }),
  ];
}
