// Таймер в окне управления: блок в правой панели и сигнал по окончании. Запуск и настройка — в «Инструментах».
import { Hourglass } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import Chime from './ui/Chime.svelte';

export default defineControl({
  id: 'timer',
  title: 'Таймер',
  icon: Hourglass,
  order: 26,
  screen: OnScreen,
  screenEmpty: (app) => (app.timer.active ? null : 'нет'),
  background: Chime,
});
