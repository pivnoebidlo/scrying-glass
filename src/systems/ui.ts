// Компоненты систем для окна управления: как показать блок stats карточки.
import type { Component } from 'svelte';
import type { Card } from '../shared/cards';
import Dnd5eStatBlock from './dnd5e/StatBlock.svelte';
import GenericStats from './GenericStats.svelte';

type StatsView = Component<{ card: Card<any> }>;

const views: Record<string, StatsView> = {
  'dnd5e-2014': Dnd5eStatBlock,
  'dnd5e-2024': Dnd5eStatBlock,
};

export const statsView = (system: string): StatsView => views[system] ?? GenericStats;
