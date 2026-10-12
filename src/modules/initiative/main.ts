// Трекер инициативы: участники боя, очерёдность ходов, раунды, хиты, состояния.
import { randomUUID } from 'node:crypto';
import { defineModule } from '../../shared/module';
import { defeated, ordered } from './order';
import type { Combatant, InitiativeState } from './types';

const initialState: InitiativeState = { combatants: [], turn: null, round: 0, showToPlayers: true };

const d20 = () => 1 + Math.floor(Math.random() * 20);

// Следующий (step = 1) или предыдущий (-1) ход. Побеждённые пропускаются; переход через начало — новый раунд.
function advance(s: InitiativeState, step: 1 | -1): InitiativeState {
  const list = ordered(s.combatants);
  if (!list.length) return s;
  const live = list.filter((c) => !defeated(c));
  if (!live.length) return s;
  let i = list.findIndex((c) => c.id === s.turn);
  let round = s.round;
  for (let n = 0; n < list.length; n++) {
    i += step;
    if (i >= list.length) {
      i = 0;
      round++;
    } else if (i < 0) {
      i = list.length - 1;
      round = Math.max(1, round - 1);
    }
    if (!defeated(list[i]!)) break;
  }
  return { ...s, turn: list[i]!.id, round };
}

const patch = (s: InitiativeState, id: string, fn: (c: Combatant) => Combatant): InitiativeState => ({
  ...s,
  combatants: s.combatants.map((c) => (c.id === id ? fn(c) : c)),
});

export default defineModule({
  id: 'initiative',
  persist: true,
  initialState,

  actions: {
    add(s, { c }: { c: Partial<Omit<Combatant, 'id'>> }) {
      const full: Combatant = {
        id: randomUUID(),
        name: c.name?.trim() || 'Без имени',
        init: c.init ?? null,
        bonus: c.bonus ?? 0,
        hp: c.hp ?? c.maxHp ?? null,
        maxHp: c.maxHp ?? null,
        ac: c.ac ?? null,
        side: c.side ?? 'enemy',
        portrait: c.portrait ?? null,
        image: c.image ?? null,
        hidden: c.hidden ?? false,
        conditions: [],
        card: c.card ?? null,
      };
      return { ...s, combatants: [...s.combatants, full] };
    },

    update(s, { id, changes }: { id: string; changes: Partial<Omit<Combatant, 'id'>> }) {
      return patch(s, id, (c) => ({ ...c, ...changes }));
    },

    // Урон (amount < 0) или лечение (amount > 0). Хиты не выходят за 0 и максимум.
    changeHp(s, { id, amount }: { id: string; amount: number }) {
      return patch(s, id, (c) => {
        if (c.hp === null && c.maxHp === null) return c;
        const max = c.maxHp ?? Infinity;
        return { ...c, hp: Math.min(max, Math.max(0, (c.hp ?? c.maxHp ?? 0) + amount)) };
      });
    },

    toggleCondition(s, { id, condition }: { id: string; condition: string }) {
      return patch(s, id, (c) => ({
        ...c,
        conditions: c.conditions.includes(condition)
          ? c.conditions.filter((x) => x !== condition)
          : [...c.conditions, condition],
      }));
    },

    remove(s, { id }: { id: string }) {
      // Если удаляют того, чей ход, ход переходит к следующему.
      const next = s.turn === id ? advance(s, 1) : s;
      const combatants = next.combatants.filter((c) => c.id !== id);
      return { ...next, combatants, turn: combatants.length > 0 && next.turn !== id ? next.turn : null };
    },

    // Бросить инициативу за противников и союзников, у которых её ещё нет (all — за всех, кроме партии).
    rollNpcs(s, { all }: { all?: boolean }) {
      return {
        ...s,
        combatants: s.combatants.map((c) =>
          c.side !== 'party' && (all || c.init === null) ? { ...c, init: d20() + c.bonus } : c
        ),
      };
    },

    start(s) {
      const first = ordered(s.combatants).find((c) => !defeated(c));
      return first ? { ...s, turn: first.id, round: 1 } : s;
    },

    next(s) {
      return s.turn ? advance(s, 1) : s;
    },

    prev(s) {
      return s.turn ? advance(s, -1) : s;
    },

    // Закончить бой: участники остаются (можно начать заново), очередь и раунды сбрасываются.
    end(s) {
      return { ...s, turn: null, round: 0 };
    },

    // Убрать противников и союзников после боя; партия остаётся, инициатива и состояния сбрасываются.
    clearEnemies(s) {
      return {
        ...s,
        turn: null,
        round: 0,
        combatants: s.combatants
          .filter((c) => c.side === 'party')
          .map((c) => ({ ...c, init: null, conditions: [] })),
      };
    },

    setShowToPlayers(s, { value }: { value: boolean }) {
      return { ...s, showToPlayers: value };
    },
  },
});
