<!-- Характеристики карточки неизвестной системы: «поле — значение», чтобы данные не потерялись. -->
<script lang="ts">
  import { t } from '../renderer/lib/i18n.svelte';
  import type { Card } from '../shared/cards';

  let { card }: { card: Card } = $props();

  const show = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
  const entries = $derived(
    card.stats && typeof card.stats === 'object' ? Object.entries(card.stats as Record<string, unknown>) : []
  );
</script>

<p class="faint">{t('sys.genericStats', { system: card.system })}</p>
<dl>
  {#each entries as [k, v] (k)}
    <dt>{k}</dt>
    <dd>{show(v)}</dd>
  {/each}
</dl>

<style>
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 4px 16px;
    user-select: text;
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
