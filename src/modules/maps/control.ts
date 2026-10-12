// Карты в окне управления: список, редактор тумана и обзора, кнопка «картой» на картинках.
import { Map } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import Editor from './ui/Editor.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';
import Settings from './ui/Settings.svelte';
import { ui } from './ui/ui.svelte';

export default defineControl({
  id: 'maps',
  title: 'Карты',
  icon: Map,
  order: 15,
  view: Editor,
  sidebar: Sidebar,
  screen: OnScreen,
  settings: Settings,
  imageActions: [
    {
      id: 'map',
      title: 'Показать картой (с туманом войны)',
      badge: 'карта',
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
