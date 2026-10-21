// Mausritter tracker: attacks always hit, damage goes to HP and then to STR (action `changeHp`), armour is
// subtracted from each hit. Turn order: a mouse that passes a DEX save (or ambushes) acts before the opponents,
// otherwise after them; DEX breaks ties.
import type { Combatant, AttrScore } from '../../modules/initiative/types';
import type { CombatField, TrackerDef } from '../tracker';
import { t } from '../../shared/i18n';
import { ATTR_SHORT, ATTR_TITLES, ATTRS, conditionList, type MausAttr } from './stats';

// The order column: 2 — before the opponents, 1 — the opponents, 0 — after them.
export const ORDER = { first: 2, foes: 1, last: 0 };

// The attributes a combatant without a card gets.
const DEFAULT_ATTR = 10;

export function withAttr(list: AttrScore[] | undefined, id: string, max: number): AttrScore[] {
  const all = list?.length ? list : [];
  const old = all.find((a) => a.id === id);
  const next = old ? all.map((a) => (a.id === id ? { id, max, value: Math.max(0, Math.min(max, a.value + (max - a.max))) } : a)) : [...all, { id, value: max, max }];
  return next.sort((a, b) => ATTRS.indexOf(a.id as MausAttr) - ATTRS.indexOf(b.id as MausAttr));
}

const attrField = (id: MausAttr): CombatField => ({
  key: id,
  get label() {
    return ATTR_SHORT[id]!;
  },
  get title() {
    return t('maus.tr.attrTitle', { title: ATTR_TITLES[id]!, n: DEFAULT_ATTR });
  },
  get: (c) => c.attrs?.find((a) => a.id === id)?.max ?? null,
  set: (v, c) => ({ attrs: withAttr(c?.attrs, id, v ?? DEFAULT_ATTR), ...(id === 'dex' ? { bonus: v ?? DEFAULT_ATTR } : {}) }),
});

export const mausTracker: TrackerDef = {
  // Labels are getters: they follow the interface language.
  init: {
    get label() {
      return t('maus.tr.init');
    },
    get title() {
      return t('maus.tr.initTitle');
    },
  },
  bonus: {
    get label() {
      return ATTR_SHORT.dex!;
    },
    get short() {
      return ATTR_SHORT.dex!;
    },
    get title() {
      return t('maus.tr.bonusTitle');
    },
    from: 'dex',
  },
  roll: {
    get label() {
      return t('maus.tr.roll');
    },
    get title() {
      return t('maus.tr.rollTitle');
    },
    // The opponents do not roll: the mice save against DEX to act before them.
    value: () => ORDER.foes,
  },
  conditions: {
    get label() {
      return t('maus.conditions');
    },
    get list() {
      return conditionList();
    },
    free: false,
  },
  fields: [
    {
      key: 'hp',
      get label() {
        return t('maus.hp');
      },
      get title() {
        return t('maus.hpTitle');
      },
      get: (c) => c.maxHp,
      set: (v) => ({ maxHp: v, hp: v }),
    },
    ...ATTRS.map(attrField),
    {
      key: 'ac',
      get label() {
        return t('maus.armourShort');
      },
      get title() {
        return t('maus.armour');
      },
      get: (c) => c.ac,
      set: (v) => ({ ac: v }),
    },
  ],
  fromCard: (s) => ({
    maxHp: s.hp,
    hp: s.hp,
    ac: s.ac,
    bonus: s.initiative,
    attrs: (s.attrs?.length ? s.attrs : ATTRS.map((id) => ({ id, value: DEFAULT_ATTR }))).map((a) => ({ id: a.id, value: a.value, max: a.value })),
  }),
};

// A combatant added before the system changed (or by hand in D&D) — give it the usual attributes.
export const defaultAttrs = (c: Combatant): AttrScore[] => ATTRS.map((id) => ({ id, value: DEFAULT_ATTR, max: DEFAULT_ATTR })).map((a) => c.attrs?.find((x) => x.id === a.id) ?? a);
