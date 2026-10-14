// Что открыто в справочнике: запись (путь), правится ли она, фильтр и поиск; история переходов по ссылкам.
import { openTab } from '../../../renderer/lib/nav';

export const ui = $state({
  open: null as string | null,
  editing: false,
  type: 'all',
  query: '',
  back: [] as string[],
  // Страница вкладки: запись или «Типы записей».
  page: 'entry' as 'entry' | 'types',
});

// Открыть запись (из ссылки, поиска, другого раздела); прошлая — в историю «Назад».
export function openEntry(path: string) {
  if (ui.open && ui.open !== path) ui.back = [...ui.back.slice(-30), ui.open];
  ui.open = path;
  ui.editing = false;
  ui.page = 'entry';
  openTab('compendium');
}
