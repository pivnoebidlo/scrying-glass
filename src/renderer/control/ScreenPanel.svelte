<!-- Правая панель: что сейчас видят игроки, и управление экраном. -->
<script lang="ts">
  import { Monitor, MonitorOff, Moon, Sun } from '@lucide/svelte';
  import Stage from '../lib/Stage.svelte';
  import { controlContributions } from '../lib/registry';
  import { dispatch, store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';

  const display = $derived(workspace.display);
  const ratio = $derived(display ? `${display.width} / ${display.height}` : '16 / 9');
  const widgets = controlContributions.filter((c) => c.screen);

  function toggleDisplay() {
    if (store.displayOpen) window.api.closeDisplay();
    else if (display) window.api.openDisplay(display.id);
  }
</script>

<aside class="panel">
  <div class="pane-title">Экран игроков</div>

  <div class="section">
    <div class="preview" style:aspect-ratio={ratio} class:closed={!store.displayOpen}>
      <div class="stage-box" inert>
        <Stage state={store.state} />
      </div>
      {#if !store.displayOpen}
        <div class="closed-label">экран закрыт</div>
      {/if}
    </div>

    <select
      value={display ? String(display.id) : ''}
      onchange={(e) => (workspace.displayId = Number(e.currentTarget.value))}
      disabled={store.displayOpen}
      title={store.displayOpen ? 'Закройте экран, чтобы выбрать другой' : ''}
    >
      {#each store.displays as d (d.id)}
        <option value={String(d.id)}>{d.label}</option>
      {/each}
    </select>

    <div class="row">
      <button class="btn" class:primary={!store.displayOpen} onclick={toggleDisplay} disabled={!display}>
        {#if store.displayOpen}
          <MonitorOff size={14} /> Закрыть
        {:else}
          <Monitor size={14} /> Открыть
        {/if}
      </button>
      <button class="btn" class:active={store.state.core.blackout} onclick={() => dispatch('core', 'toggleBlackout')}>
        {#if store.state.core.blackout}
          <Sun size={14} /> Вернуть
        {:else}
          <Moon size={14} /> Погасить
        {/if}
      </button>
    </div>
  </div>

  {#each widgets as c (c.id)}
    {#if c.screen}
      <div class="pane-title">{c.title}</div>
      <div class="section">
        <c.screen ms={store.state[c.id]} state={store.state} />
      </div>
    {/if}
  {/each}
</aside>

<style>
  .panel {
    width: 280px;
    flex: none;
    overflow: auto;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border);
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
    color: var(--text-muted);
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
