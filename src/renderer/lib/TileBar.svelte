<!-- The top of a tile (a picture, a note, a canvas): the tab's main action as a labelled button on the left (accented
     when it is on) and «⋯» on the right with every action of the tile. Always visible, over the picture. The tile opens
     the same menu on a right click: bind:this and call openMenu(e). -->
<script lang="ts">
  import type { Component } from 'svelte';
  import { MoreHorizontal } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from './ContextMenu.svelte';
  import { t } from './i18n.svelte';

  let {
    main,
    items,
  }: {
    main?: { icon: Component<{ size?: number }>; label: string; title?: string; on: boolean; run: () => void } | null;
    items: () => MenuItem[];
  } = $props();

  let menu = $state<{ x: number; y: number } | null>(null);
  export const openMenu = (e: MouseEvent) => (menu = menuAt(e));
</script>

<div class="bar">
  {#if main}
    <button class="main" class:on={main.on} title={main.title ?? main.label} onclick={main.run}>
      <main.icon size={13} />
      <span class="l">{main.label}</span>
    </button>
  {/if}
  <button class="more" title={t('action.more')} onclick={openMenu}><MoreHorizontal size={14} /></button>
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={items()} onclose={() => (menu = null)} />{/if}

<style>
  .bar {
    position: absolute;
    left: 6px;
    right: 6px;
    top: 6px;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    pointer-events: none;
  }
  .bar button {
    pointer-events: auto;
  }
  /* Dark pills over a picture: the same in every theme (the colours of a picture are not the theme's). */
  .main,
  .more {
    height: 24px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    cursor: pointer;
  }
  .main:hover,
  .more:hover {
    background: rgba(0, 0, 0, 0.85);
  }
  .main {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 5px;
    padding: 0 9px 0 7px;
    font-size: 11px;
  }
  .main.on {
    background: var(--accent);
    color: var(--on-accent);
  }
  .main :global(svg) {
    flex: none;
  }
  .l {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .more {
    display: grid;
    flex: none;
    place-items: center;
    width: 24px;
    margin-left: auto;
    padding: 0;
  }
</style>
