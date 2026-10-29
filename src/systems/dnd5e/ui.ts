// D&D 5e in the control window: the stat block and the character sheet, their editors, its tools.
import type { Component } from 'svelte';
import { Calculator as CalculatorIcon, Footprints, Gauge, Wand2, Zap } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import type { ToolDef } from '../../modules/tools/ui/registry.svelte';
import type { SystemUi, StatsEditor, StatsView } from '../ui';
import Calculator from './tools/difficulty/Calculator.svelte';
import PointBuy from './tools/pointbuy/PointBuy.svelte';
import Reshape from './tools/reshape/Reshape.svelte';
import TravelCalculator from './tools/travel/TravelCalculator.svelte';
import WildMagic from './tools/wildmagic/WildMagic.svelte';
import StatBlock from './StatBlock.svelte';
import Editor from './Editor.svelte';
import CharacterSheet from './CharacterSheet.svelte';
import CharacterEditor from './CharacterEditor.svelte';
import { isCharacter } from './character';

const tool = (id: string, icon: ToolDef['icon'], key: string, page: Component): ToolDef => ({
  id,
  icon,
  get title() {
    return t(key as never);
  },
  families: ['dnd5e'],
  page,
});

export const dnd5eUi: SystemUi = {
  family: 'dnd5e',
  view: (_system, stats) => (isCharacter(stats) ? CharacterSheet : StatBlock) as StatsView,
  editor: (_system, stats) => (isCharacter(stats) ? CharacterEditor : Editor) as StatsEditor,
  tools: [
    tool('difficulty', Gauge, 'tools.side.difficulty', Calculator),
    tool('pointbuy', CalculatorIcon, 'tools.side.pointbuy', PointBuy),
    tool('reshape', Wand2, 'tools.side.reshape', Reshape),
    tool('travel', Footprints, 'tools.side.travel', TravelCalculator),
    tool('wildMagic', Zap, 'tools.side.wildMagic', WildMagic),
  ],
  // Fantasy generators with D&D's rules and SRD inside.
  claims: ['names', 'npc', 'tavern', 'settlement', 'shop', 'relic', 'dungeon', 'weather', 'events', 'treasure'],
};
