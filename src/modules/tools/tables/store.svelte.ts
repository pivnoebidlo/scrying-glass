// Таблицы случайностей в окне управления: встроенные (написаны для приложения, лежат рядом) и таблицы хранилища
// (Markdown в папках таблиц). Тексты хранилища читаются через ядро и перечитываются, когда хранилище изменилось.
import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { placeOrder, placeTitle, visibleIn } from '../../../shared/adventures';
import { parseTable, rollTable, tableKey, type RandomTable, type TableRoll } from '../../../shared/tables';
import { allFiles, basename, dirname, roleFolders } from '../../../shared/vault';

export interface TableItem {
  // «builtin:<имя>» или путь файла в хранилище.
  id: string;
  path: string | null;
  // Подпись группы: «Встроенные», «Страд», «Общее»…
  group: string;
  order: number;
  table: RandomTable;
  text: string;
}

const raw = import.meta.glob('./builtin/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const fileTitle = (p: string) => basename(p).replace(/\.(md|txt)$/i, '');

export const BUILTIN: TableItem[] = Object.entries(raw)
  .map(([p, text]) => ({ id: 'builtin:' + fileTitle(p), path: null, group: 'Встроенные', order: 9, table: parseTable(text, fileTitle(p)), text }))
  .sort((a, b) => a.table.title.localeCompare(b.table.title, 'ru'));

export const tables = $state({ vault: [] as TableItem[], loading: false });

let loadedFor = '';
// Перечитать таблицы хранилища, если изменился список файлов или ядро перечитало хранилище.
export async function loadTables() {
  connectNotes();
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

export const allTables = () => [...tables.vault, ...BUILTIN];

// [[Ссылка]] на таблицу: по названию или имени файла; свои таблицы важнее встроенных.
export function resolveTable(name: string): RandomTable | null {
  const k = tableKey(name);
  const hit = allTables().find((t) => tableKey(t.table.title) === k || (t.path ? tableKey(fileTitle(t.path)) === k : tableKey(t.id.slice(8)) === k));
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
