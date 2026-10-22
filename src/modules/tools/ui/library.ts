// Записки хранилища: из папок раздатки, сгруппированные по месту (текущее приключение и общее).
import { allFiles, dirname, roleFolders, type VaultFile, type VaultFolder } from '../../../shared/vault';
import { placeOrder, placeTitle, visibleIn, type AdventuresState } from '../../../shared/adventures';

export interface NoteGroup {
  key: string;
  title: string;
  order: number;
  items: VaultFile[];
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

// kind — notes or canvases (both live in the handouts folders).
export function noteGroups(tree: VaultFolder, vaultName: string, adv: AdventuresState, kind: 'note' | 'sketch' = 'note'): NoteGroup[] {
  return roleFolders(tree, 'handouts', vaultName)
    .filter((r) => visibleIn(adv, r.folder.path))
    .map((r) => {
      const dir = dirname(r.folder.path);
      return { key: r.folder.path, title: placeTitle(adv, dir, vaultName), order: placeOrder(adv, dir), items: allFiles(r.folder, kind) };
    })
    .filter((g) => g.items.length)
    .sort((a, b) => a.order - b.order || collator.compare(a.title, b.title));
}
