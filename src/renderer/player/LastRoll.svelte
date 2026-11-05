<!-- The last roll made from the sheet: the rolls stay on the phone, the GM's log does not get them. Tap to hide. -->
<script lang="ts">
  import { rolls, type RollEntry } from '../lib/rolls.svelte';
  import { t } from '../lib/i18n.svelte';

  let hidden = $state(0);
  const last = $derived(rolls.list.at(-1));
  const shown = $derived(last && last.id !== hidden ? last : null);

  const main = (e: RollEntry) => e.d20?.total ?? e.save?.natural ?? e.pack?.total ?? e.damage[0]?.total;
  const extra = (e: RollEntry) => [e.pack?.outcome, ...(e.d20 || e.damage.length > 1 ? e.damage.slice(e.d20 ? 0 : 1).map((d) => String(d.total)) : [])].filter(Boolean).join(' · ');
</script>

{#if shown}
  <button class="roll" onclick={() => (hidden = shown.id)}>
    <span class="what">{shown.what}</span>
    <b>{main(shown)}</b>
    {#if extra(shown)}<span>{extra(shown)}</span>{/if}
    <small>{t('pl.page.local')}</small>
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
