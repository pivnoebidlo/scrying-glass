<!-- Левая боковая панель выбранного модуля. Стрелки в её списках — listNav (пункты помечает модуль). -->
<script lang="ts">
  import { controlContributions } from '../lib/registry';
  import { store } from '../lib/store.svelte';
  import { listNav } from '../lib/listnav';
  import { t } from '../lib/i18n.svelte';
  import { PanelLeftClose } from '@lucide/svelte';
  import { TITLE_ROW, workspace } from './workspace.svelte';

  const c = $derived(controlContributions.find((x) => x.id === workspace.sidebar));
  const headers = controlContributions.filter((x) => x.header);
  // Modules whose button is in the title row (as the file explorer in Obsidian), not in the ribbon.
  const top = controlContributions.filter((x) => TITLE_ROW.includes(x.id));
</script>

<aside class="sidebar">
  <!-- The title row: Files, as in Obsidian, and «hide the panel»; drags the window (without the system title bar). -->
  <div class="title-row drag">
    {#each top as m (m.id)}
      <button class="icon-btn" class:active={workspace.sidebar === m.id} title={m.title} onclick={() => (workspace.sidebar === m.id ? workspace.openTab(m.id) : workspace.select(m.id))}><m.icon size={16} /></button>
    {/each}
    <div class="grow"></div>
    <button class="icon-btn faint-btn" title={t('app.hideSidebar')} onclick={() => (workspace.sidebarOpen = false)}><PanelLeftClose size={15} /></button>
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
    gap: 2px;
    height: var(--title-h);
    padding: 0 8px;
    border-bottom: 1px solid var(--border);
  }
  .grow {
    flex: 1;
  }
  .title-row .icon-btn {
    width: 28px;
    height: 28px;
  }
  .title-row .faint-btn {
    color: var(--text-faint);
  }
  .empty {
    padding: 0 12px;
  }
</style>
