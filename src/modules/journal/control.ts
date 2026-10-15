// Журнал в окне управления: вкладка с заметками, список слева, закреплённая заметка — в правой панели.
import { NotebookPen } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { allFiles } from '../../shared/vault';
import type { AppState } from '../../shared/types';
import OnScreen from './ui/OnScreen.svelte';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';

// Закреплённая заметка текущего приключения, если файл на месте.
export function pinnedPage(app: AppState): string | null {
  const p = app.journal.pinned[app.adventures.current ?? ''];
  return p && app.vault.tree && allFiles(app.vault.tree, 'page').some((f) => f.path === p) ? p : null;
}

export default defineControl({
  id: 'journal',
  title: 'Журнал',
  icon: NotebookPen,
  // Рядом с «Инструментами»: подготовка к игре; блок в правой панели — внизу, под всем, что видят игроки.
  order: 28,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (pinnedPage(app) ? null : 'нет закреплённой заметки'),
});
