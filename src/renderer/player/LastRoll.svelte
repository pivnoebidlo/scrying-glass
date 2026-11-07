<!-- The last roll made from the sheet; each one also goes to the GM's log. Tap to hide. -->
<script lang="ts">
  import { rolls, type RollEntry } from '../lib/rolls.svelte';
  import { t } from '../lib/i18n.svelte';
  import { rollAction, type PlayerRoll } from '../../shared/players';

  let { send }: { send: (roll: PlayerRoll) => void } = $props();

  let hidden = $state(0);
  const last = $derived(rolls.list.at(-1));
  const shown = $derived(last && last.id !== hidden ? last : null);

  const main = (e: RollEntry) => e.d20?.total ?? e.save?.natural ?? e.pack?.total ?? e.damage[0]?.total;
  const extra = (e: RollEntry) => [e.pack?.outcome, ...(e.d20 || e.damage.length > 1 ? e.damage.slice(e.d20 ? 0 : 1).map((d) => String(d.total)) : [])].filter(Boolean).join(' · ');
  const tone = (e: RollEntry) =>
    e.save ? (e.save.success ? 'good' : 'bad') : e.d20?.natural === 20 ? 'good' : e.d20?.natural === 1 ? 'bad' : e.pack?.tone === 'good' || e.pack?.tone === 'bad' ? e.pack.tone : undefined;

  // Each new roll once. A roll with nothing to show (no total) stays here.
  let sent = 0;
  $effect(() => {
    if (!last || last.id === sent) return;
    sent = last.id;
    const total = main(last);
    if (total === undefined) return;
    const dice = last.d20 ? `${t('lib.d20')}: ${last.d20.rolls.join(' | ')}` : last.pack?.note;
    send(rollAction(last.what, total, [dice, extra(last)].filter(Boolean).join(' · ') || undefined, tone(last)));
  });
</script>

{#if shown}
  <button class="roll" onclick={() => (hidden = shown.id)}>
    <span class="what">{shown.what}</span>
    <b>{main(shown)}</b>
    {#if extra(shown)}<span>{extra(shown)}</span>{/if}
    {#if shown.changed?.to !== undefined}<span>{shown.changed.title}: {shown.changed.from} → {shown.changed.to}</span>{/if}
    <small>{t('pl.page.toGm')}</small>
  </button>
{/if}

<style>
  .roll {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 6;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 2px 12px;
    max-width: 736px;
    margin: 0 auto;
    padding: 10px 14px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    text-align: left;
  }
  b {
    grid-row: span 2;
    grid-column: 2;
    grid-row-start: 1;
    font-size: 28px;
  }
  small {
    color: var(--text-muted);
  }
</style>
