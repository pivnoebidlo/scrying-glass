// Что открыто в журнале: заметка (путь), режим правки, поиск, свёрнутые папки списка.
import { openTab } from '../../../renderer/lib/nav';

export const ui = $state({
  open: null as string | null,
  editing: false,
  query: '',
  back: [] as string[],
  collapsed: [] as string[],
  // Только что созданная заметка: сначала — название (поле выделено), Enter — к тексту.
  fresh: false,
});

// Открыть заметку (из списка, ссылки, правой панели); прошлая — в историю «Назад».
export function openPage(path: string, edit = false) {
  if (ui.open && ui.open !== path) ui.back = [...ui.back.slice(-30), ui.open];
  ui.open = path;
  ui.editing = edit;
  openTab('journal');
}
