<!-- The builder, under the "Factions" feature: the between-sessions roll (GeneratorFile.goalRoll) and the template of a
     warband (GeneratorFile.warband) in SystemPack.kit. A value of a card that is not a line (a list) stays as it is. -->
<script lang="ts">
  import { Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { templateText, templateValue, type GenText } from '../../../shared/generators';
  import { fieldMap, loc, type SystemPack } from '../../../shared/syspack';
  import { filesOf } from '../generators/store.svelte';
  import LocInput from './LocInput.svelte';

  let { pack, disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  const roll = $derived(pack.kit?.goalRoll);
  const band = $derived(pack.kit?.warband);
  const asLoc = (x: GenText | undefined) => x as string | Record<string, string> | undefined;
  const num = (e: Event) => {
    const n = Number((e.currentTarget as HTMLInputElement).value);
    return Number.isInteger(n) ? n : undefined;
  };
  function kit() {
    pack.kit ??= { tables: {}, generators: [] };
    return pack.kit;
  }
  // The rules of the system's content package: a copy here wins over them.
  const files = $derived(filesOf(pack.family ?? pack.id));
  const ownRoll = $derived(files.find((f) => f.goalRoll)?.goalRoll);
  const ownBand = $derived(files.find((f) => f.warband)?.warband);
  const addRoll = () => (kit().goalRoll = ownRoll ? $state.snapshot(ownRoll) : { die: 6, steps: [{ from: 6, gained: 2 }, { from: 4, gained: 1 }] });
  const addBand = () => (kit().warband = ownBand ? $state.snapshot(ownBand) : { description: '', stats: {} });

  // Everything the card can have, except what is counted.
  const fields = $derived([...fieldMap(pack).values()].filter((f) => f.type !== 'formula'));
  const free = $derived(fields.filter((f) => !band || !(f.key in band.stats)));
  const titleOf = (key: string) => {
    const f = fieldMap(pack).get(key);
    return f ? loc(f.title, lang) : key;
  };
  function setUpkeep(e: Event) {
    const n = num(e);
    if (n && n > 0) band!.upkeep = { amount: n, money: band!.upkeep?.money ?? t('sb.rules.defMoney') };
    else delete band!.upkeep;
  }
</script>

<div class="rules">
  <h4>{t('sb.rules.goalRoll')}</h4>
  {#if !roll}
    <p class="faint">{ownRoll ? t('sb.rules.fromPackage') : t('sb.rules.noGoalRoll')}</p>
    <div><button class="btn" {disabled} onclick={addRoll}><Plus size={14} /> {ownRoll ? t('sb.rules.copy') : t('sb.rules.add')}</button></div>
  {:else}
    <p class="faint">{t('sb.rules.goalSum')}</p>
    <label class="row"><span>{t('sb.rules.die')}</span><input class="short" type="number" min="1" {disabled} value={roll.die} onchange={(e) => { const n = num(e); if (n && n > 0) roll.die = n; }} /></label>
    {#each roll.steps as s, i (i)}
      <div class="two">
        <label class="row"><span>{t('sb.rules.from')}</span><input class="short" type="number" {disabled} value={s.from} onchange={(e) => (s.from = num(e) ?? s.from)} /></label>
        <label class="row"><span>{t('sb.rules.gained')}</span><input class="short" type="number" min="1" {disabled} value={s.gained} onchange={(e) => { const n = num(e); if (n && n > 0) s.gained = n; }} /></label>
        <button class="icon-btn" {disabled} title={t('sb.rules.remove')} onclick={() => roll.steps.splice(i, 1)}><Trash2 size={13} /></button>
      </div>
    {/each}
    <div><button class="btn" {disabled} onclick={() => roll.steps.push({ from: 1, gained: 1 })}><Plus size={14} /> {t('sb.rules.addStep')}</button></div>
    <label class="row"><span>{t('sb.rules.goalAbout')}</span><LocInput multiline {disabled} value={asLoc(roll.about)} set={(v) => (roll.about = v)} /></label>
    <div class="end"><button class="btn" {disabled} onclick={() => kit() && delete kit().goalRoll}><Trash2 size={13} /> {t('sb.rules.remove')}</button></div>
  {/if}

  <h4>{t('sb.rules.warband')}</h4>
  {#if !band}
    <p class="faint">{ownBand ? t('sb.rules.fromPackage') : t('sb.rules.noWarband')}</p>
    <div><button class="btn" {disabled} onclick={addBand}><Plus size={14} /> {ownBand ? t('sb.rules.copy') : t('sb.rules.add')}</button></div>
  {:else}
    <label class="row"><span>{t('sb.rules.about')}</span><LocInput multiline {disabled} value={asLoc(band.about)} set={(v) => (band.about = v)} /></label>
    <label class="row"><span>{t('sb.rules.hint')}</span><LocInput {disabled} value={asLoc(band.hint)} set={(v) => (band.hint = v)} /></label>
    <label class="row"><span>{t('sb.rules.cardText')}</span><LocInput multiline {disabled} value={asLoc(band.description)} set={(v) => (band.description = v)} /></label>
    <div class="two">
      <label class="row"><span>{t('sb.rules.upkeep')}</span><input class="short" type="number" min="0" title={t('sb.rules.upkeepHint')} {disabled} value={band.upkeep?.amount ?? ''} onchange={setUpkeep} /></label>
      {#if band.upkeep}
        {@const upkeep = band.upkeep}
        <label class="row grow"><span>{t('sb.rules.money')}</span><LocInput {disabled} value={asLoc(upkeep.money)} set={(v) => (upkeep.money = v)} /></label>
      {/if}
    </div>
    <div class="row">
      <span title={t('sb.rules.statsHint')}>{t('sb.rules.stats')}</span>
      {#each Object.keys(band.stats) as key (key)}
        {@const text = templateText(band.stats[key], lang)}
        <div class="two">
          <span class="key">{titleOf(key)}</span>
          {#if text === null}
            <span class="grow faint">{t('sb.rules.complex')}</span>
          {:else}
            <input class="grow" type="text" {disabled} value={text} onchange={(e) => (band.stats[key] = templateValue(e.currentTarget.value, band.stats[key], lang))} />
          {/if}
          <button class="icon-btn" {disabled} title={t('sb.rules.remove')} onclick={() => delete band.stats[key]}><Trash2 size={13} /></button>
        </div>
      {/each}
      {#if free.length}
        <select {disabled} value="" onchange={(e) => { const k = e.currentTarget.value; if (k) band.stats[k] = ''; e.currentTarget.value = ''; }}>
          <option value="">{t('sb.rules.addStat')}</option>
          {#each free as f (f.key)}<option value={f.key}>{loc(f.title, lang)}</option>{/each}
        </select>
      {/if}
    </div>
    <div class="end"><button class="btn" {disabled} onclick={() => kit() && delete kit().warband}><Trash2 size={13} /> {t('sb.rules.remove')}</button></div>
  {/if}
</div>

<style>
  .rules {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 0 10px 24px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  p {
    margin: 0;
    font-size: 12px;
  }
  h4 {
    margin: 6px 0 0;
    color: var(--text-muted);
    font-size: 12px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .row > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .row :global(input[type='text']),
  .row :global(textarea) {
    width: 100%;
  }
  .two {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-end;
  }
  .grow {
    flex: 1;
    min-width: 160px;
  }
  .short {
    width: 90px;
  }
  .key {
    width: 130px;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .end {
    display: flex;
    justify-content: flex-end;
  }
</style>
