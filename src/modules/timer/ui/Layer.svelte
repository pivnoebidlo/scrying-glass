<!-- Экран игроков: таймер — песочные часы или цифры, в углу или крупно по центру. Время вышло — вспыхивает. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { fade } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { clock, timeLeft } from '../types';
  import Hourglass from './Hourglass.svelte';

  let { ms }: ModuleProps<'timer'> = $props();

  // Остаток пересчитываем сами (не requestAnimationFrame: он стоит в перекрытых окнах).
  let now = $state(Date.now());
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 200);
    return () => clearInterval(t);
  });

  const left = $derived(timeLeft(ms, now));
  const done = $derived(ms.active && left === 0);
</script>

{#if ms.active && ms.shown}
  <div class="timer {ms.position}" class:done transition:fade|global={{ duration: 300 }}>
    {#if ms.label}<div class="label">{ms.label}</div>{/if}
    {#if ms.style === 'hourglass'}
      <div class="glass"><Hourglass left={ms.duration ? left / ms.duration : 0} running={ms.endsAt !== null} /></div>
    {/if}
    <div class="digits" class:big={ms.style === 'digits'}>{done ? t('timer.timeUpBang') : clock(left)}</div>
  </div>
{/if}

<style>
  .timer {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6cqmin;
    padding: 1.4cqmin 1.8cqmin;
    border-radius: 1.6cqmin;
    background: rgba(0, 0, 0, 0.55);
    color: #f3e6c8;
    font-family: Georgia, serif;
    text-shadow: 0 0 0.6cqmin #000;
    pointer-events: none;
    --s: 1;
  }
  .top-right {
    top: 3cqmin;
    right: 3cqmin;
  }
  .bottom-right {
    right: 3cqmin;
    bottom: 3cqmin;
  }
  .center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    --s: 2.6;
  }
  .label {
    max-width: calc(26cqmin * var(--s));
    font-size: calc(1.8cqmin * var(--s));
    text-align: center;
  }
  .glass {
    width: calc(9cqmin * var(--s));
    height: calc(14.4cqmin * var(--s));
  }
  .digits {
    font-size: calc(2.6cqmin * var(--s));
    font-variant-numeric: tabular-nums;
  }
  .digits.big {
    font-size: calc(6cqmin * var(--s));
  }
  .done {
    animation: alarm 0.9s ease-in-out infinite;
  }
  .done .digits {
    color: #ff8a7a;
  }
  @keyframes alarm {
    50% {
      box-shadow: 0 0 4cqmin 1cqmin rgba(255, 70, 50, 0.6);
    }
  }
</style>
