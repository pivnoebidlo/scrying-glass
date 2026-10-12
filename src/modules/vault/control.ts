// Файлы хранилища в окне управления: дерево папок и содержимое выбранной.
import { FolderTree } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Tree from './ui/Tree.svelte';
import FolderView from './ui/FolderView.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'vault',
  title: 'Файлы',
  icon: FolderTree,
  order: 0,
  sidebar: Tree,
  view: FolderView,
  settings: Settings,
});
