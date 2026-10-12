// Плейлисты: папки хранилища, в которых прямо лежат аудиофайлы.
import { dirname, folderRole, walk, type VaultFolder } from '../../../shared/vault';
import { NO_ADVENTURE, placeOrder, placeTitle, visibleIn, type AdventuresState } from '../../../shared/adventures';

export interface Playlist {
  path: string;
  // Где лежит: для папки music — где лежит она сама («Проклятие Страда / Глава 1»).
  title: string;
  count: number;
  order: number;
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

// Показываются плейлисты текущего приключения и общие (см. shared/adventures.ts).
export function playlists(tree: VaultFolder, vaultName: string, adv: AdventuresState = NO_ADVENTURE): Playlist[] {
  const out: Playlist[] = [];
  walk(tree, (f) => {
    const count = f.files.filter((x) => x.kind === 'audio').length;
    if (!count || !visibleIn(adv, f.path)) return;
    const shown = folderRole(f.name) === 'music' ? dirname(f.path) : f.path;
    out.push({ path: f.path, title: placeTitle(adv, shown, vaultName), order: placeOrder(adv, shown), count });
  });
  return out.sort((a, b) => a.order - b.order || collator.compare(a.title, b.title));
}

export function playlistTitle(tree: VaultFolder | null, vaultName: string, path: string | null): string {
  if (path === null || !tree) return '';
  return playlists(tree, vaultName).find((p) => p.path === path)?.title ?? (path.split('/').join(' / ') || vaultName);
}
