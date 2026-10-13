<!-- Вкладка «Файлы»: содержимое выбранной папки хранилища. -->
<script lang="ts">
  import { ChevronRight, ClipboardPaste, Download, FilePlus, FolderOpen, Map, Music, Trash2 } from '@lucide/svelte';
  import { badgeOf, type ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { findFolder, folderRole } from '../../../shared/vault';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import { audioActions } from '../../../renderer/lib/registry';
  import { store } from '../../../renderer/lib/store.svelte';
  import { trackName } from '../../../shared/vault';
  import { folderIcon, ui } from './ui.svelte';
  import CardRow from './CardRow.svelte';
  import { onMount } from 'svelte';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { dirname } from '../../../shared/vault';
  import ThumbSize from '../../../renderer/lib/ThumbSize.svelte';
  import { thumbs } from '../../../renderer/lib/thumbs.svelte';

  let { ms, app }: ModuleProps<'vault'> = $props();

  // Если выбранную папку удалили, показываем корень.
  const folder = $derived(ms.tree ? (findFolder(ms.tree, ui.folder) ?? ms.tree) : null);

  // Папка первого уровня может быть приключением: отсюда его отмечают и открывают.
  const topLevel = $derived(!!folder?.path && !folder.path.includes('/') && !folderRole(folder.name));
  const isAdventure = $derived(!!folder && app.adventures.list.includes(folder.path));
  const crumbs = $derived.by(() => {
    if (!folder?.path) return [];
    const parts = folder.path.split('/');
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
  });
  const images = $derived(folder?.files.filter((f) => f.kind === 'image') ?? []);

  // Карточки (*.json) этой папки — их знает бестиарий, дерево хранилища показывает только картинки и музыку.
  onMount(connectCards);
  const cards = $derived(
    folder ? bestiary.all.filter((c) => c.ref.scope === 'vault' && c.file && dirname(c.file) === folder.path).sort((a, b) => a.name.localeCompare(b.name, 'ru')) : []
  );
  // Папка карточек — монстры, персонажи или партия (или вложенная в такую): сюда можно создавать и импортировать.
  const cardFolder = $derived(
    !!folder?.path && folder.path.split('/').some((p) => ['bestiary', 'characters', 'party'].includes(folderRole(p) ?? ''))
  );
  const audio = $derived(folder?.files.filter((f) => f.kind === 'audio') ?? []);
  // Что делает клик по картинке: в папках персонажей — портрет, в папках карт — карта, в остальных — на весь экран.
  const role = $derived(folder ? folderRole(folder.name) : null);
  const primary = $derived(
    role === 'characters' || role === 'party' ? 'portrait' : role === 'maps' ? 'map' : role === 'handouts' ? 'handout' : 'background'
  );
  const PRIMARY_HINT: Record<string, string> = { portrait: 'портретом', map: 'картой', background: 'на весь экран', handout: 'раздаткой' };

  // ⌘V во вкладке «Файлы» — вставить картинку из буфера в открытую папку (если фокус не в поле ввода).
  function onkeydown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    if (!(e.metaKey || e.ctrlKey) || e.code !== 'KeyV' || !folder) return;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    dispatch('vault', 'pasteImage', { folder: folder.path });
  }

  function go(path: string) {
    ui.folder = path;
    // Раскрываем ветку в дереве, чтобы было видно, где мы.
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) ui.expanded[parts.slice(0, i).join('/')] = true;
  }
</script>

<svelte:window {onkeydown} />

