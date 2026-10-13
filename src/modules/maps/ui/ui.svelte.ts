// Состояние редактора карт в окне управления: выбранная карта и инструмент.
import type { PinColor } from '../types';

export type Tool = 'pan' | 'reveal' | 'hide' | 'revealRect' | 'hideRect' | 'view' | 'pin';

export const ui = $state({
  selected: null as string | null,
  tool: 'reveal' as Tool,
  // Радиус кисти в точках экрана.
  brush: 40,
  // Выбранная метка и открыт ли список меток.
  pin: null as string | null,
  pinList: false,
  // С чем ставятся новые метки: последний выбранный цвет и видят ли их игроки сразу.
  pinColor: 'red' as PinColor,
  pinShown: false,
});
