<!-- The side panel of the «Adventures» tab: the adventures by name (a click makes one current and shows the tab) and
     the whole vault; ↑ ↓ walk the list (listNav). -->
<script lang="ts">
  import { BookOpen, Castle, CloudUpload, Download, ImagePlus, Library, Pencil, Trash2 } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { repo } from '../../repo/ui/repo.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { isSupplement, shownAdventures, systemFor } from '../../../shared/adventures';
  import { advUi } from './ui.svelte';
  import { systems } from '../../../systems';

  let { ms, app }: ModuleProps<'adventures'> = $props();
  // Adventures first, then supplements.
  const list = $derived(shownAdventures(ms).sort((a, b) => Number(isSupplement(ms, a)) - Number(isSupplement(ms, b))));
  const systemTitle = (a: string | null) => {
    const id = systemFor(ms, a);
    return systems.find((s) => s.id === id)?.title ?? id;
  };
  function select(path: string | null) {
    dispatch('adventures', 'select', { path });
    // A supplement opens on its own page; anything else — the tiles.
    advUi.supplement = path !== null && isSupplement(ms, path) ? path : null;
    openTab('adventures');
  }

  // A row's menu (a right click): the same as the «⋯» of its tile.
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  function openMenu(e: MouseEvent, a: string) {
    const supplement = isSupplement(ms, a);
    const onTab = (k: 'edit' | 'cover') => () => (openTab('adventures'), (advUi[k] = a));
    menu = {
      ...menuAt(e),
      items: [
        { label: t('adv.page.edit'), icon: Pencil, action: onTab('edit') },
        { label: t('adv.page.cover'), icon: ImagePlus, action: onTab('cover') },
        { label: t('adv.export', { name: a }), icon: Download, action: () => void window.api.exportAdventure(a) },
        {
          label: supplement ? t(app.repo.published[a] ? 'adv.supp.updateLong' : 'adv.page.publishBestiary') : t(app.repo.published[a] ? 'repo.menuUpdate' : 'repo.menuPublish', { name: a }),
          icon: CloudUpload,
          action: () => (repo.publish = a),
        },
        { label: t('adv.delete', { name: a }), icon: Trash2, danger: true, action: () => void window.api.deleteAdventure(a) },
      ],
    };
  }
</script>

<div class="list">
  {#each list as a (a)}
    <button class="item" class:active={ms.current === a} data-nav onclick={() => select(a)} oncontextmenu={(e) => openMenu(e, a)}>
      {#if isSupplement(ms, a)}<BookOpen size={14} />{:else}<Castle size={14} />{/if}
      <span class="text"><span class="name">{a}</span><span class="faint small">{systemTitle(a)}</span></span>
    </button>
  {/each}
  {#if list.length}
    <button class="item" class:active={ms.current === null} data-nav onclick={() => select(null)} title={t('adv.allHint')}>
      <Library size={14} />
      <span class="text"><span class="name">{t('adv.allVault')}</span><span class="faint small">{systemTitle(null)}</span></span>
    </button>
  {/if}
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

<style>
  .list {
    display: flex;
    flex-direction: column;
    padding: 6px 6px 10px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
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
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .small {
    font-size: 11px;
  }
</style>
