// Компоненты систем для окна управления: как показать и как править блок stats карточки.
import type { Component } from 'svelte';
import type { Card } from '../shared/cards';
import Dnd5eStatBlock from './dnd5e/StatBlock.svelte';
import Dnd5eEditor from './dnd5e/Editor.svelte';
import GenericStats from './GenericStats.svelte';
import GenericEditor from './GenericEditor.svelte';

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

export const statsView = (system: string): StatsView => views[system] ?? GenericStats;
export const statsEditor = (system: string): StatsEditor => editors[system] ?? GenericEditor;
