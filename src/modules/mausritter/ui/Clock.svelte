<!-- Right panel, Mausritter: the exploration clock — turns in an adventure site (every third — an encounter roll,
     every sixth — torches mark usage) and watches of travel (morning and evening start with an encounter roll); a
     warband whose upkeep is owed by the days of the clock — with a button to pay a week. -->
<script lang="ts">
  import { Dices, Minus, Plus, RotateCcw, Footprints } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { blankAdventure, WARBAND_UPKEEP, weeksOwed } from '../types';

  let { ms, app }: ModuleProps<'mausritter'> = $props();
  const adventure = $derived(app.adventures.current);
  const clock = $derived((ms.byAdventure[adventure ?? ''] ?? blankAdventure()).clock);
  const act = (name: 'turn' | 'watch' | 'rollEncounter' | 'resetTurns' | 'resetClock') => dispatch('mausritter', name, { adventure });
  const last = $derived(clock.last);
  const torches = $derived(clock.turn > 0 && clock.turn % 6 === 0);
  const owing = $derived(((ms.byAdventure[adventure ?? ''] ?? blankAdventure()).warbands ?? []).filter((w) => weeksOwed(w, clock.day) > 0));
  const pips = (n: number) => t('build.pips', { n: n.toLocaleString(locale.lang) });
</script>

<div class="clock">
  <div class="row" title={t('mclock.turnHint')}>
    <span class="k">{t('mclock.turn')}</span>
    <span class="n">{clock.turn}</span>
    <div class="spacer"></div>
    <button class="icon-btn" title={t('mclock.back')} disabled={!clock.turn} onclick={() => dispatch('mausritter', 'turn', { adventure, step: -1 })}><Minus size={14} /></button>
    <button class="btn primary" title={t('mclock.turnHint')} onclick={() => act('turn')}><Plus size={14} /> {t('mclock.turn')}</button>
  </div>
  <p class="faint small">{t('mclock.everyThird')}</p>
  {#if torches}<p class="note warn">{t('mclock.torches')}</p>{/if}

  <div class="row" title={t('mclock.watchHint')}>
    <span class="k">{t('mclock.day', { n: clock.day })}</span>
    <span class="faint">· {t(`mclock.watchName.${clock.watch}` as 'mclock.watchName.1')}</span>
    <div class="spacer"></div>
    <button class="btn" title={t('mclock.watchHint')} onclick={() => act('watch')}><Footprints size={14} /> {t('mclock.watch')}</button>
  </div>

  {#if last}
    <p class="note" class:hit={last.roll === 1} class:omen={last.roll === 2}>
      {#if last.turn}<span class="when">{t('mclock.turn')} {last.turn}:</span>{/if}
      {last.roll === 1 ? t('mclock.enc.1') : last.roll === 2 ? t('mclock.enc.2') : t('mclock.enc.none', { n: last.roll })}
      {#if last.hour}<span class="faint">{t('mclock.hour', { n: last.hour })}</span>{/if}
    </p>
  {/if}

  {#each owing as w (w.id)}
    <div class="row">
      <span class="note warn">{w.name}: {t('mwar.owedShort', { count: weeksOwed(w, clock.day), pips: pips(weeksOwed(w, clock.day) * WARBAND_UPKEEP) })}</span>
      <div class="spacer"></div>
      <button class="btn" onclick={() => dispatch('mausritter', 'payWarband', { adventure, id: w.id })}>{t('mwar.payShort')}</button>
    </div>
  {/each}

  <div class="row tools">
    <button class="btn" title={t('mclock.rollHint')} onclick={() => act('rollEncounter')}><Dices size={13} /> {t('mclock.roll')}</button>
    <button class="btn" title={t('mclock.newSiteHint')} onclick={() => act('resetTurns')}>{t('mclock.newSite')}</button>
    <div class="spacer"></div>
    <button class="icon-btn" title={t('mclock.reset')} onclick={() => act('resetClock')}><RotateCcw size={13} /></button>
  </div>
  <p class="faint small">{t('mclock.rest')}</p>
</div>

<style>
  .clock {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .spacer {
    flex: 1;
  }
  .k {
    font-weight: 600;
  }
  .n {
    min-width: 22px;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
  }
  .small {
    margin: -4px 0 0;
    font-size: 11px;
  }
  .when {
    margin-right: 4px;
    opacity: 0.8;
  }
  .note {
    margin: 0;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 13px;
  }
  .note.hit {
    background: var(--danger);
    color: var(--bg-primary);
  }
  .note.omen,
  .note.warn {
    color: var(--warning);
  }
  .tools .btn {
    font-size: 12px;
  }
</style>
