<!-- Above a fight and an encounter: the threat by the system's XP budget (shared/threat.ts). Enemies' levels — from
     their cards; the party — its characters in the fight (their ranks), else the fight's settings. -->
<script lang="ts">
  import { Gauge } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { t } from '../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../renderer/lib/store.svelte';
  import { sameRef } from '../shared/cards';
  import { currentSystem } from '../shared/adventures';
  import { getLang } from '../shared/i18n';
  import { loc } from '../shared/syspack';
  import { threatOf, type ThreatSpec } from '../shared/threat';
  import { bestiary, connectCards } from '../modules/bestiary/ui/cards.svelte';
  import type { Combatant } from '../modules/initiative/types';
  import { packOf } from './packs';

  let { list, spec }: { list: Combatant[]; spec?: ThreatSpec } = $props();
  onMount(connectCards);

  const s = $derived(spec ?? packOf(currentSystem(store.state.adventures))?.threat);
  const levelOf = (c: Combatant) => (c.card ? (bestiary.all.find((x) => sameRef(x.ref, c.card!))?.rank ?? null) : null);
  const heroes = $derived((bestiary.all, list.filter((c) => c.side === 'party').map(levelOf).filter((l): l is number => l !== null)));
  const setting = $derived(store.state.initiative.party);
  const party = $derived(heroes.length ? { size: heroes.length, level: Math.round(heroes.reduce((a, b) => a + b, 0) / heroes.length) } : setting);
  const enemies = $derived(list.filter((c) => c.side === 'enemy'));
  const a = $derived((bestiary.all, s ? threatOf(s, enemies.map(levelOf), party) : null));
  const unknown = $derived(enemies.filter((c) => levelOf(c) === null).map((c) => c.name));
  const name = $derived(!s || !a ? '' : a.level === 'beyond' ? (s.beyond ? loc(s.beyond, getLang()) : t('threat.beyond')) : loc(s.levels[a.level]?.title, getLang()));
  // The border goes from calm to danger along the levels.
  const tone = $derived(!a || !s ? '' : a.level === 'beyond' ? 'high' : a.level === 0 ? '' : a.level >= s.levels.length - 2 ? 'high' : a.level >= s.levels.length / 2 ? 'mid' : 'low');
  let open = $state(false);
</script>

{#if enemies.length && s && a}
  <div class="budget">
    <button class="badge {tone}" title={t('threat.title')} onclick={() => (open = !open)}>
      <Gauge size={14} />
      <span class="r">{name}</span>
      <span class="x">{t('threat.line', { xp: a.xp, budget: a.next, size: party.size, level: party.level })}</span>
    </button>
    {#if open}
      <div class="pop">
        <p class="faint">{t('threat.title')}</p>
        <div class="row">
          <label>{t('threat.size')} <input type="number" min="1" max="10" value={party.size} disabled={heroes.length > 0} onchange={(e) => dispatch('initiative', 'setParty', { size: Number(e.currentTarget.value) })} /></label>
          <label>{t('threat.level')} <input type="number" min="1" max="20" value={party.level} disabled={heroes.length > 0} onchange={(e) => dispatch('initiative', 'setParty', { level: Number(e.currentTarget.value) })} /></label>
        </div>
        <ul>
          {#each s.levels as l, i (i)}<li class:on={a.level === i}>{loc(l.title, getLang())} — {a.budgets[i]}</li>{/each}
        </ul>
        {#if unknown.length}<p class="faint">{t('threat.unknown', { list: unknown.join(', ') })}</p>{/if}
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
  .badge.mid {
    border-color: var(--warning);
  }
  .badge.high {
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
