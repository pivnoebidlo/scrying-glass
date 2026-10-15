// Перетаскивание плиток внутри группы: use:sortable={{ group, id, ids }}. Новый порядок уходит в модуль order.
// Переносить можно только внутри своей группы (папки): плитка — файл в этой папке, сами файлы не двигаются.
import type { Action } from 'svelte/action';
import { moveId } from '../../shared/order';
import { dispatch, store } from './store.svelte';

export interface SortableOpts {
  group: string;
  id: string;
  // Все id группы в текущем порядке.
  ids: string[];
  // Например, пока идёт поиск: видна только часть группы.
  disabled?: boolean;
  // Список строк, а не сетка: «до/после» — по вертикали.
  vertical?: boolean;
  // Файл плитки: его можно перетащить в подборку правой панели (и при disabled — без перестановки).
  file?: string;
}

// Что тащим сейчас (одно на окно).
let dragging: { group: string; id: string } | null = null;

const MIME = 'application/x-sg-tile';

// Какой файл тащат (в dragover данные перетаскивания не прочитать, а принимать ли — зависит от вида файла).
let draggingFile: string | null = null;
export const draggedFile = () => draggingFile;

// Без настроек (undefined) — ничего не делает: так компонент может принимать сортировку необязательным пропом.
export const sortable: Action<HTMLElement, SortableOpts | undefined> = (node, initial) => {
  const off: SortableOpts = { group: '', id: '', ids: [], disabled: true };
  let o = initial ?? off;

  const sideAfter = (e: DragEvent) => {
    const r = node.getBoundingClientRect();
    return o.vertical ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
  };
  const clear = () => node.classList.remove('sort-before', 'sort-after', 'sort-vertical');
  const accepts = () => !o.disabled && dragging !== null && dragging.group === o.group && dragging.id !== o.id;

  // В полях ввода (подпись портрета) мышь выделяет текст, а не тащит плитку.
  const canDrag = () => !o.disabled || !!o.file;
  const onpointerdown = (e: PointerEvent) => {
    node.draggable = canDrag() && !(e.target as HTMLElement).closest('input, textarea, select');
  };
  const ondragstart = (e: DragEvent) => {
    if (!canDrag()) return;
    if (o.file) {
      draggingFile = o.file;
      e.dataTransfer?.setData('text/plain', o.file);
    }
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
    if (o.disabled) return;
    dragging = { group: o.group, id: o.id };
    e.dataTransfer?.setData(MIME, o.id);
    node.classList.add('sort-dragging');
  };
  const ondragend = () => {
    dragging = null;
    draggingFile = null;
    node.classList.remove('sort-dragging');
  };
  const ondragover = (e: DragEvent) => {
    if (!accepts()) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    const after = sideAfter(e);
    node.classList.toggle('sort-after', after);
    node.classList.toggle('sort-before', !after);
    node.classList.toggle('sort-vertical', !!o.vertical);
  };
  const ondrop = (e: DragEvent) => {
    clear();
    if (!accepts()) return;
    e.preventDefault();
    const next = moveId(o.ids, dragging!.id, o.id, sideAfter(e));
    dragging = null;
    // Здесь может быть видна только часть группы («Файлы» показывают папку без вложенных, а вкладка — с ними):
    // места остальных сохранённых плиток не теряем, они идут следом.
    const saved = store.state.order.groups[o.group] ?? [];
    dispatch('order', 'set', { group: o.group, ids: [...next, ...saved.filter((x) => !next.includes(x))] });
  };

  node.addEventListener('pointerdown', onpointerdown);
  node.addEventListener('dragstart', ondragstart);
  node.addEventListener('dragend', ondragend);
  node.addEventListener('dragover', ondragover);
  node.addEventListener('dragleave', clear);
  node.addEventListener('drop', ondrop);
  node.draggable = canDrag();

  return {
    update(next) {
      o = next ?? off;
      node.draggable = canDrag();
    },
    destroy() {
      node.removeEventListener('pointerdown', onpointerdown);
      node.removeEventListener('dragstart', ondragstart);
      node.removeEventListener('dragend', ondragend);
      node.removeEventListener('dragover', ondragover);
      node.removeEventListener('dragleave', clear);
      node.removeEventListener('drop', ondrop);
    },
  };
};
