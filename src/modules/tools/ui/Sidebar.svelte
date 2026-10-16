<!-- Боковая панель «Инструментов»: сами инструменты и, для записок, быстрый список записок приключения. -->
<script lang="ts">
  import { Calculator, Dices, FileText, Gauge, Hourglass, ScrollText, Table2 } from '@lucide/svelte';
  import { tables } from '../tables/store.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { noteTitle } from '../../../shared/notes';
  import { noteGroups } from './library';
  import { pickTool, ui } from './ui.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { isDnd } from '../../../systems';

  let { app }: ModuleProps<'tools'> = $props();
  // Инструменты D&D (сложность боя, покупка характеристик) — только в приключениях D&D.
  const dnd = $derived(isDnd(currentSystem(app.adventures)));
  const notes = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures).flatMap((g) => g.items) : []);
</script>

<div class="list">
  <button class="item" class:active={ui.tool === 'notes' && !ui.note} onclick={() => pickTool('notes')}>
    <ScrollText size={14} />
    <span class="name">Записки</span>
    <span class="count">{notes.length}</span>
  </button>
  {#each ui.tool === 'notes' && ui.folded !== 'notes' ? notes : [] as f (f.path)}
    <button class="item sub" class:active={ui.note === f.path} title={f.path} onclick={() => ((ui.tool = 'notes'), (ui.note = f.path))}>
      <FileText size={13} />
      <span class="name">{noteTitle(f.path)}</span>
    </button>
  {/each}
  <button class="item" class:active={ui.tool === 'tables' && !ui.table} onclick={() => pickTool('tables')}>
    <Dices size={14} />
    <span class="name">Таблицы случайностей</span>
    <span class="count">{tables.vault.length + tables.library.length || ''}</span>
  </button>
  {#if ui.tool === 'tables' && ui.folded !== 'tables'}
    {#each [...tables.vault, ...tables.library] as t (t.id)}
      <button class="item sub" class:active={ui.table === t.id} title={t.path} onclick={() => (ui.table = t.id)}>
        <Table2 size={13} />
        <span class="name">{t.table.title}</span>
      </button>
    {/each}
  {/if}
  {#if dnd}
    <button class="item" class:active={ui.tool === 'difficulty'} onclick={() => pickTool('difficulty')}>
      <Gauge size={14} />
      <span class="name">Сложность боя</span>
    </button>
  {/if}
  <button class="item" class:active={ui.tool === 'timer'} onclick={() => pickTool('timer')}>
    <Hourglass size={14} />
    <span class="name">Таймер</span>
    {#if app.timer.active}<span class="count">идёт</span>{/if}
  </button>
  {#if dnd}
    <button class="item" class:active={ui.tool === 'pointbuy'} onclick={() => pickTool('pointbuy')}>
      <Calculator size={14} />
      <span class="name">Покупка характеристик</span>
    </button>
  {/if}
  <p class="faint more">Здесь появятся и другие инструменты мастера.</p>
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
  .more {
    padding: 10px 8px;
    font-size: 12px;
  }
</style>
