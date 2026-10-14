// Приключения в окне управления: переключатель над боковой панелью и проверка папок при открытии.
// Отметить папку приключением можно во вкладке «Файлы». В настройках — какие ролевые системы нужны.
import { Map } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Switcher from './ui/Switcher.svelte';
import Ensure from './ui/Ensure.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'adventures',
  title: 'Приключения',
  icon: Map,
  // Раздел настроек — после разделов вкладок.
  order: 1,
  header: Switcher,
  background: Ensure,
  settings: Settings,
});
