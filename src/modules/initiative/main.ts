// Трекер инициативы: участники боя, очерёдность ходов, раунды, хиты, состояния.
import { randomUUID } from 'node:crypto';
import { defineModule } from '../../shared/module';
import { defeated, ordered } from './order';
import type { Combatant, Encounter, InitiativeState } from './types';

const initialState: InitiativeState = { combatants: [], encounters: [], turn: null, round: 0, showToPlayers: true };

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

// Список участников: текущего боя или заготовки (encounter — её id).
function withList(s: InitiativeState, encounter: string | undefined, fn: (list: Combatant[]) => Combatant[]): InitiativeState {
  if (!encounter) return { ...s, combatants: fn(s.combatants) };
  return { ...s, encounters: s.encounters.map((e) => (e.id === encounter ? { ...e, combatants: fn(e.combatants) } : e)) };
}

const patch = (s: InitiativeState, id: string, fn: (c: Combatant) => Combatant, encounter?: string): InitiativeState =>
  withList(s, encounter, (list) => list.map((c) => (c.id === id ? fn(c) : c)));

const patchEncounter = (s: InitiativeState, id: string, fn: (e: Encounter) => Encounter): InitiativeState => ({
  ...s,
  encounters: s.encounters.map((e) => (e.id === id ? fn(e) : e)),
});

// Копия участника для боя: новый id, полные хиты, без инициативы и состояний.
const fresh = (c: Combatant): Combatant => ({ ...c, id: randomUUID(), init: null, hp: c.maxHp, conditions: [] });

export default defineModule({
  id: 'initiative',
  persist: true,
  initialState,

  actions: {
    // encounter — добавить в заготовку, а не в текущий бой.
    add(s, { c, encounter }: { c: Partial<Omit<Combatant, 'id'>>; encounter?: string }) {
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
        hidden: c.hidden ?? false,
        conditions: [],
        card: c.card ?? null,
      };
      return withList(s, encounter, (list) => [...list, full]);
    },

    update(s, { id, changes, encounter }: { id: string; changes: Partial<Omit<Combatant, 'id'>>; encounter?: string }) {
      return patch(s, id, (c) => ({ ...c, ...changes, ...(encounter && 'maxHp' in changes ? { hp: changes.maxHp ?? null } : {}) }), encounter);
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

    remove(s, { id, encounter }: { id: string; encounter?: string }) {
      if (encounter) return withList(s, encounter, (list) => list.filter((c) => c.id !== id));
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

    // ---- Заготовки боёв ----

    // Новая заготовка (id даёт окно, чтобы сразу её открыть); fromFight — сразу с участниками текущего боя (кроме партии): «сохранить бой как заготовку».
    createEncounter(s, { id, name, adventure, fromFight }: { id: string; name: string; adventure: string | null; fromFight?: boolean }) {
      const combatants = fromFight ? s.combatants.filter((c) => c.side !== 'party').map(fresh) : [];
      const e: Encounter = { id, name: name.trim() || 'Новый бой', adventure, combatants };
      return { ...s, encounters: [...s.encounters, e] };
    },

    renameEncounter(s, { id, name }: { id: string; name: string }) {
      return name.trim() ? patchEncounter(s, id, (e) => ({ ...e, name: name.trim() })) : s;
    },

    setEncounterAdventure(s, { id, adventure }: { id: string; adventure: string | null }) {
      return patchEncounter(s, id, (e) => ({ ...e, adventure }));
    },

    deleteEncounter(s, { id }: { id: string }) {
      return { ...s, encounters: s.encounters.filter((e) => e.id !== id) };
    },

    // В бой: участники заготовки добавляются к текущему бою (партия и кто уже есть — остаются).
    // Сама заготовка остаётся: бой можно повторить.
    startEncounter(s, { id }: { id: string }) {
      const e = s.encounters.find((x) => x.id === id);
      return e ? { ...s, combatants: [...s.combatants, ...e.combatants.map(fresh)] } : s;
    },

    setShowToPlayers(s, { value }: { value: boolean }) {
      return { ...s, showToPlayers: value };
    },
  },
});
