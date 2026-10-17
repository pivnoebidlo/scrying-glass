// Список карт: картинки из папок maps/карты (на любой глубине) и всё, что уже открывали как карту.
import { t } from '../../renderer/lib/i18n.svelte';
import { allFiles, dirname, folderRole, prettyName, type VaultFolder } from '../../shared/vault';
import { NO_ADVENTURE, placeOrder, placeTitle, visibleIn, type AdventuresState } from '../../shared/adventures';
import type { MapsState } from './types';

export interface MapGroup {
  key: string;
  title: string;
  items: string[];
  order?: number;
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

// Показываются карты текущего приключения и общие (см. shared/adventures.ts).
export function mapGroups(tree: VaultFolder, vaultName: string, ms: MapsState, adv: AdventuresState = NO_ADVENTURE): MapGroup[] {
  const out: MapGroup[] = [];
  const seen = new Set<string>();
  const visit = (f: VaultFolder) => {
    if (f.path && folderRole(f.name) === 'maps') {
      const where = dirname(f.path);
      const items = allFiles(f, 'image').map((x) => x.path);
      items.forEach((p) => seen.add(p));
      if (visibleIn(adv, f.path)) out.push({ key: f.path, title: placeTitle(adv, where, vaultName), order: placeOrder(adv, where), items });
      return;
    }
    f.folders.forEach(visit);
  };
  visit(tree);
  out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || collator.compare(a.title, b.title));
  const other = Object.keys(ms.maps)
    .filter((p) => !seen.has(p) && visibleIn(adv, p))
    .sort((a, b) => collator.compare(a, b));
  if (other.length) out.push({ key: '', title: t('maps.otherMaps'), items: other });
  return out;
}

export const mapName = (path: string) => prettyName(path);
