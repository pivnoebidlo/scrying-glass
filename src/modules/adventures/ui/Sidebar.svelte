<!-- The side panel of the «Adventures» tab: the adventures by name (a click makes one current and shows the tab) and
     the whole vault; ↑ ↓ walk the list (listNav). -->
<script lang="ts">
  import { Castle, Library } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { shownAdventures, systemFor } from '../../../shared/adventures';
  import { systems } from '../../../systems';

  let { ms }: ModuleProps<'adventures'> = $props();
  const list = $derived(shownAdventures(ms));
  const systemTitle = (a: string | null) => {
    const id = systemFor(ms, a);
    return systems.find((s) => s.id === id)?.title ?? id;
  };
  function select(path: string | null) {
    dispatch('adventures', 'select', { path });
    openTab('adventures');
  }
</script>

<div class="list">
  {#each list as a (a)}
    <button class="item" class:active={ms.current === a} data-nav onclick={() => select(a)}>
      <Castle size={14} />
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
