// Приключения в окне управления: переключатель над боковой панелью и проверка папок при открытии.
// Отметить папку приключением можно во вкладке «Файлы».
import { Map } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Switcher from './ui/Switcher.svelte';
import Ensure from './ui/Ensure.svelte';

export default defineControl({
  id: 'adventures',
  title: 'Приключения',
  icon: Map,
  header: Switcher,
  background: Ensure,
});
