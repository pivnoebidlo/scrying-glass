<!-- The right panel's «Next game»: when (and how soon), the table and who answered, «Start the game». -->
<script lang="ts">
  import { Play } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { tally } from '../../../shared/schedule';
  import { loadTg, tg } from '../../telegram/ui/tg.svelte';
  import { loadSchedule, next, sameVault, sched, startGame } from './store.svelte';
  import { untilText, whenText } from './when';

  let {}: ModuleProps<'schedule'> = $props();
  onMount(() => {
    void loadSchedule();
    void loadTg();
  });
  const o = $derived(next());
  const tl = $derived(o ? tally(sched.data.answers[o.key]) : null);
  const tableName = $derived(o?.game.table ? tg.status?.tables.find((x) => x.id === o.game.table)?.name : undefined);
</script>

{#if o}
  {@const until = untilText(o, sched.now, locale.lang)}
  <div class="next">
    <div class="title">{o.game.title || o.game.adventure || t('sched.game')}</div>
    <div class="faint">{whenText(o, locale.lang)} · {until ?? t('sched.now')}</div>
    {#if tableName}<div class="faint">{tableName}</div>{/if}
    {#if tl && tl.yes.length + tl.maybe.length + tl.no.length}
      <div class="answers">
        {#if tl.yes.length}<span>✅ {tl.yes.join(', ')}</span>{/if}
        {#if tl.maybe.length}<span>🤔 {tl.maybe.join(', ')}</span>{/if}
        {#if tl.no.length}<span>❌ {tl.no.join(', ')}</span>{/if}
      </div>
    {/if}
    {#if sameVault(o.game)}
      <button class="btn" onclick={() => startGame(o)}><Play size={13} /> {t('sched.start')}</button>
    {/if}
  </div>
{/if}

<style>
  .next {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 2px 4px 6px;
  }
  .title {
    font-weight: 600;
  }
  .faint {
    font-size: 12px;
  }
  .answers {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }
  .btn {
    align-self: flex-start;
    margin-top: 4px;
  }
</style>
