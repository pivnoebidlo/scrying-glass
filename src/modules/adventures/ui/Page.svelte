<!-- The «Adventures» tab, the first one: every adventure as a tile — its cover, system, what is in it and where it
     stands in the Community. «Open» makes it the current one; «⋯» — rename, cover, system, export, publish, delete.
     A picture dropped on a tile becomes its cover. -->
<script lang="ts">
  import { CloudUpload, Download, Globe, ImagePlus, MoreHorizontal, Pencil, Plus, Trash2 } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { COVER_FILE, currentSystem, shownAdventures, systemFor } from '../../../shared/adventures';
  import { allFiles, thumb, vaultUrl, type VaultFolder } from '../../../shared/vault';
  import { systems } from '../../../systems';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { openRepo, repo } from '../../repo/ui/repo.svelte';
  import SystemSelect from './SystemSelect.svelte';

  let { ms, app }: ModuleProps<'adventures'> = $props();

  void connectCards();
  const list = $derived(shownAdventures(ms));
  const hidden = $derived(ms.list.length - list.length);
  const folderOf = (a: string): VaultFolder | undefined => app.vault.tree?.folders.find((f) => f.path === a);
  // A cover just set: the same path, a new picture — the thumbnail is asked for again.
  let rev = $state(0);
  const cover = (a: string) => (folderOf(a)?.files.some((f) => f.name === COVER_FILE) ? `${thumb(vaultUrl(`${a}/${COVER_FILE}`), 640)}&r=${rev}` : '');
  const systemTitle = (a: string) => {
    const id = systemFor(ms, a);
    return systems.find((s) => s.id === id)?.title ?? id;
  };
  const inside = (a: string, p: string | undefined) => !!p && (p === a || p.startsWith(a + '/'));
  function counts(a: string) {
    const files = folderOf(a) ? allFiles(folderOf(a)!) : [];
    return [
      t('adv.page.scenes', { count: app.scenes.scenes.filter((s) => s.adventure === a).length }),
      t('adv.page.encounters', { count: app.initiative.encounters.filter((e) => e.adventure === a).length }),
      t('adv.page.cards', { count: bestiary.all.filter((c) => c.ref.scope === 'vault' && inside(a, c.folder)).length }),
      t('adv.page.notes', { count: files.filter((f) => f.kind === 'page').length }),
    ].join(' · ');
  }
  function community(a: string) {
    const pub = app.repo.published[a];
    if (pub) return t('adv.page.published', { n: pub.version });
    const got = app.repo.installed[a];
    return got ? t('adv.page.installed', { n: got.version }) : '';
  }

  // Rename and system: one small dialog.
  let editing = $state<{ name: string; was: string; system: string } | null>(null);
  let error = $state('');
  async function save() {
    if (!editing) return;
    const e = editing;
    let name = e.was;
    if (e.name.trim() && e.name.trim() !== e.was) {
      const to = await window.api.renameAdventure(e.was, e.name.trim());
      if (!to) return void (error = t('adv.page.taken'));
      name = to;
    }
    if (e.system !== systemFor(ms, e.was)) await dispatch('adventures', 'setSystem', { path: name, system: e.system });
    editing = null;
  }

  let picking = $state<string | null>(null);
  async function setCover(a: string, from: { abs?: string; rel?: string }) {
    if (await window.api.setAdventureCover(a, from)) rev++;
  }
  // The adventure is taken before the picker is closed: closing it clears `picking`.
  function pickCover(paths: string[]) {
    const a = picking;
    picking = null;
    if (a && paths[0]) void setCover(a, { rel: paths[0] });
  }
  function ondrop(e: DragEvent, a: string) {
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    void setCover(a, { abs: window.api.pathForFile(file) });
  }

  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  function openMenu(e: MouseEvent, a: string) {
    const at = menuAt(e);
    menu = {
      ...at,
      items: [
        { label: t('adv.page.edit'), icon: Pencil, action: () => ((error = ''), (editing = { name: a, was: a, system: systemFor(ms, a) })) },
        { label: t('adv.page.cover'), icon: ImagePlus, action: () => (picking = a) },
        { label: t('adv.export', { name: a }), icon: Download, action: () => void window.api.exportAdventure(a) },
        { label: t(app.repo.published[a] ? 'repo.menuUpdate' : 'repo.menuPublish', { name: a }), icon: CloudUpload, action: () => (repo.publish = a) },
        { label: t('adv.delete', { name: a }), icon: Trash2, danger: true, action: () => void window.api.deleteAdventure(a) },
      ],
    };
  }

  // Arrows walk the tiles like a list (← → — the next one, ↑ ↓ — a row up or down) and open the one they reach;
  // not while typing or with a dialog or menu open, and only when this tab is on screen.
  let pageEl = $state<HTMLElement | null>(null);
  function onkeydown(e: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (!pageEl?.offsetParent || menu || editing || picking || !list.length) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable]') || (target && target !== document.body && !pageEl.contains(target))) return;
    const grid = pageEl.querySelector('.adv-grid');
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 1;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key as 'ArrowLeft'];
    const i = ms.current === null ? -1 : list.indexOf(ms.current);
    const next = list[i < 0 ? 0 : Math.min(list.length - 1, Math.max(0, i + step))];
    e.preventDefault();
    if (!next || next === ms.current) return;
    void dispatch('adventures', 'select', { path: next });
    requestAnimationFrame(() => pageEl?.querySelector('.tile.current')?.scrollIntoView({ block: 'nearest' }));
  }

  let creating = $state(false);
  let newName = $state('');
  let newSystem = $state('');
  async function create() {
    if (!newName.trim()) return;
    await dispatch('adventures', 'create', { name: newName.trim(), system: newSystem || currentSystem(ms) });
    newName = '';
    creating = false;
  }
