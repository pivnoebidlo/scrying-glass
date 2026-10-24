<!-- The builder: one field of a pack — its title and key, type and what the type needs (limits, dots, boxes, options,
     columns, a formula), and the roll by a click. Changes go straight into the draft. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { COLUMN_TYPES, FIELD_TYPES, loc, newField, newRoll, ROLL_TYPES, type FieldDef, type FieldType, type Loc, type RollSpec } from '../../../shared/syspack';
  import { getLang } from '../../../shared/i18n';
  import FormulaInput from './FormulaInput.svelte';
  import LocInput from './LocInput.svelte';
  import { freeKey } from './store.svelte';

  let { f = $bindable(), keys, disabled = false, onkey }: { f: FieldDef; keys: string[]; disabled?: boolean; onkey: (from: string, to: string) => void } = $props();

  const others = $derived(keys.filter((k) => k !== f.key));
  const cols = $derived(f.columns?.map((c) => c.key) ?? []);
  const numberish = $derived(others);
  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? undefined : Number(v));

  function setType(type: FieldType) {
    const fresh = newField(type, f.key, f.title);
    const roll = f.roll && type !== 'text' && type !== 'textarea' && type !== 'tags' ? f.roll : undefined;
    f = { ...fresh, ...(f.hint ? { hint: f.hint } : {}), ...(roll ? { roll } : {}) };
  }
  function setRoll(type: string) {
    if (type === '') {
      const { roll: _r, ...rest } = f;
      f = rest;
    } else f.roll = newRoll(type as RollSpec['type'], f);
  }
  const optionsText = $derived((f.options ?? []).map((o) => loc(o, getLang())).join('\n'));
  function setOptions(text: string) {
    const lines = text.split('\n');
    f.options = lines.map((line, i) => {
      const old = f.options?.[i];
      return old !== undefined && typeof old !== 'string' ? { ...old, [getLang()]: line } : line;
    });
  }
  const trimOptions = () => (f.options = (f.options ?? []).filter((o) => loc(o, getLang()).trim()));
  function addColumn() {
    const taken = new Set(cols);
    f.columns = [...(f.columns ?? []), { key: freeKey('column', taken), type: 'text', title: t('sb.newField') }];
  }
  const setColTitle = (i: number, title: Loc) => {
    const c = f.columns![i]!;
    c.title = title;
  };
</script>

