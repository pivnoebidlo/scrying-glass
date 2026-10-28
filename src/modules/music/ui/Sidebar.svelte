<!-- Боковая панель: плейлисты (папки с музыкой). -->
<script lang="ts">
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { ListMusic, Play } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { playlists } from './playlists';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'music'> = $props();
  const list = $derived(app.vault.tree ? playlists(app.vault.tree, app.vault.name, app.adventures) : []);
  // A row's menu (a right click): its actions.
  let rowMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const rowMenuAt = (e: MouseEvent, items: MenuItem[]) => (rowMenu = { ...menuAt(e), items });
  const playlistMenu = (e: MouseEvent, path: string) =>
    rowMenuAt(e, [
      { label: t('music.play'), icon: Play, action: () => void dispatch('music', 'playFolder', { folder: path }) },
      { label: t('music.openList'), icon: ListMusic, action: () => ((ui.selected = path), openTab('music')) },
    ]);
</script>

<div class="list">
  {#each list as p (p.path)}
    <div class="item" class:active={ui.selected === p.path} class:playing={ms.playlist === p.path && ms.playing} oncontextmenu={(e) => playlistMenu(e, p.path)} role="none">
      <button class="main" data-nav title={p.path} onclick={() => { ui.selected = p.path; openTab('music'); }}>
        <ListMusic size={14} />
        <span class="name">{p.title}</span>
        <span class="count">{p.count}</span>
      </button>
      <button class="icon-btn play" title={t('music.play')} onclick={() => dispatch('music', 'playFolder', { folder: p.path })}>
        <Play size={13} />
      </button>
    </div>
  {:else}
    <p class="faint hint">
      {t('music.noMusicSide')} <RoleFolderNames role="music" /> {t('music.appearsHere')}
    </p>
  {/each}
</div>

{#if rowMenu}<ContextMenu x={rowMenu.x} y={rowMenu.y} items={rowMenu.items} onclose={() => (rowMenu = null)} />{/if}

<style>
  .list {
    padding: 0 6px;
  }
  .item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.active {
    background: var(--bg-active);
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border: 0;
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .item:hover .main,
  .item.active .main {
    color: var(--text-normal);
  }
  .item.playing .main {
    color: var(--accent);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    color: var(--text-faint);
    font-size: 12px;
  }
  .play {
    flex: none;
    width: 24px;
    height: 24px;
    color: var(--text-faint);
  }
  .play:hover,
  .item.playing .play {
    color: var(--accent);
  }
  .hint {
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.5;
  }
</style>
