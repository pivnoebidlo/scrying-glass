// Фон в окне управления: вкладка «Фоны» (папки backgrounds / фоны / локации), кнопка «на весь экран» на картинках,
// блок в панели экрана игроков, настройки.
import { Maximize, Wallpaper } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import OnScreen from './ui/OnScreen.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'scene',
  title: 'Фоны',
  icon: Wallpaper,
  // В полосе модулей — рядом с портретами.
  order: 8,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.scene.background ? null : 'нет'),
  settings: Settings,
  imageActions: [
    {
      id: 'background',
      title: 'Показать на весь экран',
      badge: 'фон',
      icon: Maximize,
      active: (app, path) => app.scene.background === path,
      toggle: (app, path) =>
        app.scene.background === path ? dispatch('scene', 'clear') : dispatch('scene', 'show', { path }),
    },
  ],
});
