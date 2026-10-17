// Корзина приложения, как в Obsidian. Удалённое не уходит в системную корзину (её могут очищать сами, и файл
// пропадёт), а переезжает в скрытую папку .trash того места, где лежало, — хранилища или библиотеки. Оттуда его
// возвращают в окне «Корзина» или удаляют насовсем.
//   .trash/<id>/.meta.json      — что это, откуда и когда (TrashMeta)
//   .trash/<id>/<путь как был>  — сами файлы и папки
// Скрытые папки приложение не сканирует, резервные копии и экспорт их пропускают.
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TRASH_DEFAULTS, type TrashItem, type TrashMeta, type TrashPlace, type TrashSettings } from '../shared/trash';

export const TRASH_DIR = '.trash';
const META = '.meta.json';

let listener: () => void = () => {};
// Кто узнаёт об изменениях корзины (ядро рассылает окнам событие).
export function onTrashChanged(fn: () => void) {
  listener = fn;
}

let settings: TrashSettings = { ...TRASH_DEFAULTS };
export const trashSettings = () => settings;
export function setTrashSettings(next: Partial<TrashSettings> | null | undefined) {
  settings = { ...TRASH_DEFAULTS, ...next };
}

// Подписи для подтверждения удаления: куда уйдёт и как вернуть (корзина выключена — насовсем).
export const deleteWords = () =>
  settings.keep
    ? { button: t('core.trash.button'), how: t('core.trash.how') }
    : { button: t('core.delete'), how: t('core.trash.howOff') };

// Путь внутри root (без выхода за его пределы и без пустого пути).
function inside(root: string, rel: string): string | null {
  const abs = path.resolve(root, ...rel.split('/'));
  return abs.startsWith(root + path.sep) ? abs : null;
}

// Переместить; между дисками rename не работает — тогда копия и удаление.
function move(from: string, to: string) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fs.renameSync(from, to);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EXDEV') throw e;
    fs.cpSync(from, to, { recursive: true, preserveTimestamps: true });
    fs.rmSync(from, { recursive: true, force: true });
  }
}

function sizeOf(p: string): number {
  try {
    const st = fs.lstatSync(p);
    if (!st.isDirectory()) return st.size;
    return fs.readdirSync(p).reduce((sum, name) => sum + sizeOf(path.join(p, name)), 0);
  } catch {
    return 0;
  }
}

