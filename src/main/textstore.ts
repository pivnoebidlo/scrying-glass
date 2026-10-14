// Текстовые файлы (Markdown) одного вида — таблицы случайностей, записи справочника: в хранилище — только в папках
// своей роли (заметки пользователя в других папках приложение не трогает), в библиотеке — <библиотека>/<sub>
// (общие для всех кампаний, пути «library:<sub>/…»).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LIBRARY, folderRole, type FolderRole } from '../shared/vault';

type Resolve = (rel: string) => string | null;
const TEXT = /\.(md|txt)$/i;

// Путь файла или папки (хранилища или «library:…») -> файл на диске.
export function resolver(vault: Resolve, library: Resolve): Resolve {
  return (rel) => (rel.startsWith(LIBRARY) ? library(rel.slice(LIBRARY.length)) : vault(rel));
}

export function textKind(role: FolderRole, sub: string, fallbackName: string) {
  const lib = LIBRARY + sub;
  const inRole = (rel: string) => rel.split('/').some((p) => folderRole(p) === role);
  const isPath = (rel: string) => TEXT.test(rel) && (rel.startsWith(LIBRARY) ? rel.startsWith(lib + '/') : inRole(rel.split('/').slice(0, -1).join('/')));
  const isFolder = (folder: string) => (folder.startsWith(LIBRARY) ? folder === lib || folder.startsWith(lib + '/') : inRole(folder));
  const safe = (title: string) => title.replace(/[/\\:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || fallbackName;
  const free = (dir: string, title: string, except?: string) => {
    const base = safe(title);
    let name = base + '.md';
    for (let i = 2; fs.existsSync(path.join(dir, name)) && path.join(dir, name) !== except; i++) name = `${base} (${i}).md`;
    return name;
  };

  return {
    isPath,
    isFolder,
    read(resolve: Resolve, rel: string): string | null {
      const abs = isPath(rel) ? resolve(rel) : null;
      try {
        return abs ? fs.readFileSync(abs, 'utf8') : null;
      } catch {
        return null;
      }
    },
    write(resolve: Resolve, rel: string, text: string): boolean {
      const abs = isPath(rel) ? resolve(rel) : null;
      if (!abs) return false;
      fs.writeFileSync(abs + '.tmp', text);
      fs.renameSync(abs + '.tmp', abs);
      return true;
    },
    // Новый файл в папке folder своей роли (создаётся, если её нет). Путь или null.
    create(resolve: Resolve, folder: string, title: string, text: string): string | null {
      if (!isFolder(folder)) return null;
      const dir = resolve(folder);
      if (!dir) return null;
      fs.mkdirSync(dir, { recursive: true });
      const name = free(dir, title);
      fs.writeFileSync(path.join(dir, name), text);
      return `${folder}/${name}`;
    },
    // Новое название = новое имя файла. Новый путь (тот же, если имя не изменилось) или null.
    rename(resolve: Resolve, rel: string, title: string): string | null {
      const abs = isPath(rel) ? resolve(rel) : null;
      if (!abs || !fs.existsSync(abs)) return null;
      const name = free(path.dirname(abs), title, abs);
      const target = path.join(path.dirname(abs), name);
      if (target !== abs) fs.renameSync(abs, target);
      return rel.slice(0, rel.lastIndexOf('/') + 1) + name;
    },
    // Все файлы этого вида в библиотеке: путь «library:<sub>/…» и текст.
    listLibrary(library: string | null): { path: string; text: string }[] {
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
              out.push({ path: lib + r, text: fs.readFileSync(path.join(dir, e.name), 'utf8') });
            } catch {
              /* файл исчез между чтением папки и файла */
            }
          }
        }
      };
      walk(path.join(library, sub), '', 0);
      return out;
    },
  };
}
