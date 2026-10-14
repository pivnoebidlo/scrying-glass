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
import FateTrackerCells from './fate/TrackerCells.svelte';
import type { Combatant } from '../modules/initiative/types';
import { familyOf } from '.';

type StatsView = Component<{ card: Card<any> }>;
type StatsEditor = Component<{ stats: any; system: string }, {}, 'stats'>;

const views: Record<string, StatsView> = {
  'dnd5e-2014': Dnd5eStatBlock,
  'dnd5e-2024': Dnd5eStatBlock,
};

const editors: Record<string, StatsEditor> = {
  'dnd5e-2014': Dnd5eEditor,
  'dnd5e-2024': Dnd5eEditor,
};

// stats нужен, чтобы отличить лист персонажа игрока от статблока.
export const statsView = (system: string, stats?: unknown): StatsView =>
  system.startsWith('dnd5e-') && isCharacter(stats) ? CharacterSheet : (views[system] ?? GenericStats);
export const statsEditor = (system: string, stats?: unknown): StatsEditor =>
  system.startsWith('dnd5e-') && isCharacter(stats) ? CharacterEditor : (editors[system] ?? GenericEditor);

// Ячейки строки участника в трекере инициативы (хиты и КД, стресс и последствия): по семейству системы.
type TrackerCells = Component<{ c?: Combatant; head?: boolean }>;
const trackers: Record<string, TrackerCells> = { fate: FateTrackerCells };
export const trackerCells = (system: string): TrackerCells => trackers[familyOf(system)] ?? DndTrackerCells;
