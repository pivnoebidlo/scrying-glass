// Компоненты систем для окна управления: как показать и как править блок stats карточки.
// A plugin's part for the windows — `SystemUi` (the shared part is systems/plugin.ts); a new plugin — one line in
// UIS. A pack system has its generic sheet, editor and tracker cells; an unknown one — «field — value» and JSON.
import type { Component } from 'svelte';
import type { Card } from '../shared/cards';
import GenericStats from './GenericStats.svelte';
import GenericEditor from './GenericEditor.svelte';
import HpCells from './HpCells.svelte';
import PackSheet from './pack/Sheet.svelte';
import PackEditor from './pack/Editor.svelte';
import PackTrackerCells from './pack/TrackerCells.svelte';
import { isPackFamily, packOf } from './packs';
import type { Combatant } from '../modules/initiative/types';
import type { CardKind } from '../shared/cards';
import { familyOf } from '.';
import type { ToolDef } from '../modules/tools/ui/registry.svelte';
import { dnd5eUi } from './dnd5e/ui';

export type StatsView = Component<{ card: Card<any> }>;
// lang — язык карточки (подписи, которые попадут в статблок, например название колдовства).
// kind — the kind of card (a pack system has sections for some kinds only).
export type StatsEditor = Component<{ stats: any; system: string; lang?: string; kind?: CardKind }, {}, 'stats'>;
// Ячейки строки участника в трекере инициативы (хиты и КД, стресс и последствия).
export type TrackerCells = Component<{ c?: Combatant; head?: boolean }>;

export interface SystemUi {
  family: string;
  // How to show and edit a card's stats (by their shape: D&D has a stat block and a character sheet).
  view?(system: string, stats: unknown): StatsView | undefined;
  editor?(system: string, stats: unknown): StatsEditor | undefined;
  // The cells of a combatant's row; none — hit points and defence.
  trackerCells?: TrackerCells;
  // Its tools in Tools (with `families` and `page`) and the core's generators it shows as its own.
  tools?: ToolDef[];
  claims?: string[];
}

export const systemUis: SystemUi[] = [dnd5eUi];

export const systemUi = (system: string) => systemUis.find((u) => u.family === familyOf(system));

export const statsView = (system: string, stats?: unknown): StatsView =>
  packOf(system) ? (PackSheet as StatsView) : (systemUi(system)?.view?.(system, stats) ?? GenericStats);
export const statsEditor = (system: string, stats?: unknown): StatsEditor =>
  packOf(system) ? (PackEditor as StatsEditor) : (systemUi(system)?.editor?.(system, stats) ?? GenericEditor);
export const trackerCells = (system: string): TrackerCells =>
  isPackFamily(familyOf(system)) ? PackTrackerCells : (systemUi(system)?.trackerCells ?? HpCells);
