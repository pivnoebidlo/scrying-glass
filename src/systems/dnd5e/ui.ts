// D&D 5e in the control window: the stat block and the character sheet, their editors, its tools.
import type { Component } from 'svelte';
import { Calculator as CalculatorIcon, CloudSun, DoorOpen, Footprints, Gauge, Gem, RefreshCw, Signpost, Sparkles, Store, Wand2, Zap } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import type { ToolDef } from '../../modules/tools/ui/registry.svelte';
import type { PaperView, SystemUi, StatsEditor, StatsView } from '../ui';
import { bestiary } from '../../modules/bestiary/ui/cards.svelte';
import { reshapeFor, reshapeFrom, reshapeNew } from './tools/reshape/store.svelte';
import PaperSheet from './PaperSheet.svelte';
import Difficulty from './encounter/Difficulty.svelte';
import { spellList } from './spells.svelte';
import Background from './Background.svelte';
import Calculator from './tools/difficulty/Calculator.svelte';
import PointBuy from './tools/pointbuy/PointBuy.svelte';
import Reshape from './tools/reshape/Reshape.svelte';
import TravelCalculator from './tools/travel/TravelCalculator.svelte';
import WildMagic from './tools/wildmagic/WildMagic.svelte';
import ShopGenerator from './tools/shop/ShopGenerator.svelte';
import RelicGenerator from './tools/relic/RelicGenerator.svelte';
import DungeonGenerator from './tools/dungeon/DungeonGenerator.svelte';
import WeatherGenerator from './tools/weather/WeatherGenerator.svelte';
import EventsGenerator from './tools/events/EventsGenerator.svelte';
import TreasureGenerator from './tools/treasure/TreasureGenerator.svelte';
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
  // In the order of the sidebar: after the core's fantasy generators it claims.
  tools: [
    tool('shop', Store, 'tools.side.shop', ShopGenerator),
    tool('relic', Sparkles, 'tools.side.relic', RelicGenerator),
    tool('dungeon', DoorOpen, 'tools.side.dungeon', DungeonGenerator),
    tool('weather', CloudSun, 'tools.side.weather', WeatherGenerator),
    tool('events', Signpost, 'tools.side.events', EventsGenerator),
    tool('treasure', Gem, 'tools.side.treasure', TreasureGenerator),
    tool('difficulty', Gauge, 'tools.side.difficulty', Calculator),
    tool('pointbuy', CalculatorIcon, 'tools.side.pointbuy', PointBuy),
    tool('reshape', Wand2, 'tools.side.reshape', Reshape),
    tool('travel', Footprints, 'tools.side.travel', TravelCalculator),
    tool('wildMagic', Zap, 'tools.side.wildMagic', WildMagic),
  ],
  cardActions: (c) => [
    // A player's character imported from Long Story Short: read a newer export.
    ...(c.kind === 'character' && c.ref.scope !== 'srd'
      ? [{ icon: RefreshCw, get label() { return t('best.fromLss'); }, get title() { return t('best.lssHint'); }, run: () => bestiary.updateFromLss(c.ref) }]
      : []),
    ...(c.kind !== 'character'
      ? [{ icon: Wand2, get label() { return t('reshape.fromCard'); }, get title() { return t('reshape.fromCardHint'); }, run: () => reshapeFrom(c.ref) }]
      : []),
  ],
  // A stat block made from another one (Tools → Reshape a stat block).
  newCard: [
    {
      icon: Wand2,
      get label() {
        return t('best.fromStatblock');
      },
      get short() {
        return t('portraits.fromStatblockShort');
      },
      get title() {
        return t('best.fromStatblockHint');
      },
      run: (p) => (p ? reshapeFor(p.path, p.name) : reshapeNew()),
    },
  ],
  encounter: Difficulty,
  entryList: { spell: spellList },
  background: Background,
  paper: (card) => (isCharacter(card.stats) ? (PaperSheet as PaperView) : undefined),
  // The core's fantasy generators, shown as D&D's own.
  claims: ['names', 'npc', 'tavern', 'settlement'],
};
