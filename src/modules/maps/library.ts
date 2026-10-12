// Список карт: картинки из папок maps/карты (на любой глубине) и всё, что уже открывали как карту.
import { allFiles, dirname, folderRole, prettyName, type VaultFolder } from '../../shared/vault';
import type { MapsState } from './types';

export interface MapGroup {
  key: string;
  title: string;
  items: string[];
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

export function mapGroups(tree: VaultFolder, vaultName: string, ms: MapsState): MapGroup[] {
  const out: MapGroup[] = [];
  const seen = new Set<string>();
  const visit = (f: VaultFolder) => {
    if (f.path && folderRole(f.name) === 'maps') {
      const where = dirname(f.path);
      const items = allFiles(f, 'image').map((x) => x.path);
      items.forEach((p) => seen.add(p));
      out.push({ key: f.path, title: where ? where.split('/').join(' / ') : vaultName, items });
      return;
    }
    f.folders.forEach(visit);
  };
  visit(tree);
  out.sort((a, b) => collator.compare(a.title, b.title));
  const other = Object.keys(ms.maps).filter((p) => !seen.has(p)).sort((a, b) => collator.compare(a, b));
  if (other.length) out.push({ key: '', title: 'Другие карты', items: other });
  return out;
}

export const mapName = (path: string) => prettyName(path);
