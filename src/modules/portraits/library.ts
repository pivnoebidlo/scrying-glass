// Библиотека портретов: все папки characters/персонажи хранилища, на любой глубине.
import { allFiles, prettyName, roleFolders, type FolderRole, type VaultFile, type VaultFolder } from '../../shared/vault';
import type { PortraitsState } from './types';

export interface Group {
  // Путь папки персонажей внутри хранилища.
  key: string;
  // Где она лежит: «Проклятие Страда / Глава 1».
  title: string;
  items: VaultFile[];
}

// Картинки из папок с данной ролью (персонажи, фоны), сгруппированные по месту в хранилище.
export function imageGroups(tree: VaultFolder, vaultName: string, role: FolderRole = 'characters'): Group[] {
  return roleFolders(tree, role, vaultName).map((r) => ({ key: r.folder.path, title: r.title, items: allFiles(r.folder, 'image') }));
}

export const characterGroups = (tree: VaultFolder, vaultName: string) => imageGroups(tree, vaultName, 'characters');

export const caption = (ms: PortraitsState, path: string) => ms.names[path] ?? prettyName(path);
