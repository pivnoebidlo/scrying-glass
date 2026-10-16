// Персонажи (портреты) в окне управления.
import { User, Users } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'portraits',
  get title() {
    return t('module.portraits');
  },
  icon: Users,
  order: 10,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.portraits.onScreen.length || inTray(app, 'portraits') ? null : t('empty.nobody')),
  settings: Settings,
  imageActions: [
    {
      id: 'portrait',
      get title() {
        return t('action.portrait');
      },
      get tip() {
        return { off: t('action.portrait.off'), on: t('action.portrait.on') };
      },
      badge: () => t('badge.portrait'),
      icon: User,
      active: (app, path) => app.portraits.onScreen.includes(path),
      toggle: (_app, path) => dispatch('portraits', 'toggle', { path }),
    },
  ],
});
