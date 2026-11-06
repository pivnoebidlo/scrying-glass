<!-- The builder: a price list of the system (GenList in SystemPack.kit). Sections of «a name | a price», one a line; the
     list itself shows right here as the GM will see it. Options and multipliers a package brings stay as they are. -->
<script lang="ts">
  import { Eye, Pencil, Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { packFile, priceRowsOfText, textOfPriceRows, unitOf, unitText, type GenList, type GenText, type PackKit } from '../../../shared/generators';
  import type { SystemPack } from '../../../shared/syspack';
  import PriceList from '../generators/PriceList.svelte';
  import LocInput from './LocInput.svelte';

  let { pack, list, onremove, disabled = false }: { pack: SystemPack; list: GenList; onremove(): void; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  let reading = $state(false);
  const asLoc = (x: GenText) => x as string | Record<string, string>;
  const tables = $derived(pack.kit!.tables[lang] ?? {});
  const unit = $derived(unitOf(list.unit, lang));

  function addSection() {
    const n = list.sections.length + 1;
    const id = `${list.id}_${n}_${Math.random().toString(36).slice(2, 6)}`;
    pack.kit!.tables[lang] ??= {};
    pack.kit!.tables[lang][id] = { head: [''], rows: [] };
    list.sections.push({ id, table: id, title: t('sb.list.newSection') });
  }
  function removeSection(i: number) {
    const [s] = list.sections.splice(i, 1);
    for (const x of Object.values(pack.kit!.tables)) delete x[s!.table];
  }
  function setUnit(v: string) {
    list.unit = unitText(v);
    // The prices as text follow.
    for (const s of list.sections) {
      const x = tables[s.table];
      if (x) x.rows = priceRowsOfText(textOfPriceRows(x.rows), v);
    }
  }
</script>

<div class="bar">
  <button class="btn small" onclick={() => (reading = !reading)}>
    {#if reading}<Pencil size={13} /> {t('sb.entryEdit')}{:else}<Eye size={13} /> {t('sb.entryRead')}{/if}
  </button>
  <span class="spacer"></span>
  <button class="btn small" {disabled} onclick={onremove}><Trash2 size={13} /> {t('sb.gen.remove')}</button>
</div>
{#if reading}
  {#key JSON.stringify(list)}<PriceList file={packFile(pack.id, $state.snapshot(pack.kit!) as PackKit)} list={$state.snapshot(list) as GenList} />{/key}
{:else}
  <div class="two">
    <div class="row grow"><span>{t('sb.gen.name')}</span><LocInput value={asLoc(list.title)} set={(v) => (list.title = v ?? '')} {disabled} /></div>
    <label class="row"><span>{t('sb.list.unit')}</span><input type="text" class="short" {disabled} value={unit} onchange={(e) => setUnit(e.currentTarget.value)} /></label>
  </div>
  {#each list.sections as s, i (s.id)}
    <div class="sec">
      <div class="two">
        <div class="row grow"><span>{t('sb.list.section')}</span><LocInput value={asLoc(s.title)} set={(v) => (s.title = v ?? '')} {disabled} /></div>
        <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => removeSection(i)}><Trash2 size={13} /></button>
      </div>
      {#if tables[s.table]}
        <textarea rows="6" {disabled} placeholder={t('sb.list.rowsPh').replace(/\\n/g, '\n')} value={textOfPriceRows(tables[s.table]!.rows)} onchange={(e) => (tables[s.table]!.rows = priceRowsOfText(e.currentTarget.value, unit))}></textarea>
      {/if}
    </div>
  {/each}
  <p class="faint small">{t('sb.list.hint')}</p>
  <div><button class="btn small" {disabled} onclick={addSection}><Plus size={13} /> {t('sb.list.addSection')}</button></div>
{/if}

<style>
  .bar,
  .two {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .spacer,
  .grow {
    flex: 1;
    min-width: 0;
  }
  .grow :global(input) {
    width: 100%;
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
  .short {
    width: 100px;
  }
  .sec {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  textarea {
    width: 100%;
    resize: vertical;
    font-family: var(--font-mono, monospace);
  }
  .small {
    margin: 0;
    font-size: 12px;
  }
</style>
