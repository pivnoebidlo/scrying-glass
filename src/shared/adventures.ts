// Приключения: папки первого уровня хранилища, которые пользователь отметил (или создал кнопкой).
// Вкладки показывают текущее приключение и «общее» — всё, что лежит вне приключений. Вкладка «Файлы»
// по-прежнему показывает хранилище целиком. Только типы и чистые функции: используются ядром и окнами.
import { basename, folderRole, roleNames, type FolderRole, type VaultFolder } from './vault';
import { DEFAULT_SYSTEM, defaultSystem, familyOf, isEnabled } from '../systems';

export interface AdventuresState {
  // Пути папок приключений (первый уровень хранилища, то есть просто имена).
  list: string[];
  // Текущее приключение. null — показывать всё хранилище.
  current: string | null;
  // Список уже составлялся: при первом открытии приключения угадываются по папкам внутри.
  initialized: boolean;
  // Ролевая система приключения (id из systems/index.ts); ключ '' — всё хранилище и общее вне приключений.
  // Нет записи — DEFAULT_SYSTEM. Вкладки показывают карточки и записи семейства этой системы.
  systems?: Record<string, string>;
}

// Без приключений: видно всё, подписи — путь целиком.
export const NO_ADVENTURE: AdventuresState = { list: [], current: null, initialized: true };

// Стандартные папки приключения; создаются с первым из названий роли (настройки, roleNames в vault.ts).
const STANDARD_ROLES: FolderRole[] = ['characters', 'party', 'bestiary', 'backgrounds', 'handouts', 'maps', 'music'];

// Каких стандартных папок нет прямо в папке приключения (папка с той же ролью под другим именем — есть).
export function missingFolders(folder: VaultFolder): string[] {
  const roles = new Set(folder.folders.map((f) => folderRole(f.name)));
  return STANDARD_ROLES.filter((role) => !roles.has(role)).map((role) => roleNames()[role][0]!);
}

// Папка похожа на приключение: в ней есть хотя бы одна папка с ролью (и сама она не «maps» и т. п.).
export const looksLikeAdventure = (f: VaultFolder) => !folderRole(f.name) && f.folders.some((x) => folderRole(x.name));

const within = (path: string, dir: string) => path === dir || path.startsWith(dir + '/');

// Приключение, в котором лежит путь (или null — путь вне приключений, «общее»).
export const adventureOf = (adv: AdventuresState, path: string) => adv.list.find((a) => within(path, a)) ?? null;

// Система приключения (null — всего хранилища) и текущая — по открытому приключению.
// Приключение без своей системы — с системой хранилища, а без неё — с DEFAULT_SYSTEM (так было до выбора систем:
// старые приключения — это D&D). Отключённая система приключения его скрывает (adventureHidden). Само хранилище
// («Всё хранилище») с отключённой системой берёт первую включённую — иначе в нём не было бы видно ничего.
export function systemFor(adv: AdventuresState, adventure: string | null): string {
  const vault = adv.systems?.[''] ?? DEFAULT_SYSTEM;
  if (adventure !== null) return adv.systems?.[adventure] ?? vault;
  return isEnabled(vault) ? vault : defaultSystem();
}

// Приключение, чья система отключена в настройках, скрыто целиком: его нет в переключателе и дереве файлов, его
// папки, сцены и заготовки не видны ни в одной вкладке (и во «Всём хранилище»).
export const adventureHidden = (adv: AdventuresState, adventure: string | null) =>
  adventure !== null && adv.list.includes(adventure) && !isEnabled(systemFor(adv, adventure));
export const shownAdventures = (adv: AdventuresState) => adv.list.filter((a) => !adventureHidden(adv, a));
export const currentSystem = (adv: AdventuresState) => systemFor(adv, adv.current);
// Подходит ли карточка или запись этой системы текущему приключению: то же семейство (2014 и 2024 — вместе), и
// система не отключена в настройках.
export const inCurrentFamily = (adv: AdventuresState, system: string) =>
  isEnabled(system) && familyOf(system) === familyOf(currentSystem(adv));

// Видно ли то, что лежит по пути, при текущем приключении: своё приключение и общее — да, чужие — нет.
// Скрытые приключения (система отключена) не видны никогда.
export function visibleIn(adv: AdventuresState, path: string): boolean {
  const a = adventureOf(adv, path);
  if (adventureHidden(adv, a)) return false;
  return adv.current === null || a === null || a === adv.current;
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

// Куда класть новые файлы вкладки (вставка из буфера): папка роли в текущем приключении, без приключения —
// в корне хранилища. null — такой папки нет.
export function roleFolderHere(tree: VaultFolder, adv: AdventuresState, role: FolderRole): VaultFolder | null {
  const base = adv.current === null ? tree : tree.folders.find((f) => f.path === adv.current);
  return base?.folders.find((f) => folderRole(f.name) === role) ?? null;
}
