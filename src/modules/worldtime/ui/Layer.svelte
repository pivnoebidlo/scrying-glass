<!-- Player screen: «Day 3, evening» in the chosen corner, when the GM shows it. Only the day and the part of the day —
     the exact minutes stay with the GM. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Moon, Sun, Sunrise, Sunset } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { mausHere } from '../../mausritter/here';
  import { clockOf, partOf, type DayPart } from '../types';

  let { ms, app }: ModuleProps<'worldtime'> = $props();

  const w = $derived(mausHere(app) ? undefined : ms.byAdventure[app.adventures.current ?? '']);
  const now = $derived(w?.shown ? clockOf(w.minutes) : null);
  const part = $derived(now ? partOf(now.hour) : 'day');
  const ICON: Record<DayPart, typeof Sun> = { night: Moon, morning: Sunrise, day: Sun, evening: Sunset };
  const Icon = $derived(ICON[part]);
</script>

{#if now}
  <div class="corner {ms.place}" transition:fade|global={{ duration: 300 }}>
    {#key part}<span class="icon" in:fade|global={{ duration: 600 }}><Icon /></span>{/key}
    <span>{t('worldtime.onScreen', { day: now.day, part: t(`worldtime.part.${part}`) })}</span>
  </div>
{/if}

<style>
  .corner {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 1.2cqmin;
    color: #f3ead8;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 3cqmin;
    text-shadow: 0 0 0.6cqmin #000, 0 0 1.2cqmin #000;
    pointer-events: none;
  }
  .icon {
    display: flex;
    filter: drop-shadow(0 0 0.6cqmin #000);
  }
  .icon :global(svg) {
    width: 3.6cqmin;
    height: 3.6cqmin;
  }
  .top-left {
    top: 3cqmin;
    left: 3cqmin;
  }
  .top-right {
    top: 3cqmin;
    right: 3cqmin;
  }
  .bottom-left {
    bottom: 3cqmin;
    left: 3cqmin;
  }
  .bottom-right {
    right: 3cqmin;
    bottom: 3cqmin;
  }
</style>
