<!-- The builder: one field of a pack, as the right side of the sheet step. Its title, what kind of field it is (a tile
     each), what the kind needs (limits, dots, boxes, options, columns, a formula) and what a click on it rolls: a recipe
     in words («a pool of dice, count successes»), its main numbers as a sentence («Roll [formula] d[6], a success on
     [6] and up»), the rest under «More»; a trial roll on the sample card. The key, the hint and other rare things —
     under «More» too. Changes go straight into the draft. -->
<script lang="ts">
  import { Dices, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { COLUMN_TYPES, evalFormula, FIELD_TYPES, fieldMap, loc, newField, newRoll, type FieldDef, type FieldType, type Loc, type RollSpec, POOL_KINDS, type PoolKind, type SystemPack } from '../../../shared/syspack';
  import { keyFrom } from '../../../shared/compendium';
  import { getLang } from '../../../shared/i18n';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import FormulaInput from './FormulaInput.svelte';
  import LocInput from './LocInput.svelte';
  import { builder, freeKey } from './store.svelte';

  let { f = $bindable(), keys, disabled = false, onkey }: { f: FieldDef; keys: string[]; disabled?: boolean; onkey: (from: string, to: string) => void } = $props();

  const L = (x: Loc | undefined) => loc(x, getLang());
  const others = $derived(keys.filter((k) => k !== f.key));
  const cols = $derived(f.columns?.map((c) => c.key) ?? []);
  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? undefined : Number(v));

  // The words of the sheet for the formulas: field titles by key, this list's columns by «row.<column>».
  const pack = $derived(builder.draft ? ($state.snapshot(builder.draft) as SystemPack) : null);
  const names = $derived({
    ...Object.fromEntries(pack ? [...fieldMap(pack)].map(([k, x]) => [k, L(x.title) || k]) : []),
    ...Object.fromEntries((f.columns ?? []).map((c) => [`row.${c.key}`, L(c.title) || c.key])),
  });
  // A row of the sample card for a list (its first one, else empty values of the columns).
  const sampleRow = $derived.by(() => {
    const rows = builder.previewStats[f.key];
    const first = Array.isArray(rows) ? (rows[0] as Record<string, unknown> | undefined) : undefined;
    return first ?? Object.fromEntries((f.columns ?? []).map((c) => [c.key, c.type === 'text' || c.type === 'dice' ? '' : 0]));
  });
  // The fields with a number (for a formula): numbers, dots, tracks, choices, formulas.
  const numeric = $derived(pack ? [...fieldMap(pack)].filter(([k, x]) => k !== f.key && ['number', 'dots', 'track', 'select', 'formula'].includes(x.type)).map(([k]) => k) : []);
  const valueOf = (formula: string) => (pack ? evalFormula(pack, $state.snapshot(builder.previewStats), formula, f.type === 'list' ? sampleRow : undefined) : 0);
  const example = (formula: string) => (pack && formula.trim() ? valueOf(formula) : null);

  // A new field has a key from «New field»: it follows the title until the GM changes it.
  const fresh = $derived(new RegExp(`^${keyFrom(t('sb.newField'))}(_\\d+)?$`).test(f.key));
  function retitle() {
    const title = L(f.title).trim();
    if (!fresh || !title) return;
    const to = freeKey(title, new Set(others));
    if (/^[a-z]/.test(to) && to !== f.key) onkey(f.key, to);
  }

  const ICONS: Record<FieldType, string> = { number: '12', dots: '●●○', track: '☐☐', text: 'Аа', textarea: '¶', select: '▾', tags: '#', list: '☰', formula: 'ƒ', slots: '▤' };
  function setType(type: FieldType) {
    const next = newField(type, f.key, f.title);
    const roll = f.roll && type !== 'text' && type !== 'textarea' && type !== 'tags' && type !== 'slots' ? f.roll : undefined;
    f = { ...next, ...(f.hint ? { hint: f.hint } : {}), ...(roll ? { roll } : {}) };
  }

  // The recipes of a roll: the roll types in the words of a game, a pool split by how it counts.
  type Recipe = 'none' | 'pool' | 'best' | 'd20' | 'under' | 'bands' | 'fate' | 'sum' | 'explode';
  const RECIPES: Recipe[] = ['none', 'pool', 'd20', 'under', 'bands', 'best', 'fate', 'sum', 'explode'];
  const recipe = $derived<Recipe>(!f.roll ? 'none' : f.roll.type === 'pool' ? (f.roll.best || !f.roll.success ? 'best' : 'pool') : f.roll.type);
  const rolls_ = $derived(f.type !== 'text' && f.type !== 'textarea' && f.type !== 'tags' && f.type !== 'slots');
  function setRecipe(r: Recipe) {
    if (r === 'none') {
      const { roll: _r, ...rest } = f;
      f = rest;
      return;
    }
    if (r === 'best') {
      const spec = newRoll('pool', f) as Extract<RollSpec, { type: 'pool' }>;
      delete spec.success;
      f.roll = { ...spec, best: true };
      return;
    }
    f.roll = newRoll(r, f);
  }

  function tryRoll() {
    if (!pack || !f.roll) return;
    const row = f.type === 'list' ? sampleRow : undefined;
    rolls.packRoll(t('sb.sample'), L(f.title), $state.snapshot(f.roll) as RollSpec, (formula) => evalFormula(pack, $state.snapshot(builder.previewStats), formula, row), 'normal', row);
  }

  const optionsText = $derived((f.options ?? []).map((o) => L(o)).join('\n'));
  function setOptions(text: string) {
    const lines = text.split('\n');
    f.options = lines.map((line, i) => {
      const old = f.options?.[i];
      return old !== undefined && typeof old !== 'string' ? { ...old, [getLang()]: line } : line;
    });
  }
  const trimOptions = () => (f.options = (f.options ?? []).filter((o) => L(o).trim()));
  function addColumn() {
    const taken = new Set(cols);
    f.columns = [...(f.columns ?? []), { key: freeKey('column', taken), type: 'text', title: t('sb.newField') }];
  }
  const setColTitle = (i: number, title: Loc) => {
    const c = f.columns![i]!;
    c.title = title;
  };
