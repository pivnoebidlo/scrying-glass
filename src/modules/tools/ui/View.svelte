<!-- Вкладка «Инструменты»: открытый инструмент. Записки — список записок приключения или редактор одной. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { FilePlus2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { connectNotes, createNote } from '../../../renderer/lib/note/notes.svelte';
  import NoteCard from './NoteCard.svelte';
  import NoteEditor from './NoteEditor.svelte';
  import { noteGroups } from './library';
  import { ui } from './ui.svelte';
  import Calculator from '../difficulty/Calculator.svelte';
  import TimerTool from '../../timer/ui/TimerTool.svelte';
  import PointBuy from '../pointbuy/PointBuy.svelte';
  import Reshape from '../reshape/Reshape.svelte';
  import NameGenerator from '../names/NameGenerator.svelte';
  import TavernGenerator from '../tavern/TavernGenerator.svelte';
  import NpcGenerator from '../npc/NpcGenerator.svelte';
  import MouseGenerator from '../mouse/MouseGenerator.svelte';
  import MausTables from '../maus/MausTables.svelte';
  import Factions from '../../mausritter/ui/Factions.svelte';
  import WeatherGenerator from '../weather/WeatherGenerator.svelte';
  import EventsGenerator from '../events/EventsGenerator.svelte';
  import TreasureGenerator from '../treasure/TreasureGenerator.svelte';
  import SettlementGenerator from '../settlement/SettlementGenerator.svelte';
  import ShopGenerator from '../shop/ShopGenerator.svelte';
  import RelicGenerator from '../relic/RelicGenerator.svelte';
  import DungeonGenerator from '../dungeon/DungeonGenerator.svelte';
  import TravelCalculator from '../travel/TravelCalculator.svelte';
  import WildMagic from '../wildmagic/WildMagic.svelte';
  import SchedulePage from '../../schedule/ui/SchedulePage.svelte';
  import TelegramCompose from '../../telegram/ui/Compose.svelte';

  import { currentSystem } from '../../../shared/adventures';
  import { familyOf } from '../../../systems';
  import { shown } from './registry.svelte';
  import type { Component } from 'svelte';

  let { app }: ModuleProps<'tools'> = $props();
  const family = $derived(familyOf(currentSystem(app.adventures)));
  // The page of each tool; a tool hidden in this system (another system's, not turned on) — the notes instead.
  const PAGES: Partial<Record<string, Component>> = {
    schedule: SchedulePage, names: NameGenerator, travel: TravelCalculator, dungeon: DungeonGenerator, relic: RelicGenerator,
    shop: ShopGenerator, settlement: SettlementGenerator, treasure: TreasureGenerator, events: EventsGenerator,
    weather: WeatherGenerator, mouse: MouseGenerator, mausTables: MausTables, factions: Factions, npc: NpcGenerator,
    tavern: TavernGenerator, telegram: TelegramCompose, difficulty: Calculator, timer: TimerTool, pointbuy: PointBuy, reshape: Reshape,
    wildMagic: WildMagic,
  };
  const Page = $derived(ui.tool !== 'notes' && shown(ui.tool, family) ? PAGES[ui.tool] : undefined);

  connectNotes();
  const groups = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures) : []);
  // Открытая записка пропала (удалили, переименовали снаружи) — возвращаемся к списку.
  const exists = $derived(!ui.note || groups.some((g) => g.items.some((f) => f.path === ui.note)));

  async function create() {
    const path = await createNote(app.vault.tree, app.adventures);
    if (path) ui.note = path;
  }
</script>

{#if Page}
  <Page />
{:else if ui.note && exists}
  {#key ui.note}<NoteEditor path={ui.note} />{/key}
{:else}
  <div class="view">
    <header class="head">
      <h2>{t('tools.notes.title')}</h2>
      <div class="spacer"></div>
      <button class="btn primary" onclick={create}><FilePlus2 size={14} /> {t('tools.notes.new')}</button>
    </header>
    <p class="faint intro">
      {t('tools.notes.about1')} <RoleFolderNames role="handouts" /> {t('tools.notes.about2')}
    </p>

    {#each groups as g (g.key)}
      <section>
        <h3>{g.title} <span class="faint">{g.items.length}</span></h3>
        <div class="grid">
          {#each g.items as f (f.path)}<NoteCard path={f.path} onopen={() => (ui.note = f.path)} />{/each}
        </div>
      </section>
    {:else}
      <p class="faint empty">{t('tools.notes.none')}</p>
    {/each}
  </div>
{/if}

<style>
  .view {
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .intro {
    max-width: 640px;
    margin: 8px 0 16px;
  }
  h3 {
    margin: 16px 0 10px;
    font-size: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
  .empty {
    padding: 30px 0;
  }
</style>
