<!-- Боковая панель: папки персонажей из хранилища. -->
<script lang="ts">
  import { Images, Users } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { characterGroups } from '../library';
  import { ui } from './ui.svelte';

  let { app }: ModuleProps<'portraits'> = $props();
  const groups = $derived(app.vault.tree ? characterGroups(app.vault.tree, app.vault.name) : []);
  const total = $derived(groups.reduce((n, g) => n + g.items.length, 0));
</script>

<div class="list">
  <button class="item" class:active={ui.group === 'all'} onclick={() => (ui.group = 'all')}>
    <Images size={14} />
    <span class="name">Все портреты</span>
    <span class="count">{total}</span>
  </button>
  {#each groups as g (g.key)}
    <button class="item" class:active={ui.group === g.key} title={g.key} onclick={() => (ui.group = g.key)}>
      <Users size={14} />
      <span class="name">{g.title}</span>
      <span class="count">{g.items.length}</span>
    </button>
  {/each}
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
</style>
