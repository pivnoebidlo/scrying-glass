// Набросок покупки характеристик: живёт, пока открыто окно.
import { STANDARD_RULES, zero, type Rules, type Scores } from '../../../systems/dnd5e/pointbuy';

// '2024' — бонусы предыстории, 'custom' — свои бонусы, иначе — раса 2014 года (ключ RACES_2014).
export type Mode = '2024' | 'custom' | string;

export const pb = $state({
  base: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } as Scores,
  bonus: zero(),
  extra: zero(),
  mode: '2024' as Mode,
  rules: { ...STANDARD_RULES } as Rules,
  // Результат проверки персонажа: чей и что вышло.
  checked: null as null | { name: string; level: number; verdict: string; ok: boolean },
});
