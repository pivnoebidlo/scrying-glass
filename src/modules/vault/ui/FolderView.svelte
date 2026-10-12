<!-- Вкладка «Файлы»: содержимое выбранной папки хранилища. -->
<script lang="ts">
  import { ChevronRight, FilePlus, FolderOpen, Music } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { findFolder, folderRole } from '../../../shared/vault';
  import ImageCard from '../../../renderer/lib/ImageCard.svelte';
  import { audioActions } from '../../../renderer/lib/registry';
  import { store } from '../../../renderer/lib/store.svelte';
  import { trackName } from '../../../shared/vault';
  import { folderIcon, ui } from './ui.svelte';

  let { ms }: ModuleProps<'vault'> = $props();

  // Если выбранную папку удалили, показываем корень.
  const folder = $derived(ms.tree ? (findFolder(ms.tree, ui.folder) ?? ms.tree) : null);
  const crumbs = $derived.by(() => {
    if (!folder?.path) return [];
    const parts = folder.path.split('/');
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
  });
  const images = $derived(folder?.files.filter((f) => f.kind === 'image') ?? []);
  const audio = $derived(folder?.files.filter((f) => f.kind === 'audio') ?? []);
  // Что делает клик по картинке: в папках персонажей — портрет, в папках карт — карта, в остальных — на весь экран.
  const role = $derived(folder ? folderRole(folder.name) : null);
  const primary = $derived(role === 'characters' ? 'portrait' : role === 'maps' ? 'map' : 'background');
  const PRIMARY_HINT: Record<string, string> = { portrait: 'портретом', map: 'картой', background: 'на весь экран' };

  function go(path: string) {
    ui.folder = path;
    // Раскрываем ветку в дереве, чтобы было видно, где мы.
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) ui.expanded[parts.slice(0, i).join('/')] = true;
  }
</script>

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

    {#if images.length}
      <h3>Картинки <span class="faint">{images.length}</span></h3>
      <p class="faint hint">
        Нажмите на картинку, чтобы показать её игрокам {PRIMARY_HINT[primary]}. Другие варианты — в
        кнопках при наведении.
      </p>
      <div class="grid">
        {#each images as f (f.path)}
          <ImageCard path={f.path} {primary} aspect={role === 'characters' ? '3 / 4' : '4 / 3'}>
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
            {#each on as a (a.id)}<span class="badge">{a.badge}</span>{/each}
            {#each audioActions as a (a.id)}
              <button class="icon-btn" class:active={a.active(store.state, f.path)} title={a.title} onclick={() => a.toggle(store.state, f.path)}>
                <a.icon size={14} />
              </button>
            {/each}
          </li>
        {/each}
      </ul>
    {/if}

    {#if !folder.folders.length && !folder.files.length}
      <div class="empty faint">Папка пуста. Добавьте файлы кнопкой выше или через Finder.</div>
    {/if}
  </div>
{/if}

<style>
  .view {
    padding: 0 20px 20px;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
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
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
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
