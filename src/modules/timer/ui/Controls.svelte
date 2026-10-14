<!-- Управление идущим таймером: остаток, пауза/продолжить, ±1 минута, убрать. Общее для правой панели и страницы
     таймера в «Инструментах». -->
<script lang="ts">
  import { Eye, EyeOff, Minus, Pause, Play, Plus, Square } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { clock, timeLeft, type TimerState } from '../types';
  import { clockNow, tick } from './now.svelte';

  let { ms, big = false }: { ms: TimerState; big?: boolean } = $props();

  $effect(tick);
  const left = $derived(timeLeft(ms, clockNow.ms));
  const done = $derived(left === 0);
  const running = $derived(ms.endsAt !== null && !done);
</script>

<div class="controls" class:big>
  <div class="time" class:done class:paused={!running && !done}>{done ? 'Время вышло' : clock(left)}</div>
  {#if ms.label}<div class="label faint">{ms.label}</div>{/if}
  <div class="buttons">
    {#if running}
      <button class="icon-btn" title="Пауза" onclick={() => dispatch('timer', 'pause')}><Pause size={15} /></button>
    {:else if !done}
      <button class="icon-btn" title="Продолжить" onclick={() => dispatch('timer', 'resume')}><Play size={15} /></button>
    {/if}
    <button class="icon-btn" title="Убавить минуту" onclick={() => dispatch('timer', 'add', { ms: -60000 })}><Minus size={15} /></button>
    <button class="icon-btn" title="Добавить минуту" onclick={() => dispatch('timer', 'add', { ms: 60000 })}><Plus size={15} /></button>
    <button class="icon-btn" title={ms.shown ? 'Игроки видят таймер — спрятать' : 'Таймер только у вас — показать игрокам'} onclick={() => dispatch('timer', 'setView', { shown: !ms.shown })}>
      {#if ms.shown}<Eye size={15} />{:else}<EyeOff size={15} />{/if}
    </button>
    <button class="icon-btn" title="Убрать таймер" onclick={() => dispatch('timer', 'stop')}><Square size={14} /></button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 10px;
  }
  .time {
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .big .time {
    font-size: 44px;
  }
  .time.paused {
    opacity: 0.6;
  }
  .time.done {
    color: var(--danger, #e04545);
    animation: blink 1s ease-in-out infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.4;
    }
  }
  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .buttons {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }
</style>
