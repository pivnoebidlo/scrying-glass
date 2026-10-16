<!-- Рабочая область: вкладки модулей. Когда вкладки не помещаются, они сжимаются (название обрезается, до одной
     иконки); если и так тесно — полоса прокручивается колёсиком без полосы прокрутки, активная вкладка всегда видна. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { controlContributions } from '../lib/registry';
  import { store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';
  import { t } from '../lib/i18n.svelte';

  const find = (id: string) => controlContributions.find((x) => x.id === id);
  const active = $derived(workspace.active ? find(workspace.active) : undefined);

  let bar: HTMLDivElement;
  // Активную вкладку — в видимую часть полосы.
  $effect(() => {
    const id = workspace.active;
    bar?.querySelector<HTMLElement>(`[data-tab="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  // Колесо мыши прокручивает полосу вбок.
  function onwheel(e: WheelEvent) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) bar.scrollLeft += e.deltaY;
  }
</script>

<main class="workspace">
  <div class="tab-bar" bind:this={bar} {onwheel}>
    {#each workspace.tabs as id (id)}
      {@const c = find(id)}
      {#if c}
        <!-- Средняя кнопка мыши закрывает вкладку, как в браузере. -->
        <div
          class="tab"
          class:active={workspace.active === id}
          data-tab={id}
          role="presentation"
          onauxclick={(e) => e.button === 1 && workspace.closeTab(id)}
        >
          <button class="tab-label" title={c.title} onclick={() => (workspace.active = id)}>
            <c.icon size={14} />
            <span class="tab-title">{c.title}</span>
          </button>
          <button class="tab-close icon-btn" title={t('app.close')} onclick={() => workspace.closeTab(id)}>
            <X size={13} />
          </button>
        </div>
      {/if}
    {/each}
  </div>

  <div class="content">
    {#if active?.view}
      {#key active.id}
        <active.view ms={store.state[active.id]} app={store.state} />
      {/key}
    {:else}
      <div class="placeholder faint">{t('app.pickModule')}</div>
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
    scrollbar-width: none;
  }
  .tab-bar::-webkit-scrollbar {
    display: none;
  }
  .tab {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    min-width: 58px;
    max-width: 220px;
    padding: 0 4px 0 10px;
    border-radius: var(--radius-m) var(--radius-m) 0 0;
    color: var(--text-muted);
  }
  .tab:hover {
    background: var(--bg-hover);
  }
  /* Активная вкладка не сжимается: название текущей видно всегда. */
  .tab.active {
    flex-shrink: 0;
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
  }
  .tab-label :global(svg) {
    flex: none;
  }
  .tab-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .tab-close {
    flex: none;
    width: 20px;
    height: 20px;
  }
  /* У неактивной вкладки крестик места не занимает: появляется при наведении поверх конца названия. */
  .tab:not(.active) {
    position: relative;
    min-width: 36px;
    padding-right: 4px;
  }
  .tab:not(.active) .tab-close {
    position: absolute;
    right: 4px;
    background: var(--bg-hover);
  }
  .tab:not(.active):not(:hover) .tab-close {
    display: none;
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
