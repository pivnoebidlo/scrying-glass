<!-- Player screen: the shown clocks of the current adventure, in the chosen corner; a full clock glows. Only in a
     Forged in the Dark adventure (switched to another system — the clocks are not shown). -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import ClockFace from './ClockFace.svelte';
  import type { ClockTone } from '../types';
  import { fitdHere } from '../../crew/here';

  let { ms, app }: ModuleProps<'clocks'> = $props();

  const clocks = $derived(fitdHere(app) ? (ms.byAdventure[app.adventures.current ?? ''] ?? []).filter((c) => c.shown) : []);
  const COLOR: Record<ClockTone, string> = { danger: '#c0392b', progress: '#d9a441', neutral: '#9aa3ad' };
  const SIZE = { small: 7, medium: 10, large: 14 } as const;
</script>

{#if clocks.length}
  <div class="corner {ms.place}" style:--d="{SIZE[ms.size]}cqmin" transition:fade|global={{ duration: 300 }}>
    {#each clocks as c (c.id)}
      <div class="clock" class:full={c.filled >= c.segments} style:--c={COLOR[c.tone]} animate:flip={{ duration: 300 }} in:fly|global={{ y: -12, duration: 300 }} out:fade|global={{ duration: 200 }}>
        <div class="face"><ClockFace segments={c.segments} filled={c.filled} color={COLOR[c.tone]} rim="#f3ead8" empty="rgba(15, 12, 10, 0.72)" /></div>
        <div class="title">{c.title}</div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .corner {
    position: absolute;
    display: flex;
    flex-wrap: wrap;
    gap: 2.5cqmin;
    max-width: 50cqw;
    pointer-events: none;
  }
  .top-left {
    top: 3cqmin;
    left: 3cqmin;
  }
  .top-right {
    top: 3cqmin;
    right: 3cqmin;
    justify-content: flex-end;
  }
  .bottom-left {
    bottom: 3cqmin;
    left: 3cqmin;
    align-items: flex-end;
  }
  .bottom-right {
    right: 3cqmin;
    bottom: 3cqmin;
    align-items: flex-end;
    justify-content: flex-end;
  }
  .clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: calc(var(--d) * 1.5);
  }
  .face {
    width: var(--d);
    height: var(--d);
    filter: drop-shadow(0 0.4cqmin 1cqmin rgba(0, 0, 0, 0.7));
    transition: filter 0.4s;
  }
  .clock.full .face {
    filter: drop-shadow(0 0 1.6cqmin var(--c)) drop-shadow(0 0 0.6cqmin var(--c));
  }
  .title {
    margin-top: 0.8cqmin;
    color: #f3ead8;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: calc(var(--d) * 0.17);
    line-height: 1.15;
    text-align: center;
    text-shadow: 0 0 0.6cqmin #000, 0 0 1.2cqmin #000;
  }
</style>
