// Карточки: монстры, NPC, персонажи. Общая обёртка одинакова для любой ролевой системы,
// блок stats описывает система (src/systems/<система>/). Только типы и чистые функции.

export type CardKind = 'monster' | 'npc' | 'character';

// Где лежит карточка: встроенный SRD (только чтение), библиотека пользователя (общая для всех кампаний)
// или текущее хранилище (карточки кампании).
export type CardScope = 'srd' | 'library' | 'vault';

export interface CardRef {
  scope: CardScope;
  id: string;
}

export interface CardSource {
  title: string;
  license?: string;
  attribution?: string;
  url?: string;
}

export interface Card<S = unknown> {
  // Версия формата файла.
  format: 1;
  id: string;
  kind: CardKind;
  // 'dnd5e-2014', 'dnd5e-2024', …
  system: string;
  // 'en', 'ru', …
  lang: string;
  name: string;
  // Перевод другой карточки или вариант на её основе («вождь огров на основе огра»).
  origin?: { id: string; relation: 'translation' | 'variant' };
  source?: CardSource;
  // Картинки (пути внутри библиотеки или хранилища — смотря где лежит карточка). Первая — основная.
  portraits: string[];
  tags: string[];
  // Заметки мастера, игроки их не видят.
  notes: string;
  stats: S;
}

// Краткое описание карточки для списков и поиска. Считает ядро, чтобы не гонять в окна полные карточки.
export interface CardSummary {
  ref: CardRef;
  kind: CardKind;
  system: string;
  lang: string;
  name: string;
  origin?: Card['origin'];
  tags: string[];
  portrait: string | null;
  // Строка под названием: «Маленькая фея (гоблиноид) · ПО 1/4».
  subtitle: string;
  // Числа для сортировки и фильтров (у D&D — показатель опасности).
  rank: number | null;
  combat: CombatStats;
}

// То, что нужно трекеру инициативы.
export interface CombatStats {
  hp: number | null;
  ac: number | null;
  initiative: number;
  // Формула хитов для броска, например '3d6'.
  hpFormula?: string;
}

export const refKey = (r: CardRef) => `${r.scope}:${r.id}`;
export const sameRef = (a: CardRef | null | undefined, b: CardRef | null | undefined) =>
  !!a && !!b && a.scope === b.scope && a.id === b.id;

// Картинка карточки: путь от корня хранилища или библиотеки — смотря где лежит карточка.
export function cardImageUrl(scope: CardScope, p: string): string | null {
  if (scope === 'vault') return 'sg-asset://v/' + encodeURIComponent(p);
  if (scope === 'library') return 'sg-asset://l/' + encodeURIComponent(p);
  return null;
}
