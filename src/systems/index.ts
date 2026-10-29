// Ролевые системы: как читать блок stats карточки. Только чистые функции — используется и ядром, и окнами.
// Карточка неизвестной системы всё равно открывается: показывается общая часть и stats как «поле — значение».
// The systems come from the plugins (systems/plugins.ts) and the packs (systems/packs.ts adds them here).
import type { CardKind, CombatStats } from '../shared/cards';
import { genericTracker, type TrackerDef } from './tracker';
import { PLUGINS } from './plugins';

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
  // A short name among the family's editions in lists («2014»); none — the title.
  short?: string;
  // Stats of different shapes by the kind of card (D&D: a character's sheet, a stat block for the rest): changing
  // the kind to another shape starts the stats anew. None — one shape for every kind.
  shape?: { ofKind(kind: CardKind): string; ofStats(stats: unknown): string };
}

export const systems: SystemDef[] = PLUGINS.flatMap((p) => p.systems);

// Семейства систем по порядку (для выбора системы приключения — группами).
export const FAMILIES: { id: string; title: string }[] = PLUGINS.map((p) => ({
  id: p.family,
  get title() {
    return p.title;
  },
}));

// The system of data made before the systems existed: an adventure without a system of its own in a vault without
// one (old adventures were D&D). Empty — no plugin claims it.
export const LEGACY_SYSTEM = PLUGINS.find((p) => p.legacy)?.legacy ?? '';

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
// The default system: the legacy one while it is on, else the first one turned on.
export const defaultSystem = () => (LEGACY_SYSTEM && isEnabled(LEGACY_SYSTEM) && systems.some((s) => s.id === LEGACY_SYSTEM) ? LEGACY_SYSTEM : (enabledSystems()[0]?.id ?? LEGACY_SYSTEM));

const unknown = (id: string): SystemDef => ({
  id,
  title: id,
  family: id,
  subtitle: () => id,
  rank: () => null,
  combat: () => ({ hp: null, ac: null, initiative: 0 }),
  blank: () => ({}),
  tracker: genericTracker,
});

export const systemOf = (id: string) => systems.find((s) => s.id === id) ?? unknown(id);

export const familyOf = (id: string) => systemOf(id).family;
export const isDnd = (id: string) => familyOf(id) === 'dnd5e';
