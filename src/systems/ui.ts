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
import FateSheet from './fate/Sheet.svelte';
import FateEditor from './fate/Editor.svelte';
import { isFate } from './fate/stats';
import MausSheet from './mausritter/Sheet.svelte';
import MausEditor from './mausritter/Editor.svelte';
import MausTrackerCells from './mausritter/TrackerCells.svelte';
import { isMaus } from './mausritter/stats';
import FitdSheet from './fitd/Sheet.svelte';
import FitdEditor from './fitd/Editor.svelte';
import FitdTrackerCells from './fitd/TrackerCells.svelte';
import { isFitd } from './fitd/stats';
import DndTrackerCells from './dnd5e/TrackerCells.svelte';
import FateTrackerCells from './fate/TrackerCells.svelte';
import type { Combatant } from '../modules/initiative/types';
import { familyOf } from '.';

type StatsView = Component<{ card: Card<any> }>;
// lang — язык карточки (подписи, которые попадут в статблок, например название колдовства).
type StatsEditor = Component<{ stats: any; system: string; lang?: string }, {}, 'stats'>;

const views: Record<string, StatsView> = {
  'dnd5e-2014': Dnd5eStatBlock,
  'dnd5e-2024': Dnd5eStatBlock,
  'fate-core': FateSheet,
  mausritter: MausSheet,
  fitd: FitdSheet,
};

const editors: Record<string, StatsEditor> = {
  'dnd5e-2014': Dnd5eEditor,
  'dnd5e-2024': Dnd5eEditor,
  'fate-core': FateEditor,
  mausritter: MausEditor,
  fitd: FitdEditor,
};

// stats нужен, чтобы отличить лист персонажа игрока от статблока.
// Карточка Fate (Mausritter) с чужим блоком stats (например, старая «поле — значение») — общий вид, чтобы ничего не потерять.
const guards: Record<string, (stats: unknown) => boolean> = { 'fate-core': isFate, mausritter: isMaus, fitd: isFitd };
const fits = (system: string, stats: unknown) => stats === undefined || (guards[system]?.(stats) ?? true);
export const statsView = (system: string, stats?: unknown): StatsView =>
  system.startsWith('dnd5e-') && isCharacter(stats) ? CharacterSheet : fits(system, stats) ? (views[system] ?? GenericStats) : GenericStats;
export const statsEditor = (system: string, stats?: unknown): StatsEditor =>
  system.startsWith('dnd5e-') && isCharacter(stats) ? CharacterEditor : fits(system, stats) ? (editors[system] ?? GenericEditor) : GenericEditor;

// Ячейки строки участника в трекере инициативы (хиты и КД, стресс и последствия): по семейству системы.
type TrackerCells = Component<{ c?: Combatant; head?: boolean }>;
const trackers: Record<string, TrackerCells> = { fate: FateTrackerCells, mausritter: MausTrackerCells, fitd: FitdTrackerCells };
export const trackerCells = (system: string): TrackerCells => trackers[familyOf(system)] ?? DndTrackerCells;
