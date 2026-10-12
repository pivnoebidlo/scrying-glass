// Что модуль добавляет в окна. Все части необязательны.
import type { Component } from 'svelte';
import type { AppState, ModuleId } from '../../shared/types';

// Свойства, которые получает каждый компонент модуля.
export interface ModuleProps<K extends ModuleId> {
  ms: AppState[K];
  // Всё состояние приложения (не называется state, чтобы не путать с рунами $state).
  app: AppState;
}

type ModuleComponent<K extends ModuleId> = Component<ModuleProps<K>>;

// Окно управления.
export interface ControlContribution<K extends ModuleId> {
  id: K;
  title: string;
  icon: Component;
  // Порядок в полосе модулей и в настройках.
  order?: number;
  // Вкладка в рабочей области.
  view?: ModuleComponent<K>;
  // Левая боковая панель, когда модуль выбран.
  sidebar?: ModuleComponent<K>;
  // Блок в правой панели «Экран игроков».
  screen?: ModuleComponent<K>;
  // Раздел в окне настроек.
  settings?: ModuleComponent<K>;
  // Что модуль умеет делать с картинкой из хранилища (кнопки на карточке картинки).
  imageActions?: ImageAction[];
}

// Действие с картинкой хранилища, например «показать портретом» или «на весь экран».
// Работает как переключатель: повторное действие убирает картинку с экрана.
export interface ImageAction {
  id: string;
  // Подсказка на кнопке: «Показать портретом».
  title: string;
  // Метка на карточке, когда действие включено: «портрет».
  badge: string;
  icon: Component;
  active(app: AppState, path: string): boolean;
  toggle(app: AppState, path: string): void;
}

// Экран игроков: слой сцены. Слои с большим order лежат выше.
export interface DisplayContribution<K extends ModuleId> {
  id: K;
  order: number;
  layer: ModuleComponent<K>;
}

export const defineControl = <K extends ModuleId>(c: ControlContribution<K>) => c;
export const defineDisplay = <K extends ModuleId>(c: DisplayContribution<K>) => c;

