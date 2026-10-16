// Карты в окне управления: список, редактор тумана и обзора, кнопка «картой» на картинках.
import { Map } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import Editor from './ui/Editor.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';
import Settings from './ui/Settings.svelte';
import { ui } from './ui/ui.svelte';

export default defineControl({
  id: 'maps',
  get title() {
    return t('module.maps');
  },
  icon: Map,
  order: 15,
  view: Editor,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.maps.current || inTray(app, 'map') ? null : t('empty.none')),
  settings: Settings,
  imageActions: [
    {
      id: 'map',
      get title() {
        return t('action.map');
      },
      get tip() {
        return { off: t('action.map.off'), on: t('action.map.on') };
      },
      badge: () => t('badge.map'),
      icon: Map,
      active: (app, path) => app.maps.current === path,
      toggle: (app, path) => {
        if (app.maps.current === path) return dispatch('maps', 'clear');
        ui.selected = path;
        return dispatch('maps', 'show', { path });
      },
    },
  ],
});
