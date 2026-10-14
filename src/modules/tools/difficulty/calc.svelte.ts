// Набросок калькулятора сложности: противники (карточка и сколько) и «своя партия». Живёт, пока открыто окно.
import type { CardRef } from '../../../shared/cards';

export const calc = $state({
  rows: [] as { ref: CardRef; count: number }[],
  ownParty: false,
});
