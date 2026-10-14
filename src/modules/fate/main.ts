// Fate: аспекты сцены и жетоны судьбы персонажей и мастера (см. types.ts). Показываются в приключениях Fate.
import { randomUUID } from 'node:crypto';
import { defineModule } from '../../shared/module';
import { CORNERS, MAX_INVOKES, MAX_POINTS, type Corner, type FateHolder, type FateState, type SceneAspect } from './types';

const initialState: FateState = {
  aspects: [],
  holders: [],
  gm: 0,
  show: { aspects: true, points: true },
  place: { aspects: 'bottom-left', points: 'bottom-right' },
};

const clamp = (n: number, max: number) => Math.min(max, Math.max(0, Math.round(n)));

const patchAspect = (s: FateState, id: string, fn: (a: SceneAspect) => SceneAspect): FateState => ({
  ...s,
  aspects: s.aspects.map((a) => (a.id === id ? fn(a) : a)),
});
const patchHolder = (s: FateState, id: string, fn: (h: FateHolder) => FateHolder): FateState => ({
  ...s,
  holders: s.holders.map((h) => (h.id === id ? fn(h) : h)),
});

export default defineModule({
  id: 'fate',
  persist: true,
  initialState,

  // В сохранениях до выбора углов его нет — дополняем.
  init: (s) => ({ ...s, place: { ...initialState.place, ...s.place } }),

  actions: {
    // ---- Аспекты сцены ----

    addAspect(s, { text, hidden }: { text: string; hidden?: boolean }) {
      const t = text.trim();
      if (!t) return s;
      return { ...s, aspects: [...s.aspects, { id: randomUUID(), text: t, invokes: 0, hidden: !!hidden }] };
    },

    updateAspect(s, { id, changes }: { id: string; changes: Partial<Omit<SceneAspect, 'id'>> }) {
      return patchAspect(s, id, (a) => ({
        ...a,
        ...changes,
        text: changes.text !== undefined ? changes.text.trim() || a.text : a.text,
        invokes: changes.invokes !== undefined ? clamp(changes.invokes, MAX_INVOKES) : a.invokes,
      }));
    },

    removeAspect(s, { id }: { id: string }) {
      return { ...s, aspects: s.aspects.filter((a) => a.id !== id) };
    },

    // Новая сцена: аспекты прошлой больше не действуют.
    clearAspects(s) {
      return { ...s, aspects: [] };
    },

    // ---- Жетоны судьбы ----

    // Персонажи (из карточек партии) — кого ещё нет; есть с той же карточкой — обновить имя, картинку, восстановление.
    addHolders(s, { list }: { list: Omit<FateHolder, 'id' | 'points'>[] }) {
      let holders = s.holders;
      for (const h of list) {
        const same = holders.find((x) => (h.card && x.card ? x.card.scope === h.card.scope && x.card.id === h.card.id : x.name === h.name));
        if (same) holders = holders.map((x) => (x === same ? { ...x, name: h.name, portrait: h.portrait, refresh: h.refresh } : x));
        else holders = [...holders, { ...h, id: randomUUID(), points: clamp(h.refresh, MAX_POINTS) }];
      }
      return { ...s, holders };
    },

    updateHolder(s, { id, changes }: { id: string; changes: Partial<Omit<FateHolder, 'id'>> }) {
      return patchHolder(s, id, (h) => ({
        ...h,
        ...changes,
        points: changes.points !== undefined ? clamp(changes.points, MAX_POINTS) : h.points,
        refresh: changes.refresh !== undefined ? clamp(changes.refresh, MAX_POINTS) : h.refresh,
      }));
    },

    // Отдать (+1) или потратить (−1) жетон.
    points(s, { id, delta }: { id: string; delta: number }) {
      return patchHolder(s, id, (h) => ({ ...h, points: clamp(h.points + delta, MAX_POINTS) }));
    },

    removeHolder(s, { id }: { id: string }) {
      return { ...s, holders: s.holders.filter((h) => h.id !== id) };
    },

    // Начало сессии: у кого жетонов меньше восстановления — получает до него, у кого больше — остаются.
    newSession(s) {
      return { ...s, holders: s.holders.map((h) => ({ ...h, points: Math.max(h.points, h.refresh) })) };
    },

    gm(s, { delta, value }: { delta?: number; value?: number }) {
      return { ...s, gm: clamp(value ?? s.gm + (delta ?? 0), MAX_POINTS) };
    },

    // Новая сцена: у мастера столько жетонов, сколько персонажей.
    newScene(s) {
      return { ...s, gm: clamp(s.holders.length, MAX_POINTS) };
    },

    setShow(s, changes: Partial<FateState['show']>) {
      return { ...s, show: { ...s.show, ...changes } };
    },

    setPlace(s, changes: Partial<Record<keyof FateState['place'], Corner>>) {
      const ok = Object.fromEntries(Object.entries(changes).filter(([, v]) => CORNERS.includes(v as Corner)));
      return { ...s, place: { ...s.place, ...ok } };
    },
  },
});
