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
  import NameGenerator from '../names/NameGenerator.svelte';
  import TavernGenerator from '../tavern/TavernGenerator.svelte';
  import NpcGenerator from '../npc/NpcGenerator.svelte';
  import WeatherGenerator from '../weather/WeatherGenerator.svelte';
  import EventsGenerator from '../events/EventsGenerator.svelte';
  import TreasureGenerator from '../treasure/TreasureGenerator.svelte';
  import SettlementGenerator from '../settlement/SettlementGenerator.svelte';
  import ShopGenerator from '../shop/ShopGenerator.svelte';
  import RelicGenerator from '../relic/RelicGenerator.svelte';
  import DungeonGenerator from '../dungeon/DungeonGenerator.svelte';
  import TravelCalculator from '../travel/TravelCalculator.svelte';
  import TelegramCompose from '../../telegram/ui/Compose.svelte';

  import { currentSystem } from '../../../shared/adventures';
  import { isDnd } from '../../../systems';

  let { app }: ModuleProps<'tools'> = $props();
  const dnd = $derived(isDnd(currentSystem(app.adventures)));

  connectNotes();
  const groups = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures) : []);
  // Открытая записка пропала (удалили, переименовали снаружи) — возвращаемся к списку.
  const exists = $derived(!ui.note || groups.some((g) => g.items.some((f) => f.path === ui.note)));

  async function create() {
    const path = await createNote(app.vault.tree, app.adventures);
    if (path) ui.note = path;
  }
</script>

{#if ui.tool === 'names'}
  <NameGenerator />
{:else if ui.tool === 'travel' && dnd}
  <TravelCalculator />
{:else if ui.tool === 'dungeon'}
  <DungeonGenerator />
{:else if ui.tool === 'relic'}
  <RelicGenerator />
{:else if ui.tool === 'shop'}
  <ShopGenerator />
{:else if ui.tool === 'settlement'}
  <SettlementGenerator />
{:else if ui.tool === 'treasure'}
  <TreasureGenerator />
{:else if ui.tool === 'events'}
  <EventsGenerator />
{:else if ui.tool === 'weather'}
  <WeatherGenerator />
{:else if ui.tool === 'npc'}
  <NpcGenerator />
{:else if ui.tool === 'tavern'}
  <TavernGenerator />
{:else if ui.tool === 'telegram'}
  <TelegramCompose />
{:else if ui.tool === 'difficulty' && dnd}
  <Calculator />
{:else if ui.tool === 'timer'}
  <TimerTool />
{:else if ui.tool === 'pointbuy' && dnd}
  <PointBuy />
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
