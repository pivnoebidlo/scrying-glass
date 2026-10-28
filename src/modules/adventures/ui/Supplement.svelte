<!-- A supplement's own page (the Adventures tab): what it is, its system, the adventures that use it — and its
     content, made and edited right here: creatures (cards in its monsters folder) and compendium entries (in its
     compendium folder) on the left, the one picked — or its editor — on the right. Nothing asks where to keep a new
     one. Every row has its menu (a right click, or «⋯» on the picked one): edit, delete. -->
<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { ArrowLeft, BookOpen, ChevronDown, CloudUpload, ImagePlus, Link2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { AppState } from '../../../shared/types';
  import { COVER_FILE, isSupplement, shownAdventures, SUPPLEMENT_KINDS, systemFor, type SupplementKind } from '../../../shared/adventures';
  import { blankEntry, serializeEntry } from '../../../shared/compendium';
  import { allFiles, folderRole, roleNames, thumb, vaultUrl } from '../../../shared/vault';
  import { sameRef, type CardRef } from '../../../shared/cards';
  import { systems } from '../../../systems';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { typeDef } from '../../../renderer/lib/entry/types.svelte';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import CardEditor from '../../bestiary/ui/CardEditor.svelte';
  import CardView from '../../bestiary/ui/CardView.svelte';
  import { allEntries, entryAt, loadEntries, typesHere } from '../../compendium/ui/store.svelte';
  import EntryEditor from '../../compendium/ui/EntryEditor.svelte';
  import { ui as cmp } from '../../compendium/ui/ui.svelte';
  import { repo } from '../../repo/ui/repo.svelte';
  import { advUi } from './ui.svelte';

  let {
    app,
    folder,
    rev,
    onedit,
    oncover,
  }: {
    app: AppState;
    folder: string;
    rev: number;
    // The tab's own dialogs: name and system, a cover.
    onedit: () => void;
    oncover: () => void;
  } = $props();

  // While this page is open, the card editor opens here, not on the Cards tab.
  onMount(() => {
    bestiary.host = 'adventures';
    void connectCards();
    void loadEntries();
  });
  onDestroy(() => (bestiary.host = 'bestiary'));

  const ms = $derived(app.adventures);
  const inside = (p: string | undefined) => !!p && (p === folder || p.startsWith(folder + '/'));
  const tree = $derived(app.vault.tree?.folders.find((f) => f.path === folder));
  // Its folders of creatures and of entries: the first of each role in it (made with the supplement).
  const sub = (role: 'bestiary' | 'compendium') => tree?.folders.find((f) => folderRole(f.name) === role)?.path ?? `${folder}/${roleNames()[role][0]}`;
  const cover = $derived(tree?.files.some((f) => f.name === COVER_FILE) ? `${thumb(vaultUrl(`${folder}/${COVER_FILE}`), 240)}&r=${rev}` : '');
  const systemTitle = $derived(systems.find((s) => s.id === systemFor(ms, folder))?.title ?? systemFor(ms, folder));

  const cards = $derived(bestiary.all.filter((c) => c.ref.scope === 'vault' && inside(c.folder)).sort((a, b) => a.name.localeCompare(b.name)));
  const entries = $derived(allEntries().filter((e) => inside(e.path)));
  const groups = $derived.by(() => {
    const by = new Map<string, typeof entries>();
    for (const e of entries) by.set(e.entry.type, [...(by.get(e.entry.type) ?? []), e]);
    return [...by].map(([type, list]) => ({ type, title: typeDef(type).title, list })).sort((a, b) => a.title.localeCompare(b.title));
  });

  // What is shown on the right: a card or an entry (the compendium's open one — it follows a rename).
  let picked = $state<'card' | 'entry' | null>(null);
  const card = $derived(picked === 'card' && bestiary.selected && cards.some((c) => sameRef(c.ref, bestiary.selected!)) ? bestiary.selected : null);
  const entryItem = $derived(picked === 'entry' && cmp.open && inside(cmp.open) ? entryAt(cmp.open) : undefined);
  const draftHere = $derived(bestiary.draft && bestiary.draft.scope === 'vault' && inside(bestiary.draft.folder) ? bestiary.draft : null);
  // A card the editor saved (it selects it) is shown here — only when the selection changes, not on every list update.
  let lastSelected: string | null = null;
  $effect(() => {
    const sel = bestiary.selected;
    const key = sel ? `${sel.scope}:${sel.id}` : null;
    if (key === lastSelected) return;
    lastSelected = key;
    untrack(() => {
      if (sel && cards.some((c) => sameRef(c.ref, sel))) picked = 'card';
    });
  });

  function pickCard(ref: CardRef) {
    if (bestiary.draft) return;
    bestiary.select(ref);
    picked = 'card';
  }
  function pickEntry(path: string, edit = false) {
    if (bestiary.draft) return;
    cmp.open = path;
    cmp.editing = edit;
    picked = 'entry';
  }
  const newCard = () => void bestiary.create({ scope: 'vault', folder: sub('bestiary') });
  async function newEntry(type: string) {
    const def = typeDef(type);
    const path = await window.api.createEntry(sub('compendium'), t('cmpui.newEntryName', { type: def.title.toLowerCase() }), serializeEntry(blankEntry(type), def));
    if (path) pickEntry(path, true);
  }
  async function removeEntry(path: string) {
    const s = await dispatch('vault', 'trash', { paths: [path] });
    if ((!s.vault.tree || !allFiles(s.vault.tree).some((f) => f.path === path)) && cmp.open === path) {
      cmp.open = null;
      picked = null;
    }
  }

  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const show = (e: MouseEvent, items: MenuItem[]) => (menu = { ...menuAt(e), items });
  const cardMenu = (e: MouseEvent, ref: CardRef) =>
    show(e, [
      { label: t('adv.supp.edit'), icon: Pencil, action: () => (pickCard(ref), void bestiary.edit(ref)) },
      { label: t('adv.supp.delete'), icon: Trash2, danger: true, action: () => void bestiary.remove(ref) },
    ]);
  const entryMenu = (e: MouseEvent, path: string) =>
    show(e, [
      { label: t('adv.supp.edit'), icon: Pencil, action: () => pickEntry(path, true) },
      { label: t('adv.supp.delete'), icon: Trash2, danger: true, action: () => void removeEntry(path) },
    ]);
  const typesMenu = (e: MouseEvent) => show(e, typesHere().map((ty) => ({ label: ty.def.title, action: () => void newEntry(ty.id) })));
  const pageMenu = (e: MouseEvent) =>
    show(e, [
      { label: t('adv.page.edit'), icon: Pencil, action: onedit },
      { label: t('adv.page.cover'), icon: ImagePlus, action: oncover },
      { label: t('adv.delete', { name: folder }), icon: Trash2, danger: true, action: () => void window.api.deleteAdventure(folder).then((ok) => ok && (advUi.supplement = null)) },
    ]);

  // «Used in»: a button with how many; its list — with a search, for many adventures.
  const adventures = $derived(shownAdventures(ms).filter((a) => !isSupplement(ms, a)));
  const usedIn = $derived(adventures.filter((a) => ms.uses?.[a]?.includes(folder)));
  let usesOpen = $state(false);
  let usesQuery = $state('');
  const usesShown = $derived(adventures.filter((a) => a.toLowerCase().includes(usesQuery.trim().toLowerCase())));
  function toggleUse(adventure: string, on: boolean) {
    const now = ms.uses?.[adventure] ?? [];
    void dispatch('adventures', 'setUses', { adventure, supplements: on ? [...now, folder] : now.filter((x) => x !== folder) });
  }
</script>

<div class="supp">
  <header>
    <button class="icon-btn" title={t('adv.supp.back')} onclick={() => (advUi.supplement = null)}><ArrowLeft size={16} /></button>
    <button class="cover" title={t('adv.page.cover')} onclick={oncover}>
      {#if cover}<img src={cover} alt="" />{:else}<BookOpen size={20} />{/if}
    </button>
    <div class="title">
      <h2>{folder}</h2>
      <div class="meta">
        <select class="kind" value={ms.supplements?.[folder] ?? 'collection'} onchange={(e) => dispatch('adventures', 'setSupplementKind', { path: folder, kind: e.currentTarget.value as SupplementKind })}>
          {#each SUPPLEMENT_KINDS as k (k)}<option value={k}>{t(`adv.kind.${k}`)}</option>{/each}
        </select>
        <span class="faint">· {systemTitle}</span>
      </div>
    </div>
    <div class="uses-box">
      <button class="btn" onclick={() => ((usesOpen = !usesOpen), (usesQuery = ''))} title={usedIn.join(', ')}>
        <Link2 size={14} /> {usedIn.length ? t('adv.supp.usedInN', { count: usedIn.length }) : t('adv.supp.notUsed')} <ChevronDown size={13} />
      </button>
      {#if usesOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="pop-back" onclick={() => (usesOpen = false)}></div>
        <div class="pop">
          <p class="faint small">{t('adv.supp.usedHint')}</p>
          {#if adventures.length > 6}
            <label class="search"><Search size={13} /><input type="text" bind:value={usesQuery} placeholder={t('adv.supp.searchAdventures')} /></label>
          {/if}
          <div class="checks">
            {#each usesShown as a (a)}
              <label class="check"><input type="checkbox" checked={usedIn.includes(a)} onchange={(e) => toggleUse(a, e.currentTarget.checked)} /> <span>{a}</span></label>
            {:else}
              <p class="faint small">{t('adv.supp.noAdventures')}</p>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    <button class="btn" onclick={() => (repo.publishBestiary = folder)}><CloudUpload size={14} /> {t('adv.supp.publish')}</button>
    <button class="icon-btn" title={t('adv.page.more')} onclick={pageMenu}><MoreHorizontal size={16} /></button>
  </header>

  <div class="body">
    <nav class="list">
      <div class="head">
        <span>{t('adv.supp.creatures')} <i>{cards.length || ''}</i></span>
        <button class="icon-btn" title={t('adv.supp.newCreature')} onclick={newCard} disabled={!!bestiary.draft}><Plus size={14} /></button>
      </div>
      {#each cards as c (c.ref.id)}
        {@const on = !!card && sameRef(card, c.ref)}
        <div class="row" class:active={on} oncontextmenu={(e) => cardMenu(e, c.ref)} role="none">
          <button class="item" onclick={() => pickCard(c.ref)}>
            <span class="name">{c.name}</span>{#if c.subtitle}<span class="sub">{c.subtitle}</span>{/if}
          </button>
          {#if on}<button class="icon-btn more" title={t('adv.page.more')} onclick={(e) => cardMenu(e, c.ref)}><MoreHorizontal size={14} /></button>{/if}
        </div>
      {:else}
        <p class="none">{t('adv.supp.noCreatures')}</p>
      {/each}

      <div class="head">
        <span>{t('adv.supp.entries')} <i>{entries.length || ''}</i></span>
        <button class="icon-btn" title={t('adv.supp.newEntry')} onclick={typesMenu} disabled={!!bestiary.draft}><Plus size={14} /></button>
      </div>
      {#each groups as g (g.type)}
        <div class="group">{g.title}</div>
        {#each g.list as e (e.path)}
          {@const on = picked === 'entry' && cmp.open === e.path}
          <div class="row" class:active={on} oncontextmenu={(ev) => entryMenu(ev, e.path)} role="none">
            <button class="item" onclick={() => pickEntry(e.path)}><span class="name">{e.entry.title}</span></button>
            {#if on}<button class="icon-btn more" title={t('adv.page.more')} onclick={(ev) => entryMenu(ev, e.path)}><MoreHorizontal size={14} /></button>{/if}
          </div>
        {/each}
      {:else}
        <p class="none">{t('adv.supp.noEntries')}</p>
      {/each}
    </nav>

    <section class="detail">
      {#if draftHere}
        <CardEditor {app} draft={draftHere} />
      {:else if card}
        <CardView {app} ref={card} onselect={(r) => pickCard(r)} />
      {:else if entryItem && cmp.editing}
        {#key entryItem.path}<EntryEditor item={entryItem} />{/key}
      {:else if entryItem}
        {@const path = entryItem.path}
        <div class="entry">
          <div class="bar">
            <button class="btn" onclick={() => pickEntry(path, true)}><Pencil size={13} /> {t('adv.supp.edit')}</button>
            <button class="icon-btn" title={t('adv.page.more')} onclick={(e) => entryMenu(e, path)}><MoreHorizontal size={15} /></button>
          </div>
          <EntryCard entry={entryItem.entry} />
        </div>
      {:else}
        <p class="hint">{t('adv.supp.hint')}</p>
      {/if}
    </section>
  </div>
</div>

{#if menu}
  <ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />
{/if}

<style>
  .supp {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }
  .cover {
    display: grid;
    flex: none;
    width: 52px;
    height: 40px;
    padding: 0;
    overflow: hidden;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-faint);
    cursor: pointer;
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .title {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    overflow: hidden;
    font-size: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
  .kind {
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .uses-box {
    position: relative;
  }
  .pop-back {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 50;
  }
  .pop {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 51;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 280px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  }
  .pop p {
    margin: 0;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
    border: 0;
    background: none;
  }
  .checks {
    display: flex;
    flex-direction: column;
    max-height: 260px;
    overflow-y: auto;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 4px;
    border-radius: var(--radius-s);
  }
  .check:hover {
    background: var(--bg-hover);
  }
  .check span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .list {
    display: flex;
    flex: 0 0 260px;
    flex-direction: column;
    padding: 4px 6px 12px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
    background: var(--bg-secondary);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 4px 4px 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .head i {
    color: var(--text-faint);
    font-style: normal;
    font-weight: 400;
  }
  .group {
    padding: 8px 8px 2px;
    color: var(--text-faint);
    font-size: 11px;
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
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    padding: 4px 8px;
    border: 0;
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .row:hover .item,
  .row.active .item {
    color: var(--text-normal);
  }
  .name,
  .sub {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    color: var(--text-faint);
    font-size: 11px;
  }
  .more {
    margin-right: 2px;
  }
  .none {
    margin: 2px 8px;
    color: var(--text-faint);
    font-size: 12px;
  }
  .detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }
  .entry {
    padding: 14px 22px;
  }
  .bar {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-bottom: 4px;
  }
  .hint {
    padding: 40px 30px;
    color: var(--text-faint);
    text-align: center;
  }
  .small {
    font-size: 12px;
  }
</style>
