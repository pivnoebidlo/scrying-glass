// Файлы таблиц случайностей (shared/tables.ts): в хранилище — .md / .txt только в папках таблиц (заметки
// пользователя в других папках приложение не трогает), в библиотеке — <библиотека>/tables (общие для всех кампаний,
// пути «library:tables/…»). Встроенные таблицы при первом запуске кладутся в библиотеку обычными файлами.
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BrowserWindow } from 'electron';

import { resolver, textKind } from './textstore';

const kind = textKind('tables', 'tables', () => t('core.name.table'));
export const isTablePath = kind.isPath;
export const tableResolver = resolver;
export const readTable = kind.read;
export const writeTable = kind.write;
export const createTable = kind.create;
const safe = (title: string) => title.replace(/[/\\:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || t('core.name.table');

// ---------- Библиотека ----------

const libDir = (library: string) => path.join(library, 'tables');
// Какие встроенные таблицы уже клали в библиотеку: удалённую пользователем не возвращаем сами.
const seededFile = (library: string) => path.join(libDir(library), '.builtin.json');

export const listLibraryTables = (library: string | null) => kind.listLibrary(library);

// Положить встроенные таблицы в библиотеку: новые (каких ещё не клали) или, с restore, все, которых нет на диске.
// Возвращает, сколько файлов записано.
export function seedLibraryTables(library: string | null, files: { name: string; text: string }[], restore = false): number {
  if (!library) return 0;
  const dir = libDir(library);
  fs.mkdirSync(dir, { recursive: true });
  let seeded: string[] = [];
  try {
    seeded = JSON.parse(fs.readFileSync(seededFile(library), 'utf8')).seeded ?? [];
  } catch {
    /* первый запуск */
  }
  let n = 0;
  for (const f of files) {
    const file = path.join(dir, safe(f.name) + '.md');
    if ((!restore && seeded.includes(f.name)) || fs.existsSync(file)) continue;
    fs.writeFileSync(file, f.text);
    n++;
  }
  const all = [...new Set([...seeded, ...files.map((f) => f.name)])];
  fs.writeFileSync(seededFile(library), JSON.stringify({ seeded: all }, null, 2));
  return n;
}

// Изменения в папке таблиц библиотеки (в том числе снаружи) — окна перечитывают таблицы.
let watcher: fs.FSWatcher | null = null;
export function watchLibraryTables(library: string | null) {
  watcher?.close();
  watcher = null;
  if (!library) return;
  let timer: NodeJS.Timeout | null = null;
  try {
    fs.mkdirSync(libDir(library), { recursive: true });
    watcher = fs.watch(libDir(library), { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send('tables:changed');
      }, 300);
    });
    watcher.on('error', () => {});
  } catch {
    watcher = null;
  }
}
