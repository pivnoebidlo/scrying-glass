// Справочник в окне управления: список записей слева, запись или редактор во вкладке.
import { BookOpen } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';

export default defineControl({
  id: 'compendium',
  title: 'Справочник',
  icon: BookOpen,
  // Рядом с «Карточками»: справочник открывают прямо на игре.
  order: 23,
  view: View,
  sidebar: Sidebar,
});
