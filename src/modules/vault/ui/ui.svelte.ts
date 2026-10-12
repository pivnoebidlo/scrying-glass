// Состояние интерфейса файлов: выбранная папка и раскрытые ветки дерева. Запоминается между запусками.
import { folderRole, type FolderRole } from '../../../shared/vault';
import { Folder, Map, Music, Users } from '@lucide/svelte';
import type { Component } from 'svelte';

const KEY = 'sg.files';

function load(): { folder: string; expanded: Record<string, boolean> } {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { folder: s.folder ?? '', expanded: s.expanded ?? {} };
  } catch {
    return { folder: '', expanded: {} };
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

const ROLE_ICONS: Record<FolderRole, Component> = { characters: Users, maps: Map, music: Music };

export const folderIcon = (name: string): Component => {
  const role = folderRole(name);
  return role ? ROLE_ICONS[role] : Folder;
};
