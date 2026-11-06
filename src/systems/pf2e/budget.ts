// The numbers of the XP budget in Pathfinder 2e (GM Core): the plaque itself is common (shared/threat.ts).
import type { ThreatSpec } from '../../shared/threat';

export const PF_THREAT: ThreatSpec = {
  party: 4,
  xp: { '-4': 10, '-3': 15, '-2': 20, '-1': 30, '0': 40, '1': 60, '2': 80, '3': 120, '4': 160 },
  levels: [
    { title: { en: 'Trivial', ru: 'Пустяковая' }, base: 40, extra: 10 },
    { title: { en: 'Low', ru: 'Низкая' }, base: 60, extra: 20 },
    { title: { en: 'Moderate', ru: 'Умеренная' }, base: 80, extra: 20 },
    { title: { en: 'Severe', ru: 'Серьёзная' }, base: 120, extra: 30 },
    { title: { en: 'Extreme', ru: 'Чрезвычайная' }, base: 160, extra: 40 },
  ],
  beyond: { en: 'Beyond extreme', ru: 'Сверх чрезвычайной' },
};
