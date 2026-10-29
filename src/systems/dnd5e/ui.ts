// D&D 5e in the control window: the stat block and the character sheet, their editors.
import type { SystemUi, StatsEditor, StatsView } from '../ui';
import StatBlock from './StatBlock.svelte';
import Editor from './Editor.svelte';
import CharacterSheet from './CharacterSheet.svelte';
import CharacterEditor from './CharacterEditor.svelte';
import { isCharacter } from './character';

export const dnd5eUi: SystemUi = {
  family: 'dnd5e',
  view: (_system, stats) => (isCharacter(stats) ? CharacterSheet : StatBlock) as StatsView,
  editor: (_system, stats) => (isCharacter(stats) ? CharacterEditor : Editor) as StatsEditor,
};