</script>

<svelte:window {onkeydown} />

<div class="page" bind:this={pageEl}>
  <header>
    <h2>{t('adv.page.title')}</h2>
    <div class="actions">
      <button class="btn" onclick={() => ((creating = !creating), (newSystem = currentSystem(ms)))}><Plus size={14} /> {t('adv.createAdventure')}</button>
      <button class="btn" onclick={() => openRepo()}><Globe size={14} /> {t('repo.menuBrowse')}</button>
    </div>
  </header>

  {#if creating}
    <form class="create" onsubmit={(e) => (e.preventDefault(), create())}>
      <!-- svelte-ignore a11y_autofocus -->
      <input type="text" bind:value={newName} placeholder={t('adv.namePlaceholder')} autofocus />
      <SystemSelect value={newSystem} onchange={(v) => (newSystem = v)} />
      <button class="btn primary" type="submit" disabled={!newName.trim()}>{t('adv.create')}</button>
    </form>
  {/if}

  {#if !list.length}
    <p class="faint">{t('adv.page.empty')}</p>
  {/if}
  {#if hidden}
    <p class="faint small">{t('adv.page.hidden', { count: hidden })}</p>
  {/if}

  <div class="adv-grid">
    {#each list as a (a)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tile"
        class:current={ms.current === a}
        ondragover={(e) => e.dataTransfer?.types.includes('Files') && (e.preventDefault(), e.stopPropagation())}
        ondrop={(e) => ondrop(e, a)}
        oncontextmenu={(e) => openMenu(e, a)}
      >
        <button class="cover" title={t('adv.page.openHint')} onclick={() => dispatch('adventures', 'select', { path: a })} ondblclick={() => (picking = a)}>
          {#if cover(a)}<img src={cover(a)} alt="" />{:else}<span class="none"><ImagePlus size={22} /> {t('adv.page.dropCover')}</span>{/if}
        </button>
        <div class="info">
          <div class="name">{a}</div>
          <div class="faint small">{systemTitle(a)}{community(a) ? ` · ${community(a)}` : ''}</div>
          <div class="faint small">{counts(a)}</div>
        </div>
        <div class="bar">
          <span class="here small">{ms.current === a ? t('adv.page.current') : ''}</span>
          <button class="icon-btn" title={t('adv.page.more')} onclick={(e) => openMenu(e, a)}><MoreHorizontal size={15} /></button>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if menu}
  <ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />
{/if}

{#if picking && app.vault.tree}
  <FilePicker tree={app.vault.tree} prefer="backgrounds" onpick={pickCover} onclose={() => (picking = null)} />
{/if}

{#if editing}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && (editing = null)}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), save())}>
      <h3>{t('adv.page.edit')}</h3>
      <label class="field">
        <span>{t('adv.page.name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" bind:value={editing.name} autofocus />
      </label>
      <label class="field">
        <span>{t('adv.system')}</span>
        <SystemSelect value={editing.system} onchange={(v) => editing && (editing.system = v)} />
      </label>
      {#if app.repo.published[editing.was]}<p class="faint small">{t('adv.page.renamePublished')}</p>{/if}
      {#if error}<p class="warn small">{error}</p>{/if}
      <div class="row">
        <button class="btn" type="button" onclick={() => (editing = null)}>{t('adv.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!editing.name.trim()}>{t('adv.page.save')}</button>
      </div>
    </form>
  </div>
{/if}

<style>
  .page {
    height: 100%;
    padding: 18px 22px;
    overflow-y: auto;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }
  h2 {
    margin: 0;
    font-size: 20px;
  }
  .actions,
  .create {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .create {
    margin-bottom: 14px;
  }
  .adv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .tile.current {
    border-color: var(--accent);
  }
  .cover {
    display: grid;
    aspect-ratio: 4 / 3;
    padding: 0;
    overflow: hidden;
    place-items: center;
    border: none;
    border-radius: 0;
    background: var(--bg-primary);
    cursor: pointer;
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .none {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--text-faint);
    font-size: 12px;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px 0;
  }
  .name {
    font-weight: 600;
  }
  .small {
    font-size: 12px;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 8px 10px 10px;
  }
  .here {
    color: var(--accent);
  }
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    width: min(420px, 92vw);
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  h3 {
    margin: 0 0 10px;
    font-size: 15px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .warn {
    color: var(--warning);
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
</style>
