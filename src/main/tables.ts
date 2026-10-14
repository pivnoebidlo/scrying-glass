// Файлы таблиц случайностей (shared/tables.ts) в хранилище: прочитать, сохранить, создать. Только .md / .txt и
// только в папках таблиц — заметки пользователя в других папках приложение не трогает.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { folderRole } from '../shared/vault';

type Resolve = (rel: string) => string | null;

const TEXT = /\.(md|txt)$/i;
export const isTablePath = (rel: string) => TEXT.test(rel) && rel.split('/').slice(0, -1).some((p) => folderRole(p) === 'tables');

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
  if (!folder.split('/').some((p) => folderRole(p) === 'tables')) return null;
  const dir = resolve(folder);
  if (!dir) return null;
  fs.mkdirSync(dir, { recursive: true });
  const base = safe(title);
  let name = base + '.md';
  for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base} (${i}).md`;
  fs.writeFileSync(path.join(dir, name), text);
  return `${folder}/${name}`;
}
