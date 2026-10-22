// Текстовые файлы (Markdown) одного вида — записи справочника, заметки журнала: в хранилище — только в папках
// своей роли (заметки пользователя в других папках приложение не трогает), в библиотеке — <библиотека>/<sub>
// (общие для всех кампаний, пути «library:<sub>/…»).
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LIBRARY, folderRole, type FolderRole } from '../shared/vault';

type Resolve = (rel: string) => string | null;
const TEXT = /\.(md|txt)$/i;

// Путь файла или папки (хранилища или «library:…») -> файл на диске.
export function resolver(vault: Resolve, library: Resolve): Resolve {
  return (rel) => (rel.startsWith(LIBRARY) ? library(rel.slice(LIBRARY.length)) : vault(rel));
}

// `other` — files of the role that are moved and renamed with the texts but never read or written (the journal's PDFs).
export function textKind(role: FolderRole, sub: string, fallbackName: () => string, other?: RegExp) {
  const lib = LIBRARY + sub;
  const inRole = (rel: string) => rel.split('/').some((p) => folderRole(p) === role);
  const isPath = (rel: string) => TEXT.test(rel) && (rel.startsWith(LIBRARY) ? rel.startsWith(lib + '/') : inRole(rel.split('/').slice(0, -1).join('/')));
  const isFile = (rel: string) => isPath(rel) || (!!other && other.test(rel) && !rel.startsWith(LIBRARY) && inRole(rel.split('/').slice(0, -1).join('/')));
  const isFolder = (folder: string) => (folder.startsWith(LIBRARY) ? folder === lib || folder.startsWith(lib + '/') : inRole(folder));
  const safe = (title: string) => title.replace(/[/\\:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || fallbackName();
  const free = (dir: string, title: string, except?: string, ext = '.md') => {
    const base = safe(title);
    let name = base + ext;
    for (let i = 2; fs.existsSync(path.join(dir, name)) && path.join(dir, name) !== except; i++) name = `${base} (${i})${ext}`;
    return name;
  };
  // The extension a file keeps when renamed or moved (texts become .md, as before).
  const extOf = (rel: string) => (isPath(rel) ? '.md' : path.extname(rel));

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
      const abs = isFile(rel) ? resolve(rel) : null;
      if (!abs || !fs.existsSync(abs)) return null;
      const name = free(path.dirname(abs), title, abs, extOf(rel));
      const target = path.join(path.dirname(abs), name);
      if (target !== abs) fs.renameSync(abs, target);
      return rel.slice(0, rel.lastIndexOf('/') + 1) + name;
    },
    // Перенести файл или папку rel в папку folder той же роли (журнал: заметки по подпапкам). Новый путь или null.
    move(resolve: Resolve, rel: string, folder: string): string | null {
      const abs = resolve(rel);
      const dir = isFolder(folder) ? resolve(folder) : null;
      if (!abs || !dir || !fs.existsSync(abs) || !(isFile(rel) || isFolder(rel))) return null;
      // Папку — не внутрь самой себя.
      if (dir === abs || dir.startsWith(abs + path.sep)) return null;
      const isDir = fs.statSync(abs).isDirectory();
      const base = path.basename(abs);
      let name = base;
      if (isDir) for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base} (${i})`;
      else name = free(dir, base.slice(0, base.length - path.extname(base).length), abs, extOf(rel));
      const target = path.join(dir, name);
      if (target === abs) return rel;
      fs.mkdirSync(dir, { recursive: true });
      fs.renameSync(abs, target);
      return `${folder}/${name}`;
    },
    // Rename a folder inside a folder of this role (not the role folder itself: its name gives the role). New path
    // (the same if the name did not change) or null.
    renameFolder(resolve: Resolve, rel: string, title: string): string | null {
      const abs = resolve(rel);
      const parent = rel.slice(0, rel.lastIndexOf('/'));
      if (!abs || !isFolder(rel) || !isFolder(parent) || folderRole(path.basename(abs)) === role) return null;
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return null;
      const base = safe(title);
      if (base === path.basename(abs)) return rel;
      let name = base;
      for (let i = 2; fs.existsSync(path.join(path.dirname(abs), name)); i++) name = `${base} (${i})`;
      fs.renameSync(abs, path.join(path.dirname(abs), name));
      return `${parent}/${name}`;
    },
    // Новая папка внутри папки своей роли. Путь или null.
    mkdir(resolve: Resolve, folder: string, title: string): string | null {
      const dir = isFolder(folder) ? resolve(folder) : null;
      if (!dir) return null;
      const base = safe(title);
      let name = base;
      for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base} (${i})`;
      fs.mkdirSync(path.join(dir, name), { recursive: true });
      return `${folder}/${name}`;
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
