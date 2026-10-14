<!-- Сложность боя или заготовки: плашка «Умеренная · 1 100 / 1 500 ОО», по щелчку — подробности: партия, шкала
     бюджета, противники без опыта. Герои — из боя, а если их там нет — персонажи игроков приключения. -->
<script lang="ts">
  import { Gauge } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { RATING_TITLES } from '../../../systems/dnd5e/difficulty';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { analyze } from '../difficulty';
  import { adventureHeroes, cardInfo } from './heroes';
  import DifficultyDetails from './DifficultyDetails.svelte';
  import type { Combatant } from '../types';

  let { list }: { list: Combatant[] } = $props();

  onMount(connectCards);

  const app = $derived(store.state);
  const a = $derived((bestiary.all, analyze(list, (c) => cardInfo(c.card), adventureHeroes(app), app.initiative.party)));
  const hasEnemies = $derived(list.some((c) => c.side === 'enemy'));

  let open = $state(false);
  const fmt = (n: number) => n.toLocaleString('ru');
  // Следующий порог, до которого ещё есть запас (для подписи «1 100 / 1 500»).
  const next = $derived(a.xp <= a.budget.low ? a.budget.low : a.xp <= a.budget.moderate ? a.budget.moderate : a.budget.high);
</script>

<svelte:window onclick={(e) => open && !(e.target as HTMLElement).closest('.difficulty') && (open = false)} />

{#if hasEnemies}
  <div class="difficulty">
    <button class="badge {a.rating}" title="Сложность боя по правилам 2024 года — подробности" onclick={() => (open = !open)}>
      <Gauge size={14} />
      <span class="r">{RATING_TITLES[a.rating]}</span>
      <span class="x">{fmt(a.xp)} / {fmt(next)} ОО{a.unknown.length ? ' + ?' : ''}</span>
    </button>

    {#if open}
      <div class="pop" role="dialog">
        <DifficultyDetails {a} />
      </div>
    {/if}
  </div>
{/if}

<style>
  .difficulty {
    position: relative;
  }
  .badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    border: 1px solid var(--c);
    border-radius: 999px;
    background: color-mix(in srgb, var(--c) 14%, transparent);
    color: var(--text-normal);
    font-size: 12px;
    cursor: pointer;
  }
  .r {
    color: var(--c);
    font-weight: 600;
  }
  .x {
    color: var(--text-muted);
  }
  .trivial {
    --c: #9aa0a8;
  }
  .low {
    --c: #4caf6a;
  }
  .moderate {
    --c: #e0b23a;
  }
  .high {
    --c: #e57a2e;
  }
  .beyond {
    --c: #e04545;
  }
  .pop {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    z-index: 30;
    width: 340px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    font-size: 13px;
  }
</style>
