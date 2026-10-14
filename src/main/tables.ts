// Файлы таблиц случайностей (shared/tables.ts): в хранилище — .md / .txt только в папках таблиц (заметки
// пользователя в других папках приложение не трогает), в библиотеке — <библиотека>/tables (общие для всех кампаний,
// пути «library:tables/…»). Встроенные таблицы при первом запуске кладутся в библиотеку обычными файлами.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BrowserWindow } from 'electron';
import { LIBRARY, folderRole } from '../shared/vault';

type Resolve = (rel: string) => string | null;

const TEXT = /\.(md|txt)$/i;
export const isTablePath = (rel: string) =>
  TEXT.test(rel) && (rel.startsWith(LIBRARY) ? rel.startsWith(LIBRARY + 'tables/') : rel.split('/').slice(0, -1).some((p) => folderRole(p) === 'tables'));
const isTablesFolder = (folder: string) =>
  folder.startsWith(LIBRARY) ? folder === LIBRARY + 'tables' || folder.startsWith(LIBRARY + 'tables/') : folder.split('/').some((p) => folderRole(p) === 'tables');

// Путь таблицы или папки таблиц -> файл на диске (хранилище или библиотека).
export function tableResolver(vault: Resolve, library: Resolve): Resolve {
  return (rel) => (rel.startsWith(LIBRARY) ? library(rel.slice(LIBRARY.length)) : vault(rel));
}

export function readTable(resolve: Resolve, rel: string): string | null {
  const abs = isTablePath(rel) ? resolve(rel) : null;
  try {
    return abs ? fs.readFileSync(abs, 'utf8') : null;
  } catch {
    return null;
  }
}

export function writeTable(resolve: Resolve, rel: string, text: string): boolean {
  const abs = isTablePath(rel) ? resolve(rel) : null;
  if (!abs) return false;
  const tmp = abs + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, abs);
  return true;
}

const safe = (title: string) => title.replace(/[/\\:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Таблица';

// Новая таблица в папке таблиц folder (создаётся, если её нет). Путь к файлу или null.
export function createTable(resolve: Resolve, folder: string, title: string, text: string): string | null {
  if (!isTablesFolder(folder)) return null;
  const dir = resolve(folder);
  if (!dir) return null;
  fs.mkdirSync(dir, { recursive: true });
  const base = safe(title);
  let name = base + '.md';
  for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base} (${i}).md`;
  fs.writeFileSync(path.join(dir, name), text);
  return `${folder}/${name}`;
}

// ---------- Библиотека ----------

const libDir = (library: string) => path.join(library, 'tables');
// Какие встроенные таблицы уже клали в библиотеку: удалённую пользователем не возвращаем сами.
const seededFile = (library: string) => path.join(libDir(library), '.builtin.json');

export function listLibraryTables(library: string | null): { path: string; text: string }[] {
  if (!library) return [];
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string, rel: string, depth: number) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const r = `${rel}/${e.name}`;
      if (e.isDirectory() && depth < 4) walk(path.join(dir, e.name), r, depth + 1);
      else if (e.isFile() && TEXT.test(e.name)) {
        try {
          out.push({ path: LIBRARY + 'tables' + r, text: fs.readFileSync(path.join(dir, e.name), 'utf8') });
        } catch {
          /* файл исчез между чтением папки и файла */
        }
      }
    }
  };
  walk(libDir(library), '', 0);
  return out;
}

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
