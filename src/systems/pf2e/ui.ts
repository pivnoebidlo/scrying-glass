// Pathfinder 2e in the control window: the stat block and its editor, the threat of a fight. A character sheet and
// the Pathbuilder import come next.
import type { StatsEditor, StatsView, SystemUi } from '../ui';
import StatBlock from './StatBlock.svelte';
import Editor from './Editor.svelte';
import CharacterSheet from './CharacterSheet.svelte';
import { isCharacter } from './character';
import Budget from './Budget.svelte';

export const pf2eUi: SystemUi = {
  family: 'pf2e',
  view: (_system, stats) => (isCharacter(stats) ? CharacterSheet : StatBlock) as StatsView,
  // A character's sheet is edited as JSON for now (it comes from Pathbuilder).
  editor: (_system, stats) => (isCharacter(stats) ? undefined : (Editor as StatsEditor)),
  encounter: Budget,
  // The core's fantasy generators fit Golarion too.
  claims: ['names', 'npc', 'tavern', 'settlement'],
};
