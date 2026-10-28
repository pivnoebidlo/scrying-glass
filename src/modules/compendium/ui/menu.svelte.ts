// The menu of a compendium entry in a list (a right click, «⋯»): the same actions as the buttons of its view.
import { ExternalLink, Eye, EyeOff, Pencil, RotateCcw, Trash2 } from '@lucide/svelte';
import type { MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
import { forPlayers } from '../../../renderer/lib/entry/types.svelte';
import { t } from '../../../renderer/lib/i18n.svelte';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { OVERRIDES, type Entry } from '../../../shared/compendium';
import { isBuiltinEntry, isLibraryEntry, type EntryItem } from './store.svelte';
import { ui } from './ui.svelte';

// To the trash: an entry of the library, or of the vault (with the app's confirmation).
export async function trashEntry(path: string) {
  if (isLibraryEntry(path)) {
    if (await window.api.trashLibraryEntry(path)) if (ui.open === path) ui.open = null;
    return;
  }
  await dispatch('vault', 'trash', { paths: [path] });
}

export function entryMenu(e: EntryItem, open: (path: string, edit: boolean) => void): MenuItem[] {
  const path = e.path;
  const shown = store.state.handouts.current === path;
  const builtin = isBuiltinEntry(path);
  const replaces = typeof e.entry.fields[OVERRIDES] === 'string';
  return [
    {
      label: shown ? t('cmpui.removeFromPlayers') : t('cmpui.showToPlayers'),
      icon: shown ? EyeOff : Eye,
      action: () => void dispatch('handouts', 'toggleEntry', { path, entry: forPlayers($state.snapshot(e.entry) as Entry) }),
    },
    { label: t('cmpui.edit'), icon: Pencil, action: () => open(path, true) },
    ...(builtin ? [] : [{ label: t('cmpui.openExternalShort'), icon: ExternalLink, action: () => void window.api.openFile(path) }]),
    ...(builtin
      ? []
      : replaces
        ? [{ label: t('cmpui.revertSrd'), icon: RotateCcw, action: () => void trashEntry(path) }]
        : [{ label: t('cmpui.toTrashShort'), icon: Trash2, danger: true, action: () => void trashEntry(path) }]),
  ];
}
