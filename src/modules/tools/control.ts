// Инструменты в окне управления: список инструментов слева, открытый инструмент во вкладке.
import { Hammer } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'tools',
  get title() {
    return t('module.tools');
  },
  icon: Hammer,
  // В полосе модулей — последним: это подготовка к игре, а не то, что нажимают во время неё.
  order: 40,
  view: View,
  sidebar: Sidebar,
  settings: Settings,
});
