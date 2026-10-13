// Инструменты в окне управления: список инструментов слева, открытый инструмент во вкладке.
import { Hammer } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';

export default defineControl({
  id: 'tools',
  title: 'Инструменты',
  icon: Hammer,
  // В полосе модулей — последним: это подготовка к игре, а не то, что нажимают во время неё.
  order: 40,
  view: View,
  sidebar: Sidebar,
});
