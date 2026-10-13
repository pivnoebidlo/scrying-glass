// Перетаскивание плиток внутри группы: use:sortable={{ group, id, ids }}. Новый порядок уходит в модуль order.
// Переносить можно только внутри своей группы (папки): плитка — файл в этой папке, сами файлы не двигаются.
import type { Action } from 'svelte/action';
import { moveId } from '../../shared/order';
import { dispatch } from './store.svelte';

export interface SortableOpts {
  group: string;
  id: string;
  // Все id группы в текущем порядке.
  ids: string[];
  // Например, пока идёт поиск: видна только часть группы.
  disabled?: boolean;
}

// Что тащим сейчас (одно на окно).
let dragging: { group: string; id: string } | null = null;

const MIME = 'application/x-sg-tile';

export const sortable: Action<HTMLElement, SortableOpts> = (node, initial) => {
  let o = initial;

  const sideAfter = (e: DragEvent) => {
    const r = node.getBoundingClientRect();
    return e.clientX > r.left + r.width / 2;
  };
  const clear = () => node.classList.remove('sort-before', 'sort-after');
  const accepts = () => !o.disabled && dragging !== null && dragging.group === o.group && dragging.id !== o.id;

  // В полях ввода (подпись портрета) мышь выделяет текст, а не тащит плитку.
  const onpointerdown = (e: PointerEvent) => {
    node.draggable = !o.disabled && !(e.target as HTMLElement).closest('input, textarea, select');
  };
  const ondragstart = (e: DragEvent) => {
    if (o.disabled) return;
    dragging = { group: o.group, id: o.id };
    e.dataTransfer?.setData(MIME, o.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    node.classList.add('sort-dragging');
  };
  const ondragend = () => {
    dragging = null;
    node.classList.remove('sort-dragging');
  };
  const ondragover = (e: DragEvent) => {
    if (!accepts()) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    const after = sideAfter(e);
    node.classList.toggle('sort-after', after);
    node.classList.toggle('sort-before', !after);
  };
  const ondrop = (e: DragEvent) => {
    clear();
    if (!accepts()) return;
    e.preventDefault();
    const next = moveId(o.ids, dragging!.id, o.id, sideAfter(e));
    dragging = null;
    dispatch('order', 'set', { group: o.group, ids: next });
  };

  node.addEventListener('pointerdown', onpointerdown);
  node.addEventListener('dragstart', ondragstart);
  node.addEventListener('dragend', ondragend);
  node.addEventListener('dragover', ondragover);
  node.addEventListener('dragleave', clear);
  node.addEventListener('drop', ondrop);
  node.draggable = !o.disabled;

  return {
    update(next) {
      o = next;
      node.draggable = !o.disabled;
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
