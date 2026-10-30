// Таймер в окне управления: блок в правой панели, сигнал по окончании и плашка мастера. Запуск и настройка — в «Инструментах».
import { Hourglass } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import Background from './ui/Background.svelte';

export default defineControl({
  id: 'timer',
  get title() {
    return t('module.timer');
  },
  icon: Hourglass,
  order: 26,
  screen: OnScreen,
  screenEmpty: (app) => (app.timer.active ? null : t('empty.none')),
  background: Background,
});
