<!-- Боковая панель справочника: поиск, тип записей, список; «+» — новая запись (какого типа и где). -->
<script lang="ts">
  import { Plus, Search, Shapes } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { blankEntry, entrySubtitle, serializeEntry } from '../../../shared/compendium';
  import { customTypes, typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { LIBRARY } from '../../../shared/vault';
  import { allEntries, book, EDITIONS, entriesFolder, loadEntries, search, setEdition, srd, srdHere, typesHere, type Edition } from './store.svelte';
  import { openEntry, ui } from './ui.svelte';

  let { app }: ModuleProps<'compendium'> = $props();

  const tree = $derived(app.vault.tree);
  const adv = $derived(app.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void book.rev;
    loadEntries();
  });

  const all = $derived((book.vault, book.library, book.builtin, srd.edition, allEntries()));
  // Типы, которые есть среди записей (встроенные — всегда, в порядке описания), со счётчиками.
  const types = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const e of all) counts.set(e.entry.type, (counts.get(e.entry.type) ?? 0) + 1);
    void customTypes.list;
    const ids = [...new Set([...typesHere().map((t) => t.id), ...counts.keys()])];
    return ids.map((id) => ({ id, title: typeDef(id).plural, n: counts.get(id) ?? 0 }));
  });
  const shown = $derived(search(ui.type === 'all' ? all : all.filter((e) => e.entry.type === ui.type), ui.query));

  // Новая запись: тип и место.
  let creating = $state(false);
  let newType = $state('note');
  let place = $state<string | null>(null);
  const places = $derived([
    ...(app.adventures.current ? [{ id: app.adventures.current as string | null, title: app.adventures.current }] : []),
    { id: null, title: 'Общее (вне приключений)' },
    { id: LIBRARY as string | null, title: 'Библиотека — для всех кампаний' },
  ]);

  function startCreate() {
    newType = ui.type !== 'all' ? ui.type : 'note';
    place = app.adventures.current ?? null;
    creating = !creating;
  }

  async function create() {
    const def = typeDef(newType);
    const path = await window.api.createEntry(entriesFolder(place), `Новая запись (${def.title.toLowerCase()})`, serializeEntry(blankEntry(newType), def));
    creating = false;
    if (!path) return;
    openEntry(path);
    ui.editing = true;
  }
</script>

<div class="panel">
  <div class="top">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск: название, метки, текст" bind:value={ui.query} />
    </label>
    <button class="icon-btn" title="Новая запись" onclick={startCreate}><Plus size={16} /></button>
    <button class="icon-btn" class:on={ui.page === 'types'} title="Типы записей: свои типы и их поля" onclick={() => (ui.page = ui.page === 'types' ? 'entry' : 'types')}><Shapes size={15} /></button>
  </div>

  {#if creating}
    <div class="create">
      <label>Тип
        <select bind:value={newType}>{#each typesHere() as t (t.id)}<option value={t.id}>{t.def.title}</option>{/each}</select>
      </label>
      <label>Где
        <select bind:value={place}>{#each places as p (p.id ?? '')}<option value={p.id}>{p.title}</option>{/each}</select>
      </label>
      <button class="btn primary" onclick={create}>Создать</button>
    </div>
  {/if}

  {#if srdHere()}
    <select class="edition" title="Встроенные записи (SRD в переводе OmnisGM)" value={srd.edition} onchange={(e) => setEdition(e.currentTarget.value as Edition)}>
      {#each EDITIONS as ed (ed.id)}<option value={ed.id}>{ed.title}</option>{/each}
    </select>
  {/if}

  <div class="types">
    <button class:active={ui.type === 'all'} onclick={() => (ui.type = 'all')}>Все <span>{all.length}</span></button>
    {#each types as t (t.id)}
      <button class:active={ui.type === t.id} onclick={() => (ui.type = t.id)}>{t.title} <span>{t.n || ''}</span></button>
    {/each}
  </div>

  <div class="count faint">{shown.length} из {all.length}</div>
  <ul class="list">
    {#each shown.slice(0, 500) as e (e.path)}
      <li>
        <button class:active={ui.open === e.path} title={e.path} onclick={() => openEntry(e.path)}>
          <span class="t">{e.entry.title}</span>
          <span class="s">{entrySubtitle(e.entry, typeDef(e.entry.type))} · {e.group}</span>
        </button>
      </li>
    {/each}
  </ul>
  {#if !all.length && book.loaded}
    <p class="faint empty">Записей пока нет. «+» — новая запись: заклинание, предмет, черта, правило или заметка.</p>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 8px;
  }
  .top {
    display: flex;
    gap: 4px;
  }
  .icon-btn.on {
    color: var(--accent);
  }
  .search {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
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
  .create {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    font-size: 13px;
  }
  .create label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--text-muted);
  }
  .edition {
    font-size: 12px;
  }
  .types {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .types button {
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .types button.active {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .types span {
    color: var(--text-faint);
  }
  .count {
    font-size: 12px;
  }
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list button {
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
  .list button:hover {
    background: var(--bg-hover);
  }
  .list button.active {
    background: var(--bg-active);
  }
  .t {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .s {
    overflow: hidden;
    color: var(--text-faint);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    font-size: 13px;
  }
</style>
