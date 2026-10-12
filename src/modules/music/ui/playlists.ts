// Плейлисты: папки хранилища, в которых прямо лежат аудиофайлы.
import { dirname, folderRole, walk, type VaultFolder } from '../../../shared/vault';

export interface Playlist {
  path: string;
  // Где лежит: для папки music — где лежит она сама («Проклятие Страда / Глава 1»).
  title: string;
  count: number;
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

export function playlists(tree: VaultFolder, vaultName: string): Playlist[] {
  const out: Playlist[] = [];
  walk(tree, (f) => {
    const count = f.files.filter((x) => x.kind === 'audio').length;
    if (!count) return;
    const shown = folderRole(f.name) === 'music' ? dirname(f.path) : f.path;
    out.push({ path: f.path, title: shown ? shown.split('/').join(' / ') : vaultName, count });
  });
  return out.sort((a, b) => collator.compare(a.title, b.title));
}

export function playlistTitle(tree: VaultFolder | null, vaultName: string, path: string | null): string {
  if (path === null || !tree) return '';
  return playlists(tree, vaultName).find((p) => p.path === path)?.title ?? (path.split('/').join(' / ') || vaultName);
}
