<!-- Боковая панель: папки приключений. -->
<script lang="ts">
  import { FolderPlus, Images, Folder, Upload } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { sections, ui } from './ui.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();
  const list = $derived(sections(ms));
</script>

<div class="list">
  <button class="item" class:active={ui.group === 'all'} onclick={() => (ui.group = 'all')}>
    <Images size={14} />
    <span class="name">Все портреты</span>
    <span class="count">{ms.library.length}</span>
  </button>
  {#each list as s (s.key)}
    <button class="item" class:active={ui.group === s.key} title={s.hint} onclick={() => (ui.group = s.key)}>
      {#if s.key === 'manual'}<Upload size={14} />{:else}<Folder size={14} />{/if}
      <span class="name">{s.title}</span>
      <span class="count">{s.items.length}</span>
    </button>
  {/each}
</div>

<div class="actions">
  <button class="btn" onclick={() => dispatch('portraits', 'addFolder')}>
    <FolderPlus size={14} /> Подключить папку…
  </button>
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
  .actions {
    padding: 10px 12px;
  }
  .actions .btn {
    width: 100%;
    justify-content: center;
  }
</style>
