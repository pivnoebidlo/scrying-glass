// Сканирование хранилища. Файлы пользователя только читаются.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileKind, folderRole, type VaultFile, type VaultFolder } from '../shared/vault';

const MAX_DEPTH = 12;
const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const byName = (a: { name: string }, b: { name: string }) => collator.compare(a.name, b.name);

// Скрытые файлы и папки (в том числе .scrying-glass) пропускаются. Символические ссылки тоже:
// они могут вести по кругу или за пределы хранилища.
export function scanVault(root: string): VaultFolder {
  return scan(root, '', path.basename(root), 0, false);
}

// Текстовые файлы — только в папках таблиц (и вложенных в них): остальные заметки хранилища (Obsidian) не нужны.
const TEXT = /\.(md|txt)$/i;

function scan(abs: string, rel: string, name: string, depth: number, inTables: boolean): VaultFolder {
  const folder: VaultFolder = { path: rel, name: name.normalize('NFC'), folders: [], files: [] };
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return folder;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      const tables = inTables || folderRole(e.name) === 'tables';
      if (depth < MAX_DEPTH) folder.folders.push(scan(path.join(abs, e.name), childRel, e.name, depth + 1, tables));
    } else if (e.isFile()) {
      const kind = fileKind(e.name) ?? (inTables && TEXT.test(e.name) ? 'table' : null);
      if (kind) folder.files.push({ path: childRel, name: e.name.normalize('NFC'), kind } satisfies VaultFile);
    }
  }
  folder.folders.sort(byName);
  folder.files.sort(byName);
  return folder;
}
