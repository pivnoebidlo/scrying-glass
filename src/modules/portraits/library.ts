// Библиотека портретов: все папки characters/персонажи хранилища, на любой глубине.
import { allFiles, dirname, prettyName, roleFolders, type FolderRole, type VaultFile, type VaultFolder } from '../../shared/vault';
import { NO_ADVENTURE, placeOrder, placeTitle, visibleIn, type AdventuresState } from '../../shared/adventures';
import type { PortraitsState } from './types';

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

export interface Group {
  // Путь папки персонажей внутри хранилища.
  key: string;
  // Где она лежит: «Проклятие Страда / Глава 1».
  title: string;
  items: VaultFile[];
}

// Картинки из папок с данной ролью (персонажи, фоны), сгруппированные по месту в хранилище.
// Показываются текущее приключение и общее (см. shared/adventures.ts).
export function imageGroups(tree: VaultFolder, vaultName: string, role: FolderRole, adv: AdventuresState = NO_ADVENTURE): Group[] {
  return roleFolders(tree, role, vaultName)
    .filter((r) => visibleIn(adv, r.folder.path))
    .map((r) => {
      const dir = dirname(r.folder.path);
      return { key: r.folder.path, title: placeTitle(adv, dir, vaultName), order: placeOrder(adv, dir), items: allFiles(r.folder, 'image') };
    })
    .sort((a, b) => a.order - b.order || collator.compare(a.title, b.title));
}

export const characterGroups = (tree: VaultFolder, vaultName: string, adv?: AdventuresState) =>
  imageGroups(tree, vaultName, 'characters', adv);

export const caption = (ms: PortraitsState, path: string) => ms.names[path] ?? prettyName(path);
