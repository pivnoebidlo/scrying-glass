// Справочник в окне управления: список записей слева, запись или редактор во вкладке.
import { BookOpen } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import EntryDrawer from './ui/EntryDrawer.svelte';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';

export default defineControl({
  id: 'compendium',
  get title() {
    return t('module.compendium');
  },
  icon: BookOpen,
  // Рядом с «Карточками»: справочник открывают прямо на игре.
  order: 23,
  view: View,
  sidebar: Sidebar,
  // Выдвижная панель записи и указатель заклинаний для ссылок в статблоках и листах.
  background: EntryDrawer,
});
