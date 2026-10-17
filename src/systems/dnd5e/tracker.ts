// Трекер инициативы в D&D: к20 + бонус, хиты и КД, состояния из правил.
import { die } from '../../shared/dice';
import type { TrackerDef } from '../tracker';
import { t } from '../../shared/i18n';
import { conditionEntry, conditionList } from './conditions';

export const dndTracker: TrackerDef = {
  // Labels are getters: they follow the interface language.
  init: {
    get label() {
      return t('dnd.tr.init');
    },
    get title() {
      return t('dnd.initiative');
    },
  },
  bonus: {
    get label() {
      return t('dnd.tr.bonus');
    },
    get short() {
      return t('dnd.tr.bonusShort');
    },
    get title() {
      return t('dnd.tr.bonusTitle');
    },
  },
  roll: {
    get label() {
      return t('dnd.tr.roll');
    },
    get title() {
      return t('dnd.tr.rollTitle');
    },
    value: (b) => die(20) + b,
  },
  conditions: {
    get label() {
      return t('dnd.tr.conditions');
    },
    get list() {
      return conditionList();
    },
    free: false,
    entry: conditionEntry,
  },
  fields: [
    {
      key: 'hp',
      get label() {
        return t('dnd.hp');
      },
      get title() {
        return t('dnd.maxHp');
      },
      get: (c) => c.maxHp,
      set: (v) => ({ maxHp: v, hp: v }),
    },
    {
      key: 'ac',
      get label() {
        return t('dnd.ac');
      },
      get title() {
        return t('dnd.armorClass');
      },
      get: (c) => c.ac,
      set: (v) => ({ ac: v }),
    },
  ],
  fromCard: (s) => ({ maxHp: s.hp, hp: s.hp, ac: s.ac, bonus: s.initiative }),
};
