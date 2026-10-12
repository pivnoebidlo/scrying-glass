// Порядок ходов. Общий для ядра и окон.
import type { Combatant } from './types';

// По убыванию инициативы, при равенстве — по бонусу, затем партия раньше противников, затем по порядку добавления.
// Без брошенной инициативы — в конце.
export function ordered(list: Combatant[]): Combatant[] {
  const side = { party: 0, ally: 1, enemy: 2 };
  return list
    .map((c, i) => ({ c, i }))
    .sort(
      (a, b) =>
        (b.c.init ?? -Infinity) - (a.c.init ?? -Infinity) ||
        b.c.bonus - a.c.bonus ||
        side[a.c.side] - side[b.c.side] ||
        a.i - b.i
    )
    .map((x) => x.c);
}

// Побеждённый противник (0 хитов) пропускает ход и не показывается игрокам.
export const defeated = (c: Combatant) => c.side !== 'party' && c.hp !== null && c.hp <= 0;