</script>

{#snippet formula(value: string, set: (v: string) => void, placeholder = '')}
  <FormulaInput {value} {set} {keys} row={cols} {names} {numeric} example={example(value)} {disabled} {placeholder} />
{/snippet}

{#snippet labelsEditor(r: { labels?: { min: number; title: Loc }[] })}
  <div class="row">
    <span>{t('sb.labels')}</span>
    {#each r.labels ?? [] as l, i (i)}
      <div class="col">
        <input type="number" class="n" {disabled} value={l.min} onchange={(e) => (l.min = num(e.currentTarget.value) ?? 0)} />
        <LocInput value={l.title} set={(v) => (l.title = v)} {disabled} />
        <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (r.labels = r.labels!.filter((_, j) => j !== i))}><X size={13} /></button>
      </div>
    {/each}
    <button type="button" class="btn small" {disabled} onclick={() => (r.labels = [...(r.labels ?? []), { min: 0, title: '' }])}>{t('sb.addLabel')}</button>
  </div>
{/snippet}

<div class="panel">
  <label class="row"><span>{t('sb.name')}</span><span onfocusout={retitle}><LocInput value={f.title} set={(v) => (f.title = v)} {disabled} /></span></label>
  <div class="row">
    <span>{t('sb.type')}</span>
    <div class="types">
      {#each FIELD_TYPES as ft (ft)}
        <button type="button" aria-pressed={f.type === ft} {disabled} onclick={() => f.type !== ft && setType(ft)}><span class="ico">{ICONS[ft]}</span>{t(`sb.ft.${ft}`)}</button>
      {/each}
    </div>
  </div>

  {#if f.type === 'number'}
    <div class="two">
      <label class="row"><span>{t('sb.min')}</span><input type="number" {disabled} value={f.min ?? ''} onchange={(e) => (f.min = num(e.currentTarget.value))} /></label>
      <label class="row"><span>{t('sb.max')}</span><input type="number" {disabled} value={f.max ?? ''} onchange={(e) => (f.max = num(e.currentTarget.value))} /></label>
      <label class="row"><span>{t('sb.default')}</span><input type="number" {disabled} value={typeof f.default === 'number' ? f.default : ''} onchange={(e) => (f.default = num(e.currentTarget.value))} /></label>
    </div>
  {:else if f.type === 'slots'}
    <div class="row">
      <span>{t('sb.slotGroups')}</span>
      {#each f.slots ?? [] as g, i (i)}
        <div class="col">
          <LocInput value={g.title} set={(v) => (g.title = v)} {disabled} />
          <input type="number" min="1" max="20" class="n" {disabled} value={g.count} onchange={(e) => (g.count = Math.max(1, Math.min(20, num(e.currentTarget.value) ?? 1)))} />
          <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (f.slots = f.slots!.filter((_, j) => j !== i))}><X size={13} /></button>
        </div>
      {/each}
      <button type="button" class="btn small" {disabled} onclick={() => (f.slots = [...(f.slots ?? []), { title: '', count: 2 }])}>{t('sb.addSlotGroup')}</button>
    </div>
  {:else if f.type === 'dots'}
    <label class="sentence">{t('sb.dotsUpTo')} <input type="number" min="1" max="12" class="n" {disabled} value={f.max ?? 5} onchange={(e) => (f.max = Math.max(1, Math.min(12, num(e.currentTarget.value) ?? 5)))} /></label>
  {:else if f.type === 'track'}
    <div class="row">
      <span>{t('sb.boxes')}</span>
      <div class="inline">
        <select {disabled} value={typeof f.boxes === 'string' ? 'from' : 'fixed'} onchange={(e) => (f.boxes = e.currentTarget.value === 'from' ? (others[0] ?? 5) : 5)}>
          <option value="fixed">{t('sb.boxesFixed')}</option>
          <option value="from" disabled={!others.length}>{t('sb.boxesFrom')}</option>
        </select>
        {#if typeof f.boxes === 'string'}
          <select {disabled} value={f.boxes} onchange={(e) => (f.boxes = e.currentTarget.value)}>{#each others as k (k)}<option value={k}>{names[k] ?? k}</option>{/each}</select>
        {:else}
          <input type="number" min="1" max="40" class="n" {disabled} value={f.boxes ?? 5} onchange={(e) => (f.boxes = Math.max(1, Math.min(40, num(e.currentTarget.value) ?? 5)))} />
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
          <select {disabled} value={c.type} onchange={(e) => (c.type = e.currentTarget.value as typeof c.type)}>
            {#each COLUMN_TYPES as ct (ct)}<option value={ct}>{t(`sb.ct.${ct}`)}</option>{/each}
          </select>
          <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (f.columns = f.columns!.filter((_, j) => j !== i))}><X size={13} /></button>
        </div>
      {/each}
      <button type="button" class="btn small" {disabled} onclick={addColumn}>{t('sb.addColumn')}</button>
    </div>
  {:else if f.type === 'formula'}
    <div class="row"><span>{t('sb.formulaIs')}</span>{@render formula(f.formula ?? '', (v) => (f.formula = v))}</div>
  {/if}

  {#if rolls_}
    <div class="roll">
      <div class="row">
        <span>{t('sb.onClick')}</span>
        <div class="recipes">
          {#each RECIPES as r (r)}
            <button type="button" class="recipe" aria-pressed={recipe === r} {disabled} onclick={() => recipe !== r && setRecipe(r)}>
              <b>{t(`sb.recipe.${r}`)}</b>{#if r !== 'none'}<small>{t(`sb.recipeEg.${r}`)}</small>{/if}
            </button>
          {/each}
        </div>
      </div>

      {#if f.roll}
        {@const r = f.roll}
        <div class="sentence-box">
          {#if r.type === 'pool' && !r.best && r.success}
            <div class="line">{t('sb.ph.roll')}</div>
            {@render formula(r.count, (v) => (r.count = v))}
            <div class="line">
              {t('sb.ph.d')}<input type="number" min="2" class="n" {disabled} value={r.sides} onchange={(e) => (r.sides = Math.max(2, num(e.currentTarget.value) ?? 6))} />,
              {t('sb.ph.successOn')} <input type="number" min="1" class="n" {disabled} value={r.success} onchange={(e) => (r.success = Math.max(1, num(e.currentTarget.value) ?? 6))} /> {t('sb.ph.andUp')},
              {t('sb.ph.noMore')} <input type="number" min="1" max="30" class="n" placeholder="—" {disabled} value={r.max ?? ''} onchange={(e) => {
                const n = num(e.currentTarget.value);
                if (n) r.max = Math.min(30, Math.max(1, Math.round(n)));
                else delete r.max;
              }} /> {t('sb.ph.dice')}
            </div>
          {:else if r.type === 'pool'}
            <div class="line">{t('sb.ph.roll')}</div>
            {@render formula(r.count, (v) => (r.count = v))}
            <div class="line">{t('sb.ph.d')}<input type="number" min="2" class="n" {disabled} value={r.sides} onchange={(e) => (r.sides = Math.max(2, num(e.currentTarget.value) ?? 6))} /> {t('sb.ph.best')}</div>
            <p class="faint small">{t('sb.ph.bestHow')}</p>
          {:else if r.type === 'd20' || r.type === 'fate'}
            <div class="line">{r.type === 'd20' ? t('sb.ph.d20') : t('sb.ph.fate')}</div>
            {@render formula(r.bonus, (v) => (r.bonus = v))}
            {#if r.type === 'd20'}
              <label class="line" title={t('sb.degreesHint')}>
                {t('sb.ph.against')}
                <select {disabled} value={r.degrees ?? ''} onchange={(e) => (e.currentTarget.value ? (r.degrees = e.currentTarget.value as 'two' | 'four') : delete r.degrees)}>
                  <option value="">{t('sb.degreesNone')}</option>
                  <option value="two">{t('sb.degreesTwo')}</option>
                  <option value="four">{t('sb.degreesFour')}</option>
                </select>
              </label>
              <p class="faint small">{t('sb.ph.advantage')}</p>
            {/if}
          {:else if r.type === 'under'}
            <div class="line">{t('sb.ph.roll')} {t('sb.ph.d')}<input type="number" min="2" class="n" {disabled} value={r.sides} onchange={(e) => (r.sides = Math.max(2, num(e.currentTarget.value) ?? 100))} /> {t('sb.ph.under')}</div>
            {@render formula(r.target, (v) => (r.target = v))}
            <p class="faint small">{t('sb.ph.advantageUnder')}</p>
          {:else if r.type === 'bands'}
            <div class="line">{t('sb.ph.roll')} <input type="text" class="mono dice" {disabled} value={r.dice} onchange={(e) => (r.dice = e.currentTarget.value.trim() || '2d6')} /> {t('sb.ph.plus')}</div>
            {@render formula(r.bonus, (v) => (r.bonus = v))}
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
          {:else if r.type === 'sum'}
            <div class="line">{t('sb.ph.roll')} <input type="text" class="mono dice" {disabled} value={r.dice} onchange={(e) => (r.dice = e.currentTarget.value.trim() || '1d6')} /> {t('sb.ph.sum')}</div>
            {@render formula(r.bonus ?? '', (v) => (r.bonus = v), t('sb.ph.noBonus'))}
            {#if f.type === 'list'}<p class="faint small">{t('sb.ph.rowDice')}</p>{/if}
          {:else if r.type === 'explode'}
            <div class="line">{t('sb.ph.explode')}</div>
            {@render formula(r.sides, (v) => (r.sides = v))}
            <div class="line">{t('sb.ph.plus')}</div>
            {@render formula(r.bonus ?? '', (v) => (r.bonus = v), t('sb.ph.noBonus'))}
            <label class="line">{t('sb.wild')} <input type="number" min="0" class="n" {disabled} value={r.wild ?? 0} onchange={(e) => {
              const n = num(e.currentTarget.value);
              if (n) r.wild = n;
              else delete r.wild;
            }} /></label>
          {/if}
        </div>

        {#if r.type === 'pool'}
          <label class="check" title={t('sb.askHint')}><input type="checkbox" {disabled} checked={!!r.ask} onchange={(e) => (e.currentTarget.checked ? (r.ask = true) : (delete r.ask, delete r.askRange))} /> {t('sb.ask')}</label>
          {#if r.ask}
            <label class="check sub">{t('sb.askRange')} <input type="number" min="1" max="10" class="n" placeholder="3" {disabled} value={r.askRange ?? ''} onchange={(e) => {
              const n = num(e.currentTarget.value);
              if (n) r.askRange = Math.min(10, Math.max(1, Math.round(n)));
              else delete r.askRange;
            }} /></label>
          {/if}
          {#if r.success && !r.best && !r.kind && !r.groups?.length}
            <label class="check" title={t('sb.needHint')}><input type="checkbox" {disabled} checked={!!r.need} onchange={(e) => (e.currentTarget.checked ? (r.need = true) : delete r.need)} /> {t('sb.need')}</label>
            <label class="check" title={t('sb.tweakHint')}><input type="checkbox" {disabled} checked={!!r.tweak} onchange={(e) => (e.currentTarget.checked ? (r.tweak = true) : delete r.tweak)} /> {t('sb.tweak')}</label>
          {/if}
          {#if r.best}
            <label class="check"><input type="checkbox" {disabled} checked={!!r.resist} onchange={(e) => (e.currentTarget.checked ? (r.resist = true) : delete r.resist)} /> {t('sb.resist')}</label>
          {/if}
        {/if}

        {#if (r.type === 'pool' && r.success && !r.best) || r.type === 'under' || r.type === 'd20' || r.type === 'fate' || r.type === 'sum'}
          <details>
            <summary>{t('sb.expert')}</summary>
            <div class="expert">
              {#if r.type === 'pool'}
                <label class="check"><input type="checkbox" {disabled} checked={!!r.push} onchange={(e) => (e.currentTarget.checked ? (r.push = true) : delete r.push)} /> {t('sb.push')}</label>
                <label class="row" title={t('sb.kindHint')}>
                  <span>{t('sb.kind')}</span>
                  <select {disabled} value={r.kind ?? ''} onchange={(e) => (e.currentTarget.value ? ((r.kind = e.currentTarget.value as PoolKind), delete r.need, delete r.tweak) : delete r.kind)}>
                    <option value="">{t('sb.kindPlain')}</option>
                    {#each POOL_KINDS.filter((k) => k !== 'artifact') as k (k)}<option value={k}>{t(`sb.pk.${k}`)}</option>{/each}
                  </select>
                </label>
                <div class="row">
                  <span>{t('sb.groups')}</span>
                  {#each r.groups ?? [] as g, i (i)}
                    <div class="col">
                      <select {disabled} value={g.kind} onchange={(e) => ((g.kind = e.currentTarget.value as PoolKind), g.kind === 'artifact' ? (g.sides ??= 8) : delete g.sides)}>
                        {#each POOL_KINDS as k (k)}<option value={k}>{t(`sb.pk.${k}`)}</option>{/each}
                      </select>
                      <FormulaInput value={g.count} set={(v) => (g.count = v)} {keys} row={cols} {names} {disabled} />
                      {#if g.kind === 'artifact'}
                        <select {disabled} value={g.sides ?? 8} onchange={(e) => (g.sides = Number(e.currentTarget.value))}>
                          {#each [8, 10, 12] as n (n)}<option value={n}>d{n}</option>{/each}
                        </select>
                      {/if}
                      <button type="button" class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (r.groups = r.groups!.filter((_, j) => j !== i))}><X size={13} /></button>
                    </div>
                  {/each}
                  <button type="button" class="btn small" {disabled} onclick={() => ((r.kind ??= 'base'), delete r.need, delete r.tweak, (r.groups = [...(r.groups ?? []), { kind: 'skill', count: '0' }]))}>{t('sb.addGroup')}</button>
                </div>
                {#if r.push}
                  <label class="check"><input type="checkbox" {disabled} checked={!!r.pushStress} onchange={(e) => (e.currentTarget.checked ? (r.pushStress = true) : delete r.pushStress)} /> {t('sb.pushStress')}</label>
                {/if}
              {:else if r.type === 'under'}
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
              {:else}
                {@render labelsEditor(r)}
              {/if}
            </div>
          </details>
        {/if}

        <button type="button" class="btn try" onclick={tryRoll} title={t('sb.tryHint')}><Dices size={14} /> {t('sb.tryRoll')}</button>
      {/if}
    </div>
  {/if}

  <details>
    <summary>{t('sb.more')}</summary>
    <div class="expert">
      <label class="row"><span>{t('sb.hint')}</span><LocInput value={f.hint} set={(v) => (f.hint = v)} {disabled} /></label>
      {#if f.type === 'number' || f.type === 'dots'}
        <label class="check"><input type="checkbox" {disabled} checked={!!f.hideZero} onchange={(e) => (e.currentTarget.checked ? (f.hideZero = true) : delete f.hideZero)} /> {t('sb.hideZero')}</label>
      {/if}
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
      {#if f.type === 'list'}
        <div class="row">
          <span>{t('sb.columnKeys')}</span>
          {#each f.columns ?? [] as c (c.key)}
            <div class="col">
              <span class="faint col-name">{L(c.title)}</span>
              <input type="text" class="mono key" {disabled} value={c.key} onchange={(e) => {
                const to = e.currentTarget.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                if (to && /^[a-z]/.test(to) && !cols.includes(to)) c.key = to;
                else e.currentTarget.value = c.key;
              }} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </details>
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
  .types {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 4px;
  }
  .types button {
    padding: 5px 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    font-size: 11px;
  }
  .types button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .ico {
    display: block;
    color: var(--accent);
    font-size: 13px;
  }
  .recipes {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .recipe {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    text-align: left;
  }
  .recipe[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .recipe b {
    font-weight: 600;
  }
  .recipe small {
    color: var(--text-faint);
  }
  .sentence-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
  }
  .line,
  .sentence {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
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
  .col-name {
    flex: 1;
    min-width: 0;
  }
  .key {
    width: 110px;
  }
  .n {
    width: 56px;
  }
  .dice {
    width: 80px;
  }
  .mono {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }
  .roll {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .check.sub {
    padding-left: 22px;
  }
  details {
    border-top: 1px solid var(--border);
    padding-top: 6px;
  }
  summary {
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .expert {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
  .btn.small,
  .try {
    align-self: flex-start;
  }
  .btn.small {
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
