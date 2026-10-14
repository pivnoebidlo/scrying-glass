// Карточка Fate Core: аспекты, навыки, трюки, стресс, последствия. Один вид для персонажей игроков и NPC.
// Подписи свои (открытого русского перевода Fate Core нет); навыки хранятся текстом — свой список у каждой игры.
import type { CardKind, CombatStats } from '../../shared/cards';
import { ladderText, signed } from './ladder';

// Важность NPC: безымянный (горстка навыков, клетка-другая стресса), второстепенный, главный (как персонаж).
export type FateTier = 'nameless' | 'supporting' | 'main';
export const TIERS: Record<FateTier, string> = { nameless: 'Безымянный', supporting: 'Второстепенный', main: 'Главный' };

export interface FateSkill {
  name: string;
  rating: number;
}

export interface FateStunt {
  name: string;
  text: string;
}

export interface FateStats {
  tier: FateTier;
  // Концепция и проблема — главные аспекты; остальные — списком.
  highConcept: string;
  trouble: string;
  aspects: string[];
  skills: FateSkill[];
  stunts: FateStunt[];
  // Восстановление: жетоны судьбы в начале сессии (у NPC обычно нет).
  refresh: number | null;
  // Стресс и последствия: нет — по правилам из навыков (stressOf / consequencesOf).
  stress?: { id: string; boxes: number }[];
  consequences?: number[];
  // Какой навык решает очерёдность (по умолчанию — Внимательность).
  initiativeSkill?: string;
}

// Навыки Fate Core по умолчанию.
export const DEFAULT_SKILLS: Record<string, string[]> = {
  ru: [
    'Атлетика', 'Вождение', 'Внимательность', 'Воля', 'Драка', 'Знания', 'Кража', 'Обман', 'Общение',
    'Провокация', 'Расследование', 'Ремесло', 'Ресурсы', 'Связи', 'Скрытность', 'Стрельба', 'Телосложение', 'Эмпатия',
  ],
  en: [
    'Athletics', 'Burglary', 'Contacts', 'Crafts', 'Deceive', 'Drive', 'Empathy', 'Fight', 'Investigate',
    'Lore', 'Notice', 'Physique', 'Provoke', 'Rapport', 'Resources', 'Shoot', 'Stealth', 'Will',
  ],
};

// Навыки, от которых зависят очерёдность и дорожки стресса, — на разных языках.
const NOTICE = ['внимательность', 'notice'];
const PHYSIQUE = ['телосложение', 'physique'];
const WILL = ['воля', 'will'];

const findSkill = (s: FateStats, names: string[]) => s.skills.find((x) => names.includes(x.name.trim().toLowerCase()));
export const ratingOf = (s: FateStats, names: string[]) => findSkill(s, names)?.rating ?? 0;

// Очерёдность: выбранный навык или Внимательность.
export const initiativeOf = (s: FateStats) =>
  s.initiativeSkill ? ratingOf(s, [s.initiativeSkill.trim().toLowerCase()]) : ratingOf(s, NOTICE);

// Клетки стресса по навыку (Fate Core): 2; Средне/Неплохо (+1/+2) — 3; Хорошо и выше — 4.
const boxesFor = (rating: number) => (rating >= 3 ? 4 : rating >= 1 ? 3 : 2);

// Стресс по правилам. Безымянный NPC: Средне — 0 клеток, Неплохо — 1, Хорошо и выше — 2, по лучшему навыку.
export function stressOf(s: FateStats): { id: string; boxes: number }[] {
  if (s.stress) return s.stress;
  if (s.tier === 'nameless') {
    const top = Math.max(0, ...s.skills.map((x) => x.rating));
    return [{ id: 'physical', boxes: Math.min(2, Math.max(0, top - 1)) }];
  }
  return [
    { id: 'physical', boxes: boxesFor(ratingOf(s, PHYSIQUE)) },
    { id: 'mental', boxes: boxesFor(ratingOf(s, WILL)) },
  ];
}

// Последствия по правилам: у главных — лёгкое, среднее, тяжёлое (и ещё лёгкое при Превосходно (+5) Телосложения или
// Воли), у второстепенных — лёгкое и среднее, у безымянных — нет.
export function consequencesOf(s: FateStats): number[] {
  if (s.consequences) return s.consequences;
  if (s.tier === 'nameless') return [];
  if (s.tier === 'supporting') return [2, 4];
  return Math.max(ratingOf(s, PHYSIQUE), ratingOf(s, WILL)) >= 5 ? [2, 4, 6, 2] : [2, 4, 6];
}

export const combatStats = (s: FateStats): CombatStats => ({
  hp: null,
  ac: null,
  initiative: initiativeOf(s),
  stress: stressOf(s),
  consequences: consequencesOf(s),
});

export const topRating = (s: FateStats) => (s.skills.length ? Math.max(...s.skills.map((x) => x.rating)) : null);

// Строка под названием: концепция, а без неё — важность NPC.
export const subtitle = (s: FateStats, kind?: CardKind) => s.highConcept || (kind === 'character' ? '' : TIERS[s.tier]);

// Навыки ступенями лестницы, сверху вниз: [[+4, [Драка]], [+3, [Атлетика, Воля]], …].
export function pyramid(s: FateStats): [number, FateSkill[]][] {
  const by = new Map<number, FateSkill[]>();
  for (const x of s.skills) by.set(x.rating, [...(by.get(x.rating) ?? []), x]);
  return [...by.entries()].sort((a, b) => b[0] - a[0]);
}

// «Хорошо (+3)» для ступени пирамиды.
export const stepTitle = (rating: number) => ladderText(rating);
export { signed };

export function blankStats(kind?: CardKind): FateStats {
  return {
    tier: kind === 'monster' ? 'nameless' : 'main',
    highConcept: '',
    trouble: '',
    aspects: [],
    skills: [],
    stunts: [],
    refresh: kind === 'character' ? 3 : null,
  };
}

// Блок stats похож на карточку Fate (а не на что-то чужое).
export const isFate = (s: unknown): s is FateStats =>
  !!s && typeof s === 'object' && Array.isArray((s as FateStats).skills) && Array.isArray((s as FateStats).aspects);
