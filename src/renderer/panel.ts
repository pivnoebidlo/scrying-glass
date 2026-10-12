// Общее для окон: описание панели модуля и помощники.
import type { AppState, ModuleId } from '../shared/types';

// Панель модуля в окне. mount строит DOM один раз и возвращает функцию,
// которая вызывается при каждом изменении состояния.
export interface Panel<K extends ModuleId> {
  id: K;
  // Заголовок секции в окне управления.
  title?: string;
  mount(el: HTMLElement): (ms: AppState[K], state: AppState) => void;
}

export function definePanel<K extends ModuleId>(panel: Panel<K>): Panel<K> {
  return panel;
}

export const dispatch = window.api.dispatch;

// Картинка запрашивается по id элемента: sg-asset://p/<id>
export const assetUrl = (item: { id: string }) => 'sg-asset://p/' + encodeURIComponent(item.id);
