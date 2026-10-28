<!-- A supplement's own page (the Adventures tab): what it is, its system, the adventures that use it — and its
     content, made and edited right here: creatures (cards in its monsters folder) and compendium entries (in its
     compendium folder) on the left, the one picked — or its editor — on the right. Nothing asks where to keep a new one. -->
<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { ArrowLeft, CloudUpload, Pencil, Plus } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import type { AppState } from '../../../shared/types';
  import { COVER_FILE, isSupplement, shownAdventures, SUPPLEMENT_KINDS, systemFor, type SupplementKind } from '../../../shared/adventures';
  import { blankEntry, serializeEntry } from '../../../shared/compendium';
  import { folderRole, roleNames, thumb, vaultUrl } from '../../../shared/vault';
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

  let { app, folder, rev }: { app: AppState; folder: string; rev: number } = $props();

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
  // Its folders of creatures and of entries: the first of each role in it (made when the supplement was).
  const sub = (role: 'bestiary' | 'compendium') => tree?.folders.find((f) => folderRole(f.name) === role)?.path ?? `${folder}/${roleNames()[role][0]}`;
  const cover = $derived(tree?.files.some((f) => f.name === COVER_FILE) ? `${thumb(vaultUrl(`${folder}/${COVER_FILE}`), 320)}&r=${rev}` : '');
  const systemTitle = $derived(systems.find((s) => s.id === systemFor(ms, folder))?.title ?? systemFor(ms, folder));

  const cards = $derived(bestiary.all.filter((c) => c.ref.scope === 'vault' && inside(c.folder)).sort((a, b) => a.name.localeCompare(b.name)));
  const entries = $derived(allEntries().filter((e) => inside(e.path)));
  const groups = $derived.by(() => {
    const by = new Map<string, typeof entries>();
    for (const e of entries) by.set(e.entry.type, [...(by.get(e.entry.type) ?? []), e]);
    return [...by].map(([type, list]) => ({ type, title: typeDef(type).title, list })).sort((a, b) => a.title.localeCompare(b.title));
  });

  // What is shown on the right: a card or an entry.
  let picked = $state<{ card: CardRef } | { entry: string } | null>(null);
  // A card saved or picked elsewhere (the editor selects what it saved): shown here if it is this supplement's.
  // Only when the selection changes: the list of cards changes too (after any save), and that is not a pick.
  let lastSelected: string | null = null;
  $effect(() => {
    const sel = bestiary.selected;
    const key = sel ? `${sel.scope}:${sel.id}` : null;
    if (key === lastSelected) return;
    lastSelected = key;
    untrack(() => {
      if (sel && cards.some((c) => sameRef(c.ref, sel))) picked = { card: sel };
    });
  });
  const draftHere = $derived(bestiary.draft && bestiary.draft.scope === 'vault' && inside(bestiary.draft.folder) ? bestiary.draft : null);
  // The compendium's open entry: saving under a new title moves it, and the editor puts the new path there.
  const entryItem = $derived(picked && 'entry' in picked ? entryAt(cmp.open ?? picked.entry) : undefined);

  function newCard() {
    void bestiary.create({ scope: 'vault', folder: sub('bestiary') });
  }
  let entryType = $state('');
  const types = $derived(typesHere());
  async function newEntry() {
    const type = entryType || types[0]?.id || 'note';
    const def = typeDef(type);
    const path = await window.api.createEntry(sub('compendium'), t('cmpui.newEntryName', { type: def.title.toLowerCase() }), serializeEntry(blankEntry(type), def));
    if (!path) return;
    bestiary.draft = null;
    cmp.open = path;
    cmp.editing = true;
    picked = { entry: path };
  }
  function pickCard(ref: CardRef) {
    if (bestiary.draft) return;
    picked = { card: ref };
    bestiary.select(ref);
  }
  function pickEntry(path: string) {
    if (bestiary.draft) return;
    cmp.editing = false;
    cmp.open = path;
    picked = { entry: path };
  }

  // The adventures it is used in: a tick here is the same as one in the adventure's own dialog.
  const adventures = $derived(shownAdventures(ms).filter((a) => !isSupplement(ms, a)));
  function toggleUse(adventure: string, on: boolean) {
    const now = ms.uses?.[adventure] ?? [];
    void dispatch('adventures', 'setUses', { adventure, supplements: on ? [...now, folder] : now.filter((x) => x !== folder) });
  }
</script>

