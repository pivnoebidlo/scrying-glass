// Порядок ходов и состояние участника (выбыл, насколько ранен). Общее для ядра и окон.
import type { Combatant } from './types';

// По убыванию инициативы, при равенстве — по бонусу, затем партия раньше противников, затем по порядку добавления.
// Без брошенной инициативы — в конце.
export function ordered(list: Combatant[]): Combatant[] {
  const side = { party: 0, ally: 1, neutral: 2, enemy: 3 };
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

// Выбыл: 0 хитов (D&D), выведен из боя (Fate) или STR 0 (Mausritter: 0 HP — ещё не выбыл, урон идёт в STR).
export const down = (c: Combatant) => {
  if (c.out) return true;
  const str = c.attrs?.find((a) => a.id === 'str');
  return str ? str.value <= 0 : c.hp !== null && c.hp <= 0;
};

// Побеждённый противник пропускает ход; игроки видят его серым (вдруг оживят).
export const defeated = (c: Combatant) => c.side !== 'party' && down(c);

// Насколько ранен: 0 — цел, 1 — при смерти. По хитам, а без них — по отмеченному стрессу и последствиям
// (последствие весит столько, на сколько сдвигов оно; клетка стресса — свой номер).
export function woundOf(c: Combatant): number {
  if (down(c)) return 0;
  const str = c.attrs?.find((a) => a.id === 'str');
  // Mausritter: HP and then STR.
  if (c.maxHp && str?.max) return Math.min(1, Math.max(0, 1 - ((c.hp ?? 0) + str.value) / (c.maxHp + str.max)));
  if (c.maxHp) return c.hp === null ? 0 : Math.min(1, Math.max(0, 1 - c.hp / c.maxHp));
  let taken = 0;
  let total = 0;
  for (const t of c.stress ?? []) t.boxes.forEach((on, i) => ((total += i + 1), on && (taken += i + 1)));
  for (const q of c.consequences ?? []) (total += q.shift), q.text.trim() && (taken += q.shift);
  return total ? taken / total : 0;
}

// Для нового боя: полные хиты, чистый стресс и последствия, без инициативы и состояний.
export const refreshed = (c: Combatant): Combatant => ({
  ...c,
  init: null,
  hp: c.maxHp,
  conditions: [],
  out: false,
  ...(c.stress ? { stress: c.stress.map((t) => ({ ...t, boxes: t.boxes.map(() => false) })) } : {}),
  ...(c.consequences ? { consequences: c.consequences.map((q) => ({ ...q, text: '' })) } : {}),
  ...(c.attrs ? { attrs: c.attrs.map((a) => ({ ...a, value: a.max })) } : {}),
});
