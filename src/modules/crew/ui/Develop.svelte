<!-- A full rep tracker: what developing gives (strong hold, or the next tier for coin) and the button. -->
<script lang="ts">
  import { TrendingUp } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { develop, MAX_TIER, repFull, roman, tierCost, type Crew } from '../types';

  let { crew, adventure }: { crew: Crew; adventure: string | null } = $props();
  const can = $derived(develop(crew) !== null);
  const text = $derived(
    crew.hold === 'weak'
      ? t('crew.developWeak')
      : crew.tier >= MAX_TIER
        ? t('crew.developTop')
        : t(can ? 'crew.developTier' : 'crew.developPoor', { n: roman(crew.tier + 1), cost: tierCost(crew), coin: crew.coin })
  );
</script>

{#if repFull(crew)}
  <div class="develop">
    <span>{text}</span>
    <button class="btn primary" disabled={!can} onclick={() => dispatch('crew', 'develop', { adventure })}><TrendingUp size={13} /> {t('crew.develop')}</button>
  </div>
{/if}

<style>
  .develop {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 12px;
  }
  .develop span {
    flex: 1;
  }
</style>
