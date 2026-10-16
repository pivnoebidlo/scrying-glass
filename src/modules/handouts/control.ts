// Раздатка в окне управления: вкладка с записками и уликами, кнопка «показать раздаткой» на любой картинке,
// блок в правой панели.
import { Scroll } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';

export default defineControl({
  id: 'handouts',
  get title() {
    return t('module.handouts');
  },
  icon: Scroll,
  // В полосе модулей — после фонов.
  order: 9,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.handouts.current || inTray(app, 'handout') ? null : t('empty.none')),
  imageActions: [
    {
      id: 'handout',
      get title() {
        return t('action.handout');
      },
      get tip() {
        return { off: t('action.handout.off'), on: t('action.handout.on') };
      },
      badge: () => t('badge.handout'),
      icon: Scroll,
      active: (app, path) => app.handouts.current === path,
      toggle: (_app, path) => dispatch('handouts', 'toggle', { path }),
    },
  ],
});
