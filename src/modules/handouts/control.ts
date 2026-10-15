// Раздатка в окне управления: вкладка с записками и уликами, кнопка «показать раздаткой» на любой картинке,
// блок в правой панели.
import { Scroll } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';

export default defineControl({
  id: 'handouts',
  title: 'Раздатка',
  icon: Scroll,
  // В полосе модулей — после фонов.
  order: 9,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.handouts.current || inTray(app, 'handout') ? null : 'нет'),
  imageActions: [
    {
      id: 'handout',
      title: 'Показать раздаткой (поверх всего)',
      badge: 'раздатка',
      icon: Scroll,
      active: (app, path) => app.handouts.current === path,
      toggle: (_app, path) => dispatch('handouts', 'toggle', { path }),
    },
  ],
});
