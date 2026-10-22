<!-- Правая панель: что сейчас видят игроки, и управление экраном. Блоки модулей сворачиваются нажатием на заголовок;
     пустой блок (на экране от модуля ничего нет) свёрнут в одну строку «Карты · нет», его можно развернуть. -->
<script lang="ts">
  import { ChevronDown, ChevronRight, Monitor, MonitorOff, Moon, PanelRightClose, Sun } from '@lucide/svelte';
  import ScreenStatus from './ScreenStatus.svelte';
  import Stage from '../lib/Stage.svelte';
  import { controlContributions } from '../lib/registry';
  import { dispatch, store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';
  import { t } from '../lib/i18n.svelte';

  const display = $derived(workspace.display);
  const ratio = $derived(display ? `${display.width} / ${display.height}` : '16 / 9');
  const widgets = controlContributions.filter((c) => c.screen);

  // Пустые блоки, которые развернули (только до перезапуска).
  let peek = $state<string[]>([]);
  const without = (list: string[], id: string) => list.filter((x) => x !== id);

  function toggleBlock(id: string, empty: boolean) {
    if (empty) peek = peek.includes(id) ? without(peek, id) : [...peek, id];
    else workspace.screenClosed = workspace.screenClosed.includes(id) ? without(workspace.screenClosed, id) : [...workspace.screenClosed, id];
  }

  function toggleDisplay() {
    if (store.displayOpen) window.api.closeDisplay();
    else if (display) window.api.openDisplay(display.id);
  }
</script>

<aside class="panel">
  <!-- The title row: the screen's status and quick buttons, «hide the panel»; in Windows and Linux the system buttons
       stand over its right end (room is kept for them). -->
  <div class="pane-title panel-title drag">
    <span class="panel-name">{t('screen.title')}</span>
    <span class="grow"></span>
    <ScreenStatus />
    <button class="icon-btn hide" title={t('app.hidePanel')} onclick={() => (workspace.panelOpen = false)}><PanelRightClose size={16} /></button>
  </div>
  <!-- Only this part scrolls: the title with the screen's status stays in sight. -->
  <div class="scroll">

  <div class="section">
    <div class="preview" style:aspect-ratio={ratio} class:closed={!store.displayOpen}>
      <div class="stage-box" inert>
        <Stage app={store.state} />
      </div>
      {#if !store.displayOpen}
        <div class="closed-label">{t('screen.closed')}</div>
      {/if}
    </div>

    <select
      value={display ? String(display.id) : ''}
      onchange={(e) => (workspace.displayId = Number(e.currentTarget.value))}
      disabled={store.displayOpen}
      title={store.displayOpen ? t('screen.closeToPick') : ''}
    >
      {#each store.displays as d, i (d.id)}
        <!-- The label is built here, not in the core: it follows the interface language. -->
        <option value={String(d.id)}>{t('core.screen', { n: i + 1, w: d.width, h: d.height })}{d.primary ? t('core.primary') : ''}</option>
      {/each}
    </select>

    <div class="row">
      <button class="btn" class:primary={!store.displayOpen} onclick={toggleDisplay} disabled={!display}>
        {#if store.displayOpen}
          <MonitorOff size={14} /> {t('screen.closeScreen')}
        {:else}
          <Monitor size={14} /> {t('screen.open')}
        {/if}
      </button>
      <button class="btn" class:active={store.state.core.blackout} onclick={() => dispatch('core', 'toggleBlackout')}>
        {#if store.state.core.blackout}
          <Sun size={14} /> {t('screen.restore')}
        {:else}
          <Moon size={14} /> {t('screen.blackout')}
        {/if}
      </button>
    </div>
  </div>

  {#each widgets as c (c.id)}
    {#if c.screen && (c.screenWhen?.(store.state) ?? true)}
      {@const empty = c.screenEmpty?.(store.state) ?? null}
      {@const open = empty === null ? !workspace.screenClosed.includes(c.id) : peek.includes(c.id)}
      <button
        class="pane-title block-title"
        class:empty={empty !== null}
        title={open ? t('app.collapse') : t('app.expand')}
        onclick={() => toggleBlock(c.id, empty !== null)}
      >
        {#if open}<ChevronDown size={12} />{:else}<ChevronRight size={12} />{/if}
        <span>{c.title}</span>
        {#if empty !== null && !open}<span class="summary">· {empty}</span>{/if}
        {#if empty === null && !open}<span class="dot" title={t('app.somethingOnScreen')}></span>{/if}
      </button>
      {#if open}
        <div class="section">
          <c.screen ms={store.state[c.id]} app={store.state} />
        </div>
      {/if}
    {/if}
  {/each}
  </div>
</aside>

<style>
  /* In the title row: as high as the tab bar. */
  .panel-title {
    display: flex;
    align-items: center;
    gap: 2px;
    height: var(--title-h);
    padding-top: 0;
    padding-bottom: 0;
    padding-right: 6px;
    flex: none;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0;
  }
  .scroll > :first-child {
    margin-top: 8px;
  }
  .panel-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .grow {
    flex: 1;
  }
  .panel-title .hide {
    width: 28px;
    height: 28px;
    color: var(--text-faint);
  }
  /* Windows, Linux: the system buttons over the corner — the title gives them its right end (the name goes). */
  :global(:root[data-frame='overlay']) .panel-title {
    padding-right: var(--controls-w);
  }
  :global(:root[data-frame='overlay']) .panel-name {
    display: none;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .panel {
    display: flex;
    flex-direction: column;
    width: 280px;
    flex: none;
    overflow: hidden;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border);
  }
  .block-title {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .block-title:hover {
    color: var(--text-normal);
  }
  .block-title.empty {
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .block-title :global(svg) {
    flex: none;
    margin-left: -3px;
    color: var(--text-faint);
  }
  .summary {
    overflow: hidden;
    color: var(--text-faint);
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .dot {
    width: 6px;
    height: 6px;
    margin-left: 2px;
    border-radius: 50%;
    background: var(--accent);
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 12px 12px;
  }
  .preview {
    position: relative;
    width: 100%;
    border-radius: var(--radius-s);
    overflow: hidden;
    outline: 1px solid var(--border);
  }
  .stage-box {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .preview.closed .stage-box {
    opacity: 0.35;
  }
  .closed-label {
    position: absolute;
    left: 6px;
    top: 6px;
    padding: 1px 7px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.7);
    color: #c8c8c8;
    font-size: 11px;
  }
  .row {
    display: flex;
    gap: 6px;
  }
  .row .btn {
    flex: 1;
    justify-content: center;
  }
  .btn.active {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
