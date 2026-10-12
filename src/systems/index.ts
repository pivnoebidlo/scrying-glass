// Ролевые системы: как читать блок stats карточки. Только чистые функции — используется и ядром, и окнами.
// Карточка неизвестной системы всё равно открывается: показывается общая часть и stats как «поле — значение».
import type { CombatStats } from '../shared/cards';
import * as dnd5e from './dnd5e/stats';

export interface SystemDef {
  id: string;
  title: string;
  subtitle(stats: any, lang: string): string;
  // Число для сортировки (у D&D — показатель опасности).
  rank(stats: any): number | null;
  combat(stats: any): CombatStats;
  // Пустой блок stats для новой карточки.
  blank(): unknown;
}

const dnd = (id: string, title: string): SystemDef => ({
  id,
  title,
  subtitle: dnd5e.subtitle,
  rank: (s: dnd5e.Dnd5eStats) => s.cr,
  combat: dnd5e.combatStats,
  blank: dnd5e.blankStats,
});

export const systems: SystemDef[] = [dnd('dnd5e-2014', 'D&D 5e (2014)'), dnd('dnd5e-2024', 'D&D 5e (2024)')];

const unknown = (id: string): SystemDef => ({
  id,
  title: id,
  subtitle: () => id,
  rank: () => null,
  combat: () => ({ hp: null, ac: null, initiative: 0 }),
  blank: () => ({}),
});

export const systemOf = (id: string) => systems.find((s) => s.id === id) ?? unknown(id);
