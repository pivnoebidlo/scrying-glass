<!-- Tools → Roll tables: every roll table seen here (the adventure's, the supplements it uses, shared, the library),
     each with its «Roll» right in the list — for the game; the one picked on the right, with its editor. A new table
     goes where the GM picks. Tables are compendium entries (shared/rolltable.ts), so the same ones are in the
     Compendium and on a supplement's page. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { onMount } from 'svelte';
  import { Dices, MoreHorizontal, Pencil, Plus, Search, Trash2 } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import { typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { isSupplement, shownAdventures } from '../../../shared/adventures';
  import { blankEntry, fieldText, searchKey, serializeEntry } from '../../../shared/compendium';
  import { parseRollTable, TABLE_TYPE } from '../../../shared/rolltable';
  import { LIBRARY } from '../../../shared/vault';
  import { allEntries, entriesFolder, entryAt, loadEntries, type EntryItem } from '../../compendium/ui/store.svelte';
  import EntryEditor from '../../compendium/ui/EntryEditor.svelte';
  import { ui as cmp } from '../../compendium/ui/ui.svelte';
  import { entryMenu, trashEntry } from '../../compendium/ui/menu.svelte';

  onMount(() => void loadEntries());

  const ms = $derived(store.state.adventures);
  let query = $state('');
  const tables = $derived(allEntries().filter((e) => e.entry.type === TABLE_TYPE));
  const shown = $derived(query.trim() ? tables.filter((e) => searchKey(e.entry.title).includes(searchKey(query.trim()))) : tables);
  const groups = $derived.by(() => {
    const by = new Map<string, EntryItem[]>();
    for (const e of shown) by.set(e.group, [...(by.get(e.group) ?? []), e]);
    return [...by].map(([title, list]) => ({ title, list }));
  });

  // The one picked: the compendium's open entry (it follows a rename), when it is a table.
  const picked = $derived(cmp.open ? entryAt(cmp.open) : undefined);
  const item = $derived(picked?.entry.type === TABLE_TYPE ? picked : undefined);
  const pick = (path: string, edit = false) => ((cmp.open = path), (cmp.editing = edit));

  function roll(e: EntryItem) {
    const table = parseRollTable(e.entry.body, fieldText(e.entry.fields['roll'] ?? ''));
    if (table) rolls.table({ title: e.entry.title, path: e.path, table });
  }

  // Where a new table goes: this adventure, a supplement, shared, the library.
  const places = $derived([
    ...(ms.current ? [{ id: ms.current as string | null, title: ms.current }] : []),
    ...shownAdventures(ms)
      .filter((a) => isSupplement(ms, a) && a !== ms.current)
      .map((a) => ({ id: a as string | null, title: a })),
    { id: null, title: t('cmpui.shared') },
    { id: LIBRARY as string | null, title: t('cmpui.libraryAll') },
  ]);
  let place = $state<string | null>(store.state.adventures.current ?? null);
  async function create() {
    const def = typeDef(TABLE_TYPE);
    const path = await window.api.createEntry(entriesFolder(place), t('cmpui.newEntryName', { type: def.title.toLowerCase() }), serializeEntry(blankEntry(TABLE_TYPE), def));
    if (path) pick(path, true);
  }

  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const rowMenu = (ev: MouseEvent, e: EntryItem) => (pick(e.path), (menu = { ...menuAt(ev), items: entryMenu(e, (p, edit) => pick(p, edit)) }));
</script>

<div class="page">
  <nav class="list">
    <h2>{t('tools.side.rollTables')}</h2>
    <p class="faint about"><Lead text={t('rt.about')} /></p>
    <label class="search"><Search size={13} /><input type="text" bind:value={query} placeholder={t('rt.search')} /></label>
    <div class="new">
      <select bind:value={place} title={t('cmpui.where')}>{#each places as p (p.id ?? '')}<option value={p.id}>{p.title}</option>{/each}</select>
      <button class="btn" onclick={create}><Plus size={13} /> {t('rt.new')}</button>
    </div>
    {#each groups as g (g.title)}
      <div class="group">{g.title}</div>
      {#each g.list as e (e.path)}
        {@const on = item?.path === e.path}
        <div class="row" class:active={on} oncontextmenu={(ev) => rowMenu(ev, e)} role="none">
          <button class="item" onclick={() => pick(e.path)}>{e.entry.title}</button>
          {#if on}<button class="icon-btn" title={t('adv.page.more')} onclick={(ev) => rowMenu(ev, e)}><MoreHorizontal size={14} /></button>{/if}
          <button class="icon-btn" title={t('lib.rollTable')} onclick={() => roll(e)}><Dices size={14} /></button>
        </div>
      {/each}
    {:else}
      <p class="faint">{query.trim() ? t('rt.nothing') : t('rt.none')}</p>
    {/each}
  </nav>

  <section class="detail">
    {#if item && cmp.editing}
      {#key item.path}<EntryEditor {item} />{/key}
    {:else if item}
      {@const it = item}
      <div class="bar">
        <button class="btn" onclick={() => pick(it.path, true)}><Pencil size={13} /> {t('adv.supp.edit')}</button>
        <button class="icon-btn" title={t('cmpui.toTrash')} onclick={() => trashEntry(it.path)}><Trash2 size={15} /></button>
      </div>
      <EntryCard entry={it.entry} path={it.path} onlink={(n) => peekEntry(n)} />
    {:else}
      <p class="faint hint">{t('rt.hint')}</p>
    {/if}
  </section>
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

<style>
  .page {
    display: grid;
    grid-template-columns: minmax(240px, 300px) 1fr;
    height: 100%;
    min-height: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 16px 12px;
    overflow: auto;
    border-right: 1px solid var(--border);
  }
  h2 {
    margin: 0 0 4px;
    font-size: 18px;
  }
  .about {
    margin: 0 0 8px;
    font-size: 12px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
  }
  .new {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }
  .new select {
    flex: 1;
    min-width: 0;
  }
  .group {
    margin: 8px 0 2px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .row {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  .row:hover {
    background: var(--bg-hover);
  }
  .row.active {
    background: var(--bg-active);
  }
  .item {
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    overflow: hidden;
    border: 0;
    background: none;
    color: var(--text-normal);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .detail {
    min-width: 0;
    padding: 16px 20px 32px;
    overflow: auto;
  }
  .bar {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-bottom: 8px;
  }
  .hint {
    margin-top: 40px;
    text-align: center;
  }
</style>
