// The menu of a vault folder (a right click on it in the Files tree or in a tab's list of folders): add files, paste,
// show it in the file manager; a top-level one — mark as an adventure or a supplement, or not.
import { BookOpen, Castle, ClipboardPaste, FilePlus, FolderOpen, X } from '@lucide/svelte';
import type { MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
import { t } from '../../../renderer/lib/i18n.svelte';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { hint } from '../../../shared/hotkeys';
import { isSupplement } from '../../../shared/adventures';

export function folderMenu(path: string): MenuItem[] {
  const top = !!path && !path.includes('/');
  const adventure = top && store.state.adventures.list.includes(path);
  const supplement = adventure && isSupplement(store.state.adventures, path);
  return [
    { label: t('vault.addFiles'), icon: FilePlus, action: () => void dispatch('vault', 'importFiles', { folder: path }) },
    { label: hint(t('vault.paste'), 'paste'), icon: ClipboardPaste, action: () => void dispatch('vault', 'pasteImage', { folder: path }) },
    { label: t('vault.reveal'), icon: FolderOpen, action: () => void dispatch('vault', 'reveal', { folder: path }) },
    ...(top
      ? adventure
        ? [{ label: t(supplement ? 'vault.unmarkSupplement' : 'vault.unmark'), icon: X, action: () => void dispatch('adventures', 'unmark', { path }) }]
        : [
            { label: t('vault.mark'), icon: Castle, action: () => void dispatch('adventures', 'mark', { path }) },
            { label: t('vault.markSupplement'), icon: BookOpen, action: () => void dispatch('adventures', 'mark', { path, supplement: 'collection' }) },
          ]
      : []),
  ];
}
