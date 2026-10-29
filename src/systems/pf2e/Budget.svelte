<!-- Above a fight and an encounter in Pathfinder 2e: the threat by the XP budget. Enemies' levels — from their cards;
     the party — from the fight's settings (heroes and their level; Pathfinder has no character sheets here yet). -->
<script lang="ts">
  import { Gauge } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../../renderer/lib/store.svelte';
  import { sameRef } from '../../shared/cards';
  import { bestiary, connectCards } from '../../modules/bestiary/ui/cards.svelte';
  import type { Combatant } from '../../modules/initiative/types';
  import { threatOf } from './budget';

  let { list }: { list: Combatant[] } = $props();
  onMount(connectCards);

  const party = $derived(store.state.initiative.party);
  const enemies = $derived(list.filter((c) => c.side === 'enemy'));
  const levelOf = (c: Combatant) => (c.card ? (bestiary.all.find((x) => sameRef(x.ref, c.card!))?.rank ?? null) : null);
  const a = $derived((bestiary.all, threatOf(enemies.map(levelOf), party)));
  const unknown = $derived(enemies.filter((c) => levelOf(c) === null).map((c) => c.name));
  let open = $state(false);
</script>

{#if enemies.length}
  <div class="budget">
    <button class="badge {a.threat}" title={t('pf2e.budget.title')} onclick={() => (open = !open)}>
      <Gauge size={14} />
      <span class="r">{t(`pf2e.budget.${a.threat}`)}</span>
      <span class="x">{t('pf2e.budget.line', { xp: a.xp, budget: a.next, size: party.size, level: party.level })}</span>
    </button>
    {#if open}
      <div class="pop">
        <p class="faint">{t('pf2e.budget.title')}</p>
        <div class="row">
          <label>{t('pf2e.budget.size')} <input type="number" min="1" max="10" value={party.size} onchange={(e) => dispatch('initiative', 'setParty', { size: Number(e.currentTarget.value) })} /></label>
          <label>{t('pf2e.budget.level')} <input type="number" min="1" max="20" value={party.level} onchange={(e) => dispatch('initiative', 'setParty', { level: Number(e.currentTarget.value) })} /></label>
        </div>
        <ul>
          {#each Object.entries(a.budgets) as [k, v] (k)}<li class:on={a.threat === k}>{t(`pf2e.budget.${k as 'low'}`)} — {v}</li>{/each}
        </ul>
        {#if unknown.length}<p class="faint">{t('pf2e.budget.unknown', { list: unknown.join(', ') })}</p>{/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .budget {
    position: relative;
    margin: 6px 0;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg-secondary);
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
  }
  .badge .r {
    font-weight: 600;
  }
  .badge.low {
    border-color: var(--success);
  }
  .badge.moderate {
    border-color: var(--warning);
  }
  .badge.severe,
  .badge.extreme,
  .badge.beyond {
    border-color: var(--danger);
  }
  .pop {
    position: absolute;
    z-index: 5;
    margin-top: 4px;
    padding: 8px 10px;
    min-width: 260px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-primary);
    font-size: 12px;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .row input {
    width: 52px;
  }
  ul {
    margin: 6px 0 0;
    padding-left: 16px;
  }
  li.on {
    font-weight: 600;
  }
</style>
