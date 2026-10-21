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
  // Полоса над боковой панелью любого модуля (переключатель приключений).
  header?: ModuleComponent<K>;
  // Блок в правой панели «Экран игроков».
  screen?: ModuleComponent<K>;
  // Блок пуст (на экране ничего от модуля нет): короткая строка вместо него — «нет», «бой не идёт».
  // Пустой блок свёрнут в одну строку с заголовком; развернуть можно нажатием.
  screenEmpty?: (app: AppState) => string | null;
  // Нужен ли блок сейчас (например, только в приключениях своей системы). Нет — нужен всегда.
  screenWhen?: (app: AppState) => boolean;
  // Раздел в окне настроек.
  settings?: ModuleComponent<K>;
  // Its title and icon when they differ from the module's (Adventures → «Game systems»).
  readonly settingsTitle?: string;
  settingsIcon?: Component<{ size?: number }>;
  // Что модуль умеет делать с файлами хранилища (кнопки на карточке картинки, в строке трека).
  imageActions?: FileAction[];
  audioActions?: FileAction[];
  // Невидимый компонент, который живёт всё время, пока открыто хранилище (например, проигрыватель).
  background?: ModuleComponent<K>;
}

// Действие с файлом хранилища, например «показать портретом» или «играть».
// Работает как переключатель: повторное действие выключает его.
export interface FileAction {
  id: string;
  // Подсказка на кнопке: «Показать портретом».
  title: string;
  // Короткая подпись кнопки на плитке (видна при наведении): выключено — «Портретом», включено — «Убрать портрет».
  tip?: { off: string; on: string };
  // Метка, когда действие включено: «портрет» (или своя для картинки: «в бою ×3»).
  badge: string | ((app: AppState, path: string) => string);
  icon: Component;
  active(app: AppState, path: string): boolean;
  toggle(app: AppState, path: string): void;
  // Shown only when this is true (for example, Telegram — once a bot is set up). No function — always.
  visible?(app: AppState, path: string): boolean;
}

export const badgeOf = (a: FileAction, app: AppState, path: string) => (typeof a.badge === 'string' ? a.badge : a.badge(app, path));

// Экран игроков: слой сцены. Слои с большим order лежат выше.
export interface DisplayContribution<K extends ModuleId> {
  id: K;
  order: number;
  layer: ModuleComponent<K>;
}

export const defineControl = <K extends ModuleId>(c: ControlContribution<K>) => c;
export const defineDisplay = <K extends ModuleId>(c: DisplayContribution<K>) => c;

