<!-- Боковая панель: сцены по порядку. Порядок меняется перетаскиванием. -->
<script lang="ts">
  import { Clapperboard, GripVertical, Play, Plus } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { activate } from '../apply';
  import { saveCurrent, ui } from './ui.svelte';
  import { scenesFor } from '../types';

  let { ms, app }: ModuleProps<'scenes'> = $props();

  // Сцены текущего приключения и общие.
  const list = $derived(scenesFor(ms, app.adventures));

  let dragged = $state<string | null>(null);
  let over = $state<number | null>(null);

  // Бросили перед сценой с номером index в показанном списке.
  function drop(index: number) {
    if (dragged) dispatch('scenes', 'move', { id: dragged, before: list[index]?.id ?? null });
    dragged = null;
    over = null;
  }
</script>

<div class="list">
  {#each list as sc, i (sc.id)}
    <div
      class="item"
      class:active={ui.selected === sc.id}
      class:live={ms.active === sc.id}
      class:over-top={over === i}
      draggable="true"
      role="listitem"
      ondragstart={() => (dragged = sc.id)}
      ondragend={() => ((dragged = null), (over = null))}
      ondragover={(e) => { e.preventDefault(); over = i; }}
      ondrop={() => drop(i)}
    >
      <span class="grip faint"><GripVertical size={12} /></span>
      <button class="main" onclick={() => { ui.selected = sc.id; openTab('scenes'); }}>
        <span class="num faint">{i < 9 ? i + 1 : ''}</span>
        <span class="name">{sc.name}</span>
      </button>
      <button class="icon-btn play" title="Включить сцену" onclick={() => activate(app, sc)}><Play size={13} /></button>
    </div>
  {/each}
  {#if list.length}
    <!-- Место в конце списка, чтобы можно было перетащить сцену последней. -->
    <div
      class="tail"
      class:over-top={over === list.length}
      role="listitem"
      ondragover={(e) => { e.preventDefault(); over = list.length; }}
      ondrop={() => drop(list.length)}
    ></div>
  {:else}
    <p class="faint hint">
      <Clapperboard size={12} /> Сцена — это набор фона, карты, портретов, музыки и атмосферы. Настройте экран игроков и
      сохраните его сценой, чтобы потом включать одной кнопкой.
    </p>
  {/if}
</div>

<div class="actions">
  <button class="btn" onclick={saveCurrent}><Plus size={14} /> Сохранить текущее</button>
</div>

<style>
  .list {
    padding: 0 6px;
  }
  .item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
    border-top: 2px solid transparent;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.active {
    background: var(--bg-active);
  }
  .item.live .name {
    color: var(--accent);
  }
  .over-top {
    border-top-color: var(--accent) !important;
  }
  .tail {
    height: 12px;
    border-top: 2px solid transparent;
  }
  .grip {
    display: inline-flex;
    padding-left: 2px;
    cursor: grab;
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 6px;
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
  .num {
    width: 12px;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .play {
    width: 24px;
    height: 24px;
    opacity: 0;
  }
  .item:hover .play {
    opacity: 1;
  }
  .hint {
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  .actions {
    padding: 10px 12px;
  }
  .actions .btn {
    width: 100%;
    justify-content: center;
  }
</style>