<div class="supp">
  <header>
    <button class="icon-btn" title={t('adv.supp.back')} onclick={() => (advUi.supplement = null)}><ArrowLeft size={16} /></button>
    {#if cover}<img class="cover" src={cover} alt="" />{/if}
    <div class="title">
      <h2>{folder}</h2>
      <div class="meta">
        <select value={ms.supplements?.[folder] ?? 'collection'} onchange={(e) => dispatch('adventures', 'setSupplementKind', { path: folder, kind: e.currentTarget.value as SupplementKind })}>
          {#each SUPPLEMENT_KINDS as k (k)}<option value={k}>{t(`adv.kind.${k}`)}</option>{/each}
        </select>
        <span class="faint">{systemTitle}</span>
      </div>
    </div>
    <button class="btn" onclick={() => (repo.publishBestiary = folder)}><CloudUpload size={14} /> {t('adv.page.publishBestiary')}</button>
  </header>

  {#if adventures.length}
    <div class="uses">
      <span class="faint">{t('adv.supp.usedIn')}</span>
      {#each adventures as a (a)}
        <label class="chip"><input type="checkbox" checked={!!ms.uses?.[a]?.includes(folder)} onchange={(e) => toggleUse(a, e.currentTarget.checked)} /> {a}</label>
      {/each}
    </div>
  {/if}

  <div class="body">
    <nav class="list">
      <div class="head">
        <span>{t('adv.supp.creatures')}</span>
        <button class="icon-btn" title={t('adv.supp.newCreature')} onclick={newCard} disabled={!!bestiary.draft}><Plus size={14} /></button>
      </div>
      {#each cards as c (c.ref.id)}
        <button class="item" class:active={picked && 'card' in picked && sameRef(picked.card, c.ref)} onclick={() => pickCard(c.ref)}>
          <span class="name">{c.name}</span><span class="faint small">{c.subtitle}</span>
        </button>
      {:else}
        <p class="faint small none">{t('adv.supp.noCreatures')}</p>
      {/each}

      <div class="head">
        <span>{t('adv.supp.entries')}</span>
        <select bind:value={entryType} title={t('adv.supp.entryType')}>
          {#each types as ty (ty.id)}<option value={ty.id}>{ty.def.title}</option>{/each}
        </select>
        <button class="icon-btn" title={t('adv.supp.newEntry')} onclick={newEntry} disabled={!!bestiary.draft}><Plus size={14} /></button>
      </div>
      {#each groups as g (g.type)}
        <div class="group faint small">{g.title}</div>
        {#each g.list as e (e.path)}
          <button class="item" class:active={picked && 'entry' in picked && (cmp.open ?? picked.entry) === e.path} onclick={() => pickEntry(e.path)}>
            <span class="name">{e.entry.title}</span>
          </button>
        {/each}
      {:else}
        <p class="faint small none">{t('adv.supp.noEntries')}</p>
      {/each}
    </nav>

    <section class="detail">
      {#if draftHere}
        <CardEditor {app} draft={draftHere} />
      {:else if picked && 'card' in picked}
        <CardView {app} ref={picked.card} onselect={(r) => pickCard(r)} />
      {:else if entryItem && cmp.editing && cmp.open === entryItem.path}
        {#key entryItem.path}<EntryEditor item={entryItem} />{/key}
      {:else if entryItem}
        <div class="entry">
          <div class="bar"><button class="btn" onclick={() => ((cmp.open = entryItem.path), (cmp.editing = true))}><Pencil size={13} /> {t('adv.supp.edit')}</button></div>
          <EntryCard entry={entryItem.entry} />
        </div>
      {:else}
        <p class="faint hint">{t('adv.supp.hint')}</p>
      {/if}
    </section>
  </div>
</div>

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
    gap: 12px;
    padding: 14px 18px 8px;
  }
  .cover {
    width: 64px;
    height: 48px;
    border-radius: var(--radius-s);
    object-fit: cover;
  }
  .title {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0 0 4px;
    font-size: 19px;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .uses {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 0 18px 10px;
    font-size: 13px;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .body {
    display: flex;
    flex: 1;
    min-height: 0;
    border-top: 1px solid var(--border);
  }
  .list {
    display: flex;
    flex: 0 0 260px;
    flex-direction: column;
    padding: 6px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 6px 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .head span {
    flex: 1;
  }
  .head select {
    max-width: 120px;
    font-size: 12px;
  }
  .group {
    padding: 6px 8px 2px;
  }
  .item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 4px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .item.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .name {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .small {
    font-size: 11px;
  }
  .none {
    padding: 2px 8px;
  }
  .detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }
  .entry {
    padding: 14px 20px;
  }
  .bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .hint {
    padding: 30px;
    text-align: center;
  }
</style>
