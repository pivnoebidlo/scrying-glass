// Что модуль добавляет в окна. Все части необязательны.
import type { Component } from 'svelte';
import type { AppState, ModuleId } from '../../shared/types';

// Свойства, которые получает каждый компонент модуля.
export interface ModuleProps<K extends ModuleId> {
  ms: AppState[K];
  state: AppState;
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
}

// Экран игроков: слой сцены. Слои с большим order лежат выше.
export interface DisplayContribution<K extends ModuleId> {
  id: K;
  order: number;
  layer: ModuleComponent<K>;
}

export const defineControl = <K extends ModuleId>(c: ControlContribution<K>) => c;
export const defineDisplay = <K extends ModuleId>(c: DisplayContribution<K>) => c;

