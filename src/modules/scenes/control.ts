// Сцены в окне управления: список, редактор, кнопки на панели экрана игроков, горячие клавиши.
import { Clapperboard } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';
import QuickBar from './ui/QuickBar.svelte';
import Settings from './ui/Settings.svelte';
import Hotkeys from './ui/Hotkeys.svelte';

export default defineControl({
  id: 'scenes',
  title: 'Сцены',
  icon: Clapperboard,
  // Первым на панели экрана игроков: сцены — главное, что нажимают на игре.
  order: 1,
  view: View,
  sidebar: Sidebar,
  screen: QuickBar,
  settings: Settings,
  background: Hotkeys,
});
