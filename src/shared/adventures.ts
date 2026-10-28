// Приключения: папки первого уровня хранилища, которые пользователь отметил (или создал кнопкой).
// Вкладки показывают текущее приключение и «общее» — всё, что лежит вне приключений. Вкладка «Файлы»
// по-прежнему показывает хранилище целиком. Только типы и чистые функции: используются ядром и окнами.
import { t } from './i18n';
import { basename, folderRole, roleNames, type FolderRole, type VaultFolder } from './vault';
import { DEFAULT_SYSTEM, defaultSystem, familyOf, isEnabled, systems } from '../systems';

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
// Hidden: its system is turned off — or not installed at all (a pack deleted, or never downloaded: Fate Core and
// Mausritter are packs since 0.60).
export function adventureHidden(adv: AdventuresState, adventure: string | null): boolean {
  if (adventure === null || !adv.list.includes(adventure)) return false;
  const id = systemFor(adv, adventure);
  return !isEnabled(id) || !systems.some((s) => s.id === id);
}
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
  if (a === null) return dir ? `${t('place.shared')} / ${dir.split('/').join(' / ')}` : t('place.shared');
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

// An adventure renamed: its paths in any module's state — strings and keys «from/…» (scenes, maps, trays, order,
// «monsters:from/…» groups), keys equal to the name (systems, trays, pinned notes, byAdventure, repo marks) and the name
// itself as a value (the `adventure` of scenes and encounters, `current`, the adventures list). Other texts — names of
// scenes, notes — stay, even when they happen to be the same.
export function renameAdventurePaths<T>(value: T, from: string, to: string): T {
  if (from === to) return value;
  const path = (s: string) =>
    s.startsWith(from + '/') ? to + s.slice(from.length) : s.startsWith(`monsters:${from}/`) ? `monsters:${to}` + s.slice(`monsters:${from}`.length) : s;
  const key = (k: string) => (k === from ? to : path(k));
  const walk = (v: unknown, k?: string, inArray = false): unknown => {
    if (typeof v === 'string') return v === from && (inArray || k === 'adventure' || k === 'current') ? to : path(v);
    if (Array.isArray(v)) return v.map((x) => walk(x, k, true));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([kk, x]) => [key(kk), walk(x, kk)]));
    return v;
  };
  return walk(value) as T;
}

// The adventure's cover: a picture in its folder (the core makes it from any picture the GM gives).
export const COVER_FILE = 'cover.jpg';
