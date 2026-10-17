// Таблицы случайностей в окне управления: таблицы хранилища (Markdown в папках таблиц) и библиотеки (общие для всех
// кампаний). Встроенные таблицы (написаны для приложения, лежат рядом) при первом запуске кладутся в библиотеку
// обычными файлами — их можно править и дополнять. Тексты читаются через ядро и перечитываются при изменениях.
import { locale, t } from '../../../renderer/lib/i18n.svelte';
import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { placeOrder, placeTitle, visibleIn } from '../../../shared/adventures';
import { parseTable, rollTable, tableKey, type RandomTable, type TableRoll } from '../../../shared/tables';
import { allFiles, basename, dirname, LIBRARY, roleFolders } from '../../../shared/vault';

export interface TableItem {
  // Путь файла: в хранилище или «library:tables/…».
  id: string;
  path: string;
  // Подпись группы: «Страд», «Общее», «Библиотека»…
  group: string;
  order: number;
  table: RandomTable;
  text: string;
}

const raw = import.meta.glob('./builtin/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const fileTitle = (p: string) => basename(p).replace(/\.(md|txt)$/i, '');

// Built-in tables by language (builtin/<lang>/<title>.md). A table's id is its English title: the same table in
// another language is the same table for seeding (switching the language does not add a second set).
const RU_TO_ID: Record<string, string> = {
  'Слухи в таверне': 'Tavern Rumors', 'События в пути': 'Road Encounters', 'Что в карманах': "What's in the Pockets",
  'Безделушки и находки': 'Trinkets and Finds', Погода: 'Weather',
}
const ALL_BUILTIN = Object.entries(raw).map(([p, text]) => {
  const lang = p.split('/').at(-2)!;
  const name = fileTitle(p);
  return { lang, name, text, id: lang === 'ru' ? (RU_TO_ID[name] ?? name) : name };
});
// The set to put into the library: in the interface language, or else English. names — the table's names in all
// languages (older libraries remember seeded tables by their Russian names).
const builtinSet = () => {
  const lang = ALL_BUILTIN.some((b) => b.lang === locale.lang) ? locale.lang : 'en';
  return ALL_BUILTIN.filter((b) => b.lang === lang).map((b) => ({
    id: b.id,
    name: b.name,
    text: b.text,
    names: ALL_BUILTIN.filter((x) => x.id === b.id).map((x) => x.name),
  }));
};
export const libraryGroup = () => t('tools.tables.libraryGroup');

export const tables = $state({ vault: [] as TableItem[], library: [] as TableItem[], loading: false, rev: 0 });

let hooked = false;
let seeded: Promise<unknown> | null = null;

// Вернуть встроенные таблицы, которых нет в библиотеке (удалённые). Сколько вернулось.
export async function restoreBuiltins() {
  const n = await window.api.seedLibraryTables(builtinSet(), true);
  tables.rev++;
  return n;
}

async function loadLibrary() {
  const list = await window.api.listLibraryTables();
  tables.library = list
    .map((f) => ({ id: f.path, path: f.path, group: libraryGroup(), order: 2, table: parseTable(f.text, fileTitle(f.path)), text: f.text }))
    .sort((a, b) => a.table.title.localeCompare(b.table.title, 'ru'));
}

let loadedFor = '';
let libraryFor = -1;
// Перечитать таблицы: хранилища — если изменился список файлов или ядро перечитало хранилище, библиотеки — по
// событию ядра. Встроенные таблицы кладутся в библиотеку один раз за запуск (только новые).
export async function loadTables() {
  connectNotes();
  if (!hooked) {
    hooked = true;
    window.api.onTablesChanged(() => tables.rev++);
  }
  seeded ??= window.api.seedLibraryTables(builtinSet());
  await seeded;
  if (libraryFor !== tables.rev) {
    libraryFor = tables.rev;
    await loadLibrary();
  }
  const app = store.state;
  const tree = app.vault.tree;
  const files = tree
    ? roleFolders(tree, 'tables', app.vault.name)
        .filter((r) => visibleIn(app.adventures, r.folder.path))
        .flatMap((r) => allFiles(r.folder, 'table').map((f) => ({ path: f.path, dir: dirname(r.folder.path) })))
    : [];
  const key = notes.rev + '|' + files.map((f) => f.path).join('|');
  if (key === loadedFor) return;
  loadedFor = key;
  tables.loading = true;
  const list = await Promise.all(
    files.map(async (f) => {
      const text = (await window.api.readTable(f.path)) ?? '';
      const dir = f.dir;
      return {
        id: f.path,
        path: f.path,
        group: placeTitle(app.adventures, dir, app.vault.name),
        order: placeOrder(app.adventures, dir),
        table: parseTable(text, fileTitle(f.path)),
        text,
      };
    })
  );
  if (loadedFor === key) {
    tables.vault = list.sort((a, b) => a.order - b.order || a.group.localeCompare(b.group, 'ru') || a.table.title.localeCompare(b.table.title, 'ru'));
    tables.loading = false;
  }
}

export const allTables = () => [...tables.vault, ...tables.library];
export const isLibraryTable = (path: string) => path.startsWith(LIBRARY);

// [[Ссылка]] на таблицу: по названию или имени файла; таблицы приключения важнее общих, общие — библиотеки.
export function resolveTable(name: string): RandomTable | null {
  const k = tableKey(name);
  const hit = allTables().find((t) => tableKey(t.table.title) === k || tableKey(fileTitle(t.path)) === k);
  return hit?.table ?? null;
}

export interface HistoryItem {
  id: number;
  table: string;
  title: string;
  roll: TableRoll;
}

// Последние броски по всем таблицам (новые сверху); живут, пока открыто окно.
export const history = $state<HistoryItem[]>([]);
let seq = 0;

export function roll(item: TableItem, times = 1) {
  for (let i = 0; i < times; i++) {
    const r = rollTable(item.table, { resolve: resolveTable });
    if (r) history.unshift({ id: ++seq, table: item.id, title: item.table.title, roll: r });
  }
  history.splice(100);
}

// Вариант выбран вручную (щелчок по строке таблицы): подставляем броски и ссылки так же.
export function pick(item: TableItem, index: number) {
  const r = rollTable({ ...item.table, entries: [item.table.entries[index]!] }, { resolve: resolveTable });
  if (r) history.unshift({ id: ++seq, table: item.id, title: item.table.title, roll: { ...r, index, number: null } });
}
