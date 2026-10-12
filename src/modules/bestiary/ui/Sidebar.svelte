<!-- Боковая панель бестиария: поиск, фильтры и список карточек. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Download, FilePlus, Plus, Search, Upload } from '@lucide/svelte';
  import { langName, sameRef } from '../../../shared/cards';
  import { systems } from '../../../systems';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { roleFolders } from '../../../shared/vault';
  import { bestiary, connectCards } from './cards.svelte';

  let { app }: ModuleProps<'bestiary'> = $props();

  // Папки бестиария хранилища: для фильтра и подписей.
  const folders = $derived(app.vault.tree ? roleFolders(app.vault.tree, 'bestiary', app.vault.name) : []);
  const folderTitle = (path: string) => folders.find((f) => f.folder.path === path)?.title ?? path;

  onMount(connectCards);

  const f = bestiary.filters;
  // Длинный список рисуем частями: сотни строк сразу заметно тормозят при наборе в поиске.
  const PAGE = 200;
  let limit = $state(PAGE);
  let menu = $state(false);

  // Короткое сообщение под поиском: «Импортировано: 3».
  let status = $state('');
  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  function say(text: string) {
    status = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (status = ''), 4000);
  }

  async function importCards() {
    menu = false;
    const text = await bestiary.importFiles();
    if (text) say(text);
  }

  async function exportCards() {
    menu = false;
    const text = await bestiary.exportPlace(app.vault.name, folderTitle);
    if (text) say(text);
  }

  function create() {
    menu = false;
    if (bestiary.draft && !bestiary.cancel()) return;
    bestiary.create();
  }
  $effect(() => {
    void bestiary.visible;
    limit = PAGE;
  });
</script>

<div class="filters">
  <div class="top">
    <label class="search">
      <Search size={13} />
      <input type="text" placeholder="Поиск" bind:value={f.search} />
    </label>
    <div class="new">
      <button class="icon-btn" title="Новая карточка, импорт и экспорт" onclick={() => (menu = !menu)}><Plus size={16} /></button>
      {#if menu}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="menu-backdrop" onclick={() => (menu = false)}></div>
        <div class="menu">
          <button onclick={create}><FilePlus size={14} /> Новая карточка…</button>
          <div class="sep"></div>
          <button onclick={importCards}><Download size={14} /> Импорт из файла…</button>
          <button onclick={exportCards}><Upload size={14} /> Экспорт в файл…</button>
        </div>
      {/if}
    </div>
  </div>
  <select bind:value={f.system} title="Система">
    <option value="all">Все системы</option>
    {#each systems as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
  </select>
  <div class="row">
    <select bind:value={f.lang} title="Какую версию показывать, если карточка переведена">
      {#each bestiary.langs as l (l)}<option value={l}>{langName(l)}</option>{/each}
      {#if !bestiary.langs.includes(f.lang) && f.lang !== 'all'}<option value={f.lang}>{langName(f.lang)}</option>{/if}
      <option value="all">Все версии</option>
    </select>
    <select bind:value={f.scope} title="Где лежат карточки">
      <option value="all">Везде</option>
      <option value="srd">SRD</option>
      <option value="library">Библиотека</option>
      <option value="vault">Хранилище</option>
      {#each folders as fl (fl.folder.path)}<option value="vault:{fl.folder.path}">· {fl.title}</option>{/each}
    </select>
  </div>
</div>

{#if status}<div class="status">{status}</div>{/if}
<div class="count faint">{bestiary.visible.length} {bestiary.visible.length === bestiary.all.length ? '' : `из ${bestiary.all.length}`}</div>

<div class="list">
  {#each bestiary.visible.slice(0, limit) as c (c.ref.scope + ':' + c.ref.id)}
    <button class="item" class:active={sameRef(c.ref, bestiary.selected)} onclick={() => bestiary.select(c.ref)}>
      <span class="name"
        >{c.name}{#if f.system === 'all'}<span class="tag">{c.system.replace(/^dnd5e-/, '')}</span>{/if}{#if f.lang === 'all'}<span
            class="tag">{c.lang}</span
          >{/if}</span
      >
      <span class="sub">{c.subtitle}{#if c.folder !== undefined && !f.scope.startsWith('vault:')} · {folderTitle(c.folder)}{/if}</span>
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
  .top {
    display: flex;
    gap: 4px;
  }
  .new {
    position: relative;
  }
  .new .icon-btn {
    width: 30px;
    height: 30px;
  }
  .menu {
    position: absolute;
    top: 32px;
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    min-width: 230px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9;
  }
  .sep {
    height: 1px;
    margin: 4px 0;
    background: var(--border);
  }
  .status {
    margin: 0 8px 6px;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    background: var(--accent-soft);
    font-size: 12px;
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--bg-hover);
  }
  .search {
    flex: 1;
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