{#if folder}
  <div class="view">
    <header class="toolbar">
      <nav class="crumbs">
        <button class="crumb" onclick={() => go('')}>{ms.name}</button>
        {#each crumbs as c (c.path)}
          <ChevronRight size={12} class="faint" />
          <button class="crumb" onclick={() => go(c.path)}>{c.name}</button>
        {/each}
      </nav>
      <div class="spacer"></div>
      {#if cardFolder}
        <button class="btn" title="Новая карточка в этой папке" onclick={() => bestiary.create({ scope: 'vault', folder: folder.path })}>
          <FilePlus size={14} /> Новая карточка
        </button>
        <button
          class="btn"
          title="Карточки Scrying Glass или персонаж из Long Story Short (экспорт листа в JSON) — в эту папку"
          onclick={() => bestiary.importFiles({ scope: 'vault', folder: folder.path })}
        >
          <Download size={14} /> Импорт карточек…
        </button>
      {/if}
      {#if topLevel && isAdventure}
        <span class="badge-adv"><Map size={12} /> приключение</span>
        {#if app.adventures.current !== folder.path}
          <button class="btn primary" onclick={() => dispatch('adventures', 'select', { path: folder.path })}>Открыть приключение</button>
        {/if}
        <button
          class="btn"
          title="Папка останется как есть, её содержимое станет общим для всех приключений"
          onclick={() => dispatch('adventures', 'unmark', { path: folder.path })}>Больше не приключение</button
        >
      {:else if topLevel}
        <button
          class="btn"
          title="Вкладки будут показывать содержимое этой папки отдельно; недостающие папки characters, monsters, backgrounds, maps, music появятся сами"
          onclick={() => dispatch('adventures', 'mark', { path: folder.path })}><Map size={14} /> Сделать приключением</button
        >
      {/if}
      <button class="btn" title="Вставить картинку из буфера обмена (⌘V)" onclick={() => dispatch('vault', 'pasteImage', { folder: folder.path })}>
        <ClipboardPaste size={14} /> Вставить
      </button>
      <button class="btn" onclick={() => dispatch('vault', 'importFiles', { folder: folder.path })}>
        <FilePlus size={14} /> Добавить файлы…
      </button>
      <button class="icon-btn" title="Показать в Finder" onclick={() => dispatch('vault', 'reveal', { folder: folder.path })}>
        <FolderOpen size={16} />
      </button>
    </header>

    {#if folder.folders.length}
      <div class="folders">
        {#each folder.folders as f (f.path)}
          {@const Icon = folderIcon(f.name)}
          <button class="folder" onclick={() => go(f.path)}>
            <Icon size={16} />
            <span class="name">{f.name}</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if cards.length}
      <h3>Карточки <span class="faint">{cards.length}</span></h3>
      <ul class="cards">
        {#each cards as c (c.ref.id)}<CardRow card={c} />{/each}
      </ul>
    {/if}

    {#if images.length}
      <div class="images-head">
        <h3>Картинки <span class="faint">{images.length}</span></h3>
        <ThumbSize grid="files" />
      </div>
      <p class="faint hint">
        Нажмите на картинку, чтобы показать её игрокам {PRIMARY_HINT[primary]}. Другие варианты — в
        кнопках при наведении.
      </p>
      <div class="grid" style:--thumb="{thumbs.files}px">
        {#each images as f (f.path)}
          <ImageCard path={f.path} {primary} aspect={role === 'characters' || role === 'party' || role === 'handouts' ? '3 / 4' : '4 / 3'}>
            <div class="file-name" title={f.name}>{f.name}</div>
          </ImageCard>
        {/each}
      </div>
    {/if}

    {#if audio.length}
      <h3>Музыка <span class="faint">{audio.length}</span></h3>
      <ul class="audio">
        {#each audio as f (f.path)}
          {@const on = audioActions.filter((a) => a.active(store.state, f.path))}
          <li class:on={on.length > 0}>
            <Music size={14} />
            <span class="track" title={f.name}>{trackName(f.path)}</span>
            {#each on as a (a.id)}<span class="badge">{badgeOf(a, store.state, f.path)}</span>{/each}
            {#each audioActions as a (a.id)}
              <button class="icon-btn" class:active={a.active(store.state, f.path)} title={a.title} onclick={() => a.toggle(store.state, f.path)}>
                <a.icon size={14} />
              </button>
            {/each}
            <button class="icon-btn trash" title="Переместить в Корзину" onclick={() => dispatch('vault', 'trash', { paths: [f.path] })}>
              <Trash2 size={14} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if !folder.folders.length && !folder.files.length && !cards.length}
      <div class="empty faint">Папка пуста. Добавьте файлы кнопкой выше или через Finder.</div>
    {/if}
  </div>
{/if}

<style>
  .trash:hover {
    color: var(--danger);
  }
  .view {
    padding: 0 20px 20px;
  }
  .badge-adv {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-hover);
    font-size: 12px;
  }
  /* Кнопок бывает много (папка карточек, приключение): они переносятся на вторую строку, а путь не сжимается. */
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    background: var(--bg-primary);
  }
  .spacer {
    flex: 1;
  }
  .crumbs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
    min-width: 0;
  }
  .crumb {
    white-space: nowrap;
    padding: 3px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .crumb:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .crumb:last-child {
    color: var(--text-normal);
    font-weight: 600;
  }
  .folders {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    margin-bottom: 8px;
  }
  .folder {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .folder:hover {
    border-color: var(--accent);
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cards {
    margin: 4px 0 8px;
    padding: 0;
    list-style: none;
  }
  .images-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;
  }
  .images-head h3 {
    margin-top: 0;
  }
  h3 {
    margin: 20px 0 2px;
    font-size: 14px;
  }
  .hint {
    margin: 0 0 10px;
    font-size: 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--thumb), 1fr));
    gap: 12px;
  }
  .file-name {
    padding: 6px 8px;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .audio {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .audio li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 2px 8px;
    border-radius: var(--radius-s);
    color: var(--text-muted);
  }
  .audio li:hover {
    background: var(--bg-hover);
  }
  .audio li.on {
    color: var(--accent);
  }
  .track {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11px;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
  }
</style>
