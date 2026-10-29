// The initiative tracker in Pathfinder 2e: d20 + Perception, hit points and AC, the conditions of Player Core —
// the valued ones carry a number («Frightened 2»); a condition opens its compendium entry.
import { die } from '../../shared/dice';
import { t } from '../../shared/i18n';
import { conditionValue, type TrackerDef } from '../tracker';

// Names as in the compendium (the data is English).
export const CONDITIONS = [
  'Blinded', 'Broken', 'Clumsy', 'Concealed', 'Confused', 'Controlled', 'Dazzled', 'Deafened', 'Doomed', 'Drained',
  'Dying', 'Encumbered', 'Enfeebled', 'Fascinated', 'Fatigued', 'Fleeing', 'Frightened', 'Grabbed', 'Hidden',
  'Immobilized', 'Invisible', 'Off-Guard', 'Paralyzed', 'Persistent Damage', 'Petrified', 'Prone', 'Quickened',
  'Restrained', 'Sickened', 'Slowed', 'Stunned', 'Stupefied', 'Unconscious', 'Undetected', 'Wounded',
];
export const VALUED = ['Clumsy', 'Doomed', 'Drained', 'Dying', 'Enfeebled', 'Frightened', 'Sickened', 'Slowed', 'Stunned', 'Stupefied', 'Wounded'];

export const pf2eTracker: TrackerDef = {
  init: {
    get label() {
      return t('pf2e.tr.init');
    },
    get title() {
      return t('pf2e.tr.initiative');
    },
  },
  bonus: {
    get label() {
      return t('pf2e.tr.bonus');
    },
    get short() {
      return t('pf2e.tr.bonusShort');
    },
    get title() {
      return t('pf2e.tr.bonusTitle');
    },
  },
  roll: {
    get label() {
      return t('pf2e.tr.roll');
    },
    get title() {
      return t('pf2e.tr.rollTitle');
    },
    value: (b) => die(20) + b,
  },
  conditions: {
    get label() {
      return t('pf2e.tr.conditions');
    },
    list: CONDITIONS,
    free: false,
    valued: VALUED,
    entry: (c) => [conditionValue(c).name],
  },
  fields: [
    {
      key: 'hp',
      get label() {
        return t('pf2e.tr.hp');
      },
      get title() {
        return t('pf2e.tr.maxHp');
      },
      get: (c) => c.maxHp,
      set: (v) => ({ maxHp: v, hp: v }),
    },
    {
      key: 'ac',
      get label() {
        return t('pf2e.tr.ac');
      },
      get title() {
        return t('pf2e.tr.armorClass');
      },
      get: (c) => c.ac,
      set: (v) => ({ ac: v }),
    },
  ],
  fromCard: (s) => ({ maxHp: s.hp, hp: s.hp, ac: s.ac, bonus: s.initiative }),
};
