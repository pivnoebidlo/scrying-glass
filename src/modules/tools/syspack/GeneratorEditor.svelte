<!-- The builder: one generator. A line reads as a sentence, a condition and a place in the inventory hang on it as chips;
     numbers and questions are there only when a line needs them; a card is put together by the titles of the sheet's
     fields. The recipe's steps are the only truth: a line is read from them and written back (shared/generators.ts);
     what isn't a plain line stays as it is. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { ArrowDown, ArrowUp, Dices, Plus, Trash2, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { CardKind } from '../../../shared/cards';
  import { keyFrom } from '../../../shared/compendium';
  import { die } from '../../../shared/dice';
  import { getLang } from '../../../shared/i18n';
  import { diceOfRows, genCardOf, genText, linkCard, lineWords, numberOf, numberStep, packFile, plainText, rollWords, runGenerator, simpleStep, stepOf, type GenCardSpec, type Generator, type GenLine, type GenOption, type GenResult, type GenTable, type GenText, type NumberStep, type PackKit, type SimpleStep, type WhenOp } from '../../../shared/generators';
  import { loc, sectionsFor, type SystemPack } from '../../../shared/syspack';
  import FormulaInput from './FormulaInput.svelte';
  import LocInput from './LocInput.svelte';

  let { pack, generator: g, tables, onremove, disabled = false }: { pack: SystemPack; generator: Generator; tables: [string, GenTable][]; onremove(): void; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  const asLoc = (x: GenText) => x as string | Record<string, string>;
  let trial = $state<GenResult | null>(null);
  const OPS: WhenOp[] = ['ge', 'le', 'gt', 'lt', 'eq'];

  // Numbers stand first in the recipe, the lines after them.
  const numberCount = $derived(g.steps.findIndex((s) => !numberOf(s)) < 0 ? g.steps.length : g.steps.findIndex((s) => !numberOf(s)));
  const numbers = $derived(g.steps.slice(0, numberCount).map((s) => numberOf(s)!));
  const lines = $derived(g.steps.slice(numberCount));
  const titleOfNumber = (key: string) => genText(g.names?.[key], lang) || key;
  const asks = $derived(g.options ?? []);
  // What a condition, a count or a line can name.
  const named = $derived([...numbers.map((n) => ({ key: n.key, title: titleOfNumber(n.key), check: false })), ...asks.map((o) => ({ key: o.key, title: genText(o.title, lang), check: o.type === 'check' }))]);
  const isCheck = (key: string) => named.find((x) => x.key === key)?.check ?? false;
  const tableById = (id: string) => tables.find(([x]) => x === id)?.[1];
  const named2 = (x: string | undefined) => (x ? (tableById(x)?.head[0] ?? x) : '');

  const free = (base: string) => {
    const taken = [...numbers.map((n) => n.key), ...asks.map((o) => o.key)];
    const b = (keyFrom(base) || 'n').slice(0, 24);
    let id = b;
    for (let i = 2; taken.includes(id); i++) id = `${b}_${i}`;
    return id;
  };

  const kindOfCard = $derived(g.card?.kind ?? 'character');
  const fields = $derived(sectionsFor(pack, kindOfCard).flatMap((s) => s.fields).map((f) => ({ key: f.key, title: loc(f.title, lang), type: f.type })));
  const slotFields = $derived(sectionsFor(pack, kindOfCard).flatMap((s) => s.fields).filter((f) => f.type === 'slots'));
  const links = $derived(g.card ? linkCard($state.snapshot(g) as Generator, fields, kindOfCard, lang).links : []);

  // Every change: the trial is old, and the card follows the names.
  function changed() {
    trial = null;
    if (!g.card) return;
    const now = $state.snapshot(g) as Generator;
    const nameLine = g.card.name && 'line' in g.card.name ? g.card.name.line : undefined;
    const r = linkCard(now, fields, kindOfCard, lang, nameLine);
    g.steps = r.steps;
    g.card = r.card;
  }
  function setLine(i: number, changes: Partial<SimpleStep>) {
    const at = numberCount + i;
    const now = simpleStep(g.steps[at]!);
    if (now) g.steps[at] = stepOf({ ...now, ...changes });
    changed();
  }
  function addLine() {
    const [id, x] = tables[0]!;
    g.steps.push(stepOf({ label: x.head[0] || id, table: id, dice: diceOfRows(x.rows), times: 1 }));
    changed();
  }
  // Choosing a table takes its dice along, and its name, unless the label was written by hand.
  function setTable(i: number, id: string) {
    const was = simpleStep(lines[i]!);
    const auto = was && genText(was.label, lang) === named2(was.table);
    setLine(i, { table: id, dice: diceOfRows(tableById(id)?.rows ?? []), by: undefined, byRow: undefined, ...(auto ? { label: named2(id) } : {}) });
  }
  // The dice field takes dice or the title of a number; a number with a table without numbers counts its rows.
  function setDice(i: number, raw: string, x: SimpleStep) {
    const v = raw.trim();
    const n = named.find((y) => y.title.toLowerCase() === v.toLowerCase());
    if (n) setLine(i, { by: n.key, byRow: !diceOfRows(tableById(x.table)?.rows ?? []), dice: '' });
    else setLine(i, { dice: v.toLowerCase().replace(/к/g, 'd'), by: undefined, byRow: undefined });
  }
  const diceText = (x: SimpleStep) => (x.by ? titleOfNumber(x.by) : rollWords(x.dice, lang));
  function setTimes(i: number, v: string) {
    if (/^\d+$/.test(v)) setLine(i, { times: Number(v) || 1, timesBy: undefined });
    else setLine(i, { times: 1, timesBy: v });
  }
  function addWhen(i: number) {
    const first = named[0];
    if (first) setLine(i, { when: first.check ? { what: first.key, op: 'on' } : { what: first.key, op: 'ge', value: 1 } });
  }
  function setWhenWhat(i: number, x: SimpleStep, what: string) {
    setLine(i, { when: isCheck(what) ? { what, op: 'on' } : { what, op: 'ge', value: x.when?.value ?? 1 } });
  }
  function addInto(i: number) {
    const f = slotFields[0];
    if (f) setLine(i, { into: intoOf(f.key, 0) });
  }
  function intoOf(field: string, group: number) {
    const groups = slotFields.find((f) => f.key === field)?.slots ?? [];
    const size = groups.reduce((n, x) => n + x.count, 0);
    const start = groups.slice(0, group).reduce((n, x) => n + x.count, 0);
    return { field, size, pack: Array.from({ length: groups[group]?.count ?? 0 }, (_, k) => start + k) };
  }
  // The group an item goes to: by the first place of it.
  function groupOf(x: SimpleStep) {
    const groups = slotFields.find((f) => f.key === x.into?.field)?.slots ?? [];
    let start = 0;
    for (let i = 0; i < groups.length; i++) {
      if (x.into?.pack[0] === start) return i;
      start += groups[i]!.count;
    }
    return 0;
  }
  const groupsOf = (x: SimpleStep) => (slotFields.find((f) => f.key === x.into?.field)?.slots ?? []).map((s) => loc(s.title, lang));
  function move(i: number, by: number) {
    const at = numberCount + i;
    const [x] = g.steps.splice(at, 1);
    g.steps.splice(at + by, 0, x!);
    changed();
  }
  function removeLine(i: number) {
    g.steps.splice(numberCount + i, 1);
    changed();
  }

  function addNumber() {
    const title = t('sb.gen.newNumber');
    const key = free(`n ${numbers.length + 1}`);
    g.names = { ...g.names, [key]: title };
    g.steps.splice(numberCount, 0, numberStep({ key, dice: 'd6' }));
    changed();
  }
  function setNumber(i: number, changes: Partial<NumberStep>) {
    g.steps[i] = numberStep({ ...numbers[i]!, ...changes });
    changed();
  }
  function removeNumber(i: number) {
    const key = numbers[i]!.key;
    g.steps.splice(i, 1);
    const { [key]: _gone, ...rest } = g.names ?? {};
    g.names = rest;
    changed();
  }
  // A roll or a formula: dice «2d6» / a keep; «=» starts a formula.
  const keepOf = (n: NumberStep) => (n.formula !== undefined ? 'formula' : (n.keep ?? 'all'));
  function setKeep(i: number, v: string) {
    const n = numbers[i]!;
    if (v === 'formula') setNumber(i, { dice: undefined, keep: undefined, count: undefined, formula: '0' });
    else setNumber(i, { dice: n.dice ?? 'd6', formula: undefined, keep: v === 'all' ? undefined : (v as 'low' | 'high'), count: n.count ?? 1 });
  }

  function addAsk() {
    const title = t('sb.gen.newAsk');
    const o: GenOption = { key: free(`ask ${asks.length + 1}`), title, type: 'check', default: false };
    g.options = [...asks, o];
    changed();
  }
  function removeAsk(i: number) {
    g.options = asks.filter((_, j) => j !== i);
    if (!g.options.length) delete g.options;
    changed();
  }

  function toggleCard(on: boolean) {
    if (on) g.card = { kind: 'character', name: { line: '' }, stats: {} } as GenCardSpec;
    else delete g.card;
    changed();
  }
  function setCardKind(k: CardKind) {
    if (g.card) g.card.kind = k;
    changed();
  }
  function setCardName(as: string) {
    if (g.card) g.card.name = { line: as };
    changed();
  }

  function roll() {
    trial = runGenerator(packFile(pack.id, untrack(() => $state.snapshot(pack.kit!)) as PackKit), g.id, {}, die);
  }
  const words = (l: GenLine) => plainText(lineWords(packFile(pack.id, pack.kit!), l, lang));
  const cardWords = $derived(trial?.card ? genCardOf(packFile(pack.id, pack.kit!), trial.card, lang) : null);
</script>

<div class="row"><span>{t('sb.gen.name')}</span><LocInput value={asLoc(g.title)} set={(v) => (g.title = v ?? '')} {disabled} /></div>

<details open={asks.length > 0} class="box">
  <summary>{t('sb.gen.ask')} <span class="faint">{asks.length || ''}</span></summary>
  {#each asks as o, i (o.key)}
    <div class="pair">
      <div class="grow"><LocInput value={asLoc(o.title)} set={(v) => ((o.title = v ?? ''), changed())} {disabled} /></div>
      <select {disabled} value={o.type} onchange={(e) => ((o.type = e.currentTarget.value as 'check' | 'number'), (o.default = o.type === 'check' ? false : 1), changed())}>
        <option value="check">{t('sb.gen.askCheck')}</option>
        <option value="number">{t('sb.gen.askNumber')}</option>
      </select>
      <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => removeAsk(i)}><X size={13} /></button>
    </div>
  {/each}
  <button class="btn small" {disabled} onclick={addAsk}><Plus size={13} /> {t('sb.gen.addAsk')}</button>
</details>

<details open={numbers.length > 0} class="box">
  <summary>{t('sb.gen.numbers')} <span class="faint">{numbers.length || ''}</span></summary>
  <p class="faint small">{t('sb.gen.numbersAbout')}</p>
  {#each numbers as n, i (n.key)}
    <div class="pair">
      <div class="grow"><LocInput value={asLoc(g.names?.[n.key] ?? n.key)} set={(v) => ((g.names = { ...g.names, [n.key]: v ?? '' }), changed())} {disabled} /></div>
      <span class="faint">=</span>
      {#if n.formula === undefined}
        <input type="text" class="dice" {disabled} value={rollWords(n.dice, lang)} onchange={(e) => setNumber(i, { dice: e.currentTarget.value.trim().toLowerCase().replace(/к/g, 'd') })} />
      {/if}
      <select {disabled} value={keepOf(n)} onchange={(e) => setKeep(i, e.currentTarget.value)}>
        <option value="all">{t('sb.gen.keepAll')}</option>
        <option value="low">{t('sb.gen.keepLow')}</option>
        <option value="high">{t('sb.gen.keepHigh')}</option>
        <option value="formula">{t('sb.gen.byFormula')}</option>
      </select>
      {#if n.keep}<input type="number" class="tiny" min="1" {disabled} value={n.count ?? 1} onchange={(e) => setNumber(i, { count: Number(e.currentTarget.value) || 1 })} />{/if}
      <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => removeNumber(i)}><X size={13} /></button>
    </div>
    {#if n.formula !== undefined}
      <FormulaInput value={n.formula} set={(v) => setNumber(i, { formula: v || '0' })} keys={numbers.slice(0, i).map((x) => x.key)} names={Object.fromEntries(numbers.slice(0, i).map((x) => [x.key, titleOfNumber(x.key)]))} {disabled} />
    {/if}
  {/each}
  <button class="btn small" {disabled} onclick={addNumber}><Plus size={13} /> {t('sb.gen.addNumber')}</button>
</details>

<h4>{t('sb.gen.lines')}</h4>
{#each lines as s, i (i)}
  {@const x = simpleStep(s)}
  <div class="line">
    {#if x}
      <div class="sentence">
        <div class="label"><LocInput value={asLoc(x.label)} set={(v) => setLine(i, { label: v ?? '' })} {disabled} /></div>
        <span class="faint">{t('sb.gen.roll')}</span>
        <input type="text" class="dice" list="sb-gen-numbers" {disabled} value={diceText(x)} placeholder={t('sb.gen.anyShort')} title={t('sb.gen.dicePh')} onchange={(e) => setDice(i, e.currentTarget.value, x)} />
        <span class="faint">{t('sb.gen.onTable')}</span>
        <select {disabled} value={x.table} onchange={(e) => setTable(i, e.currentTarget.value)}>
          {#each tables as [id, tb] (id)}<option value={id}>{tb.head[0] || id}</option>{/each}
        </select>
        <input type="text" class="tiny" list="sb-gen-numbers" {disabled} value={x.timesBy ? titleOfNumber(x.timesBy) : x.times} aria-label={t('sb.gen.timesWord')} onchange={(e) => setTimes(i, named.find((y) => y.title === e.currentTarget.value)?.key ?? e.currentTarget.value)} />
        <span class="faint">{t('sb.gen.timesWord')}</span>
        <span class="acts">
          <button class="icon-btn" title={t('sb.gen.up')} disabled={disabled || !i} onclick={() => move(i, -1)}><ArrowUp size={13} /></button>
          <button class="icon-btn" title={t('sb.gen.down')} disabled={disabled || i === lines.length - 1} onclick={() => move(i, 1)}><ArrowDown size={13} /></button>
          <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => removeLine(i)}><Trash2 size={13} /></button>
        </span>
      </div>
      {#if x.when}
        <div class="chip">
          <span class="accent">{t('sb.gen.onlyIf')}</span>
          <select {disabled} value={x.when.what} onchange={(e) => setWhenWhat(i, x, e.currentTarget.value)}>
            {#each named as y (y.key)}<option value={y.key}>{y.title}</option>{/each}
          </select>
          {#if isCheck(x.when.what)}
            <select {disabled} value={x.when.op} onchange={(e) => setLine(i, { when: { ...x.when!, op: e.currentTarget.value as WhenOp } })}>
              <option value="on">{t('sb.gen.op.on')}</option>
              <option value="off">{t('sb.gen.op.off')}</option>
            </select>
          {:else}
            <select {disabled} value={x.when.op} onchange={(e) => setLine(i, { when: { ...x.when!, op: e.currentTarget.value as WhenOp } })}>
              {#each OPS as op (op)}<option value={op}>{t(`sb.gen.op.${op}`)}</option>{/each}
            </select>
            <input type="number" class="tiny" {disabled} value={x.when.value ?? 0} onchange={(e) => setLine(i, { when: { ...x.when!, value: Number(e.currentTarget.value) } })} />
          {/if}
          <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => setLine(i, { when: undefined })}><X size={13} /></button>
        </div>
      {/if}
      {#if x.into}
        <div class="chip">
          <span class="accent">{t('sb.gen.putInto')}</span>
          <select {disabled} value={groupOf(x)} onchange={(e) => setLine(i, { into: intoOf(x.into!.field, Number(e.currentTarget.value)) })}>
            {#each groupsOf(x) as title, k (k)}<option value={k}>{title}</option>{/each}
          </select>
          <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => setLine(i, { into: undefined })}><X size={13} /></button>
        </div>
      {/if}
      {#if (!x.when && named.length) || (!x.into && slotFields.length && g.card)}
        <div class="adds">
          {#if !x.when && named.length}<button class="add" {disabled} onclick={() => addWhen(i)}>{t('sb.gen.addCond')}</button>{/if}
          {#if !x.into && slotFields.length && g.card}<button class="add" {disabled} onclick={() => addInto(i)}>{t('sb.gen.addInto')}</button>{/if}
        </div>
      {/if}
    {:else}
      <div class="sentence">
        <span class="faint grow">{t('sb.gen.complex')}</span>
        <button class="icon-btn" title={t('sb.gen.remove')} {disabled} onclick={() => removeLine(i)}><Trash2 size={13} /></button>
      </div>
    {/if}
  </div>
{/each}
<datalist id="sb-gen-numbers">{#each named.filter((y) => !y.check) as y (y.key)}<option value={y.title}></option>{/each}</datalist>

{#if tables.length}
  <div class="bar">
    <button class="btn small" {disabled} onclick={addLine}><Plus size={13} /> {t('sb.gen.addLine')}</button>
    <button class="btn small primary" disabled={!g.steps.length} onclick={roll}><Dices size={13} /> {t('sb.gen.trial')}</button>
    <span class="grow"></span>
    <button class="btn small" {disabled} onclick={onremove}><Trash2 size={13} /> {t('sb.gen.remove')}</button>
  </div>
{:else}
  <p class="faint small">{t('sb.gen.needTable')}</p>
{/if}

<div class="box">
  <label class="check"><input type="checkbox" {disabled} checked={!!g.card} onchange={(e) => toggleCard(e.currentTarget.checked)} /> {t('sb.gen.card')}</label>
  {#if g.card}
    <div class="pair">
      <label class="row grow"><span>{t('sb.gen.cardKind')}</span>
        <select {disabled} value={g.card.kind} onchange={(e) => setCardKind(e.currentTarget.value as CardKind)}>
          <option value="character">{t('sb.kind.character')}</option>
          <option value="npc">{t('sb.kind.npc')}</option>
          <option value="monster">{t('sb.kind.monster')}</option>
        </select>
      </label>
      <label class="row grow"><span>{t('sb.gen.cardName')}</span>
        <select {disabled} value={'line' in g.card.name ? g.card.name.line : ''} onchange={(e) => setCardName(e.currentTarget.value)}>
          {#each lines.flatMap((s) => (simpleStep(s)?.as ? [simpleStep(s)!] : [])) as x (x.as)}<option value={x.as}>{genText(x.label, lang)}</option>{/each}
        </select>
      </label>
    </div>
    {#each links as l, i (i)}
      <div class="small" class:faint={!l.to}>{l.to ? t('sb.gen.linked', { from: l.from, to: l.to }) : t('sb.gen.unlinked', { from: l.from })}</div>
    {/each}
  {/if}
</div>

{#if trial}
  <ul class="result">
    {#each trial.lines as l, i (i)}
      <li><b>{genText(l.label, lang, l.params)}:</b> {words(l)} {#if l.roll}<span class="faint small">{rollWords(l.roll, lang)}</span>{/if}</li>
    {/each}
    {#if cardWords}<li class="faint small">{t('sb.gen.card')}: {cardWords.name} · {Object.entries(cardWords.stats).map(([k, v]) => `${k} ${typeof v === 'object' ? '…' : v}`).join(', ')}</li>{/if}
  </ul>
{/if}

<style>
  h4 {
    margin: 4px 0 0;
    color: var(--text-muted);
    font-size: 12px;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .row > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  details.box > * + * {
    margin-top: 6px;
  }
  summary {
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .pair {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .grow {
    flex: 1 1 170px;
    min-width: 0;
  }
  .grow :global(input),
  .label :global(input) {
    width: 100%;
  }
  .line {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .sentence {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .label {
    flex: 1 1 140px;
    min-width: 0;
  }
  .sentence select {
    max-width: 180px;
  }
  .dice {
    width: 96px;
  }
  .tiny {
    width: 56px;
  }
  .acts {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }
  .chip {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    padding-left: 12px;
  }
  .accent {
    color: var(--accent);
  }
  .adds {
    display: flex;
    gap: 6px;
  }
  .add {
    padding: 1px 10px;
    border: 1px dashed var(--border);
    border-radius: 12px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .small {
    margin: 0;
    font-size: 12px;
  }
  .result {
    margin: 0;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    list-style: none;
  }
  .result li {
    margin: 4px 0;
  }
</style>
