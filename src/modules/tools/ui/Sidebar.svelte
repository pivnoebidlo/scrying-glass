<!-- Боковая панель «Инструментов»: сами инструменты и, для записок, быстрый список записок приключения. -->
<script lang="ts">
  import { Dices, FileText, ScrollText, Table2 } from '@lucide/svelte';
  import { BUILTIN, tables } from '../tables/store.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { noteTitle } from '../../../shared/notes';
  import { noteGroups } from './library';
  import { ui } from './ui.svelte';

  let { app }: ModuleProps<'tools'> = $props();
  const notes = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures).flatMap((g) => g.items) : []);
</script>

<div class="list">
  <button class="item" class:active={ui.tool === 'notes' && !ui.note} onclick={() => ((ui.tool = 'notes'), (ui.note = null))}>
    <ScrollText size={14} />
    <span class="name">Записки</span>
    <span class="count">{notes.length}</span>
  </button>
  {#each ui.tool === 'notes' ? notes : [] as f (f.path)}
    <button class="item sub" class:active={ui.note === f.path} title={f.path} onclick={() => ((ui.tool = 'notes'), (ui.note = f.path))}>
      <FileText size={13} />
      <span class="name">{noteTitle(f.path)}</span>
    </button>
  {/each}
  <button class="item" class:active={ui.tool === 'tables' && !ui.table} onclick={() => ((ui.tool = 'tables'), (ui.table = null))}>
    <Dices size={14} />
    <span class="name">Таблицы случайностей</span>
    <span class="count">{tables.vault.length + BUILTIN.length}</span>
  </button>
  {#if ui.tool === 'tables'}
    {#each [...tables.vault, ...BUILTIN] as t (t.id)}
      <button class="item sub" class:active={ui.table === t.id} title={t.path ?? 'встроенная'} onclick={() => (ui.table = t.id)}>
        <Table2 size={13} />
        <span class="name">{t.table.title}</span>
      </button>
    {/each}
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
