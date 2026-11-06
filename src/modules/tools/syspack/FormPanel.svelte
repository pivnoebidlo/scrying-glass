<!-- The builder: a form of the system (GenForm in SystemPack.kit). What the GM fills in, the numbers counted from it,
     and what it says, with the condition for each line. A choice is written «a name | speed=3, note=fast» and brings
     its numbers and words into formulas and text. What this panel doesn't show (repeats, words for numbers, systems of
     the family) stays as it is. It shows right here as the GM will see it. -->
<script lang="ts">
  import { Eye, Pencil, Plus, Trash2, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { keyFrom } from '../../../shared/compendium';
  import { getLang } from '../../../shared/i18n';
  import { formKeys, formWords, genText, optionsOfText, renameFormKey, textOfOptions, type FormInput, type FormResult, type GenForm, type GenText } from '../../../shared/generators';
  import type { SystemPack } from '../../../shared/syspack';
  import Form from '../generators/Form.svelte';
  import FormulaInput from './FormulaInput.svelte';
  import LocInput from './LocInput.svelte';

  let { pack, form, onremove, disabled = false }: { pack: SystemPack; form: GenForm; onremove(): void; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  let reading = $state(false);
  const asLoc = (x: GenText | undefined) => x as string | Record<string, string> | undefined;
  const keys = $derived(formKeys(form));
  const inputNames = $derived(Object.fromEntries(form.inputs.map((i) => [i.key, genText(i.title, lang)])));
  const free = (title: string) => {
    const base = (keyFrom(title) || 'value').replace(/-/g, '_');
    const start = /^[a-z]/.test(base) ? base : `v_${base}`;
    let id = start;
    for (let i = 2; keys.includes(id); i++) id = `${start}_${i}`;
    return id;
  };
  function addInput(type: FormInput['type']) {
    const key = `value_${form.inputs.length + 1}`;
    const title = t(`sb.form.new.${type}`);
    form.inputs = [...form.inputs, { key: keys.includes(key) ? free(title) : key, title, type, default: type === 'number' ? 1 : 0, ...(type === 'select' ? { options: [{ id: 'o1', title: t('sb.form.option') }] } : {}) }];
  }
  // A key made at first follows the title while it is the made one: {rasstoyanie}, not {value_1}. What already reads it
  // is renamed too.
  function retitle(x: FormInput, title: string) {
    if (!/^value_\d+$/.test(x.key) || !title.trim()) return;
    const to = free(title);
    const next = renameFormKey($state.snapshot(form) as GenForm, x.key, to);
    form.inputs = next.inputs;
    if (next.lets) form.lets = next.lets;
    form.results = next.results;
  }
  const addLet = () => (form.lets = [...(form.lets ?? []), { key: free(`sum ${(form.lets ?? []).length + 1}`), formula: '0' }]);
  const addResult = () => (form.results = [...form.results, { text: t('sb.form.newResult') }]);
  // What's kept but not shown here.
  const extras = (r: FormResult) => !!(r.each || r.only || r.vars);
  const hidden = $derived(!!(form.picks?.length || form.words || form.inputs.some((i) => i.only) || form.results.some(extras)));
</script>

<div class="bar">
  <button class="btn small" onclick={() => (reading = !reading)}>
    {#if reading}<Pencil size={13} /> {t('sb.entryEdit')}{:else}<Eye size={13} /> {t('sb.entryRead')}{/if}
  </button>
  <span class="spacer"></span>
  <button class="btn small" {disabled} onclick={onremove}><Trash2 size={13} /> {t('sb.gen.remove')}</button>
</div>
{#if reading}
  {#key JSON.stringify(form)}<Form id={`builder/${pack.id}/${form.id}`} form={$state.snapshot(form) as GenForm} system={pack.id} />{/key}
{:else}
  <div class="row"><span>{t('sb.gen.name')}</span><LocInput value={asLoc(form.title)} set={(v) => (form.title = v ?? '')} {disabled} /></div>
  <div class="row"><span>{t('sb.form.about')}</span><LocInput value={asLoc(form.about)} set={(v) => (v ? (form.about = v) : delete form.about)} {disabled} /></div>
  {#if hidden}<p class="faint small">{t('sb.form.hidden')}</p>{/if}

  <h4>{t('sb.form.inputs')}</h4>
  {#each form.inputs as x, i (x.key)}
    <div class="block">
      <div class="two">
        <div class="grow"><LocInput value={asLoc(x.title)} set={(v) => ((x.title = v ?? ''), retitle(x, typeof v === 'string' ? v : (v?.[lang] ?? '')))} {disabled} /></div>
        <span class="faint">{t(`sb.form.type.${x.type}`)}</span>
        {#if x.type === 'number'}<input type="number" class="short" {disabled} title={t('sb.calc.default')} bind:value={x.default} />{/if}
        <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => (form.inputs = form.inputs.filter((_, j) => j !== i))}><X size={13} /></button>
      </div>
      {#if x.type === 'select'}
        <label class="row">
          <span>{t('sb.form.options')}</span>
          <textarea rows="4" class="mono" {disabled} placeholder={t('sb.form.optionsPh').replace(/\\n/g, '\n')} value={textOfOptions(x.options ?? [], lang)} onchange={(e) => (x.options = optionsOfText(e.currentTarget.value, x.options ?? [], lang))}></textarea>
        </label>
      {/if}
      <div class="row"><span>{t('sb.form.when')}</span><FormulaInput value={x.when ?? ''} set={(v) => (v.trim() ? (x.when = v) : delete x.when)} {keys} names={inputNames} {disabled} placeholder={t('sb.form.always')} /></div>
    </div>
  {/each}
  <div class="add">
    <button class="btn small" {disabled} onclick={() => addInput('number')}><Plus size={13} /> {t('sb.form.type.number')}</button>
    <button class="btn small" {disabled} onclick={() => addInput('select')}><Plus size={13} /> {t('sb.form.type.select')}</button>
    <button class="btn small" {disabled} onclick={() => addInput('check')}><Plus size={13} /> {t('sb.form.type.check')}</button>
  </div>

  <h4>{t('sb.form.lets')}</h4>
  {#each form.lets ?? [] as x, i (i)}
    <div class="two">
      <input type="text" class="key mono" {disabled} aria-label={t('sb.key')} value={x.key} onchange={(e) => (x.key = keyFrom(e.currentTarget.value).replace(/-/g, '_') || x.key)} />
      <span>=</span>
      <div class="grow"><FormulaInput value={x.formula} set={(v) => (x.formula = v)} {keys} names={inputNames} {disabled} /></div>
      <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => (form.lets = form.lets!.filter((_, j) => j !== i))}><X size={13} /></button>
    </div>
  {/each}
  <div><button class="btn small" {disabled} onclick={addLet}><Plus size={13} /> {t('sb.form.addLet')}</button></div>

  <h4>{t('sb.form.results')}</h4>
  <p class="faint small">{t('sb.form.resultsHint')} {#each formWords(form) as w (w)}<code>{`{${w}}`}</code> {/each}</p>
  {#each form.results as x, i (i)}
    <div class="block">
      <div class="two">
        <select {disabled} value={x.kind ?? 'card'} onchange={(e) => (x.kind = e.currentTarget.value as FormResult['kind'])}>
          {#each ['big', 'warn', 'card'] as const as k (k)}<option value={k}>{t(`sb.form.kind.${k}`)}</option>{/each}
        </select>
        {#if (x.kind ?? 'card') === 'card'}<div class="grow"><LocInput value={asLoc(x.title)} set={(v) => (v ? (x.title = v) : delete x.title)} {disabled} /></div>{:else}<span class="grow"></span>{/if}
        <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => (form.results = form.results.filter((_, j) => j !== i))}><X size={13} /></button>
      </div>
      <LocInput value={asLoc(x.text)} set={(v) => (x.text = v ?? '')} {disabled} />
      <div class="row"><span>{t('sb.form.when')}</span><FormulaInput value={x.when ?? ''} set={(v) => (v.trim() ? (x.when = v) : delete x.when)} {keys} names={inputNames} {disabled} placeholder={t('sb.form.always')} /></div>
      {#if extras(x)}<p class="faint small">{t('sb.form.hiddenOne')}</p>{/if}
    </div>
  {/each}
  <div><button class="btn small" {disabled} onclick={addResult}><Plus size={13} /> {t('sb.form.addResult')}</button></div>
{/if}

<style>
  .bar,
  .two,
  .add {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer,
  .grow {
    flex: 1 1 160px;
    min-width: 0;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 12px;
  }
  .row textarea {
    width: 100%;
    box-sizing: border-box;
  }
  .block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  h4 {
    margin: 10px 0 0;
    font-size: 13px;
  }
  .small {
    margin: 0;
    font-size: 12px;
  }
  .short {
    width: 72px;
  }
  .key {
    width: 130px;
  }
  code {
    font-size: 11px;
  }
</style>
