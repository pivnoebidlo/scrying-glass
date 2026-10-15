<!-- Правая панель: сцены одной кнопкой (⌘1…⌘9 — первые девять). -->
<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { activate } from '../apply';
  import { saveCurrent } from './ui.svelte';
  import { scenesFor } from '../types';

  let { ms, app }: ModuleProps<'scenes'> = $props();
  const list = $derived(scenesFor(ms, app.adventures));
  const mod = navigator.platform.startsWith('Mac') ? '⌘' : 'Ctrl+';
</script>

<div class="scenes">
  {#each list as sc, i (sc.id)}
    <div class="scene" class:live={ms.active === sc.id}>
      <button class="main" title={i < 9 ? `${sc.name} (${mod}${i + 1})` : sc.name} onclick={() => activate(app, sc)}>
        {#if i < 9}<span class="key">{i + 1}</span>{/if}
        <span class="name">{sc.name}</span>
      </button>
      {#if ms.active === sc.id}
        <!-- Экран не меняется: в панели снова подборка приключения (например, чтобы собрать следующую сцену). -->
        <button class="leave" title="Выйти из сцены: на экране всё остаётся, в панели — подборка приключения" onclick={() => dispatch('scenes', 'markActive', { id: null })}><X size={11} /></button>
      {/if}
    </div>
  {/each}
  <button class="scene add" title="Сохранить то, что сейчас на экране, новой сценой" onclick={saveCurrent}>
    <Plus size={13} />{#if !list.length}<span class="name">Сохранить текущее</span>{/if}
  </button>
</div>

<style>
  .scenes {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .scene {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-hover);
    cursor: pointer;
  }
  .scene:hover {
    border-color: var(--accent);
  }
  .scene.live {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .scene:has(.main) {
    padding: 0;
  }
  .main {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px 8px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .leave {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    margin-right: 3px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .leave:hover {
    color: var(--text-normal);
    background: var(--bg-hover);
  }
  .key {
    color: var(--text-faint);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .add {
    color: var(--text-muted);
    border-style: dashed;
    background: none;
  }
</style>
