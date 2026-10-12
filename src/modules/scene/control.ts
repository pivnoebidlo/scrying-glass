// Фон в окне управления: кнопка «на весь экран» на картинках, блок в панели экрана игроков, настройки.
import { Maximize, Wallpaper } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import OnScreen from './ui/OnScreen.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'scene',
  title: 'Фон',
  icon: Wallpaper,
  order: 5,
  screen: OnScreen,
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
