// Трекер инициативы в D&D: к20 + бонус, хиты и КД, состояния из правил.
import { die } from '../../shared/dice';
import type { TrackerDef } from '../tracker';
import { CONDITIONS, conditionEntry } from './conditions';

export const dndTracker: TrackerDef = {
  init: { label: 'Иниц.', title: 'Инициатива' },
  bonus: { label: 'Бонус', short: 'бонус', title: 'Бонус инициативы' },
  roll: { label: 'Бросить за NPC', title: 'Бросить d20 + бонус за противников и союзников без инициативы', value: (b) => die(20) + b },
  conditions: { label: 'Состояния', list: CONDITIONS, free: false, entry: conditionEntry },
  fields: [
    { key: 'hp', label: 'Хиты', title: 'Максимум хитов', get: (c) => c.maxHp, set: (v) => ({ maxHp: v, hp: v }) },
    { key: 'ac', label: 'КД', title: 'Класс доспеха', get: (c) => c.ac, set: (v) => ({ ac: v }) },
  ],
  fromCard: (s) => ({ maxHp: s.hp, hp: s.hp, ac: s.ac, bonus: s.initiative }),
};
