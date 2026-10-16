// Фон в окне управления: вкладка «Фоны» (папки backgrounds / фоны / локации), кнопка «на весь экран» на картинках,
// блок в панели экрана игроков, настройки.
import { Maximize, Wallpaper } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import OnScreen from './ui/OnScreen.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'scene',
  get title() {
    return t('module.scene');
  },
  icon: Wallpaper,
  // В полосе модулей — рядом с портретами.
  order: 8,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.scene.background || inTray(app, 'background') ? null : t('empty.none')),
  settings: Settings,
  imageActions: [
    {
      id: 'background',
      get title() {
        return t('action.background');
      },
      get tip() {
        return { off: t('action.background.off'), on: t('action.background.on') };
      },
      badge: () => t('badge.background'),
      icon: Maximize,
      active: (app, path) => app.scene.background === path,
      toggle: (app, path) =>
        app.scene.background === path ? dispatch('scene', 'clear') : dispatch('scene', 'show', { path }),
    },
  ],
});
