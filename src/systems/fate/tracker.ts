// Трекер в Fate Core: очерёдность по навыку (Внимательность, в ментальном конфликте — Эмпатия) без броска,
// дорожки стресса, последствия и аспекты вместо состояний.
import type { CombatStats } from '../../shared/cards';
import type { Combatant, Consequence, StressTrack } from '../../modules/initiative/types';
import type { TrackerDef } from '../tracker';
import { labels, t } from '../../shared/i18n';

export const TRACKS: Record<string, string> = labels(['physical', 'mental'], 'fcore.track');
export const trackTitle = (id: string) => TRACKS[id] ?? id;

// Последствия по порядку: лёгкое, среднее, тяжёлое и второе лёгкое (при Превосходной Выносливости или Воле).
export const CONSEQUENCE_SHIFTS = [2, 4, 6, 2];
export const CONSEQUENCE_TITLES: Record<number, string> = labels([2, 4, 6], 'fcore.cons');

// Обычный персонаж: по две клетки стресса и три последствия.
const DEFAULT = { physical: 2, mental: 2, consequences: 3 };

const boxes = (n: number) => Array.from({ length: Math.max(0, Math.min(10, Math.round(n))) }, () => false);

function withTrack(list: StressTrack[] | undefined, id: string, n: number): StressTrack[] {
  const all = list?.length ? list : [];
  const has = all.some((t) => t.id === id);
  const next = has ? all.map((t) => (t.id === id ? { id, boxes: boxes(n).map((_, i) => t.boxes[i] ?? false) } : t)) : [...all, { id, boxes: boxes(n) }];
  // Порядок дорожек: физическая, ментальная, остальные.
  const order = (t: StressTrack) => (t.id === 'physical' ? 0 : t.id === 'mental' ? 1 : 2);
  return next.sort((a, b) => order(a) - order(b));
}

export const consequences = (n: number, old: Consequence[] = []): Consequence[] =>
  CONSEQUENCE_SHIFTS.slice(0, Math.max(0, Math.min(CONSEQUENCE_SHIFTS.length, Math.round(n)))).map((shift, i) => ({ shift, text: old[i]?.text ?? '' }));

const track = (id: 'physical' | 'mental', label: () => string, title: () => string) => ({
  key: id,
  get label() {
    return label();
  },
  get title() {
    return t('fcore.tr.boxes', { title: title(), n: DEFAULT[id] });
  },
  get: (c: Combatant) => c.stress?.find((t) => t.id === id)?.boxes.length ?? null,
  set: (v: number | null, c?: Combatant) => ({ stress: withTrack(c?.stress, id, v ?? DEFAULT[id]) }),
});

export const fateTracker: TrackerDef = {
  // Labels are getters: they follow the interface language.
  init: {
    get label() {
      return t('fcore.tr.init');
    },
    get title() {
      return t('fcore.tr.initTitle');
    },
  },
  bonus: {
    get label() {
      return t('fcore.tr.bonus');
    },
    get short() {
      return t('fcore.tr.bonusShort');
    },
    get title() {
      return t('fcore.tr.bonusTitle');
    },
  },
  roll: {
    get label() {
      return t('fcore.tr.roll');
    },
    get title() {
      return t('fcore.tr.rollTitle');
    },
    value: (b) => b,
  },
  conditions: {
    get label() {
      return t('fcore.aspects');
    },
    list: [],
    free: true,
  },
  fields: [
    track('physical', () => t('fcore.tr.phys'), () => t('fcore.tr.physTitle')),
    track('mental', () => t('fcore.tr.ment'), () => t('fcore.tr.mentTitle')),
    {
      key: 'consequences',
      get label() {
        return t('fcore.tr.cons');
      },
      get title() {
        return t('fcore.tr.consTitle', { n: DEFAULT.consequences });
      },
      get: (c) => c.consequences?.length ?? null,
      set: (v, c) => ({ consequences: consequences(v ?? DEFAULT.consequences, c?.consequences) }),
    },
  ],
  fromCard(s: CombatStats) {
    const stress = s.stress ?? [
      { id: 'physical', boxes: DEFAULT.physical },
      { id: 'mental', boxes: DEFAULT.mental },
    ];
    return {
      bonus: s.initiative,
      maxHp: null,
      hp: null,
      ac: null,
      stress: stress.map((t) => ({ id: t.id, boxes: boxes(t.boxes) })),
      consequences: (s.consequences ?? CONSEQUENCE_SHIFTS.slice(0, DEFAULT.consequences)).map((shift) => ({ shift, text: '' })),
    };
  },
};
