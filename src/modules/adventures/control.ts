// Приключения в окне управления: переключатель над боковой панелью и проверка папок при открытии.
// Отметить папку приключением можно во вкладке «Файлы». В настройках — раздел «Ролевые системы»: какие системы нужны.
import { Dices, Map } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Switcher from './ui/Switcher.svelte';
import Ensure from './ui/Ensure.svelte';
import Settings from './ui/Settings.svelte';
import Page from './ui/Page.svelte';

export default defineControl({
  id: 'adventures',
  get title() {
    return t('module.adventures');
  },
  icon: Map,
  // The first tab of the strip (before «Files»).
  order: -1,
  view: Page,
  header: Switcher,
  background: Ensure,
  settings: Settings,
  // The section is about the game systems, not the adventures.
  get settingsTitle() {
    return t('adv.systems');
  },
  settingsIcon: Dices,
});
