// Pathfinder 2e in the control window: the stat block and its editor, the threat of a fight. A character sheet and
// the Pathbuilder import come next.
import type { StatsEditor, StatsView, SystemUi } from '../ui';
import StatBlock from './StatBlock.svelte';
import Editor from './Editor.svelte';
import Budget from './Budget.svelte';

export const pf2eUi: SystemUi = {
  family: 'pf2e',
  view: () => StatBlock as StatsView,
  editor: () => Editor as StatsEditor,
  encounter: Budget,
  // The core's fantasy generators fit Golarion too.
  claims: ['names', 'npc', 'tavern', 'settlement'],
};
