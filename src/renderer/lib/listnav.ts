// Клавиши в списках боковой панели — как в файловом менеджере. Модуль только помечает пункты:
//   data-nav            — пункт списка (кнопка): ↑ ↓ переходят на соседний и выбирают его (щелчком);
//   data-depth="N"      — уровень вложенности в дереве: ← с вложенного пункта поднимает к родителю;
//   aria-expanded       — папка: стрелки на неё только наводят, → раскрывает (щелчком), ← сворачивает.
// Висит на всей боковой панели (renderer/control/Sidebar.svelte). Событие, уже обработанное списком со своими
// клавишами (дерево «Файлов»), и клавиши в полях ввода не трогаются.
import type { Action } from 'svelte/action';

const KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const items = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-nav]')].filter((el) => el.offsetParent !== null);
const depth = (el: HTMLElement) => Number(el.dataset['depth'] ?? 0);
const isFolder = (el: HTMLElement) => el.hasAttribute('aria-expanded');

// Текущий пункт: в фокусе, иначе выбранный (класс active).
function current(list: HTMLElement[]): number {
  const focused = list.findIndex((el) => el === document.activeElement || el.contains(document.activeElement));
  return focused >= 0 ? focused : list.findIndex((el) => el.classList.contains('active') || !!el.parentElement?.classList.contains('active'));
}

function go(el: HTMLElement | undefined) {
  if (!el) return;
  el.focus();
  el.scrollIntoView({ block: 'nearest' });
  if (!isFolder(el)) el.click();
}

export const listNav: Action<HTMLElement> = (node) => {
  const onkeydown = (e: KeyboardEvent) => {
    if (!KEYS.has(e.key) || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('input, textarea, select, [contenteditable]')) return;
    const list = items(node);
    if (!list.length) return;
    const i = current(list);
    const here = list[i];
    e.preventDefault();
    if (!here) return go(list[0]);
    if (e.key === 'ArrowUp') go(list[i - 1]);
    else if (e.key === 'ArrowDown') go(list[i + 1]);
    else if (e.key === 'ArrowRight') {
      if (here.getAttribute('aria-expanded') === 'false') here.click();
      else if (here.getAttribute('aria-expanded') === 'true' && list[i + 1] && depth(list[i + 1]!) > depth(here)) go(list[i + 1]);
    } else if (e.key === 'ArrowLeft') {
      if (here.getAttribute('aria-expanded') === 'true') return here.click();
      for (let j = i - 1; j >= 0; j--) if (depth(list[j]!) < depth(here)) return go(list[j]);
    }
  };
  node.addEventListener('keydown', onkeydown);
  return { destroy: () => node.removeEventListener('keydown', onkeydown) };
};
