<!-- Боковая панель бестиария: поиск, фильтры и список карточек. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import { Download, FilePlus, Plus, Search, Upload, Wand2 } from '@lucide/svelte';
  import { reshapeNew } from '../../tools/reshape/store.svelte';
  import { langName, sameRef } from '../../../shared/cards';
  import { familyOf, isDnd, isEnabled, systems } from '../../../systems';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dirname, roleFolders } from '../../../shared/vault';
  import { adventureHidden, adventureOf, currentSystem, inCurrentFamily, placeTitle, visibleIn } from '../../../shared/adventures';
  import { bestiary, connectCards } from './cards.svelte';

  let { app }: ModuleProps<'bestiary'> = $props();

  // Папки бестиария хранилища: для фильтра и подписей.
  // Папки, где лежат карточки хранилища: бестиарий и персонажи.
  const folders = $derived(
    (app.vault.tree
      ? (['bestiary', 'characters', 'party'] as const).flatMap((role) => roleFolders(app.vault.tree!, role, app.vault.name))
      : []
    )
      .filter((f) => visibleIn(app.adventures, f.folder.path))
      .map((f) => ({ ...f, title: `${placeTitle(app.adventures, dirname(f.folder.path), app.vault.name)} / ${f.folder.name}` }))
  );
  const folderTitle = (path: string) => folders.find((f) => f.folder.path === path)?.title ?? path;

  onMount(connectCards);

  // Карточки — только системы приключения; выбирать можно редакцию внутри семейства (D&D 2014 / 2024).
  // Счётчик «из N» — без карточек скрытых приключений (их система отключена).
  const inFamily = $derived(
    bestiary.all.filter((c) => inCurrentFamily(app.adventures, c.system) && (c.ref.scope !== 'vault' || c.folder === undefined || !adventureHidden(app.adventures, adventureOf(app.adventures, c.folder)))).length
  );
  const editions = $derived(
    (app.vault.systemsOff, systems.filter((s) => s.family === familyOf(currentSystem(app.adventures)) && isEnabled(s.id)))
  );

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
      <input type="text" placeholder={t('best.search')} bind:value={f.search} />
    </label>
    <div class="new">
      <button class="icon-btn" title={t('best.menuHint')} onclick={() => (menu = !menu)}><Plus size={16} /></button>
      {#if menu}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="menu-backdrop" onclick={() => (menu = false)}></div>
        <div class="menu">
          <button onclick={create}><FilePlus size={14} /> {t('best.newCardMenu')}</button>
          <!-- A stat block made from another one (Tools → Reshape a stat block) — in D&D adventures. -->
          {#if isDnd(currentSystem(app.adventures))}
            <button title={t('best.fromStatblockHint')} onclick={() => ((menu = false), reshapeNew())}><Wand2 size={14} /> {t('best.fromStatblock')}</button>
          {/if}
          <div class="sep"></div>
          <button onclick={importCards}><Download size={14} /> {t('best.importFile')}</button>
          <button onclick={exportCards}><Upload size={14} /> {t('best.exportFile')}</button>
        </div>
      {/if}
    </div>
  </div>
  <!-- Система и место — на всю ширину (длинные подписи: «D&D 5e (2014)», «· Глава 1 / monsters»), вид и язык — парой. -->
  {#if editions.length > 1}
    <select
      value={editions.some((s) => s.id === f.system) ? f.system : 'all'}
      onchange={(e) => (f.system = e.currentTarget.value)}
      title={t('best.editionHint')}
    >
      <option value="all">{t('best.allEditions')}</option>
      {#each editions as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
    </select>
  {/if}
  <div class="row">
    <select bind:value={f.kind} title={t('best.kindHint')}>
      <option value="all">{t('best.allKinds')}</option>
      <option value="monster">{t('best.monsters')}</option>
      <option value="npc">NPC</option>
      <option value="character">{t('best.party')}</option>
    </select>
    <select value={bestiary.lang} onchange={(e) => (f.lang = e.currentTarget.value)} title={t('best.langHint')}>
      {#each bestiary.langs as l (l)}<option value={l}>{langName(l)}</option>{/each}
      {#if !bestiary.langs.includes(bestiary.lang) && bestiary.lang !== 'all'}<option value={bestiary.lang}>{langName(bestiary.lang)}</option>{/if}
      <option value="all">{t('best.allVersions')}</option>
    </select>
  </div>
  <select bind:value={f.scope} title={t('best.scopeHint')}>
    <option value="all">{t('best.everywhere')}</option>
    {#if isDnd(currentSystem(app.adventures)) || f.scope === 'srd'}<option value="srd">SRD</option>{/if}
    <option value="library">{t('best.libraryShort')}</option>
    <option value="vault">{t('best.vault')}</option>
    {#each folders as fl (fl.folder.path)}<option value="vault:{fl.folder.path}">· {fl.title}</option>{/each}
  </select>
</div>

{#if status}<div class="status">{status}</div>{/if}
<div class="count faint">{bestiary.visible.length} {bestiary.visible.length === inFamily ? '' : t('best.ofTotal', { total: inFamily })}</div>

<div class="list">
  {#each bestiary.visible.slice(0, limit) as c (c.ref.scope + ':' + c.ref.id)}
    <button class="item" data-nav class:active={sameRef(c.ref, bestiary.selected)} onclick={() => bestiary.select(c.ref)}>
      <span class="name"
        >{c.name}{#if editions.length > 1 && !editions.some((s) => s.id === f.system)}<span class="tag">{c.system.replace(/^dnd5e-/, '')}</span>{/if}{#if bestiary.lang === 'all'}<span
            class="tag">{c.lang}</span
          >{/if}{#if c.edited}<span class="tag" title={t('best.editedHint')}>{t('best.edited')}</span>{/if}</span
      >
      <span class="sub">{c.subtitle}{#if c.folder !== undefined && !f.scope.startsWith('vault:')} · {folderTitle(c.folder)}{/if}</span>
    </button>
  {:else}
    <p class="faint empty">{t('best.nothing')}</p>
  {/each}
  {#if bestiary.visible.length > limit}
    <button class="btn more" onclick={() => (limit += PAGE)}>{t('best.more')}</button>
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
  .filters > select {
    width: 100%;
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
