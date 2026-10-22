// Что открыто в журнале: заметка (путь), режим правки, поиск, свёрнутые папки списка.
import { openTab } from '../../../renderer/lib/nav';

export const ui = $state({
  open: null as string | null,
  editing: false,
  query: '',
  back: [] as string[],
  collapsed: [] as string[],
  // The folder clicked in the list: «New note» and «New folder» create there.
  selected: null as string | null,
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

// The side drawer of the journal: a pinned note or a PDF over any tab (from the right panel, a [[link]] — a PDF page).
export const peek = $state({ path: null as string | null, page: null as number | null, rev: 0 });
export function peekJournal(path: string, page: number | null = null) {
  peek.path = path;
  peek.page = page;
  peek.rev++;
}
export const closePeek = () => (peek.path = null);
