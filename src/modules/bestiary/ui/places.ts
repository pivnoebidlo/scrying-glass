// Подпись папки карточки хранилища: «Тыквенный фестиваль / monsters», «Глава 1 / characters».
import { t } from '../../../renderer/lib/i18n.svelte';
import type { AppState } from '../../../shared/types';
import { dirname, roleFolders } from '../../../shared/vault';
import { placeTitle } from '../../../shared/adventures';

export function folderLabel(app: AppState, path: string | undefined): string {
  if (path === undefined) return t('best.vault');
  const tree = app.vault.tree;
  const all = tree
    ? [...roleFolders(tree, 'bestiary', app.vault.name), ...roleFolders(tree, 'characters', app.vault.name), ...roleFolders(tree, 'party', app.vault.name)]
    : [];
  // Папка карточки или её родительская папка с ролью (карточка может лежать во вложенной папке).
  const f = all.find((x) => path === x.folder.path || path.startsWith(x.folder.path + '/'));
  return f ? `${placeTitle(app.adventures, dirname(f.folder.path), app.vault.name)} / ${f.folder.name}` : path;
}
