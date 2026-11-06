<!-- The builder: what an outcome of a roll does to the sheet — a field marked at the table, up or down by a number or
     dice («1», «-1», «-1d6»). Nothing chosen — no change. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { RollChange } from '../../../shared/syspack';

  let { value, set, fields, disabled = false }: { value: RollChange | undefined; set: (v: RollChange | undefined) => void; fields: [string, string][]; disabled?: boolean } = $props();
</script>

{#if fields.length}
  <span class="change">
    <select {disabled} aria-label={t('sb.change')} title={t('sb.changeHint')} value={value?.field ?? ''} onchange={(e) => set(e.currentTarget.value ? { field: e.currentTarget.value, by: value?.by ?? '1' } : undefined)}>
      <option value="">{t('sb.changeNone')}</option>
      {#each fields as [key, title] (key)}<option value={key}>{title}</option>{/each}
    </select>
    {#if value}
      <input type="text" class="by" {disabled} aria-label={t('sb.changeBy')} value={value.by} onchange={(e) => set({ field: value!.field, by: e.currentTarget.value.trim().toLowerCase().replace(/к/g, 'd') || '1' })} />
    {/if}
  </span>
{/if}

<style>
  .change {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
  .by {
    width: 56px;
  }
</style>