<div class="panel">
  <label class="row"><span>{t('sb.name')}</span><LocInput value={f.title} set={(v) => (f.title = v)} {disabled} /></label>
  <label class="row" title={t('sb.idHint')}>
    <span>{t('sb.key')}</span>
    <input
      type="text"
      class="mono"
      {disabled}
      value={f.key}
      onchange={(e) => {
        const to = e.currentTarget.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (to && /^[a-z]/.test(to) && !others.includes(to)) onkey(f.key, to);
        else e.currentTarget.value = f.key;
      }}
    />
  </label>
  <label class="row">
    <span>{t('sb.type')}</span>
    <select {disabled} value={f.type} onchange={(e) => setType(e.currentTarget.value as FieldType)}>
      {#each FIELD_TYPES as ft (ft)}<option value={ft}>{t(`sb.ft.${ft}`)}</option>{/each}
    </select>
  </label>
  <label class="row"><span>{t('sb.hint')}</span><LocInput value={f.hint} set={(v) => (f.hint = v)} {disabled} /></label>

  {#if f.type === 'number'}
    <div class="two">
      <label class="row"><span>{t('sb.min')}</span><input type="number" {disabled} value={f.min ?? ''} onchange={(e) => (f.min = num(e.currentTarget.value))} /></label>
      <label class="row"><span>{t('sb.max')}</span><input type="number" {disabled} value={f.max ?? ''} onchange={(e) => (f.max = num(e.currentTarget.value))} /></label>
      <label class="row"><span>{t('sb.default')}</span><input type="number" {disabled} value={typeof f.default === 'number' ? f.default : ''} onchange={(e) => (f.default = num(e.currentTarget.value))} /></label>
    </div>
  {:else if f.type === 'dots'}
    <label class="row"><span>{t('sb.dots')}</span><input type="number" min="1" max="12" {disabled} value={f.max ?? 5} onchange={(e) => (f.max = Math.max(1, Math.min(12, num(e.currentTarget.value) ?? 5)))} /></label>
  {:else if f.type === 'track'}
    <div class="row">
      <span>{t('sb.boxes')}</span>
      <div class="inline">
        <select {disabled} value={typeof f.boxes === 'string' ? 'from' : 'fixed'} onchange={(e) => (f.boxes = e.currentTarget.value === 'from' ? (numberish[0] ?? 5) : 5)}>
          <option value="fixed">{t('sb.boxesFixed')}</option>
          <option value="from" disabled={!numberish.length}>{t('sb.boxesFrom')}</option>
        </select>
        {#if typeof f.boxes === 'string'}
          <select {disabled} value={f.boxes} onchange={(e) => (f.boxes = e.currentTarget.value)}>{#each numberish as k (k)}<option value={k}>{k}</option>{/each}</select>
        {:else}
          <input type="number" min="1" max="40" {disabled} value={f.boxes ?? 5} onchange={(e) => (f.boxes = Math.max(1, Math.min(40, num(e.currentTarget.value) ?? 5)))} />
        {/if}
      </div>
    </div>
  {:else if f.type === 'select'}
    <label class="row"><span>{t('sb.options')}</span><textarea rows="4" {disabled} value={optionsText} oninput={(e) => setOptions(e.currentTarget.value)} onblur={trimOptions}></textarea></label>
  {:else if f.type === 'list'}
    <div class="row">
      <span>{t('sb.columns')}</span>
      {#each f.columns ?? [] as c, i (i)}
        <div class="col">
          <LocInput value={c.title} set={(v) => setColTitle(i, v)} {disabled} />
          <input type="text" class="mono key" {disabled} value={c.key} onchange={(e) => {
            const to = e.currentTarget.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
            if (to && /^[a-z]/.test(to) && !cols.includes(to)) c.key = to;
            else e.currentTarget.value = c.key;
          }} />
          <select {disabled} value={c.type} onchange={(e) => (c.type = e.currentTarget.value as typeof c.type)}>
            {#each COLUMN_TYPES as ct (ct)}<option value={ct}>{t(`sb.ct.${ct}`)}</option>{/each}
          </select>
          <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (f.columns = f.columns!.filter((_, j) => j !== i))}><X size={13} /></button>
        </div>
      {/each}
      <button type="button" class="btn small" {disabled} onclick={addColumn}>{t('sb.addColumn')}</button>
    </div>
  {:else if f.type === 'formula'}
    <div class="row"><span>{t('sb.formula')}</span><FormulaInput value={f.formula ?? ''} set={(v) => (f.formula = v)} keys={others} {disabled} /></div>
    <p class="faint small">{t('sb.formulaHint')}</p>
  {/if}

  {#if f.type !== 'text' && f.type !== 'textarea' && f.type !== 'tags'}
    <div class="roll">
      <label class="row">
        <span>{t('sb.roll')}</span>
        <select {disabled} value={f.roll?.type ?? ''} onchange={(e) => setRoll(e.currentTarget.value)}>
          <option value="">{t('sb.noRoll')}</option>
          {#each ROLL_TYPES as rt (rt)}<option value={rt}>{t(`sb.rt.${rt}`)}</option>{/each}
        </select>
      </label>
      {#if f.roll}
        {@const r = f.roll}
        {#if r.type === 'd20' || r.type === 'fate'}
          <div class="row"><span>{t('sb.bonus')}</span><FormulaInput value={r.bonus} set={(v) => (r.bonus = v)} keys={keys} row={cols} {disabled} /></div>
        {:else if r.type === 'under'}
          <div class="two">
            <label class="row"><span>{t('sb.sides')}</span><input type="number" min="2" {disabled} value={r.sides} onchange={(e) => (r.sides = Math.max(2, num(e.currentTarget.value) ?? 100))} /></label>
          </div>
          <div class="row"><span>{t('sb.target')}</span><FormulaInput value={r.target} set={(v) => (r.target = v)} keys={keys} row={cols} {disabled} /></div>
          <div class="row">
            <span>{t('sb.levels')}</span>
            {#each r.levels ?? [] as l, i (i)}
              <div class="col">
                <LocInput value={l.title} set={(v) => (l.title = v)} {disabled} />
                <span class="faint">{t('sb.levelDivide')}</span>
                <input type="number" min="1" class="n" {disabled} value={l.divide} onchange={(e) => (l.divide = Math.max(1, num(e.currentTarget.value) ?? 2))} />
                <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (r.levels = r.levels!.filter((_, j) => j !== i))}><X size={13} /></button>
              </div>
            {/each}
            <button type="button" class="btn small" {disabled} onclick={() => (r.levels = [...(r.levels ?? []), { title: '', divide: (r.levels?.length ?? 0) ? 5 : 2 }])}>{t('sb.addLevel')}</button>
          </div>
        {:else if r.type === 'bands'}
          <div class="two">
            <label class="row"><span>{t('sb.dice')}</span><input type="text" class="mono" {disabled} value={r.dice} onchange={(e) => (r.dice = e.currentTarget.value.trim() || '2d6')} /></label>
          </div>
          <div class="row"><span>{t('sb.bonus')}</span><FormulaInput value={r.bonus} set={(v) => (r.bonus = v)} keys={keys} row={cols} {disabled} /></div>
          <div class="row">
            <span>{t('sb.bands')}</span>
            {#each r.bands as b, i (i)}
              <div class="col">
                <span class="faint">{t('sb.bandMin')}</span>
                <input type="number" class="n" {disabled} value={b.min} onchange={(e) => (b.min = num(e.currentTarget.value) ?? 0)} />
                <LocInput value={b.title} set={(v) => (b.title = v)} {disabled} />
                <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (r.bands = r.bands.filter((_, j) => j !== i))}><X size={13} /></button>
              </div>
            {/each}
            <button type="button" class="btn small" {disabled} onclick={() => (r.bands = [...r.bands, { min: 0, title: '' }])}>{t('sb.addBand')}</button>
          </div>
        {:else if r.type === 'pool'}
          <div class="row"><span>{t('sb.count')}</span><FormulaInput value={r.count} set={(v) => (r.count = v)} keys={keys} row={cols} {disabled} /></div>
          <div class="two">
            <label class="row"><span>{t('sb.sides')}</span><input type="number" min="2" {disabled} value={r.sides} onchange={(e) => (r.sides = Math.max(2, num(e.currentTarget.value) ?? 6))} /></label>
            <label class="row">
              <span>{t('sb.success')}</span>
              <input type="number" min="0" placeholder={t('sb.successNone')} {disabled} value={r.success ?? ''} onchange={(e) => {
                const n = num(e.currentTarget.value);
                if (n) {
                  r.success = n;
                  delete r.best;
                } else {
                  delete r.success;
                  r.best = true;
                }
              }} />
            </label>
          </div>
          <label class="check"><input type="checkbox" {disabled} checked={!!r.push} onchange={(e) => (e.currentTarget.checked ? (r.push = true) : delete r.push)} /> {t('sb.push')}</label>
        {:else if r.type === 'sum'}
          <div class="two">
            <label class="row"><span>{t('sb.dice')}</span><input type="text" class="mono" {disabled} value={r.dice} onchange={(e) => (r.dice = e.currentTarget.value.trim() || '1d6')} /></label>
          </div>
          <div class="row"><span>{t('sb.bonus')}</span><FormulaInput value={r.bonus ?? ''} set={(v) => (r.bonus = v)} keys={keys} row={cols} {disabled} /></div>
        {:else if r.type === 'explode'}
          <div class="row"><span>{t('sb.sides')}</span><FormulaInput value={r.sides} set={(v) => (r.sides = v)} keys={keys} row={cols} {disabled} /></div>
          <div class="row"><span>{t('sb.bonus')}</span><FormulaInput value={r.bonus ?? ''} set={(v) => (r.bonus = v)} keys={keys} row={cols} {disabled} /></div>
          <label class="row"><span>{t('sb.wild')}</span><input type="number" min="0" {disabled} value={r.wild ?? 0} onchange={(e) => {
            const n = num(e.currentTarget.value);
            if (n) r.wild = n;
            else delete r.wild;
          }} /></label>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .row > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .two {
    display: flex;
    gap: 8px;
  }
  .two .row {
    flex: 1 1 0;
    min-width: 0;
  }
  .two input {
    width: 100%;
    min-width: 0;
  }
  .inline,
  .col {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .col :global(input[type='text']:not(.key)) {
    flex: 1;
    min-width: 0;
  }
  .key {
    width: 90px;
  }
  .n {
    width: 64px;
  }
  .mono {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }
  .roll {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn.small {
    align-self: flex-start;
    padding: 2px 8px;
    font-size: 12px;
  }
  .small {
    margin: 0;
    font-size: 11px;
  }
  textarea {
    resize: vertical;
  }
</style>
