<!-- The filter of a type of entries a pack describes (PackEntryType.filters): chips of the values the entries have, any
     of them within a field, all fields at once; a yes/no field cycles. Remembered for the window's life, by type. -->
<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { filterValues, loc, type EntryFilter, type FilterPick } from '../../../shared/syspack';
  import type { FieldValue } from '../../../shared/compendium';
  import { packFilters as ui } from './packlist.svelte';

  let { entries, type, filters, titles }: { entries: Record<string, FieldValue>[]; type: string; filters: EntryFilter[]; titles: Record<string, unknown> } = $props();

  const pick = $derived(ui.picks[type] ?? {});
  const count = $derived(Object.values(pick).filter((v) => (Array.isArray(v) ? v.length : v)).length);
  const set = (key: string, v: FilterPick | undefined) => {
    const next = { ...pick };
    if (v === undefined || (Array.isArray(v) && !v.length)) delete next[key];
    else next[key] = v;
    ui.picks[type] = next;
  };
  const toggle = (key: string, v: string) => {
    const now = Array.isArray(pick[key]) ? pick[key] : [];
    set(key, now.includes(v) ? now.filter((x) => x !== v) : [...now, v]);
  };
  const cycle = (key: string) => set(key, pick[key] === undefined ? 'yes' : pick[key] === 'yes' ? 'no' : undefined);
</script>

<div class="filters">
  <div class="head">
    <button class="toggle" onclick={() => (ui.closed = !ui.closed)}>
      {#if ui.closed}<ChevronRight size={13} />{:else}<ChevronDown size={13} />{/if}
      {t('cmpui.filter')}{#if count}<span class="n">{count}</span>{/if}
    </button>
    <span class="spacer"></span>
    {#if count}<button class="reset" onclick={() => (ui.picks[type] = {})}>{t('cmpui.reset')}</button>{/if}
  </div>
  {#if !ui.closed}
    {#each filters as f (f.key)}
      <div class="group">
        <span class="label">{loc(titles[f.key] as never, getLang()) || f.key}</span>
        <div class="chips">
          {#if f.kind === 'tri'}
            <button class:on={pick[f.key] !== undefined} class:no={pick[f.key] === 'no'} onclick={() => cycle(f.key)}>{t(`cmpui.${typeof pick[f.key] === 'string' ? (pick[f.key] as 'yes') : 'any'}`)}</button>
          {:else}
            {#each filterValues(entries, f.key) as v (v)}<button class:on={Array.isArray(pick[f.key]) && pick[f.key]!.includes(v)} onclick={() => toggle(f.key, v)}>{v}</button>{/each}
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .filters {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    font-size: 12px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--text-normal);
    font-weight: 600;
    cursor: pointer;
  }
  .n {
    margin-left: 4px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    font-size: 11px;
  }
  .spacer {
    flex: 1;
  }
  .reset {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .label {
    color: var(--text-faint);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .chips button {
    padding: 1px 7px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
  }
  .chips button:hover {
    color: var(--text-normal);
  }
  .chips button.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--text-normal);
  }
  .chips button.on.no {
    border-color: var(--danger, #e04545);
    background: color-mix(in srgb, var(--danger, #e04545) 14%, transparent);
  }
</style>
