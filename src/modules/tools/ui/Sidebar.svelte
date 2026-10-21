<!-- Боковая панель «Инструментов»: сами инструменты и, для записок, быстрый список записок приключения. -->
<script lang="ts">
  import { unread } from '../../telegram/ui/tg.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Beer, CalendarClock, Rat, Calculator, Castle, Footprints, DoorOpen, Sparkles, Store, CloudSun, Gem, Signpost, UserRound, FileText, Gauge, Hourglass, ScrollText, Send, Signature } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { noteTitle } from '../../../shared/notes';
  import { noteGroups } from './library';
  import { pickTool, ui } from './ui.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { familyOf, isDnd } from '../../../systems';

  let { app }: ModuleProps<'tools'> = $props();
  // The mouse generator — only in Mausritter adventures.
  const maus = $derived(familyOf(currentSystem(app.adventures)) === 'mausritter');
  // Инструменты D&D (сложность боя, покупка характеристик) — только в приключениях D&D.
  const dnd = $derived(isDnd(currentSystem(app.adventures)));
  const notes = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures).flatMap((g) => g.items) : []);
</script>

<div class="list">
  <button class="item" data-nav class:active={ui.tool === 'notes' && !ui.note} onclick={() => pickTool('notes')}>
    <ScrollText size={14} />
    <span class="name">{t('tools.side.notes')}</span>
    <span class="count">{notes.length}</span>
  </button>
  {#each ui.tool === 'notes' && ui.folded !== 'notes' ? notes : [] as f (f.path)}
    <button class="item sub" data-nav data-depth="1" class:active={ui.note === f.path} title={f.path} onclick={() => ((ui.tool = 'notes'), (ui.note = f.path))}>
      <FileText size={13} />
      <span class="name">{noteTitle(f.path)}</span>
    </button>
  {/each}
  <button class="item" data-nav class:active={ui.tool === 'names'} onclick={() => pickTool('names')}>
    <Signature size={14} />
    <span class="name">{t('tools.side.names')}</span>
  </button>
  {#if maus}
    <button class="item" data-nav class:active={ui.tool === 'mouse'} onclick={() => pickTool('mouse')}>
      <Rat size={14} />
      <span class="name">{t('tools.side.mouse')}</span>
    </button>
  {/if}
  <button class="item" data-nav class:active={ui.tool === 'npc'} onclick={() => pickTool('npc')}>
    <UserRound size={14} />
    <span class="name">{t('tools.side.npc')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'tavern'} onclick={() => pickTool('tavern')}>
    <Beer size={14} />
    <span class="name">{t('tools.side.tavern')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'settlement'} onclick={() => pickTool('settlement')}>
    <Castle size={14} />
    <span class="name">{t('tools.side.settlement')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'shop'} onclick={() => pickTool('shop')}>
    <Store size={14} />
    <span class="name">{t('tools.side.shop')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'relic'} onclick={() => pickTool('relic')}>
    <Sparkles size={14} />
    <span class="name">{t('tools.side.relic')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'dungeon'} onclick={() => pickTool('dungeon')}>
    <DoorOpen size={14} />
    <span class="name">{t('tools.side.dungeon')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'weather'} onclick={() => pickTool('weather')}>
    <CloudSun size={14} />
    <span class="name">{t('tools.side.weather')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'events'} onclick={() => pickTool('events')}>
    <Signpost size={14} />
    <span class="name">{t('tools.side.events')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'treasure'} onclick={() => pickTool('treasure')}>
    <Gem size={14} />
    <span class="name">{t('tools.side.treasure')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'schedule'} onclick={() => pickTool('schedule')}>
    <CalendarClock size={14} />
    <span class="name">{t('tools.side.schedule')}</span>
  </button>
  <button class="item" data-nav class:active={ui.tool === 'telegram'} onclick={() => pickTool('telegram')}>
    <Send size={14} />
    <span class="name">{t('tg.compose')}</span>
    {#if unread()}<span class="count unread">{unread()}</span>{/if}
  </button>
  {#if dnd}
    <button class="item" data-nav class:active={ui.tool === 'difficulty'} onclick={() => pickTool('difficulty')}>
      <Gauge size={14} />
      <span class="name">{t('tools.side.difficulty')}</span>
    </button>
  {/if}
  <button class="item" data-nav class:active={ui.tool === 'timer'} onclick={() => pickTool('timer')}>
    <Hourglass size={14} />
    <span class="name">{t('tools.side.timer')}</span>
    {#if app.timer.active}<span class="count">{t('tools.side.running')}</span>{/if}
  </button>
  {#if dnd}
    <button class="item" data-nav class:active={ui.tool === 'pointbuy'} onclick={() => pickTool('pointbuy')}>
      <Calculator size={14} />
      <span class="name">{t('tools.side.pointbuy')}</span>
    </button>
    <button class="item" data-nav class:active={ui.tool === 'travel'} onclick={() => pickTool('travel')}>
      <Footprints size={14} />
      <span class="name">{t('tools.side.travel')}</span>
    </button>
  {/if}
  <p class="faint more">{t('tools.side.more')}</p>
</div>

<style>
  .list {
    padding: 0 6px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .item.sub {
    padding-left: 24px;
  }
  .item:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .item.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    color: var(--text-faint);
    font-size: 12px;
  }
  .count.unread {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    text-align: center;
  }
  .more {
    padding: 10px 8px;
    font-size: 12px;
  }
</style>
