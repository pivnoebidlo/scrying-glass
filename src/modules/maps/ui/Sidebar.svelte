<!-- Боковая панель: карты, сгруппированные по месту в хранилище. Двойной щелчок по названию — переименовать файл.
     The eye (show to players) is always visible; the rest — a right click or «⋯» on the selected map. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { Eye, EyeOff, Map, MoreHorizontal, Pencil, Trash2 } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { mapGroups, mapName } from '../library';
  import { ui } from './ui.svelte';
  import PasteButton from '../../../renderer/lib/PasteButton.svelte';
  import { sortable } from '../../../renderer/lib/sortable';

  let { ms, app }: ModuleProps<'maps'> = $props();
  const groups = $derived(app.vault.tree ? mapGroups(app.vault.tree, app.vault.name, ms, app.adventures) : []);

  function select(path: string) {
    ui.selected = path;
    openTab('maps');
  }

  // Переименование: какая карта сейчас правится (поле вместо названия).
  let renaming = $state<string | null>(null);
  async function rename(path: string, name: string) {
    renaming = null;
    if (!name.trim() || name.trim() === mapName(path)) return;
    const next = await window.api.renameFile(path, name);
    if (next && ui.selected === path) ui.selected = next;
  }

  const toggleShown = (p: string) => dispatch('maps', ms.current === p ? 'clear' : 'show', { path: p });
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const items = (p: string): MenuItem[] => [
    { label: t('maps.open'), icon: Map, action: () => select(p) },
    { label: ms.current === p ? t('maps.removeFromPlayers') : t('maps.showToPlayers'), icon: ms.current === p ? EyeOff : Eye, action: () => toggleShown(p) },
    { label: t('action.rename'), icon: Pencil, action: () => (renaming = p) },
    { label: t('maps.toTrash'), icon: Trash2, danger: true, action: () => dispatch('vault', 'trash', { paths: [p] }) },
  ];
  const openMenu = (e: MouseEvent, p: string) => (menu = { ...menuAt(e), items: items(p) });
</script>

<div class="list">
  <!-- Без ⌘V: боковая панель карт может быть открыта рядом с чужой вкладкой, где ⌘V значит своё. -->
  <div class="tools"><PasteButton {app} role="maps" hotkey={false} /></div>
  {#each groups as g (g.key)}
    <div class="group faint" title={g.key}>{g.title}</div>
    {#each g.items as p (p)}
      <!-- Перетаскивается в подборку правой панели. -->
      <div class="item" class:active={ui.selected === p} class:shown={ms.current === p} use:sortable={{ group: '', id: p, ids: [], disabled: true, file: p }} oncontextmenu={(e) => openMenu(e, p)} role="none">
        {#if renaming === p}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="rename"
            type="text"
            value={mapName(p)}
            autofocus
            onfocus={(e) => e.currentTarget.select()}
            onblur={(e) => rename(p, e.currentTarget.value)}
            onkeydown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              else if (e.key === 'Escape') {
                e.currentTarget.value = mapName(p);
                renaming = null;
              }
            }}
          />
        {:else}
          <button class="main" data-nav title={t('maps.renameHint', { path: p })} onclick={() => select(p)} ondblclick={() => (renaming = p)}>
            <Map size={14} />
            <span class="name">{mapName(p)}</span>
          </button>
        {/if}
        <button
          class="icon-btn show"
          class:active={ms.current === p}
          title={ms.current === p ? t('maps.removeFromPlayers') : t('maps.showToPlayers')}
          onclick={() => toggleShown(p)}
        >
          <Eye size={13} />
        </button>
        {#if ui.selected === p}<button class="icon-btn more" title={t('action.more')} onclick={(e) => openMenu(e, p)}><MoreHorizontal size={13} /></button>{/if}
      </div>
    {/each}
  {:else}
    <p class="faint hint">
      {t('maps.none')} {t('maps.putPictures')} <RoleFolderNames role="maps" /> {t('maps.appearHere')}
    </p>
  {/each}
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

<style>
  .list {
    padding: 0 6px 10px;
  }
  .tools {
    display: flex;
    padding: 4px 2px 0;
  }
  .group {
    padding: 10px 8px 4px;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  .item.shown .main {
    color: var(--accent);
  }
  .rename {
    flex: 1;
    min-width: 0;
    margin: 2px 4px;
    padding: 3px 6px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .show,
  .more {
    flex: none;
    width: 24px;
    height: 24px;
  }
  .show {
    color: var(--text-faint);
  }
  .show.active {
    color: var(--accent);
  }
  .hint {
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.5;
  }
</style>
