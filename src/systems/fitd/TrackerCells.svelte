<!-- Initiative tracker, Forged in the Dark: the stress line (a click fills up to that box, on the last filled — one
     less), the five harm lines and "taken out" (head — the column headers). -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { Ban } from '@lucide/svelte';
  import { dispatch } from '../../renderer/lib/store.svelte';
  import type { Combatant } from '../../modules/initiative/types';
  import { fitdTracker, harmLines, stressOf, withStress } from './tracker';
  import { HARM_TITLES } from './stats';

  let { c, head = false }: { c?: Combatant; head?: boolean } = $props();

  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes });
  const setStress = (c: Combatant, n: number) => update(c, { stress: withStress(c, stressOf(c) === n ? n - 1 : n) });
  // Added before the system changed (or by hand): give them the usual lines.
  function addLines(c: Combatant) {
    const { stress, consequences } = fitdTracker.fromCard({ hp: null, ac: null, initiative: 0 });
    update(c, { stress, consequences });
  }
  function setHarm(c: Combatant, i: number, text: string) {
    update(c, { consequences: harmLines(c.consequences).map((h, j) => (j === i ? { ...h, text: text.trim() } : h)) });
  }
</script>

{#if head}
  <th class="c-stress" title={t('fitd.stressHint')}>{t('fitd.stress')}</th>
  <th class="c-harm" title={t('fitd.tc.harmHint')}>{t('fitd.harmTitle')}</th>
{:else if c}
  {@const it = c}
  {@const line = c.stress?.find((s) => s.id === 'stress')}
  <td class="c-stress">
    <div class="stress-row">
      {#if line}
        <div class="track" title={t('fitd.tc.stressBoxes', { n: stressOf(c), of: line.boxes.length })}>
          {#each line.boxes as on, i (i)}
            <button class="box" class:on onclick={() => setStress(it, i + 1)}>{i + 1}</button>
          {/each}
        </div>
      {:else}
        <button class="link faint" onclick={() => addLines(it)}>{t('fitd.tc.addLines')}</button>
      {/if}
      <!-- Taken out: skipped, grey for the players. -->
      <button class="icon-btn out" class:on={c.out} title={c.out ? t('fitd.tc.outBack') : t('fitd.tc.outHint')} onclick={() => update(it, { out: !it.out })}>
        <Ban size={14} />
      </button>
    </div>
  </td>
  <td class="c-harm">
    {#each c.consequences ?? [] as h, i (i)}
      <input
        type="text"
        class="harm"
        class:filled={!!h.text}
        value={h.text}
        placeholder="{h.shift} · {(HARM_TITLES[h.shift] ?? '').toLowerCase()}"
        onchange={(e) => setHarm(it, i, e.currentTarget.value)}
      />
    {/each}
  </td>
{/if}

<style>
  .c-stress {
    white-space: nowrap;
  }
  .track {
    display: flex;
    gap: 2px;
  }
  .box {
    width: 18px;
    height: 20px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
  }
  .box:hover {
    border-color: var(--accent);
  }
  .box.on {
    border-color: var(--danger);
    background: var(--danger);
    color: var(--bg-primary);
  }
  .stress-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .out {
    margin-left: auto;
  }
  .out.on {
    color: var(--danger);
  }
  .c-harm {
    width: 120px;
  }
  .harm {
    display: block;
    width: 116px !important;
    margin: 1px 0;
    font-size: 12px;
  }
  .harm.filled {
    color: var(--danger);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    font-size: 12px;
    cursor: pointer;
  }
  .link:hover {
    color: var(--accent);
  }
</style>
