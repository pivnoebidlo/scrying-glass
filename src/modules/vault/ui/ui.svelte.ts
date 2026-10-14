// Состояние интерфейса файлов: выбранная папка (trash — открыта корзина) и раскрытые ветки дерева. Запоминается
// между запусками.
import { folderRole, type FolderRole } from '../../../shared/vault';
import { BookOpen, Dices, Folder, Map, Music, Scroll, Shield, Skull, Users, Wallpaper } from '@lucide/svelte';
import type { Component } from 'svelte';

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

export const ROLE_ICONS: Record<FolderRole, Component> = {
  characters: Users, party: Shield, maps: Map, music: Music, backgrounds: Wallpaper, handouts: Scroll, bestiary: Skull, tables: Dices, compendium: BookOpen,
};

export const folderIcon = (name: string): Component => {
  const role = folderRole(name);
  return role ? ROLE_ICONS[role] : Folder;
};
