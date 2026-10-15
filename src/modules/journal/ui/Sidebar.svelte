<!-- Боковая панель журнала: поиск и дерево заметок — папки журнала приключения и общие, с подпапками. Заметки
     переставляются перетаскиванием внутри папки, перетаскивание на папку — перенос в неё. -->
<script lang="ts">
  import { ChevronDown, ChevronRight, FilePlus, Folder, FolderPlus, Search, Trash2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { draggedFile, sortable } from '../../../renderer/lib/sortable';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { applyOrder } from '../../../shared/order';
  import { pageTitle } from '../../../shared/journal';
  import { dirname, type VaultFolder } from '../../../shared/vault';
  import { journal, journalFolder, journalRoots, loadPages, preview, searchPages } from './store.svelte';
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
  const found = $derived((journal.pages, ui.query.trim() ? searchPages(ui.query) : null));
  const groups = $derived(app.order.groups);

  async function newPage(folder: string) {
    const path = await window.api.createPage(folder, 'Новая заметка', '');
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

  // Перенос заметки на папку.
  let over = $state<string | null>(null);
  const movable = (folder: string) => {
    const f = draggedFile();
    return !!f && /\.(md|txt)$/i.test(f) && dirname(f) !== folder && journal.pages.some((p) => p.path === f);
  };
  function dragover(e: DragEvent, folder: string) {
    if (!movable(folder)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    over = folder;
  }
  async function drop(e: DragEvent, folder: string) {
    over = null;
    const f = draggedFile();
    if (!f || !movable(folder)) return;
    e.preventDefault();
    const path = await window.api.movePage(f, folder);
    if (path && ui.open === f) ui.open = path;
  }

  const filesOf = (f: VaultFolder) =>
    applyOrder(
      f.files.filter((x) => x.kind === 'page'),
      (x) => x.path,
      groups[f.path]
    );
  const textOf = (path: string) => journal.pages.find((p) => p.path === path);
</script>

{#snippet folderNode(f: VaultFolder, depth: number)}
  {@const files = filesOf(f)}
  {@const ids = files.map((x) => x.path)}
  {@const open = !ui.collapsed.includes(f.path)}
  {#if depth > 0}
    <div
      class="row folder"
      class:over={over === f.path}
      style:--d={depth - 1}
      role="treeitem"
      aria-selected="false"
      aria-expanded={open}
      tabindex="-1"
      ondragover={(e) => dragover(e, f.path)}
      ondragleave={() => over === f.path && (over = null)}
      ondrop={(e) => drop(e, f.path)}
    >
      <button class="name" onclick={() => toggle(f.path)}>
        {#if open}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
        <Folder size={14} />
        <span class="t">{f.name}</span>
      </button>
      <span class="tools">
        <button class="icon-btn" title="Новая заметка в этой папке" onclick={() => newPage(f.path)}><FilePlus size={14} /></button>
        <button class="icon-btn" title="Новая папка внутри" onclick={() => startFolder(f.path)}><FolderPlus size={14} /></button>
        <button class="icon-btn" title="Удалить папку с заметками в корзину" onclick={() => dispatch('vault', 'trash', { paths: [f.path] })}><Trash2 size={14} /></button>
      </span>
    </div>
  {/if}
  {#if open}
    {#if naming === f.path}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="new-folder"
        style:--d={depth}
        type="text"
        placeholder="Название папки"
        autofocus
        bind:value={folderName}
        onkeydown={(e) => (e.key === 'Enter' ? makeFolder() : e.key === 'Escape' && (naming = null))}
        onblur={makeFolder}
      />
    {/if}
    {#each f.folders as sub (sub.path)}{@render folderNode(sub, depth + 1)}{/each}
    {#each files as file (file.path)}
      <button
        class="row page"
        class:active={ui.open === file.path}
        style:--d={depth}
        title={textOf(file.path) ? preview(textOf(file.path)!) : file.path}
        onclick={() => openPage(file.path)}
        use:sortable={{ group: f.path, id: file.path, ids, vertical: true, file: file.path }}
      >
        <span class="t">{pageTitle(file.path)}</span>
      </button>
    {/each}
  {/if}
{/snippet}

<div class="panel">
  <div class="top">
    <label class="search">
      <Search size={14} />
      <input type="text" placeholder="Поиск по заметкам" bind:value={ui.query} />
    </label>
    <button class="icon-btn" title="Новая заметка" onclick={() => newPage(home)}><FilePlus size={16} /></button>
  </div>

  {#if found}
    <div class="count faint">Найдено: {found.length}</div>
    <ul class="results">
      {#each found as p (p.path)}
        <li>
          <button class:active={ui.open === p.path} onclick={() => openPage(p.path)}>
            <span class="t">{p.title}</span>
            <span class="s">{preview(p) || 'пусто'}</span>
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
          role="treeitem"
          aria-selected="false"
          tabindex="-1"
          ondragover={(e) => dragover(e, r.folder.path)}
          ondragleave={() => over === r.folder.path && (over = null)}
          ondrop={(e) => drop(e, r.folder.path)}
        >
          <span class="t">{r.title}</span>
          <span class="tools">
            <button class="icon-btn" title="Новая заметка" onclick={() => newPage(r.folder.path)}><FilePlus size={14} /></button>
            <button class="icon-btn" title="Новая папка" onclick={() => startFolder(r.folder.path)}><FolderPlus size={14} /></button>
          </span>
        </div>
        <div role="tree">{@render folderNode(r.folder, 0)}</div>
      </section>
    {/each}
    {#if !journal.pages.length && journal.loaded}
      <p class="faint empty">
        Заметок пока нет. «+» — новая заметка: план сессии, текст для зачитывания, итоги игры, идеи.
      </p>
    {/if}
  {/if}
</div>

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
    padding: 2px 4px 2px 8px;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
  }
  .group .t {
    flex: 1;
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
  .row:hover {
    background: var(--bg-hover);
  }
  .page {
    cursor: pointer;
  }
  .page.active {
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
  .tools {
    display: none;
    gap: 2px;
  }
  .row:hover .tools,
  .group:hover .tools {
    display: flex;
  }
  .tools .icon-btn {
    padding: 2px;
  }
  .over {
    outline: 1px dashed var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
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
  .empty {
    font-size: 13px;
  }
</style>
