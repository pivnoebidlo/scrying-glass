// Портреты в окне управления.
import { Image } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
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
});
