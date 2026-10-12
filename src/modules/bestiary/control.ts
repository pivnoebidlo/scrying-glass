// Бестиарий в окне управления: список с поиском слева, статблок во вкладке.
import { Skull } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'bestiary',
  title: 'Бестиарий',
  icon: Skull,
  order: 24,
  view: View,
  sidebar: Sidebar,
  settings: Settings,
});
