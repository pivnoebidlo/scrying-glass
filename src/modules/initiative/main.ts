// Трекер инициативы: участники боя, очерёдность ходов, раунды, хиты, состояния.
import { t } from '../../shared/i18n';
import { randomUUID } from 'node:crypto';
import { defineModule } from '../../shared/module';
import { sameRef } from '../../shared/cards';
import { defeated, ordered, refreshed } from './order';
import { DEFAULT_SYSTEM, systemOf } from '../../systems';
import type { Combatant, Encounter, InitiativeState, StripSettings } from './types';

const initialState: InitiativeState = {
  combatants: [],
  encounters: [],
  turn: null,
  round: 0,
  showToPlayers: true,
  display: { size: 1.5, names: true, wounds: true, position: 'top' },
  party: { size: 4, level: 1 },
};

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

// Копия участника для боя: новый id, полные хиты и чистый стресс, без инициативы и состояний.
const fresh = (c: Combatant): Combatant => ({ ...refreshed(c), id: randomUUID() });

export default defineModule({
  id: 'initiative',
  persist: true,
  initialState,

  // В сохранённом состоянии прошлых версий нет новых настроек полосы (положение) — дополняем по умолчанию.
  init: (s) => ({ ...s, display: { ...initialState.display, ...s.display } }),

  actions: {
    // encounter — добавить в заготовку, а не в текущий бой.
    add(s, { c, encounter }: { c: Partial<Omit<Combatant, 'id'>>; encounter?: string }) {
      const full: Combatant = {
        id: randomUUID(),
        name: c.name?.trim() || t('init.noName'),
        init: c.init ?? null,
        bonus: c.bonus ?? 0,
        hp: c.hp ?? c.maxHp ?? null,
        maxHp: c.maxHp ?? null,
        ac: c.ac ?? null,
        side: c.side ?? 'enemy',
        portrait: c.portrait ?? null,
        hidden: c.hidden ?? false,
        hideWounds: c.hideWounds ?? false,
        conditions: [],
        ...(c.stress ? { stress: c.stress } : {}),
        ...(c.consequences ? { consequences: c.consequences } : {}),
        ...(c.attrs ? { attrs: c.attrs } : {}),
        card: c.card ?? null,
      };
      return withList(s, encounter, (list) => [...list, full]);
    },

    update(s, { id, changes, encounter }: { id: string; changes: Partial<Omit<Combatant, 'id'>>; encounter?: string }) {
      return patch(s, id, (c) => ({ ...c, ...changes, ...(encounter && 'maxHp' in changes ? { hp: changes.maxHp ?? null } : {}) }), encounter);
    },

    // Урон (amount < 0) или лечение (amount > 0). Хиты не выходят за 0 и максимум.
    // Mausritter: damage past HP goes to STR (healing restores only HP).
    changeHp(s, { id, amount }: { id: string; amount: number }) {
      return patch(s, id, (c) => {
        if (c.hp === null && c.maxHp === null) return c;
        const max = c.maxHp ?? Infinity;
        const now = c.hp ?? c.maxHp ?? 0;
        const overflow = amount < 0 ? Math.max(0, -amount - now) : 0;
        const attrs = overflow && c.attrs?.some((a) => a.id === 'str')
          ? c.attrs.map((a) => (a.id === 'str' ? { ...a, value: Math.max(0, a.value - overflow) } : a))
          : c.attrs;
        return { ...c, hp: Math.min(max, Math.max(0, now + amount)), ...(attrs ? { attrs } : {}) };
      });
    },

    // Mausritter: set an attribute score now (damage, a spell, rest); not above its maximum.
    setAttr(s, { id, attr, value }: { id: string; attr: string; value: number }) {
      return patch(s, id, (c) => ({
        ...c,
        attrs: c.attrs?.map((a) => (a.id === attr ? { ...a, value: Math.max(0, Math.min(a.max, Math.round(value))) } : a)),
      }));
    },

    toggleCondition(s, { id, condition }: { id: string; condition: string }) {
      return patch(s, id, (c) => ({
        ...c,
        conditions: c.conditions.includes(condition)
          ? c.conditions.filter((x) => x !== condition)
          : [...c.conditions, condition],
      }));
    },

    // Fate: отметить или снять клетку стресса.
    toggleStress(s, { id, track, box }: { id: string; track: string; box: number }) {
      return patch(s, id, (c) => ({
        ...c,
        stress: c.stress?.map((t) => (t.id === track ? { ...t, boxes: t.boxes.map((on, i) => (i === box ? !on : on)) } : t)),
      }));
    },

    // Fate: текст последствия (пусто — ячейка свободна).
    setConsequence(s, { id, index, text }: { id: string; index: number; text: string }) {
      return patch(s, id, (c) => ({ ...c, consequences: c.consequences?.map((q, i) => (i === index ? { ...q, text: text.trim() } : q)) }));
    },

    remove(s, { id, encounter }: { id: string; encounter?: string }) {
      if (encounter) return withList(s, encounter, (list) => list.filter((c) => c.id !== id));
      // Если удаляют того, чей ход, ход переходит к следующему.
      const next = s.turn === id ? advance(s, 1) : s;
      const combatants = next.combatants.filter((c) => c.id !== id);
      return { ...next, combatants, turn: combatants.length > 0 && next.turn !== id ? next.turn : null };
    },

    // Бросить инициативу за противников и союзников, у которых её ещё нет (all — за всех, кроме партии). Как —
    // решает система приключения: в D&D к20 + бонус, в Fate — просто значение навыка.
    rollNpcs(s, { all, system }: { all?: boolean; system?: string }) {
      const value = systemOf(system ?? DEFAULT_SYSTEM).tracker.roll.value;
      return {
        ...s,
        combatants: s.combatants.map((c) => (c.side !== 'party' && (all || c.init === null) ? { ...c, init: value(c.bonus) } : c)),
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
      const e: Encounter = { id, name: name.trim() || t('init.newFight'), adventure, combatants };
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
    // Сама заготовка остаётся: бой можно повторить. replace — another prepared fight instead of the running one
    // (the right panel: fights of one scene are alternatives); heroes added by hand stay. Heroes of the encounter
    // who are already in the fight are not added twice.
    startEncounter(s, { id, replace }: { id: string; replace?: boolean }) {
      const e = s.encounters.find((x) => x.id === id);
      if (!e) return s;
      const kept = replace ? s.combatants.filter((c) => !c.encounter && c.side === 'party') : s.combatants;
      const present = (c: Combatant) => c.side === 'party' && kept.some((k) => k.side === 'party' && (c.card && k.card ? sameRef(c.card, k.card) : k.name === c.name));
      const added = e.combatants.filter((c) => !present(c)).map((c) => ({ ...fresh(c), encounter: id }));
      return { ...s, ...(replace ? { turn: null, round: 0 } : {}), combatants: [...kept, ...added] };
    },

    // Turn a prepared fight off: its combatants (heroes too) leave; if no other prepared fight runs — the whole
    // fight is cleared.
    stopEncounter(s, { id }: { id: string }) {
      const others = s.combatants.some((c) => c.encounter && c.encounter !== id);
      const combatants = others ? s.combatants.filter((c) => c.encounter !== id) : [];
      const turn = combatants.some((c) => c.id === s.turn) ? s.turn : null;
      return { ...s, combatants, turn, round: turn ? s.round : 0 };
    },

    setParty(s, changes: Partial<InitiativeState['party']>) {
      const p = { ...s.party, ...changes };
      return { ...s, party: { size: Math.min(10, Math.max(1, Math.round(p.size))), level: Math.min(20, Math.max(1, Math.round(p.level))) } };
    },

    setDisplay(s, changes: Partial<StripSettings>) {
      return { ...s, display: { ...s.display, ...changes } };
    },

    setShowToPlayers(s, { value }: { value: boolean }) {
      return { ...s, showToPlayers: value };
    },
  },
});
