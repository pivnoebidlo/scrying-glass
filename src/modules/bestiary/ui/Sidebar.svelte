<!-- Боковая панель бестиария: поиск, фильтры и список карточек. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search } from '@lucide/svelte';
  import { sameRef } from '../../../shared/cards';
  import { systems } from '../../../systems';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { bestiary, connectCards } from './cards.svelte';

  let {}: ModuleProps<'bestiary'> = $props();

  onMount(connectCards);

  const f = bestiary.filters;
  // Длинный список рисуем частями: сотни строк сразу заметно тормозят при наборе в поиске.
  const PAGE = 200;
  let limit = $state(PAGE);
  $effect(() => {
    void bestiary.visible;
    limit = PAGE;
  });
</script>

<div class="filters">
  <label class="search">
    <Search size={13} />
    <input type="text" placeholder="Поиск" bind:value={f.search} />
  </label>
  <select bind:value={f.system} title="Система">
    <option value="all">Все системы</option>
    {#each systems as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
  </select>
  <div class="row">
    <select bind:value={f.lang} title="Какую версию показывать, если карточка переведена">
      <option value="ru">Русский</option>
      <option value="en">English</option>
      <option value="all">Все версии</option>
    </select>
    <select bind:value={f.scope} title="Где лежат карточки">
      <option value="all">Везде</option>
      <option value="srd">SRD</option>
      <option value="library">Библиотека</option>
      <option value="vault">Кампания</option>
    </select>
  </div>
</div>

<div class="count faint">{bestiary.visible.length} {bestiary.visible.length === bestiary.all.length ? '' : `из ${bestiary.all.length}`}</div>

<div class="list">
  {#each bestiary.visible.slice(0, limit) as c (c.ref.scope + ':' + c.ref.id)}
    <button class="item" class:active={sameRef(c.ref, bestiary.selected)} onclick={() => bestiary.select(c.ref)}>
      <span class="name"
        >{c.name}{#if f.system === 'all'}<span class="tag">{c.system.replace(/^dnd5e-/, '')}</span>{/if}{#if f.lang === 'all'}<span
            class="tag">{c.lang}</span
          >{/if}</span
      >
      <span class="sub">{c.subtitle}</span>
    </button>
  {:else}
    <p class="faint empty">Ничего не нашлось.</p>
  {/each}
  {#if bestiary.visible.length > limit}
    <button class="btn more" onclick={() => (limit += PAGE)}>Показать ещё</button>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 8px 8px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    color: var(--text-faint);
  }
  .search:focus-within {
    border-color: var(--accent);
  }
  .search input {
    flex: 1;
    min-width: 0;
    padding: 5px 0;
    border: 0;
    background: none;
  }
  .search input:focus {
    outline: none;
  }
  .row {
    display: flex;
    gap: 6px;
  }
  .row select {
    flex: 1;
    min-width: 0;
  }
  .count {
    padding: 0 16px 4px;
    font-size: 11px;
  }
  .list {
    padding: 0 6px 8px;
  }
  .item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 4px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.active {
    background: var(--bg-active);
  }
  .name,
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    color: var(--text-faint);
    font-size: 11px;
  }
  .tag {
    margin-left: 6px;
    color: var(--text-faint);
    font-size: 10px;
    text-transform: uppercase;
  }
  .empty {
    padding: 0 8px;
  }
  .more {
    width: 100%;
    justify-content: center;
    margin-top: 6px;
  }
</style>
