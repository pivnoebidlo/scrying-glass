// Компоненты систем для окна управления: как показать и как править блок stats карточки.
import type { Component } from 'svelte';
import type { Card } from '../shared/cards';
import Dnd5eStatBlock from './dnd5e/StatBlock.svelte';
import Dnd5eEditor from './dnd5e/Editor.svelte';
import CharacterSheet from './dnd5e/CharacterSheet.svelte';
import CharacterEditor from './dnd5e/CharacterEditor.svelte';
import { isCharacter } from './dnd5e/character';
import GenericStats from './GenericStats.svelte';
import GenericEditor from './GenericEditor.svelte';
import DndTrackerCells from './dnd5e/TrackerCells.svelte';
import PackSheet from './pack/Sheet.svelte';
import PackEditor from './pack/Editor.svelte';
import PackTrackerCells from './pack/TrackerCells.svelte';
import { isPackFamily, packOf } from './packs';
import type { Combatant } from '../modules/initiative/types';
import type { CardKind } from '../shared/cards';
import { familyOf } from '.';

type StatsView = Component<{ card: Card<any> }>;
// lang — язык карточки (подписи, которые попадут в статблок, например название колдовства).
// kind — the kind of card (a pack system has sections for some kinds only).
type StatsEditor = Component<{ stats: any; system: string; lang?: string; kind?: CardKind }, {}, 'stats'>;

const views: Record<string, StatsView> = {
  'dnd5e-2014': Dnd5eStatBlock,
  'dnd5e-2024': Dnd5eStatBlock,
};

const editors: Record<string, StatsEditor> = {
  'dnd5e-2014': Dnd5eEditor,
  'dnd5e-2024': Dnd5eEditor,
};

// A system described by a pack: its own generic view and editor (stats of another shape too — the editor starts
// from the pack's blank values).
export const statsView = (system: string, stats?: unknown): StatsView =>
  packOf(system) ? (PackSheet as StatsView) : system.startsWith('dnd5e-') && isCharacter(stats) ? CharacterSheet : (views[system] ?? GenericStats);
export const statsEditor = (system: string, stats?: unknown): StatsEditor =>
  packOf(system) ? (PackEditor as StatsEditor) : system.startsWith('dnd5e-') && isCharacter(stats) ? CharacterEditor : (editors[system] ?? GenericEditor);

// Ячейки строки участника в трекере инициативы (хиты и КД, стресс и последствия): по семейству системы.
type TrackerCells = Component<{ c?: Combatant; head?: boolean }>;
export const trackerCells = (system: string): TrackerCells => (isPackFamily(familyOf(system)) ? PackTrackerCells : DndTrackerCells);
