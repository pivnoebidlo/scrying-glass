// Pathfinder 2e in the control window: the stat block, the threat of a fight. The editor is the generic one (JSON)
// for now; a character sheet and the Pathbuilder import come next.
import type { StatsView, SystemUi } from '../ui';
import StatBlock from './StatBlock.svelte';
import Budget from './Budget.svelte';

export const pf2eUi: SystemUi = {
  family: 'pf2e',
  view: () => StatBlock as StatsView,
  encounter: Budget,
  // The core's fantasy generators fit Golarion too.
  claims: ['names', 'npc', 'tavern', 'settlement'],
};
