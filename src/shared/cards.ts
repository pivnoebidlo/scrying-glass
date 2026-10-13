// Карточки: монстры, NPC, персонажи. Общая обёртка одинакова для любой ролевой системы,
// блок stats описывает система (src/systems/<система>/). Только типы и чистые функции.
import { assetUrl, libraryAsset } from './vault';


export type CardKind = 'monster' | 'npc' | 'character';

// На чьей стороне существо в бою (для трекера инициативы). Её можно поменять при добавлении и в самом бою.
export type CardSide = 'party' | 'ally' | 'enemy';
// Если в карточке не указано: персонажи игроков — партия, NPC — союзники, монстры — противники.
export const defaultSide = (kind: CardKind): CardSide => (kind === 'monster' ? 'enemy' : kind === 'character' ? 'party' : 'ally');

// Где лежит карточка: встроенный SRD (только чтение), библиотека пользователя (общая для всех кампаний)
// или текущее хранилище (папки бестиария приключений).
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
  // Описание: внешность, повадки, история. Разметка как в текстах действий.
  description?: string;
  side?: CardSide;
  // Заметки мастера, игроки их не видят.
  notes: string;
  stats: S;
  // Откуда карточка импортирована: по id повторный импорт обновляет её, а не создаёт новую.
  links?: { lss?: string };
}

// Краткое описание карточки для списков и поиска. Считает ядро, чтобы не гонять в окна полные карточки.
export interface CardSummary {
  ref: CardRef;
  kind: CardKind;
  system: string;
  lang: string;
  name: string;
  origin?: Card['origin'];
  // Для карточек хранилища: папка бестиария или персонажей, где лежит файл (путь внутри хранилища).
  folder?: string;
  // Для карточек хранилища: сам файл карточки (путь внутри хранилища) — чтобы показывать их во «Файлах».
  file?: string;
  side: CardSide;
  tags: string[];
  portrait: string | null;
  // Все портреты карточки как пути для экрана игроков (путь хранилища или «library:…»).
  images: string[];
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

// Языки карточек: код -> название на самом языке. Список можно расширять; карточка на языке не из списка
// всё равно откроется и подпишется кодом.
export const LANGUAGES: Record<string, string> = {
  ru: 'Русский', en: 'English', uk: 'Українська', be: 'Беларуская', de: 'Deutsch', fr: 'Français',
  es: 'Español', it: 'Italiano', pt: 'Português', pl: 'Polski', cs: 'Čeština', tr: 'Türkçe',
  ja: '日本語', zh: '中文', ko: '한국어',
};
export const langName = (code: string) => LANGUAGES[code] ?? code;

export const refKey = (r: CardRef) => `${r.scope}:${r.id}`;
export const sameRef = (a: CardRef | null | undefined, b: CardRef | null | undefined) =>
  !!a && !!b && a.scope === b.scope && a.id === b.id;

// Картинка карточки как путь для портретов и инициативы: путь хранилища или «library:…». Портреты
// встроенных карточек тоже лежат в библиотеке.
export const cardAsset = (scope: CardScope, p: string) => (scope === 'vault' ? p : libraryAsset(p));

// Куда копировать картинку для карточки: для встроенных — в библиотеку.
export const imageScope = (scope: CardScope): CardScope => (scope === 'srd' ? 'library' : scope);
export const cardImageUrl = (scope: CardScope, p: string) => assetUrl(cardAsset(scope, p));
