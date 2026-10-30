<!-- Боковая панель журнала: поиск и дерево заметок и PDF — папки журнала приключения и общие, с подпапками.
     Nothing hides until hovered: "New note" and "New folder" are always at the top and create in the selected folder
     (a clicked folder or the folder of the open note); every row has a context menu (right click, or "⋯" on the
     selected row): new note or folder here, rename, move to…, pin, trash. Rows are dragged within a folder to reorder
     and onto a folder (or a place) to move; files from Finder can be dropped onto a folder (FileDrop: data-drop-folder). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { BookOpen, ChevronDown, ChevronRight, ExternalLink, FilePlus, Folder, FolderInput, FolderPlus, MoreHorizontal, Pencil, Pin, PinOff, Search, Trash2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { movePlace } from '../../../renderer/lib/pdf/pdf.svelte';
  import { draggedFile, sortable } from '../../../renderer/lib/sortable';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { applyOrder } from '../../../shared/order';
  import { isPdf, pageTitle } from '../../../shared/journal';
  import { searchKey } from '../../../shared/compendium';
  import { dirname, type VaultFolder } from '../../../shared/vault';
  import { journal, journalFolder, journalPdfs, journalRoots, loadPages, preview, searchPages, type JournalRoot } from './store.svelte';
  import { openPage, ui } from './ui.svelte';

  let { app }: ModuleProps<'journal'> = $props();

  const tree = $derived(app.vault.tree);
  const adv = $derived(app.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void loadPages();
  });

  const roots = $derived.by(() => {
    void tree, adv, app.adventures;
    return journalRoots();
  });
  // Куда «+» кладёт заметку, если журнала ещё нет: в текущее приключение (или в корень хранилища).
  const home = $derived.by(() => {
    void tree;
    return journalFolder(adv);
  });
  // Every visible journal folder (for "Move to…" and the selected folder).
  const folders = $derived.by(() => {
    const out: { path: string; name: string; depth: number; root: JournalRoot }[] = [];
    const walk = (f: VaultFolder, depth: number, root: JournalRoot) => {
      out.push({ path: f.path, name: depth ? f.name : root.title, depth, root });
      for (const sub of f.folders) walk(sub, depth + 1, root);
    };
    for (const r of roots) walk(r.folder, 0, r);
    return out;
  });
  // Where the buttons at the top create: the selected folder, else the folder of the open note, else the adventure's.
  const target = $derived.by(() => {
    const has = (p: string | null | undefined) => (p && folders.some((f) => f.path === p) ? p : null);
    return has(ui.selected) ?? has(ui.open ? dirname(ui.open) : null) ?? home;
  });
  const targetName = $derived(folders.find((f) => f.path === target)?.name ?? pageTitle(target));

  const found = $derived((journal.pages, ui.query.trim() ? searchPages(ui.query) : null));
  // PDFs are found by their names.
  const foundPdfs = $derived.by(() => {
    void tree, adv;
    const q = searchKey(ui.query.trim());
    return q ? journalPdfs().filter((p) => searchKey(p.title).includes(q)) : [];
  });
  const groups = $derived(app.order.groups);
  const pinned = $derived(app.journal.pinned[adv ?? ''] ?? []);

  async function newPage(folder: string) {
    const path = await window.api.createPage(folder, t('journal.newNoteName'), '');
    if (!path) return;
    openPage(path, true);
    ui.fresh = true;
  }

  // Новая папка: сначала название (поле в списке), потом папка.
  let naming = $state<string | null>(null);
  let folderName = $state('');
  function startFolder(parent: string) {
    naming = parent;
    folderName = '';
    if (ui.collapsed.includes(parent)) ui.collapsed = ui.collapsed.filter((x) => x !== parent);
  }
  async function makeFolder() {
    const parent = naming;
    const name = folderName.trim();
    naming = null;
    if (parent !== null && name) await window.api.createPageFolder(parent, name);
  }

  const toggle = (path: string) =>
    (ui.collapsed = ui.collapsed.includes(path) ? ui.collapsed.filter((x) => x !== path) : [...ui.collapsed, path]);
  function clickFolder(path: string) {
    if (ui.selected === path) toggle(path);
    else {
      ui.selected = path;
      if (ui.collapsed.includes(path)) toggle(path);
    }
  }

  // A file or folder moved or renamed: the open note, the selection and the collapsed folders follow it.
  const moved = (p: string, from: string, to: string) => (p === from ? to : p.startsWith(from + '/') ? to + p.slice(from.length) : p);
  function follow(from: string, to: string | null) {
    if (!to || to === from) return;
    if (ui.open) ui.open = moved(ui.open, from, to);
    if (ui.selected) ui.selected = moved(ui.selected, from, to);
    ui.collapsed = ui.collapsed.map((c) => moved(c, from, to));
    if (isPdf(from)) movePlace(from, to);
  }
  async function moveTo(path: string, folder: string) {
    follow(path, await window.api.movePage(path, folder));
  }

  // Rename a folder in place.
  let renaming = $state<string | null>(null);
  let renameTo = $state('');
  function startRename(f: { path: string; name: string }) {
    renaming = f.path;
    renameTo = f.name;
  }
  async function finishRename() {
    const from = renaming;
    const name = renameTo.trim();
    renaming = null;
    if (from && name) follow(from, await window.api.renamePageFolder(from, name));
  }

  // A file or folder can go into a folder that is not its own, not itself and not inside itself.
  const canMoveInto = (path: string, folder: string) => folder !== dirname(path) && folder !== path && !folder.startsWith(path + '/');

  // Перенос заметки, PDF (или папки) на папку.
  let over = $state<string | null>(null);
  let dragFolder = $state<string | null>(null);
  const movable = (folder: string) => {
    if (dragFolder) return canMoveInto(dragFolder, folder);
    const f = draggedFile();
    return !!f && /\.(md|txt|pdf)$/i.test(f) && canMoveInto(f, folder) && folders.some((x) => x.path === dirname(f));
  };
  function dragover(e: DragEvent, folder: string) {
    if (!movable(folder)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    over = folder;
  }
  async function drop(e: DragEvent, folder: string) {
    over = null;
    if (dragFolder) {
      const from = dragFolder;
      const ok = movable(folder);
      dragFolder = null;
      if (!ok) return;
      e.preventDefault();
      await moveTo(from, folder);
      return;
    }
    const f = draggedFile();
    if (!f || !movable(folder)) return;
    e.preventDefault();
    await moveTo(f, folder);
  }

  async function trash(path: string) {
    const s = await dispatch('vault', 'trash', { paths: [path] });
    const gone = (p: string | null) => !!p && (p === path || p.startsWith(path + '/'));
    if (s.vault.tree && !journalRoots().some((r) => r.folder.path === path)) {
      if (gone(ui.open)) ui.open = null;
      if (gone(ui.selected)) ui.selected = null;
      for (const p of pinned) if (gone(p)) dispatch('journal', 'unpin', { adventure: adv, path: p });
    }
  }

  // ---- Context menu ----
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const moveItems = (path: string): MenuItem[] =>
    folders.map((f) => ({ label: f.name, depth: f.depth, icon: f.depth ? Folder : undefined, disabled: !canMoveInto(path, f.path), action: () => void moveTo(path, f.path) }));
  function folderMenu(path: string, name: string, isRoot: boolean): MenuItem[] {
    return [
      { label: t('journal.newNoteHere'), icon: FilePlus, action: () => void newPage(path) },
      { label: t('journal.newSubfolder'), icon: FolderPlus, action: () => startFolder(path) },
      ...(isRoot
        ? []
        : [
            { label: t('action.rename'), icon: Pencil, action: () => startRename({ path, name }) },
            { label: t('journal.moveTo'), icon: FolderInput, items: moveItems(path) },
            { label: t('journal.deleteFolder'), icon: Trash2, danger: true, action: () => void trash(path) },
          ]),
    ];
  }
  function fileMenu(path: string): MenuItem[] {
    const pdf = isPdf(path);
    const isPinned = pinned.includes(path);
    return [
      {
        label: t('action.rename'),
        icon: Pencil,
        action: () => {
          openPage(path);
          ui.fresh = true;
        },
      },
      { label: t('journal.moveTo'), icon: FolderInput, items: moveItems(path) },
      { label: isPinned ? t('journal.unpin') : t('journal.pinShort'), icon: isPinned ? PinOff : Pin, action: () => dispatch('journal', isPinned ? 'unpin' : 'pin', { adventure: adv, path }) },
      { label: t('journal.openExternalShort'), icon: ExternalLink, action: () => window.api.openFile(path) },
      { label: t(pdf ? 'pdf.delete' : 'journal.deleteNote'), icon: Trash2, danger: true, action: () => void trash(path) },
    ];
  }
  const openMenu = (e: MouseEvent, items: MenuItem[]) => (menu = { ...menuAt(e), items });

  const filesOf = (f: VaultFolder) =>
    applyOrder(
      f.files.filter((x) => x.kind === 'page' || x.kind === 'pdf'),
      (x) => x.path,
      groups[f.path]
    );
  const textOf = (path: string) => journal.pages.find((p) => p.path === path);
</script>

{#snippet more(items: () => MenuItem[])}
  <button class="icon-btn more" title={t('action.more')} onclick={(e) => openMenu(e, items())}><MoreHorizontal size={14} /></button>
{/snippet}

{#snippet folderNode(f: VaultFolder, depth: number)}
  {@const files = filesOf(f)}
  {@const ids = files.map((x) => x.path)}
  {@const open = !ui.collapsed.includes(f.path)}
  {#if depth > 0}
    <div
      class="row folder"
      class:over={over === f.path}
      class:selected={ui.selected === f.path}
      style:--d={depth - 1}
      role="treeitem"
      aria-selected={ui.selected === f.path}
      aria-expanded={open}
      tabindex="-1"
      data-drop-folder={f.path}
      draggable={renaming !== f.path}
      ondragstart={(e) => {
        dragFolder = f.path;
        e.dataTransfer?.setData('text/plain', f.path);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      }}
      ondragend={() => ((dragFolder = null), (over = null))}
      ondragover={(e) => dragover(e, f.path)}
      ondragleave={() => over === f.path && (over = null)}
      ondrop={(e) => drop(e, f.path)}
      oncontextmenu={(e) => openMenu(e, folderMenu(f.path, f.name, false))}
    >
      {#if renaming === f.path}
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="rename"
          type="text"
          autofocus
          bind:value={renameTo}
          onkeydown={(e) => (e.key === 'Enter' ? finishRename() : e.key === 'Escape' && (renaming = null))}
          onblur={finishRename}
        />
      {:else}
        <button class="name" data-nav data-depth={depth - 1} aria-expanded={open} onclick={() => clickFolder(f.path)} ondblclick={() => startRename(f)}>
          {#if open}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
          <Folder size={14} />
          <span class="t">{f.name}</span>
        </button>
        {#if ui.selected === f.path}{@render more(() => folderMenu(f.path, f.name, false))}{/if}
      {/if}
    </div>
  {/if}
  {#if open}
    {#if naming === f.path}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="new-folder"
        style:--d={depth}
        type="text"
        placeholder={t('journal.folderName')}
        autofocus
        bind:value={folderName}
        onkeydown={(e) => (e.key === 'Enter' ? makeFolder() : e.key === 'Escape' && (naming = null))}
        onblur={makeFolder}
      />
    {/if}
    {#each f.folders as sub (sub.path)}{@render folderNode(sub, depth + 1)}{/each}
    {#each files as file (file.path)}
      <div class="file" class:active={ui.open === file.path} style:--d={depth} data-drop-folder={f.path} oncontextmenu={(e) => openMenu(e, fileMenu(file.path))} role="none">
        <button
          class="row page"
          data-nav
          data-depth={depth}
          class:active={ui.open === file.path}
          style:--d={depth}
          title={textOf(file.path) ? preview(textOf(file.path)!) : file.path}
          onclick={() => {
            ui.selected = null;
            openPage(file.path);
          }}
          use:sortable={{ group: f.path, id: file.path, ids, vertical: true, file: file.path }}
        >
          {#if file.kind === 'pdf'}<BookOpen size={13} class="pdf-icon" />{/if}
          <span class="t">{pageTitle(file.path)}</span>
          {#if pinned.includes(file.path)}<Pin size={11} class="pin-mark" />{/if}
        </button>
        {#if ui.open === file.path}{@render more(() => fileMenu(file.path))}{/if}
      </div>
    {/each}
  {/if}
{/snippet}

<div class="panel">
  <div class="top">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder={t('journal.search')} bind:value={ui.query} />
    </label>
  </div>
  <div class="actions">
    <button class="btn" title={t('journal.newNoteIn', { folder: targetName })} onclick={() => newPage(target)}><FilePlus size={14} /> {t('journal.newNoteShort')}</button>
    <button
      class="btn"
      title={t('journal.newFolderIn', { folder: targetName })}
      disabled={!folders.some((f) => f.path === target)}
      onclick={() => startFolder(target)}><FolderPlus size={14} /> {t('journal.newFolderShort')}</button
    >
  </div>

  {#if found}
    <div class="count faint">{t('journal.found', { count: found.length + foundPdfs.length })}</div>
    <ul class="results">
      {#each foundPdfs as p (p.path)}
        <li>
          <button data-nav class:active={ui.open === p.path} onclick={() => openPage(p.path)} oncontextmenu={(e) => openMenu(e, fileMenu(p.path))}>
            <span class="t"><BookOpen size={12} /> {p.title}</span>
            <span class="s">PDF</span>
          </button>
        </li>
      {/each}
      {#each found as p (p.path)}
        <li>
          <button data-nav class:active={ui.open === p.path} onclick={() => openPage(p.path)} oncontextmenu={(e) => openMenu(e, fileMenu(p.path))}>
            <span class="t">{p.title}</span>
            <span class="s">{preview(p) || t('journal.emptyShort')}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    {#each roots as r (r.folder.path)}
      <section>
        <div
          class="group"
          class:over={over === r.folder.path}
          class:selected={ui.selected === r.folder.path}
          role="treeitem"
          aria-selected={ui.selected === r.folder.path}
          tabindex="-1"
          data-drop-folder={r.folder.path}
          ondragover={(e) => dragover(e, r.folder.path)}
          ondragleave={() => over === r.folder.path && (over = null)}
          ondrop={(e) => drop(e, r.folder.path)}
          oncontextmenu={(e) => openMenu(e, folderMenu(r.folder.path, r.title, true))}
        >
          <button class="gname" onclick={() => (ui.selected = ui.selected === r.folder.path ? null : r.folder.path)}><span class="t">{r.title}</span></button>
          {#if ui.selected === r.folder.path}{@render more(() => folderMenu(r.folder.path, r.title, true))}{/if}
        </div>
        <div role="tree">{@render folderNode(r.folder, 0)}</div>
      </section>
    {/each}
    {#if !journal.pages.length && !journalPdfs().length && journal.loaded}
      <p class="faint empty">
        {t('journal.none')}
      </p>
    {:else}
      <p class="faint hint"><Lead text={t('journal.treeHint')} /></p>
    {/if}
  {/if}
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 8px;
  }
  .top {
    display: flex;
    gap: 4px;
  }
  .actions {
    display: flex;
    gap: 4px;
  }
  .actions .btn {
    flex: 1;
    justify-content: center;
    min-width: 0;
    font-size: 12px;
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
  section {
    margin-top: 4px;
  }
  .group {
    display: flex;
    align-items: center;
    padding: 0 4px 0 0;
    border-radius: var(--radius-s);
  }
  .gname {
    flex: 1;
    min-width: 0;
    padding: 3px 8px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .row {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 26px;
    padding: 0 4px 0 calc(8px + var(--d, 0) * 14px);
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
  }
  .row:hover,
  .group:hover {
    background: var(--bg-hover);
  }
  .file {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  .file .row {
    flex: 1;
    min-width: 0;
  }
  .file.active {
    background: var(--bg-active);
  }
  .file.active .row:hover {
    background: none;
  }
  .page {
    cursor: pointer;
  }
  .page :global(.pdf-icon) {
    flex: none;
    margin-right: 5px;
    color: var(--text-muted);
  }
  .page :global(.pin-mark) {
    flex: none;
    margin-left: 4px;
    color: var(--accent);
  }
  .folder.selected,
  .group.selected {
    background: var(--bg-active);
  }
  .folder .name {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 4px;
    padding: 3px 0;
    border: 0;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .t {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .more {
    flex: none;
    padding: 2px;
  }
  .over {
    outline: 1px dashed var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .rename {
    flex: 1;
    min-width: 0;
    font-size: 13px;
  }
  .new-folder {
    margin-left: calc(8px + var(--d, 0) * 14px);
    width: calc(100% - 8px - var(--d, 0) * 14px);
    font-size: 13px;
  }
  .count {
    font-size: 12px;
  }
  .results {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .results button {
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
  .results button:hover {
    background: var(--bg-hover);
  }
  .results button.active {
    background: var(--bg-active);
  }
  .s {
    overflow: hidden;
    color: var(--text-faint);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty,
  .hint {
    font-size: 12px;
  }
  .hint {
    margin: 8px 4px 0;
  }
</style>
