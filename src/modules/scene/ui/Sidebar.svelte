<!-- Боковая панель «Фонов»: папки фонов из хранилища. -->
<script lang="ts">
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { folderMenu } from '../../vault/ui/folderMenu.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Images, Wallpaper } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { imageGroups } from '../../portraits/library';
  import { ui } from './ui.svelte';

  let { app }: ModuleProps<'scene'> = $props();
  const groups = $derived(app.vault.tree ? imageGroups(app.vault.tree, app.vault.name, 'backgrounds', app.adventures) : []);
  const total = $derived(groups.reduce((n, g) => n + g.items.length, 0));
  // A folder's menu (a right click): the same as in the Files tree.
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const groupMenu = (e: MouseEvent, path: string) => {
    ui.group = path;
    menu = { ...menuAt(e), items: folderMenu(path) };
  };
</script>

<div class="list">
  <button class="item" data-nav class:active={ui.group === 'all'} onclick={() => (ui.group = 'all')}>
    <Images size={14} />
    <span class="name">{t('scene.all')}</span>
    <span class="count">{total}</span>
  </button>
  {#each groups as g (g.key)}
    <button class="item" data-nav class:active={ui.group === g.key} title={g.key} onclick={() => (ui.group = g.key)} oncontextmenu={(e) => groupMenu(e, g.key)}>
      <Wallpaper size={14} />
      <span class="name">{g.title}</span>
      <span class="count">{g.items.length}</span>
    </button>
  {/each}
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

<style>
  .list {
    padding: 0 6px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
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
</style>
