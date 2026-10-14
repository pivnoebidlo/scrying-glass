// Fate на экране игроков: аспекты сцены и жетоны судьбы. Общее для ядра и окон.
import type { CardRef } from '../../shared/cards';

// Аспект сцены: «Горящий склад», «Скользкий пол». Бесплатные призывы — кружками; скрытый игроки не видят (ещё не
// обнаружили).
export interface SceneAspect {
  id: string;
  text: string;
  invokes: number;
  hidden: boolean;
}

// У кого жетоны судьбы: персонаж игрока (обычно из карточки) — сколько сейчас и восстановление.
export interface FateHolder {
  id: string;
  name: string;
  // Картинка из хранилища или библиотеки («library:…»).
  portrait: string | null;
  card?: CardRef | null;
  points: number;
  refresh: number;
}

export interface FateState {
  aspects: SceneAspect[];
  holders: FateHolder[];
  // Запас мастера на сцену.
  gm: number;
  // Что видят игроки.
  show: { aspects: boolean; points: boolean };
  // В каком углу экрана игроков (чтобы не наложиться на полосу инициативы или таймер).
  place: { aspects: Corner; points: Corner };
}

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
export const CORNER_TITLES: Record<Corner, string> = {
  'top-left': 'слева вверху',
  'top-right': 'справа вверху',
  'bottom-left': 'слева внизу',
  'bottom-right': 'справа внизу',
};

export const MAX_POINTS = 20;
export const MAX_INVOKES = 9;
