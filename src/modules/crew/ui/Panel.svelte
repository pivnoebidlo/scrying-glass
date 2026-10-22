<!-- Right panel, Forged in the Dark: the crew at a glance — tier and hold, heat and wanted level, rep, coin — and the
     entanglement roll. The full sheet is a page in Tools. -->
<script lang="ts">
  import { Minus, Plus, ScrollText } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { ui } from '../../tools/ui/ui.svelte';
  import { atWar, blankCrew, coinCap, MAX_HEAT, MAX_WANTED, REP_TRACK, roman } from '../types';
  import Boxes from './Boxes.svelte';
  import Develop from './Develop.svelte';
  import Entangle from './Entangle.svelte';

  let { ms, app }: ModuleProps<'crew'> = $props();
  const adventure = $derived(app.adventures.current);
  const crew = $derived(ms.byAdventure[adventure ?? ''] ?? blankCrew());
  const update = (changes: Record<string, unknown>) => dispatch('crew', 'update', { adventure, changes });
  const open = () => {
    ui.tool = 'crew';
    ui.note = null;
    openTab('tools');
  };
</script>

<div class="crew">
  <div class="row">
    <b class="name">{crew.name || t('crew.title')}</b>
    <span class="faint" title={t('crew.holdHint')}>{t('crew.tierOf', { n: roman(crew.tier) })} · {t(`crew.hold.${crew.hold}`)}</span>
    <div class="spacer"></div>
    <button class="icon-btn" title={t('crew.openSheet')} onclick={open}><ScrollText size={14} /></button>
  </div>

  <div class="row">
    <span class="k">{t('crew.heat')}</span>
    <Boxes n={crew.heat} of={MAX_HEAT} tone="danger" title={t('crew.heatHint', { n: crew.heat })} set={(v) => dispatch('crew', 'heat', { adventure, delta: v - crew.heat })} />
  </div>
  <div class="row">
    <span class="k">{t('crew.wanted')}</span>
    <Boxes n={crew.wanted} of={MAX_WANTED} tone="danger" title={t('crew.wantedHint', { n: crew.wanted })} set={(v) => update({ wanted: v })} />
  </div>
  <div class="row">
    <span class="k">{t('crew.rep')}</span>
    <Boxes n={crew.rep} of={REP_TRACK} fixed={crew.turf} title={t('crew.repHint', { n: crew.rep, of: REP_TRACK - crew.turf })} set={(v) => update({ rep: v })} />
  </div>
  <Develop {crew} {adventure} />
  <div class="row" title={t('crew.coinHint', { cap: coinCap(crew) })}>
    <span class="k">{t('crew.coin')}</span>
    <button class="icon-btn" title={t('crew.minus')} disabled={!crew.coin} onclick={() => update({ coin: crew.coin - 1 })}><Minus size={13} /></button>
    <span class="n" class:over={crew.coin > coinCap(crew)}>{crew.coin}</span>
    <button class="icon-btn" title={t('crew.plus')} onclick={() => update({ coin: crew.coin + 1 })}><Plus size={13} /></button>
  </div>
  {#if crew.coin > coinCap(crew)}<p class="warn small">{t('crew.overCap', { cap: coinCap(crew) })}</p>{/if}
  {#if atWar(crew)}<p class="warn small">{t('crew.atWar')}</p>{/if}
  <Entangle {crew} {adventure} />
</div>

<style>
  .crew {
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
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .k {
    min-width: 72px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .n {
    min-width: 22px;
    font-weight: 700;
    text-align: center;
  }
  .over,
  .warn {
    color: var(--warning);
  }
  .small {
    margin: 0;
    font-size: 11px;
  }
</style>
