<!-- Tools → Factions, below the factions (Mausritter): the party's warbands. "Form a warband" makes its card by the SRD
     (d6 HP, STR/DEX/WIL 10, d6 clubs and axes, warband scale; the casualty rules in its text) in the adventure's
     bestiary folder (none — the library) and starts its upkeep: 1000p for each week begun on the exploration clock. -->
<script lang="ts">
  import { IdCard, Swords, Users, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { die } from '../../../shared/dice';
  import { roleFolderHere } from '../../../shared/adventures';
  import type { Card } from '../../../shared/cards';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { addToInitiative } from '../../bestiary/ui/combat';
  import { blankAdventure, WARBAND_UPKEEP, weeksDue, weeksOwed, type Warband } from '../types';

  onMount(() => void connectCards());

  const adventure = $derived(store.state.adventures.current);
  const data = $derived(store.state.mausritter.byAdventure[adventure ?? ''] ?? blankAdventure());
  const day = $derived(data.clock.day);
  const pips = (n: number) => t('build.pips', { n: n.toLocaleString(locale.lang) });

  let name = $state('');
  let busy = $state(false);

  async function form() {
    const title = name.trim() || t('mwar.defaultName', { n: (data.warbands?.length ?? 0) + 1 });
    busy = true;
    try {
      const lang = locale.lang === 'ru' ? 'ru' : 'en';
      const card: Card = {
        format: 1, id: '', kind: 'npc', system: 'mausritter', lang, name: title, side: 'party', portraits: [], tags: [], notes: '',
        description: t('mwar.cardText'),
        stats: { hp: die(6), str: 10, dex: 10, wil: 10, armour: 0, warband: 0, attacks: [{ name: t('mwar.attack'), dice: 'd6' }], critical: t('mwar.critical'), abilities: t('mwar.abilities'), wants: '' },
      };
      const tree = store.state.vault.tree;
      const folder = tree ? roleFolderHere(tree, store.state.adventures, 'bestiary') : null;
      const ref = await window.api.saveCard(folder ? 'vault' : 'library', card, folder?.path);
      await dispatch('mausritter', 'formWarband', { adventure, name: title, card: { scope: ref.scope, id: ref.id } });
      name = '';
    } finally {
      busy = false;
    }
  }

  const summary = (w: Warband) => (w.card ? bestiary.all.find((c) => c.ref.scope === w.card!.scope && c.ref.id === w.card!.id) : undefined);
  const pay = (w: Warband, step: 1 | -1 = 1) => dispatch('mausritter', 'payWarband', { adventure, id: w.id, step });
  const rename = (w: Warband, v: string) => dispatch('mausritter', 'updateWarband', { adventure, id: w.id, changes: { name: v } });
  const disband = (w: Warband) => confirm(t('mwar.disbandConfirm', { name: w.name })) && dispatch('mausritter', 'disbandWarband', { adventure, id: w.id });
  async function toFight(w: Warband) {
    const c = summary(w);
    if (c) await addToInitiative(c);
  }
</script>

<section class="warbands">
  <h3><Users size={13} /> {t('mwar.title')}</h3>
  <p class="faint small">{t('mwar.about')}</p>
  {#each data.warbands ?? [] as w (w.id)}
    {@const owed = weeksOwed(w, day)}
    <div class="warband">
      <div class="row">
        <input class="name" type="text" value={w.name} onchange={(e) => rename(w, e.currentTarget.value)} />
        <span class="faint">{t('mwar.formed', { day: w.formed })}</span>
        <span class="spacer"></span>
        {#if summary(w)}
          <button class="icon-btn" title={t('mwar.card')} onclick={() => bestiary.show(w.card!)}><IdCard size={14} /></button>
          <button class="icon-btn" title={t('mwar.fight')} onclick={() => toFight(w)}><Swords size={14} /></button>
        {/if}
        <button class="icon-btn" title={t('mwar.disband')} onclick={() => disband(w)}><X size={14} /></button>
      </div>
      <div class="row">
        <span>{t('mwar.upkeep', { paid: w.paid, due: weeksDue(w, day), pips: pips(WARBAND_UPKEEP) })}</span>
        <span class="spacer"></span>
        {#if w.paid}<button class="btn" title={t('mwar.unpayHint')} onclick={() => pay(w, -1)}>−</button>{/if}
        <button class="btn" class:primary={owed > 0} onclick={() => pay(w)}>{t('mwar.pay', { pips: pips(WARBAND_UPKEEP) })}</button>
      </div>
      {#if owed > 0}<p class="warn small">{t('mwar.owed', { count: owed, pips: pips(owed * WARBAND_UPKEEP) })}</p>{/if}
    </div>
  {/each}
  <form class="row" onsubmit={(e) => (e.preventDefault(), form())}>
    <input class="name" type="text" bind:value={name} placeholder={t('mwar.namePh')} />
    <button class="btn" type="submit" disabled={busy} title={t('mwar.formHint')}>{t('mwar.form')}</button>
  </form>
</section>

<style>
  .warbands {
    margin-top: 16px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .small {
    margin: 4px 0 8px;
    font-size: 12px;
  }
  .warband {
    margin-bottom: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2px 0;
  }
  .name {
    min-width: 0;
    flex: 0 1 260px;
  }
  .spacer {
    flex: 1;
  }
  .warn {
    color: var(--warning);
  }
</style>
