<!-- Левая боковая панель выбранного модуля. Стрелки в её списках — listNav (пункты помечает модуль). -->
<script lang="ts">
  import { hint } from '../../shared/hotkeys';
  import { controlContributions } from '../lib/registry';
  import { store } from '../lib/store.svelte';
  import { listNav } from '../lib/listnav';
  import { t } from '../lib/i18n.svelte';
  import { Dices, PanelLeftClose, Search } from '@lucide/svelte';
  import { openQuickSearch } from '../lib/quicksearch.svelte';
  import { rolls } from '../lib/rolls.svelte';
  import { workspace } from './workspace.svelte';

  const c = $derived(controlContributions.find((x) => x.id === workspace.sidebar));
  const headers = controlContributions.filter((x) => x.header);
</script>

<aside class="sidebar">
  <!-- The title row (the traffic lights in macOS stand on its left — nothing there): search ⌘K, the roll log, «hide the
       panel»; drags the window (without the system title bar). -->
  <div class="title-row drag">
    <button class="icon-btn faint-btn" title={hint(t('app.search'), 'search')} onclick={openQuickSearch}><Search size={17} /></button>
    <button class="icon-btn faint-btn" class:on={rolls.open} title={t('lib.rolls')} onclick={() => (rolls.open = !rolls.open)}><Dices size={17} /></button>
    <button class="icon-btn faint-btn" title={t('app.hideSidebar')} onclick={() => (workspace.sidebarOpen = false)}><PanelLeftClose size={18} /></button>
  </div>
  {#each headers as h (h.id)}
    {#if h.header}<h.header ms={store.state[h.id]} app={store.state} />{/if}
  {/each}
  {#if c}
    <div class="pane-title">{c.title}</div>
    <div class="body" use:listNav>
      {#if c.sidebar}
        <c.sidebar ms={store.state[c.id]} app={store.state} />
      {:else}
        <p class="faint empty">{t('app.noSidebar')}</p>
      {/if}
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 240px;
    flex: none;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
  }
  .body {
    flex: 1;
    overflow: auto;
  }
  .title-row {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: flex-end;
    height: var(--title-h);
    padding: 0 6px;
    border-bottom: 1px solid var(--border);
  }
  /* A little below the middle: in line with the tabs, which sit at the bottom of the row. */
  .title-row .icon-btn {
    width: 32px;
    height: 32px;
    margin-top: 6px;
  }
  .title-row .faint-btn {
    color: var(--text-faint);
  }
  .title-row .faint-btn.on {
    color: var(--text-normal);
  }
  .empty {
    padding: 0 12px;
  }
</style>
