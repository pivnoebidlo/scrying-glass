<!-- Рабочая область: вкладки модулей. Когда вкладки не помещаются, они сжимаются (название обрезается, до одной
     иконки); если и так тесно — полоса прокручивается колёсиком без полосы прокрутки, активная вкладка всегда видна.
     Справа — список всех вкладок с полными названиями (как в Obsidian); правая панель скрыта — её состояние и
     «показать». Полоса — заголовок окна (перетаскивается за пустое место). -->
<script lang="ts">
  import { Check, ChevronDown, PanelLeftOpen, PanelRightOpen, X } from '@lucide/svelte';
  import ScreenStatus from './ScreenStatus.svelte';
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

  // The list of the tabs: every open tab with its whole title; Esc or a click elsewhere closes it.
  let listOpen = $state(false);
  // Under the arrow: its right edge, from the right of the window.
  let listRight = $state(0);
  function toggleList(e: MouseEvent) {
    listRight = window.innerWidth - (e.currentTarget as HTMLElement).getBoundingClientRect().right;
    listOpen = !listOpen;
  }
  function pickTab(id: string) {
    workspace.active = id as typeof workspace.active;
    listOpen = false;
  }
  function onkeydown(e: KeyboardEvent) {
    if (listOpen && e.key === 'Escape') listOpen = false;
  }

  // The side panel hidden: «show» at the start of the tab bar (as in Obsidian); no module chosen yet — Files.
  const sidebarShown = $derived(workspace.sidebarOpen && !!workspace.sidebar);
  function showSidebar() {
    if (workspace.sidebar) workspace.sidebarOpen = true;
    else workspace.select('vault');
  }
</script>

<svelte:window {onkeydown} />

<main class="workspace">
  <div class="tab-bar drag" class:no-sidebar={!sidebarShown} class:no-panel={!workspace.panelOpen}>
    {#if !sidebarShown}
      <button class="icon-btn side-btn show-sidebar" title={t('app.showSidebar')} onclick={showSidebar}><PanelLeftOpen size={18} /></button>
    {/if}
    <div class="tabs" bind:this={bar} {onwheel}>
    {#each workspace.tabs as id (id)}
      {@const c = find(id)}
      {#if c}
        <!-- Средняя кнопка мыши закрывает вкладку, как в браузере. -->
        <div
          class="tab no-drag"
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
    {#if workspace.tabs.length}
      <button class="icon-btn side-btn" class:on={listOpen} title={t('app.tabList')} onclick={toggleList}><ChevronDown size={16} /></button>
    {/if}
    {#if !workspace.panelOpen}
      <ScreenStatus controls={false} />
      <button class="icon-btn side-btn" title={t('app.showPanel')} onclick={() => (workspace.panelOpen = true)}><PanelRightOpen size={18} /></button>
    {/if}
  </div>

  {#if listOpen}
    <div class="list-backdrop" role="presentation" onclick={() => (listOpen = false)}></div>
    <div class="tab-list" role="menu" style:right="{listRight}px">
      {#each workspace.tabs as id (id)}
        {@const c = find(id)}
        {#if c}
          <button role="menuitem" class:active={workspace.active === id} onclick={() => pickTab(id)}>
            <c.icon size={14} />
            <span class="name">{c.title}</span>
            {#if workspace.active === id}<Check size={14} />{/if}
          </button>
        {/if}
      {/each}
    </div>
  {/if}

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
    position: relative;
    display: flex;
    align-items: stretch;
    gap: 2px;
    height: var(--title-h);
    flex: none;
    padding: 6px 8px 0;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
  }
  .tabs {
    display: flex;
    flex: 1;
    min-width: 0;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  /* The buttons at the ends of the bar: as big as the ribbon's, in line with the tabs (a little below the middle). */
  .side-btn {
    flex: none;
    align-self: center;
    width: 32px;
    height: 32px;
    color: var(--text-faint);
  }
  .side-btn.on {
    color: var(--text-normal);
    background: var(--bg-hover);
  }
  .tab-bar > :global(.status) {
    align-self: center;
  }
  /* Windows, Linux with the right panel hidden: the system buttons stand over the end of the bar. */
  :global(:root[data-frame='overlay']) .tab-bar.no-panel {
    padding-right: var(--controls-w);
  }
  .list-backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 30;
  }
  .tab-list {
    position: fixed;
    -webkit-app-region: no-drag;
    top: calc(var(--title-h) + 2px);
    z-index: 31;
    display: flex;
    flex-direction: column;
    min-width: 220px;
    max-height: 70vh;
    overflow: auto;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .tab-list button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-s, 4px);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .tab-list button:hover {
    background: var(--bg-hover);
  }
  .tab-list button.active {
    color: var(--text-normal);
  }
  .tab-list .name {
    flex: 1;
  }
  /* macOS: the traffic lights stand over the ribbon and the sidebar; with the sidebar hidden — before the tabs. */
  :global(:root[data-frame='mac']:not([data-fullscreen='true'])) .tab-bar.no-sidebar {
    padding-left: 40px;
  }
  .show-sidebar {
    margin-right: 8px;
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
