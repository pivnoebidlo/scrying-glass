<!-- Right panel: the exploration clock — turns in a place and watches of travel, by the rules of the system's package
     (without them it only counts); a warband whose upkeep is owed by the days of the clock — with a button to pay. -->
<script lang="ts">
  import { Dices, Minus, Plus, RotateCcw, Footprints } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { genText, warbandUpkeep } from '../../../shared/generators';
  import { familyOf } from '../../../systems';
  import { filesOf, loadGenerators } from '../../tools/generators/store.svelte';
  import { blankAdventure, weeksOwed } from '../types';

  onMount(() => void loadGenerators());

  let { ms, app }: ModuleProps<'factions'> = $props();
  const adventure = $derived(app.adventures.current);
  const clock = $derived((ms.byAdventure[adventure ?? ''] ?? blankAdventure()).clock);
  const files = $derived(filesOf(familyOf(currentSystem(app.adventures))));
  const rules = $derived(files.find((f) => f.exploration)?.exploration);
  const text = (x: Parameters<typeof genText>[0], params?: Record<string, number>) => genText(x, locale.lang, params);
  const act = (name: 'turn' | 'watch' | 'rollEncounter' | 'resetTurns' | 'resetClock') => dispatch('factions', name, { adventure, rules: $state.snapshot(rules) });
  const last = $derived(clock.last);
  const usage = $derived(rules?.turn?.usage);
  const outcome = $derived(last ? rules?.encounter?.results.find((r) => r.roll === last.roll) : undefined);
  const watchName = $derived(rules?.watch?.names?.[clock.watch - 1]);
  const upkeep = $derived(warbandUpkeep(files.find((f) => f.warband)?.warband, locale.lang));
  const owing = $derived((upkeep ? (ms.byAdventure[adventure ?? ''] ?? blankAdventure()).warbands ?? [] : []).filter((w) => weeksOwed(w, clock.day) > 0));
</script>

<div class="clock">
  <div class="row" title={text(rules?.turn?.hint)}>
    <span class="k">{t('mclock.turn')}</span>
    <span class="n">{clock.turn}</span>
    <div class="spacer"></div>
    <button class="icon-btn" title={t('mclock.back')} disabled={!clock.turn} onclick={() => dispatch('factions', 'turn', { adventure, step: -1, rules: $state.snapshot(rules) })}><Minus size={14} /></button>
    <button class="btn primary" title={text(rules?.turn?.hint)} onclick={() => act('turn')}><Plus size={14} /> {t('mclock.turn')}</button>
  </div>
  {#if rules?.turn?.note}<p class="faint small">{text(rules.turn.note)}</p>{/if}
  {#if usage && clock.turn > 0 && clock.turn % usage.every === 0}<p class="note warn">{text(usage.text)}</p>{/if}

  <div class="row" title={text(rules?.watch?.hint)}>
    <span class="k">{t('mclock.day', { n: clock.day })}</span>
    <span class="faint">· {watchName ? text(watchName) : t('mclock.watchN', { n: clock.watch })}</span>
    <div class="spacer"></div>
    <button class="btn" title={text(rules?.watch?.hint)} onclick={() => act('watch')}><Footprints size={14} /> {t('mclock.watch')}</button>
  </div>

  {#if last && rules?.encounter}
    <p class="note" class:hit={outcome?.tone === 'hit'} class:omen={outcome?.tone === 'omen'}>
      {#if last.turn}<span class="when">{t('mclock.turn')} {last.turn}:</span>{/if}
      {text(outcome?.text ?? rules.encounter.none, { n: last.roll })}
      {#if last.hour}<span class="faint">{text(rules.encounter.hour?.text, { n: last.hour })}</span>{/if}
    </p>
  {/if}

  {#each owing as w (w.id)}
    <div class="row">
      <span class="note warn">{w.name}: {t('mwar.owedShort', { count: weeksOwed(w, clock.day), money: upkeep!.money(weeksOwed(w, clock.day)) })}</span>
      <div class="spacer"></div>
      <button class="btn" onclick={() => dispatch('factions', 'payWarband', { adventure, id: w.id })}>{t('mwar.payShort')}</button>
    </div>
  {/each}

  <div class="row tools">
    {#if rules?.encounter}<button class="btn" title={text(rules.encounter.hint)} onclick={() => act('rollEncounter')}><Dices size={13} /> {t('mclock.roll')}</button>{/if}
    <button class="btn" title={t('mclock.newSiteHint')} onclick={() => act('resetTurns')}>{t('mclock.newSite')}</button>
    <div class="spacer"></div>
    <button class="icon-btn" title={t('mclock.reset')} onclick={() => act('resetClock')}><RotateCcw size={13} /></button>
  </div>
  {#if rules?.watch?.note}<p class="faint small">{text(rules.watch.note)}</p>{/if}
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
