// Хранилище: папка на диске, внутри которой лежит всё (приключения, главы, персонажи, карты, музыка).
// Здесь только типы и чистые функции: модуль используется и ядром, и окнами.

export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
export const AUDIO_EXT = ['.mp3', '.ogg', '.wav', '.flac', '.m4a'];

export type FileKind = 'image' | 'audio';

// Пути внутри хранилища — относительные, через «/», корень — пустая строка.
export interface VaultFile {
  path: string;
  name: string;
  kind: FileKind;
}

export interface VaultFolder {
  path: string;
  name: string;
  folders: VaultFolder[];
  files: VaultFile[];
}

export interface VaultState {
  root: string | null;
  name: string;
  tree: VaultFolder | null;
  // Недавно открытые хранилища, самое свежее первым.
  recent: string[];
}

// Назначение папки угадывается по названию. Это подсказка, а не требование.
export type FolderRole = 'characters' | 'maps' | 'music';

const ROLES: Record<FolderRole, string[]> = {
  characters: ['characters', 'персонажи', 'npc', 'нпс'],
  maps: ['maps', 'карты'],
  music: ['music', 'музыка', 'audio', 'звуки'],
};

export function folderRole(name: string): FolderRole | null {
  const n = name.normalize('NFC').toLowerCase();
  for (const [role, names] of Object.entries(ROLES) as [FolderRole, string[]][]) {
    if (names.includes(n)) return role;
  }
  return null;
}

export function fileKind(name: string): FileKind | null {
  const ext = extname(name);
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (AUDIO_EXT.includes(ext)) return 'audio';
  return null;
}

export const basename = (p: string) => p.slice(p.lastIndexOf('/') + 1);
export const dirname = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

function extname(name: string) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i).toLowerCase() : '';
}

// Обходит папку и все вложенные.
export function walk(folder: VaultFolder, fn: (f: VaultFolder) => void) {
  fn(folder);
  for (const sub of folder.folders) walk(sub, fn);
}

export function findFolder(root: VaultFolder, path: string): VaultFolder | null {
  if (path === root.path) return root;
  for (const sub of root.folders) {
    if (path === sub.path || path.startsWith(sub.path + '/')) return findFolder(sub, path);
  }
  return null;
}

// Все файлы папки, включая вложенные.
export function allFiles(folder: VaultFolder, kind?: FileKind): VaultFile[] {
  const out: VaultFile[] = [];
  walk(folder, (f) => out.push(...(kind ? f.files.filter((x) => x.kind === kind) : f.files)));
  return out;
}

// «Глава 1/characters/староста_гилберт.jpg» -> «Староста Гилберт»
export function prettyName(path: string): string {
  const file = basename(path);
  const i = file.lastIndexOf('.');
  return (i > 0 ? file.slice(0, i) : file)
    .normalize('NFC')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Название трека: «01_дорога_в_баровию.mp3» -> «Дорога в баровию». Номер в начале нужен только для порядка.
export function trackName(path: string): string {
  const file = basename(path);
  const i = file.lastIndexOf('.');
  const name = (i > 0 ? file.slice(0, i) : file)
    .normalize('NFC')
    .replace(/_+/g, ' ')
    .replace(/^\d+\s*[-.)]?\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name ? name[0]!.toUpperCase() + name.slice(1) : file;
}

// Картинка из хранилища: sg-asset://v/<путь>
export const vaultUrl = (path: string) => 'sg-asset://v/' + encodeURIComponent(path);
