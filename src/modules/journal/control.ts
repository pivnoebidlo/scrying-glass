// Журнал в окне управления: вкладка с заметками, список слева, закреплённые заметки и PDF — в правой панели, they open
// in the side drawer (Drawer.svelte).
import { NotebookPen } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { allFiles } from '../../shared/vault';
import type { AppState } from '../../shared/types';
import OnScreen from './ui/OnScreen.svelte';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';
import Settings from './ui/Settings.svelte';
import Drawer from './ui/Drawer.svelte';

// Закреплённая заметка текущего приключения, если файл на месте.
// Pinned notes and PDFs of the current adventure whose files are in place.
export function pinnedPages(app: AppState): string[] {
  const list = app.journal.pinned[app.adventures.current ?? ''] ?? [];
  const files = app.vault.tree ? new Set(allFiles(app.vault.tree).filter((f) => f.kind === 'page' || f.kind === 'pdf').map((f) => f.path)) : new Set<string>();
  return list.filter((p) => files.has(p));
}

export default defineControl({
  id: 'journal',
  get title() {
    return t('module.journal');
  },
  icon: NotebookPen,
  // Рядом с «Инструментами»: подготовка к игре; блок в правой панели — внизу, под всем, что видят игроки.
  order: 28,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (pinnedPages(app).length ? null : t('empty.noPinned')),
  settings: Settings,
  background: Drawer,
});
