<!-- Левая боковая панель выбранного модуля. Стрелки в её списках — listNav (пункты помечает модуль). -->
<script lang="ts">
  import { controlContributions } from '../lib/registry';
  import { store } from '../lib/store.svelte';
  import { listNav } from '../lib/listnav';
  import { t } from '../lib/i18n.svelte';
  import { workspace } from './workspace.svelte';

  const c = $derived(controlContributions.find((x) => x.id === workspace.sidebar));
  const headers = controlContributions.filter((x) => x.header);
</script>

<aside class="sidebar">
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
  .empty {
    padding: 0 12px;
  }
</style>
