<!-- Боковая панель: сцены по порядку. Порядок меняется перетаскиванием. «Play» is always visible; the rest — a right
     click or «⋯» on the selected scene. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Clapperboard, FilePlus, GripVertical, MoreHorizontal, Pencil, Play, Plus, Trash2 } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import type { Scene } from '../types';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { activate } from '../apply';
  import { createEmpty, saveCurrent, ui } from './ui.svelte';
  import { scenesFor } from '../types';

  let { ms, app }: ModuleProps<'scenes'> = $props();

  // Сцены текущего приключения и общие.
  const list = $derived(scenesFor(ms, app.adventures));

  let dragged = $state<string | null>(null);
  let over = $state<number | null>(null);

  // Бросили перед сценой с номером index в показанном списке.
  function drop(index: number) {
    if (dragged) dispatch('scenes', 'move', { id: dragged, before: list[index]?.id ?? null });
    dragged = null;
    over = null;
  }

  const open = (id: string) => {
    ui.selected = id;
    openTab('scenes');
  };
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const items = (sc: Scene): MenuItem[] => [
    { label: t('scenes.activate'), icon: Play, action: () => activate(app, sc) },
    { label: t('scenes.edit'), icon: Pencil, action: () => open(sc.id) },
    { label: t('scenes.delete'), icon: Trash2, danger: true, action: () => confirm(t('scenes.confirmDelete', { name: sc.name })) && dispatch('scenes', 'remove', { id: sc.id }) },
  ];
  const openMenu = (e: MouseEvent, sc: Scene) => (menu = { ...menuAt(e), items: items(sc) });
</script>

<div class="list">
  {#each list as sc, i (sc.id)}
    <div
      class="item"
      class:active={ui.selected === sc.id}
      class:live={ms.active === sc.id}
      class:over-top={over === i}
      draggable="true"
      role="listitem"
      ondragstart={() => (dragged = sc.id)}
      ondragend={() => ((dragged = null), (over = null))}
      ondragover={(e) => { e.preventDefault(); over = i; }}
      ondrop={() => drop(i)}
      oncontextmenu={(e) => openMenu(e, sc)}
    >
      <span class="grip faint"><GripVertical size={12} /></span>
      <button class="main" data-nav onclick={() => open(sc.id)}>
        <span class="name">{sc.name}</span>
      </button>
      <button class="icon-btn play" class:live={ms.active === sc.id} title={t('scenes.activate')} onclick={() => activate(app, sc)}><Play size={13} /></button>
      {#if ui.selected === sc.id}<button class="icon-btn more" title={t('action.more')} onclick={(e) => openMenu(e, sc)}><MoreHorizontal size={13} /></button>{/if}
    </div>
  {/each}
  {#if list.length}
    <!-- Место в конце списка, чтобы можно было перетащить сцену последней. -->
    <div
      class="tail"
      class:over-top={over === list.length}
      role="listitem"
      ondragover={(e) => { e.preventDefault(); over = list.length; }}
      ondrop={() => drop(list.length)}
    ></div>
  {:else}
    <p class="faint hint">
      <Clapperboard size={12} /> {t('scenes.about')}
    </p>
  {/if}
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

<div class="actions">
  <button class="btn" title={t('scenes.saveCurrentHint')} onclick={() => saveCurrent()}><Plus size={14} /> {t('scenes.saveCurrent')}</button>
  <button class="btn" title={t('scenes.emptyHint')} onclick={createEmpty}><FilePlus size={14} /> {t('scenes.empty')}</button>
</div>

<style>
  .list {
    padding: 0 6px;
  }
  .item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
    border-top: 2px solid transparent;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.active {
    background: var(--bg-active);
  }
  .item.live .name {
    color: var(--accent);
  }
  .over-top {
    border-top-color: var(--accent) !important;
  }
  .tail {
    height: 12px;
    border-top: 2px solid transparent;
  }
  .grip {
    display: inline-flex;
    padding-left: 2px;
    cursor: grab;
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 6px;
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
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .play,
  .more {
    flex: none;
    width: 24px;
    height: 24px;
  }
  .play {
    color: var(--text-faint);
  }
  .play:hover,
  .play.live {
    color: var(--accent);
  }
  .hint {
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
  }
  .actions .btn {
    width: 100%;
    justify-content: center;
  }
</style>
