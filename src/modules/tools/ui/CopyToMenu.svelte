<!-- Кнопка с выбором места: приключения, «Общее» (вне приключений) и, если library, библиотека — общая для всех
     кампаний (место — LIBRARY). Одно-единственное место выбирается сразу, без списка. -->
<script lang="ts">
  import { FilePlus2 } from '@lucide/svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { LIBRARY } from '../../../shared/vault';
  import { shownAdventures } from '../../../shared/adventures';

  let {
    label = 'Копия в…',
    title,
    library = false,
    primary = false,
    onpick,
  }: { label?: string; title: string; library?: boolean; primary?: boolean; onpick: (place: string | null) => void } = $props();

  const places = $derived([
    ...shownAdventures(store.state.adventures).map((a) => ({ id: a as string | null, title: a })),
    { id: null, title: 'Общее (вне приключений)' },
    ...(library ? [{ id: LIBRARY as string | null, title: 'Библиотека — для всех кампаний' }] : []),
  ]);
  let open = $state(false);

  function pick(id: string | null) {
    open = false;
    onpick(id);
  }
</script>

<svelte:window onclick={(e) => open && !(e.target as HTMLElement).closest('.copy-to') && (open = false)} />

<div class="copy-to">
  <button class="btn" class:primary {title} onclick={() => (places.length > 1 ? (open = !open) : pick(null))}><FilePlus2 size={14} /> {label}</button>
  {#if open}
    <ul class="menu" role="menu">
      {#each places as p (p.id ?? '')}
        <li><button role="menuitem" onclick={() => pick(p.id)}>{p.title}{p.id === store.state.adventures.current ? ' · текущее' : ''}</button></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .copy-to {
    position: relative;
  }
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 20;
    min-width: 220px;
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .menu button {
    width: 100%;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--bg-hover);
  }
</style>
