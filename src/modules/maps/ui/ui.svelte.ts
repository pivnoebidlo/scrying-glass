// Состояние редактора карт в окне управления: выбранная карта и инструмент.
import type { PinIcon } from '../icons';
import type { PinColor } from '../types';

export type Tool = 'pan' | 'reveal' | 'hide' | 'revealRect' | 'hideRect' | 'view' | 'pin' | 'grid' | 'token';

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
  pinIcon: 'pin' as PinIcon,
  pinShown: false,
  // Выбранный жетон и открыт ли список жетонов.
  token: null as string | null,
  tokenList: false,
  // Масштаб жетонов, пока ползунок тянут (в ядро уходит, когда отпустят).
  tokenScale: null as number | null,
});
