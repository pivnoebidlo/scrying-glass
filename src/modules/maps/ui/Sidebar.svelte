<!-- Боковая панель: карты, сгруппированные по месту в хранилище. -->
<script lang="ts">
  import { Eye, Map } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { mapGroups, mapName } from '../library';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'maps'> = $props();
  const groups = $derived(app.vault.tree ? mapGroups(app.vault.tree, app.vault.name, ms, app.adventures) : []);

  function select(path: string) {
    ui.selected = path;
    openTab('maps');
  }
</script>

<div class="list">
  {#each groups as g (g.key)}
    <div class="group faint" title={g.key}>{g.title}</div>
    {#each g.items as p (p)}
      <div class="item" class:active={ui.selected === p} class:shown={ms.current === p}>
        <button class="main" title={p} onclick={() => select(p)}>
          <Map size={14} />
          <span class="name">{mapName(p)}</span>
        </button>
        <button
          class="icon-btn show"
          class:active={ms.current === p}
          title={ms.current === p ? 'Убрать у игроков' : 'Показать игрокам'}
          onclick={() => dispatch('maps', ms.current === p ? 'clear' : 'show', { path: p })}
        >
          <Eye size={13} />
        </button>
      </div>
    {/each}
  {:else}
    <p class="faint hint">
      Карт пока нет. Положите картинки в папку <code>maps</code> или <code>карты</code> — они появятся здесь.
    </p>
  {/each}
</div>

<style>
  .list {
    padding: 0 6px 10px;
  }
  .group {
    padding: 10px 8px 4px;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.active {
    background: var(--bg-active);
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border: 0;
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .item:hover .main,
  .item.active .main {
    color: var(--text-normal);
  }
  .item.shown .main {
    color: var(--accent);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .show {
    width: 24px;
    height: 24px;
    opacity: 0;
  }
  .item:hover .show,
  .show.active {
    opacity: 1;
  }
  .hint {
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  code {
    padding: 0 3px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
