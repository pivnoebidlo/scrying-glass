// Pathfinder 2e in the control window: the stat block and the character sheet with their editors, the threat of a
// fight.
import type { StatsEditor, StatsView, SystemUi } from '../ui';
import StatBlock from './StatBlock.svelte';
import Editor from './Editor.svelte';
import CharacterSheet from './CharacterSheet.svelte';
import CharacterEditor from './CharacterEditor.svelte';
import { isCharacter } from './character';
import Budget from './Budget.svelte';

export const pf2eUi: SystemUi = {
  family: 'pf2e',
  view: (_system, stats) => (isCharacter(stats) ? CharacterSheet : StatBlock) as StatsView,
  editor: (_system, stats) => (isCharacter(stats) ? CharacterEditor : Editor) as StatsEditor,
  encounter: Budget,
  // The core's fantasy generators fit Golarion too.
  claims: ['names', 'npc', 'tavern', 'settlement'],
};
