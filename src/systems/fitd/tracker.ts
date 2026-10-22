// The tracker in Forged in the Dark: no initiative (the scene goes where the fiction leads — the order is the list's);
// a stress line of 9 boxes and five harm lines (two lesser, two moderate, one severe); a free text for conditions.
import type { CombatStats } from '../../shared/cards';
import type { Combatant, Consequence } from '../../modules/initiative/types';
import type { TrackerDef } from '../tracker';
import { t } from '../../shared/i18n';
import { HARM_LEVELS, MAX_STRESS } from './stats';

const boxes = (n: number, filled = 0) => Array.from({ length: Math.max(0, Math.min(12, Math.round(n))) }, (_, i) => i < filled);

// Stress as a number: the marked boxes.
export const stressOf = (c: Combatant) => c.stress?.find((s) => s.id === 'stress')?.boxes.filter(Boolean).length ?? 0;
// The stress line filled up to n.
export const withStress = (c: Combatant, n: number) => {
  const max = c.stress?.find((s) => s.id === 'stress')?.boxes.length ?? MAX_STRESS;
  return [{ id: 'stress', boxes: boxes(max, Math.max(0, Math.min(max, n))) }];
};
export const harmLines = (old: Consequence[] = []): Consequence[] => HARM_LEVELS.map((shift, i) => ({ shift, text: old[i]?.text ?? '' }));

export const fitdTracker: TrackerDef = {
  init: {
    get label() {
      return t('fitd.tr.init');
    },
    get title() {
      return t('fitd.tr.initTitle');
    },
  },
  bonus: {
    get label() {
      return t('fitd.tr.bonus');
    },
    get short() {
      return t('fitd.tr.bonusShort');
    },
    get title() {
      return t('fitd.tr.bonusTitle');
    },
  },
  roll: {
    get label() {
      return t('fitd.tr.roll');
    },
    get title() {
      return t('fitd.tr.rollTitle');
    },
    value: () => 0,
    none: true,
  },
  conditions: {
    get label() {
      return t('fitd.tr.conditions');
    },
    get add() {
      return t('fitd.tr.addCondition');
    },
    list: [],
    free: true,
  },
  fields: [
    {
      key: 'stress',
      get label() {
        return t('fitd.stress');
      },
      get title() {
        return t('fitd.tr.stressTitle', { n: MAX_STRESS });
      },
      get: (c) => c.stress?.find((s) => s.id === 'stress')?.boxes.length ?? null,
      set: (v, c) => ({ stress: [{ id: 'stress', boxes: boxes(v ?? MAX_STRESS, c ? stressOf(c) : 0) }] }),
    },
  ],
  fromCard(s: CombatStats) {
    return {
      bonus: 0,
      maxHp: null,
      hp: null,
      ac: null,
      stress: [{ id: 'stress', boxes: boxes(s.stress?.[0]?.boxes ?? MAX_STRESS) }],
      consequences: harmLines(),
    };
  },
};
