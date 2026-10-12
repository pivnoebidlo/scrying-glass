// Портреты в окне управления.
import { Image, User } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'portraits',
  title: 'Портреты',
  icon: Image,
  order: 10,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  settings: Settings,
  imageActions: [
    {
      id: 'portrait',
      title: 'Показать портретом',
      badge: 'портрет',
      icon: User,
      active: (app, path) => app.portraits.onScreen.includes(path),
      toggle: (_app, path) => dispatch('portraits', 'toggle', { path }),
    },
  ],
});
