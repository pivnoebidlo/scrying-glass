<!-- Боковая панель «Раздатки»: папки раздаточных материалов из хранилища. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Images, Scroll } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { imageGroups } from '../../portraits/library';
  import { allFiles, findFolder } from '../../../shared/vault';
  import { ui } from './ui.svelte';

  let { app }: ModuleProps<'handouts'> = $props();
  // Картинки и записки в каждой папке раздатки.
  const groups = $derived(
    app.vault.tree
      ? imageGroups(app.vault.tree, app.vault.name, 'handouts', app.adventures).map((g) => {
          const f = findFolder(app.vault.tree!, g.key);
          return { ...g, items: [...g.items, ...(f ? allFiles(f, 'note') : [])] };
        })
      : []
  );
  const total = $derived(groups.reduce((n, g) => n + g.items.length, 0));
</script>

<div class="list">
  <button class="item" data-nav class:active={ui.group === 'all'} onclick={() => (ui.group = 'all')}>
    <Images size={14} />
    <span class="name">{t('handouts.all')}</span>
    <span class="count">{total}</span>
  </button>
  {#each groups as g (g.key)}
    <button class="item" data-nav class:active={ui.group === g.key} title={g.key} onclick={() => (ui.group = g.key)}>
      <Scroll size={14} />
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
