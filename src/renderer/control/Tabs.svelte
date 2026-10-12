<!-- Рабочая область: вкладки модулей. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { controlContributions } from '../lib/registry';
  import { store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';

  const find = (id: string) => controlContributions.find((x) => x.id === id);
  const active = $derived(workspace.active ? find(workspace.active) : undefined);
</script>

<main class="workspace">
  <div class="tab-bar">
    {#each workspace.tabs as id (id)}
      {@const c = find(id)}
      {#if c}
        <div class="tab" class:active={workspace.active === id}>
          <button class="tab-label" onclick={() => (workspace.active = id)}>
            <c.icon size={14} />
            {c.title}
          </button>
          <button class="tab-close icon-btn" title="Закрыть" onclick={() => workspace.closeTab(id)}>
            <X size={13} />
          </button>
        </div>
      {/if}
    {/each}
  </div>

  <div class="content">
    {#if active?.view}
      {#key active.id}
        <active.view ms={store.state[active.id]} state={store.state} />
      {/key}
    {:else}
      <div class="placeholder faint">Выберите модуль на панели слева</div>
    {/if}
  </div>
</main>

<style>
  .workspace {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .tab-bar {
    display: flex;
    gap: 2px;
    height: 38px;
    flex: none;
    padding: 6px 8px 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .tab {
    display: flex;
    align-items: center;
    max-width: 220px;
    padding: 0 4px 0 10px;
    border-radius: var(--radius-m) var(--radius-m) 0 0;
    color: var(--text-muted);
  }
  .tab:hover {
    background: var(--bg-hover);
  }
  .tab.active {
    background: var(--bg-primary);
    color: var(--text-normal);
  }
  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 0 6px 0 0;
    border: 0;
    background: none;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tab-close {
    width: 20px;
    height: 20px;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .placeholder {
    display: grid;
    place-items: center;
    height: 100%;
  }
</style>
