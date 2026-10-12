// Библиотека портретов: все папки characters/персонажи хранилища, на любой глубине.
import { allFiles, dirname, roleFolders, type FolderRole, type VaultFile, type VaultFolder } from '../../shared/vault';
import { NO_ADVENTURE, placeOrder, placeTitle, visibleIn, type AdventuresState } from '../../shared/adventures';

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

export interface Group {
  // Путь папки персонажей внутри хранилища.
  key: string;
  // Где она лежит: «Проклятие Страда / Глава 1».
  title: string;
  order: number;
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

// Вкладка «Персонажи»: портреты NPC (characters) и партии (party). Папки партии подписаны «· партия».
export function characterGroups(tree: VaultFolder, vaultName: string, adv?: AdventuresState): Group[] {
  const party = imageGroups(tree, vaultName, 'party', adv).map((g) => ({ ...g, title: `${g.title} · партия` }));
  const npc = imageGroups(tree, vaultName, 'characters', adv);
  return [...party, ...npc].sort((a, b) => a.order - b.order || collator.compare(a.title, b.title));
}

// Подпись портрета — в ui/cardNames.svelte.ts: она учитывает названия карточек.
export { caption } from './ui/cardNames.svelte';
