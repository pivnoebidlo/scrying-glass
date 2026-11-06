<!-- The builder: a calculator of the system (GenCalculator in SystemPack.kit). Kinds of rows with a value («a name |
     100»), numbers the GM types in, and totals by formulas, which read the sum of the rows (`value`), the count, those
     numbers and the totals above them. It shows right here as the GM will see it. -->
<script lang="ts">
  import { Eye, Pencil, Plus, Trash2, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { genText, kindsOfText, packFile, textOfKinds, unitOf, unitText, type GenCalculator, type GenText, type PackKit } from '../../../shared/generators';
  import type { SystemPack } from '../../../shared/syspack';
  import Calculator from '../generators/Calculator.svelte';
  import FormulaInput from './FormulaInput.svelte';
  import LocInput from './LocInput.svelte';

  let { pack, calc, onremove, disabled = false }: { pack: SystemPack; calc: GenCalculator; onremove(): void; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  let reading = $state(false);
  const asLoc = (x: GenText) => x as string | Record<string, string>;
  const free = (base: string, taken: string[]) => {
    let id = base || 'value';
    for (let i = 2; taken.includes(id); i++) id = `${base}_${i}`;
    return id;
  };
  const taken = $derived(['value', 'count', 'flag', ...Object.keys(calc.row), ...(calc.inputs ?? []).map((i) => i.key), ...calc.totals.map((x) => x.key)]);
  function addInput() {
    const title = t('sb.calc.newInput');
    const key = free(`input_${(calc.inputs ?? []).length + 1}`, taken);
    calc.inputs = [...(calc.inputs ?? []), { key, title, default: 1, min: 0 }];
  }
  function addTotal() {
    const key = free(`total_${calc.totals.length + 1}`, taken);
    calc.totals.push({ key, title: t('sb.calc.newTotal'), formula: 'value' });
  }
  // What a total may read: the rows' sums, the numbers typed in, the totals above it.
  function keysFor(i: number) {
    return [...Object.keys(calc.row), ...(calc.inputs ?? []).map((x) => x.key), ...calc.totals.slice(0, i).map((x) => x.key)];
  }
  function namesFor(i: number) {
    return Object.fromEntries([
      ['value', t('sb.calc.sum')],
      ...(calc.inputs ?? []).map((x) => [x.key, genText(x.title, lang)]),
      ...calc.totals.slice(0, i).map((x) => [x.key, genText(x.title, lang)]),
    ]);
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
  {#key JSON.stringify(calc)}<Calculator file={packFile(pack.id, $state.snapshot(pack.kit!) as PackKit)} calc={$state.snapshot(calc) as GenCalculator} />{/key}
{:else}
  <div class="two">
    <div class="row grow"><span>{t('sb.gen.name')}</span><LocInput value={asLoc(calc.title)} set={(v) => (calc.title = v ?? '')} {disabled} /></div>
    <label class="row"><span>{t('sb.list.unit')}</span><input type="text" class="short" {disabled} value={unitOf(calc.unit, lang)} onchange={(e) => (calc.unit = unitText(e.currentTarget.value))} /></label>
  </div>
  <label class="row">
    <span>{t('sb.calc.kinds')}</span>
    <textarea rows="5" {disabled} placeholder={t('sb.calc.kindsPh').replace(/\\n/g, '\n')} value={textOfKinds(calc.kinds, lang)} onchange={(e) => (calc.kinds = kindsOfText(e.currentTarget.value))}></textarea>
  </label>
  <h4>{t('sb.calc.inputs')}</h4>
  {#each calc.inputs ?? [] as x, i (x.key)}
    <div class="two">
      <div class="grow"><LocInput value={asLoc(x.title)} set={(v) => (x.title = v ?? '')} {disabled} /></div>
      <input type="number" class="short" {disabled} bind:value={x.default} title={t('sb.calc.default')} />
      <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => (calc.inputs = calc.inputs!.filter((_, j) => j !== i))}><X size={13} /></button>
    </div>
  {/each}
  <div><button class="btn small" {disabled} onclick={addInput}><Plus size={13} /> {t('sb.calc.addInput')}</button></div>
  <h4>{t('sb.calc.totals')}</h4>
  {#each calc.totals as x, i (x.key)}
    <div class="total">
      <div class="two">
        <div class="grow"><LocInput value={asLoc(x.title)} set={(v) => (x.title = v ?? '')} {disabled} /></div>
        <label class="check"><input type="checkbox" {disabled} checked={!!x.strong} onchange={(e) => { for (const y of calc.totals) delete y.strong; if (e.currentTarget.checked) x.strong = true; }} /> {t('sb.calc.strong')}</label>
        <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => calc.totals.splice(i, 1)}><X size={13} /></button>
      </div>
      <FormulaInput value={x.formula} set={(v) => (x.formula = v || '0')} keys={keysFor(i)} names={namesFor(i)} {disabled} />
    </div>
  {/each}
  <div><button class="btn small" {disabled} onclick={addTotal}><Plus size={13} /> {t('sb.calc.addTotal')}</button></div>
{/if}

<style>
  .bar,
  .two {
    display: flex;
    gap: 8px;
    align-items: center;
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
    width: 90px;
  }
  h4 {
    margin: 6px 0 0;
    color: var(--text-muted);
    font-size: 12px;
  }
  .total {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  textarea {
    width: 100%;
    resize: vertical;
    font-family: var(--font-mono, monospace);
  }
</style>
