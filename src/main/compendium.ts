// Записи справочника (shared/compendium.ts): Markdown в папках справочника хранилища и в <библиотека>/compendium
// (общие для всех кампаний, пути «library:compendium/…»). Изменения в библиотеке (и снаружи) — событие окнам.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app, BrowserWindow } from 'electron';
import type { BuiltinBook } from '../shared/compendium';
import { textKind } from './textstore';

export const entries = textKind('compendium', 'compendium', 'Запись');

// Встроенный справочник (SRD в переводе OmnisGM) — resources/compendium/<система>.json, собирает
// scripts/import-compendium.ts. Только чтение; читается один раз за запуск.
let builtin: BuiltinBook[] | null = null;
export function builtinEntries(): BuiltinBook[] {
  if (builtin) return builtin;
  const dir = path.join(app.getAppPath(), 'resources', 'compendium');
  try {
    builtin = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as BuiltinBook);
  } catch {
    builtin = [];
  }
  return builtin;
}

let watcher: fs.FSWatcher | null = null;
export function watchLibraryCompendium(library: string | null) {
  watcher?.close();
  watcher = null;
  if (!library) return;
  const dir = path.join(library, 'compendium');
  let timer: NodeJS.Timeout | null = null;
  try {
    fs.mkdirSync(dir, { recursive: true });
    watcher = fs.watch(dir, { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send('compendium:changed');
      }, 300);
    });
    watcher.on('error', () => {});
  } catch {
    watcher = null;
  }
}
