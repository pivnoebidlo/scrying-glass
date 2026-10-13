// Приключения: папки первого уровня хранилища, которые пользователь отметил (или создал кнопкой).
// Вкладки показывают текущее приключение и «общее» — всё, что лежит вне приключений. Вкладка «Файлы»
// по-прежнему показывает хранилище целиком. Только типы и чистые функции: используются ядром и окнами.
import { basename, folderRole, type FolderRole, type VaultFolder } from './vault';

export interface AdventuresState {
  // Пути папок приключений (первый уровень хранилища, то есть просто имена).
  list: string[];
  // Текущее приключение. null — показывать всё хранилище.
  current: string | null;
  // Список уже составлялся: при первом открытии приключения угадываются по папкам внутри.
  initialized: boolean;
}

// Без приключений: видно всё, подписи — путь целиком.
export const NO_ADVENTURE: AdventuresState = { list: [], current: null, initialized: true };

// Стандартные папки приключения и как их называть при создании (варианты названий — ROLES в vault.ts).
export const STANDARD_FOLDERS: [FolderRole, string][] = [
  ['characters', 'characters'],
  ['party', 'party'],
  ['bestiary', 'monsters'],
  ['backgrounds', 'backgrounds'],
  ['handouts', 'handouts'],
  ['maps', 'maps'],
  ['music', 'music'],
];

// Каких стандартных папок нет прямо в папке приключения (папка с той же ролью под другим именем — есть).
export function missingFolders(folder: VaultFolder): string[] {
  const roles = new Set(folder.folders.map((f) => folderRole(f.name)));
  return STANDARD_FOLDERS.filter(([role]) => !roles.has(role)).map(([, name]) => name);
}

// Папка похожа на приключение: в ней есть хотя бы одна папка с ролью (и сама она не «maps» и т. п.).
export const looksLikeAdventure = (f: VaultFolder) => !folderRole(f.name) && f.folders.some((x) => folderRole(x.name));

const within = (path: string, dir: string) => path === dir || path.startsWith(dir + '/');

// Приключение, в котором лежит путь (или null — путь вне приключений, «общее»).
export const adventureOf = (adv: AdventuresState, path: string) => adv.list.find((a) => within(path, a)) ?? null;

// Видно ли то, что лежит по пути, при текущем приключении: своё приключение и общее — да, чужие — нет.
export function visibleIn(adv: AdventuresState, path: string): boolean {
  if (adv.current === null) return true;
  const a = adventureOf(adv, path);
  return a === null || a === adv.current;
}

// Подпись группы по папке, где она лежит: «Глава 1» внутри текущего приключения, название приключения
// для его корня, «Общее» — вне приключений. Без текущего приключения — путь целиком, как раньше.
export function placeTitle(adv: AdventuresState, dir: string, vaultName: string): string {
  if (adv.current === null) return dir ? dir.split('/').join(' / ') : vaultName;
  const a = adventureOf(adv, dir);
  if (a === null) return dir ? `Общее / ${dir.split('/').join(' / ')}` : 'Общее';
  if (dir === a) return basename(a);
  return dir.slice(a.length + 1).split('/').join(' / ');
}

// Порядок групп: сначала текущее приключение (его корень, потом главы), затем общее.
export const placeOrder = (adv: AdventuresState, dir: string) =>
  adv.current !== null && adventureOf(adv, dir) === null ? 1 : 0;
