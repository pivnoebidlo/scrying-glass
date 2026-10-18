// Состояние интерфейса файлов: выбранная папка (trash — открыта корзина) и раскрытые ветки дерева. Запоминается
// между запусками.
import { folderRole, type FolderRole } from '../../../shared/vault';
import { BookOpen, Folder, Map, Music, NotebookPen, Scroll, Shield, Skull, Users, Wallpaper } from '@lucide/svelte';
import type { Component } from 'svelte';
import { dispatch, store } from '../../../renderer/lib/store.svelte';

const KEY = 'sg.files';

function load(): { folder: string; trash: boolean; expanded: Record<string, boolean> } {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { folder: s.folder ?? '', trash: !!s.trash, expanded: s.expanded ?? {} };
  } catch {
    return { folder: '', trash: false, expanded: {} };
  }
}

export const ui = $state(load());

$effect.root(() => {
  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ui));
    } catch {
      /* не страшно: просто не запомним */
    }
  });
});

// Открыли папку приключения или папку внутри него — это приключение становится текущим (как выбор в
// переключателе). Корень и общие папки текущее приключение не меняют.
export function followAdventure(path: string) {
  const top = path.split('/')[0]!;
  const adv = store.state.adventures;
  if (path && adv.list.includes(top) && adv.current !== top) dispatch('adventures', 'select', { path: top });
}

export const ROLE_ICONS: Record<FolderRole, Component> = {
  characters: Users, party: Shield, maps: Map, music: Music, backgrounds: Wallpaper, handouts: Scroll, bestiary: Skull, compendium: BookOpen, journal: NotebookPen,
};

export const folderIcon = (name: string): Component => {
  const role = folderRole(name);
  return role ? ROLE_ICONS[role] : Folder;
};
