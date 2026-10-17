<!-- Трекер инициативы, Fate: ячейки строки участника — дорожки стресса, последствия и «выведен из боя»
     (head — заголовки столбцов). Клетка N поглощает N сдвигов; последствие — аспект, его текст пишется в ячейку. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { Ban } from '@lucide/svelte';
  import { dispatch } from '../../renderer/lib/store.svelte';
  import type { Combatant } from '../../modules/initiative/types';
  import { CONSEQUENCE_TITLES, fateTracker, trackTitle } from './tracker';

  let { c, head = false }: { c?: Combatant; head?: boolean } = $props();

  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes });

  // Участник без дорожек (добавлен до смены системы или вручную в D&D) — дать ему обычные.
  function addTracks(c: Combatant) {
    const { stress, consequences } = fateTracker.fromCard({ hp: null, ac: null, initiative: c.bonus });
    update(c, { stress, consequences });
  }
</script>

{#if head}
  <th class="c-stress" title={t('fcore.tc.stressHint')}>{t('fcore.tc.stress')}</th>
  <th class="c-cons" title={t('fcore.tc.consHint')}>{t('fcore.consequences')}</th>
{:else if c}
  {@const it = c}
  <td class="c-stress">
    <div class="stress-row">
      <div>
        {#each c.stress ?? [] as tr (tr.id)}
          <div class="track" title={t('fcore.tc.trackStress', { track: trackTitle(tr.id) })}>
            <span class="tl faint">{trackTitle(tr.id).slice(0, 1)}</span>
            {#each tr.boxes as on, i (i)}
              <button class="box" class:on onclick={() => dispatch('initiative', 'toggleStress', { id: it.id, track: tr.id, box: i })}>{i + 1}</button>
            {/each}
            {#if !tr.boxes.length}<span class="faint none">{t('fcore.none')}</span>{/if}
          </div>
        {:else}
          <button class="link faint" title={t('fcore.tc.addStressHint')} onclick={() => addTracks(it)}>{t('fcore.tc.addStress')}</button>
        {/each}
      </div>
      <!-- Выведен из боя: пропускает ход, у игроков серый. -->
      <button class="icon-btn out" class:on={c.out} title={c.out ? t('fcore.tc.outBack') : t('fcore.tc.outHint')} onclick={() => update(it, { out: !it.out })}>
        <Ban size={14} />
      </button>
    </div>
  </td>
  <td class="c-cons">
    {#each c.consequences ?? [] as q, i (i)}
      <input
        type="text"
        class="cons"
        class:filled={!!q.text}
        value={q.text}
        placeholder="{q.shift} · {(CONSEQUENCE_TITLES[q.shift] ?? '').toLowerCase()}"
        title={t('fcore.tc.consTitle', { title: CONSEQUENCE_TITLES[q.shift] ?? t('fcore.consequence'), n: q.shift })}
        onchange={(e) => dispatch('initiative', 'setConsequence', { id: it.id, index: i, text: e.currentTarget.value })}
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
    align-items: center;
    gap: 3px;
    margin: 1px 0;
  }
  .tl {
    width: 12px;
    font-size: 11px;
  }
  .none {
    font-size: 11px;
  }
  .box {
    width: 20px;
    height: 20px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
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
  .c-cons {
    width: 110px;
  }
  .cons {
    display: block;
    width: 106px !important;
    margin: 1px 0;
    font-size: 12px;
  }
  .cons.filled {
    color: var(--danger);
  }
  .on {
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
