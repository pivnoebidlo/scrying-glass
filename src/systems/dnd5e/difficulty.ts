// Сложность боя по правилам D&D 2024 (SRD 5.2.1, «Combat Encounters», CC BY 4.0): у каждого героя бюджет опыта
// по уровню на низкую, умеренную и высокую сложность; бюджет партии — сумма. Опыт противников складывается без
// множителей (как в правилах 2024). Для партий 2014 года — та же оценка, только ориентир.
import { labels } from '../../shared/i18n';

// Уровень -> [низкая, умеренная, высокая].
const BUDGET: [number, number, number][] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100],
  [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];

export interface Budget {
  low: number;
  moderate: number;
  high: number;
}

export function partyBudget(levels: number[]): Budget {
  const b = { low: 0, moderate: 0, high: 0 };
  for (const l of levels) {
    const row = BUDGET[Math.min(20, Math.max(1, Math.round(l))) - 1]!;
    b.low += row[0];
    b.moderate += row[1];
    b.high += row[2];
  }
  return b;
}

// trivial — меньше половины низкого бюджета, beyond — больше высокого (правила 2024 таких боёв не описывают:
// это «смертельно опасно» на усмотрение мастера).
export type Rating = 'trivial' | 'low' | 'moderate' | 'high' | 'beyond';

export const RATING_TITLES = labels<Rating>(['trivial', 'low', 'moderate', 'high', 'beyond'], 'dnd.rating');

export function rate(xp: number, b: Budget): Rating {
  if (xp > b.high) return 'beyond';
  if (xp > b.moderate) return 'high';
  if (xp > b.low) return 'moderate';
  if (xp >= b.low / 2) return 'low';
  return 'trivial';
}