const newId = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${stamp}-${Math.random().toString(36).slice(2, 8)}`;
};

// Переместить пути (от корня root) в корзину одним элементом. Чего нет — пропускается. id элемента или null.
export function moveToTrash(root: string, paths: string[], meta: Omit<TrashMeta, 'paths' | 'deleted'>): string | null {
  const id = newId();
  const dir = path.join(root, TRASH_DIR, id);
  const moved: string[] = [];
  for (const rel of paths) {
    const src = inside(root, rel);
    if (!src || rel.split('/')[0] === TRASH_DIR || !fs.existsSync(src)) continue;
    move(src, path.join(dir, ...rel.split('/')));
    moved.push(rel);
  }
  if (!moved.length) return null;
  const full: TrashMeta = { ...meta, paths: moved, deleted: Date.now() };
  fs.writeFileSync(path.join(dir, META), JSON.stringify(full, null, 2));
  listener();
  return id;
}

// Удалить по команде пользователя: в корзину или, если она выключена в настройках, сразу насовсем.
// true — что-то удалено.
export function discard(root: string, paths: string[], meta: Omit<TrashMeta, 'paths' | 'deleted'>): boolean {
  if (settings.keep) return !!moveToTrash(root, paths, meta);
  let done = false;
  for (const rel of paths) {
    const abs = inside(root, rel);
    if (!abs || rel.split('/')[0] === TRASH_DIR || !fs.existsSync(abs)) continue;
    fs.rmSync(abs, { recursive: true, force: true });
    done = true;
  }
  return done;
}

function readMeta(dir: string): TrashMeta | null {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, META), 'utf8')) as TrashMeta;
    return Array.isArray(m.paths) && typeof m.title === 'string' ? m : null;
  } catch {
    return null;
  }
}

// Описание элемента. Нет .meta.json (папку положили руками или файл испорчен) — что лежит внутри, как есть.
function metaOf(dir: string): TrashMeta {
  const m = readMeta(dir);
  if (m) return m;
  const names = fs.readdirSync(dir).filter((n) => n !== META);
  const st = fs.statSync(dir);
  const one = names.length === 1 && fs.statSync(path.join(dir, names[0]!)).isDirectory();
  return { title: names.join(', ') || path.basename(dir), kind: one ? 'folder' : 'file', paths: names, deleted: st.mtimeMs };
}

function itemDir(root: string, id: string): string | null {
  if (!id || id.includes('/') || id.includes('\\') || id.startsWith('.')) return null;
  const dir = path.join(root, TRASH_DIR, id);
  return fs.existsSync(dir) ? dir : null;
}

// Содержимое корзины места, новые сверху.
export function listTrash(root: string, place: TrashPlace): TrashItem[] {
  const base = path.join(root, TRASH_DIR);
  let names: string[] = [];
  try {
    names = fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name);
  } catch {
    return [];
  }
  const out: TrashItem[] = [];
  for (const id of names) {
    const dir = path.join(base, id);
    try {
      const { data: _data, ...m } = metaOf(dir);
      out.push({ ...m, id, place, size: sizeOf(dir) - sizeOf(path.join(dir, META)) });
    } catch {
      /* папку убрали, пока читали */
    }
  }
  return out.sort((a, b) => b.deleted - a.deleted);
}

// Свободный путь: «x.png», «x (2).png»; у папок — «Глава», «Глава (2)».
function freePath(abs: string, isDir: boolean): string {
  if (!fs.existsSync(abs)) return abs;
  const dir = path.dirname(abs);
  const ext = isDir ? '' : path.extname(abs);
  const base = path.basename(abs, ext);
  for (let i = 2; ; i++) {
    const next = path.join(dir, `${base} (${i})${ext}`);
    if (!fs.existsSync(next)) return next;
  }
}

export interface Restored {
  meta: TrashMeta;
  // Куда вернулось: прежний путь → новый (другой, если прежнее имя уже занято).
  moved: { from: string; to: string }[];
}

// Вернуть элемент на прежнее место. Папки, которых больше нет, создаются; занятое имя — «x (2)».
export function restoreFromTrash(root: string, id: string): Restored | null {
  const dir = itemDir(root, id);
  if (!dir) return null;
  const meta = metaOf(dir);
  const moved: Restored['moved'] = [];
  for (const rel of meta.paths) {
    const src = inside(dir, rel);
    const dst = inside(root, rel);
    if (!src || !dst || !fs.existsSync(src)) continue;
    const to = freePath(dst, fs.statSync(src).isDirectory());
    move(src, to);
    moved.push({ from: rel, to: path.relative(root, to).split(path.sep).join('/') });
  }
  fs.rmSync(dir, { recursive: true, force: true });
  listener();
  return { meta, moved };
}

// Удалить элемент насовсем.
export function purgeTrash(root: string, id: string): boolean {
  const dir = itemDir(root, id);
  if (!dir) return false;
  fs.rmSync(dir, { recursive: true, force: true });
  listener();
  return true;
}

// Очистить корзину места.
export function emptyTrash(root: string) {
  fs.rmSync(path.join(root, TRASH_DIR), { recursive: true, force: true });
  listener();
}

// Убрать насовсем то, что лежит в корзине дольше days дней. Сколько убрано.
export function pruneTrash(root: string, days: number, now = Date.now()): number {
  if (!(days > 0)) return 0;
  const old = listTrash(root, 'vault').filter((it) => now - it.deleted > days * 864e5);
  for (const it of old) fs.rmSync(path.join(root, TRASH_DIR, it.id), { recursive: true, force: true });
  if (old.length) listener();
  return old.length;
}
