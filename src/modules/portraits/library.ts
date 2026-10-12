// Библиотека портретов: все папки characters/персонажи хранилища, на любой глубине.
import { allFiles, dirname, folderRole, prettyName, type VaultFile, type VaultFolder } from '../../shared/vault';
import type { PortraitsState } from './types';

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

export interface Group {
  // Путь папки персонажей внутри хранилища.
  key: string;
  // Где она лежит: «Проклятие Страда / Глава 1».
  title: string;
  items: VaultFile[];
}

export function characterGroups(tree: VaultFolder, vaultName: string): Group[] {
  const out: Group[] = [];
  const visit = (f: VaultFolder) => {
    if (f.path && folderRole(f.name) === 'characters') {
      // Вложенные папки (characters/NPC/…) входят в эту же группу.
      const where = dirname(f.path);
      out.push({ key: f.path, title: where ? where.split('/').join(' / ') : vaultName, items: allFiles(f, 'image') });
      return;
    }
    f.folders.forEach(visit);
  };
  visit(tree);
  // По пути: персонажи кампании идут перед персонажами её глав.
  return out.sort((a, b) => collator.compare(a.title, b.title));
}

export const caption = (ms: PortraitsState, path: string) => ms.names[path] ?? prettyName(path);
