// Файлы записок (shared/notes.ts) в хранилище: прочитать, сохранить, создать, переименовать. Это файлы,
// которые создаёт и правит само приложение (как карточки), — только «….note.json» и только внутри хранилища.
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isNotePath, NOTE_SUFFIX, parseNote, type Note } from '../shared/notes';
import { writeJsonAtomic } from './files';

type Resolve = (rel: string) => string | null;

export function readNoteFile(abs: string): Note | null {
  try {
    return parseNote(JSON.parse(fs.readFileSync(abs, 'utf8')));
  } catch {
    return null;
  }
}

export function readNote(resolve: Resolve, rel: string): Note | null {
  const abs = isNotePath(rel) ? resolve(rel) : null;
  return abs ? readNoteFile(abs) : null;
}

export function writeNote(resolve: Resolve, rel: string, note: Note): boolean {
  const abs = isNotePath(rel) ? resolve(rel) : null;
  const clean = parseNote(note);
  if (!abs || !clean) return false;
  writeJsonAtomic(abs, clean);
  return true;
}

// Название файла из названия записки: без символов, запрещённых в именах файлов.
const safe = (title: string) => title.replace(/[/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || t('core.name.note');

function freeNote(dir: string, title: string, except?: string): string {
  const base = safe(title);
  let name = base + NOTE_SUFFIX;
  for (let i = 2; fs.existsSync(path.join(dir, name)) && path.join(dir, name) !== except; i++) name = `${base} (${i})${NOTE_SUFFIX}`;
  return name;
}

// Новая записка в папке folder (путь внутри хранилища; папку создаём, если её нет). Возвращает её путь.
export function createNote(resolve: Resolve, folder: string, title: string, note: Note): string | null {
  const dir = resolve(folder);
  if (!dir) return null;
  fs.mkdirSync(dir, { recursive: true });
  const name = freeNote(dir, title);
  writeJsonAtomic(path.join(dir, name), parseNote(note));
  return folder ? `${folder}/${name}` : name;
}

// Переименовать записку (название = имя файла). Возвращает новый путь (тот же, если имя не изменилось).
export function renameNote(resolve: Resolve, rel: string, title: string): string | null {
  const abs = isNotePath(rel) ? resolve(rel) : null;
  if (!abs || !fs.existsSync(abs)) return null;
  const dir = path.dirname(abs);
  const name = freeNote(dir, title, abs);
  const target = path.join(dir, name);
  if (target !== abs) fs.renameSync(abs, target);
  const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  return folder ? `${folder}/${name}` : name;
}
