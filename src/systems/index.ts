// Ролевые системы: как читать блок stats карточки. Только чистые функции — используется и ядром, и окнами.
// Карточка неизвестной системы всё равно открывается: показывается общая часть и stats как «поле — значение».
import type { CardKind, CombatStats } from '../shared/cards';
import * as dnd5e from './dnd5e/stats';
import * as character from './dnd5e/character';
import type { TrackerDef } from './tracker';
import { dndTracker } from './dnd5e/tracker';
import { fateTracker } from './fate/tracker';

export interface SystemDef {
  id: string;
  title: string;
  // Семейство: редакции одной игры (D&D 5e 2014 и 2024). Приключение показывает карточки и записи своего семейства.
  family: string;
  subtitle(stats: any, lang: string): string;
  // Число для сортировки (у D&D — показатель опасности).
  rank(stats: any): number | null;
  combat(stats: any): CombatStats;
  // Пустой блок stats для новой карточки: у персонажа игрока — лист, у остальных — статблок.
  blank(kind?: CardKind): unknown;
  // Трекер инициативы: очерёдность, числа участника, состояния.
  tracker: TrackerDef;
}

// У D&D два вида блока stats: статблок (монстры, NPC) и лист персонажа игрока — их различает форма.
const dnd = (id: string, title: string): SystemDef => ({
  id,
  title,
  family: 'dnd5e',
  subtitle: (s, lang) => (character.isCharacter(s) ? character.characterSubtitle(s) : dnd5e.subtitle(s, lang)),
  rank: (s) => (character.isCharacter(s) ? character.totalLevel(s) : (s as dnd5e.Dnd5eStats).cr),
  combat: (s) => (character.isCharacter(s) ? character.characterCombat(s) : dnd5e.combatStats(s)),
  blank: (kind) => (kind === 'character' ? character.blankCharacter() : dnd5e.blankStats()),
  tracker: dndTracker,
});

// Fate Core: пока без своего вида — карточка показывается как «поле — значение».
const fate: SystemDef = {
  id: 'fate-core',
  title: 'Fate Core',
  family: 'fate',
  subtitle: () => '',
  rank: () => null,
  combat: () => ({ hp: null, ac: null, initiative: 0 }),
  blank: () => ({}),
  tracker: fateTracker,
};

export const systems: SystemDef[] = [dnd('dnd5e-2024', 'D&D 5e (2024)'), dnd('dnd5e-2014', 'D&D 5e (2014)'), fate];

// Семейства систем по порядку (для выбора системы приключения — группами).
export const FAMILIES: { id: string; title: string }[] = [
  { id: 'dnd5e', title: 'D&D 5e' },
  { id: 'fate', title: 'Fate' },
];

// Система, если для приключения она не выбрана.
export const DEFAULT_SYSTEM = 'dnd5e-2024';

// Отключённые в настройках системы (settings.json приложения, общие для всех хранилищ): их не предлагают при
// выборе, их карточки и встроенные записи не показываются. Ставит ядро из настроек, окна — из `vault.systemsOff`.
// Все отключить нельзя.
let off = new Set<string>();
export function setSystemsOff(list?: string[] | null): string[] {
  const known = (list ?? []).filter((id) => systems.some((s) => s.id === id));
  off = new Set(known.length < systems.length ? known : []);
  return [...off];
}
export const isEnabled = (id: string) => !off.has(id);
export const enabledSystems = () => systems.filter((s) => !off.has(s.id));
// Система по умолчанию с учётом отключённых.
export const defaultSystem = () => (isEnabled(DEFAULT_SYSTEM) ? DEFAULT_SYSTEM : (enabledSystems()[0]?.id ?? DEFAULT_SYSTEM));

const unknown = (id: string): SystemDef => ({
  id,
  title: id,
  family: id,
  subtitle: () => id,
  rank: () => null,
  combat: () => ({ hp: null, ac: null, initiative: 0 }),
  blank: () => ({}),
  // У неизвестной системы — хиты и КД, как у D&D: самое привычное.
  tracker: dndTracker,
});

export const systemOf = (id: string) => systems.find((s) => s.id === id) ?? unknown(id);

export const familyOf = (id: string) => systemOf(id).family;
export const isDnd = (id: string) => familyOf(id) === 'dnd5e';
