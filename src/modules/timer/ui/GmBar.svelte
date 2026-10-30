<!-- The timer for the GM alone, at the top of the GM window (the players see and hear nothing of it). «Always» — a small
     bar with the time left while the timer runs, yellow in the last minute; «when time is up» — only then. Time up —
     a red bar: one more minute, remove the timer, or hide the bar (until the timer ends again). -->
<script lang="ts">
  import { Hourglass, Pause, Play, Plus, Square, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { clock, timeLeft } from '../types';
  import { clockNow, tick } from './now.svelte';

  let { ms }: ModuleProps<'timer'> = $props();

  const mode = $derived(ms.gm ?? 'end');
  const on = $derived(ms.active && mode !== 'off');
  $effect(() => {
    if (on) return tick();
  });
  const left = $derived(timeLeft(ms, clockNow.ms));
  const done = $derived(left === 0);
  const running = $derived(ms.endsAt !== null && !done);
  // The end the GM hid the bar for: more time (or a new timer) gives another end, and the bar comes back.
  let hidden = $state<number | null>(null);
  const shown = $derived(on && hidden !== ms.endsAt && (done || mode === 'always'));
</script>

{#if shown}
  <div class="gm-bar" class:done class:warn={!done && left <= 60_000} class:paused={!running && !done} role="status">
    <Hourglass size={14} />
    <span class="time">{done ? t('timer.timeUp') : clock(left)}</span>
    {#if ms.label}<span class="label">{ms.label}</span>{/if}
    {#if !done}
      {#if running}
        <button class="icon-btn" title={t('timer.pause')} onclick={() => dispatch('timer', 'pause')}><Pause size={13} /></button>
      {:else}
        <button class="icon-btn" title={t('timer.resume')} onclick={() => dispatch('timer', 'resume')}><Play size={13} /></button>
      {/if}
    {/if}
    <button class="icon-btn" title={t('timer.plusMinute')} onclick={() => dispatch('timer', 'add', { ms: 60000 })}><Plus size={13} /></button>
    {#if done}
      <button class="icon-btn" title={t('timer.stop')} onclick={() => dispatch('timer', 'stop')}><Square size={12} /></button>
      <button class="icon-btn" title={t('timer.gmHide')} onclick={() => (hidden = ms.endsAt)}><X size={13} /></button>
    {/if}
  </div>
{/if}

<style>
  .gm-bar {
    position: fixed;
    -webkit-app-region: no-drag;
    z-index: 150;
    top: calc(var(--title-h, 38px) + 8px);
    left: 50%;
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: min(520px, calc(100vw - 32px));
    padding: 3px 6px 3px 10px;
    transform: translateX(-50%);
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg-secondary);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    color: var(--text-normal);
    font-size: 13px;
  }
  .gm-bar :global(svg) {
    flex: none;
  }
  .time {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .label {
    min-width: 0;
    overflow: hidden;
    color: var(--text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .paused .time {
    opacity: 0.6;
  }
  .warn {
    border-color: var(--warning);
  }
  .warn .time {
    color: var(--warning);
  }
  .done {
    border-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 18%, var(--bg-secondary));
  }
  .done .time {
    color: var(--danger);
    animation: blink 1s ease-in-out infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.4;
    }
  }
</style>
