<!-- A calculator of a package (shared/generators.ts): rows of a kind and a count, the inputs, the totals. The plan is
     remembered by the window; «To journal» writes it as a note of the adventure. Knows no game. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { NotebookPen, Plus, X } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../renderer/lib/nav';
  import { store } from '../../../renderer/lib/store.svelte';
  import { calcValue, genText, runCalculator, type CalcRow, type GeneratorFile, type GenCalculator, type GenText } from '../../../shared/generators';
  import { journalFolder } from '../../journal/ui/store.svelte';
  import { openPage } from '../../journal/ui/ui.svelte';

  let { file, calc }: { file: GeneratorFile; calc: GenCalculator } = $props();

  type Saved = { rows: CalcRow[]; inputs: Record<string, number> };
  const KEY = $derived(`generators.calc.${file.system}/${calc.id}`);
  function load(key: string): Saved {
    const fresh: Saved = { rows: (calc.start ?? []).map((r) => ({ ...r })), inputs: Object.fromEntries((calc.inputs ?? []).map((i) => [i.key, i.default ?? 0])) };
    try {
      return { ...fresh, ...JSON.parse(localStorage.getItem(key) ?? '{}') };
    } catch {
      return fresh;
    }
  }
  const b = $state(untrack(() => load(KEY)));
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(b)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const lang = $derived(locale.lang);
  const w = (x: GenText | undefined, params?: Record<string, string | number>) => genText(x, lang, params);
  const r = $derived(runCalculator(calc, b.rows, b.inputs));
  // A calculator without the checkbox doesn't draw its column.
  const flagged = $derived(!!w(calc.labels.flag));
  const money = (n: number) => w(calc.unit, { n: n.toLocaleString(lang) });
  const kindTitle = (id: string) => w(calc.kinds.find((k) => k.id === id)?.title);
  const shownTotals = $derived(calc.totals.filter((x) => !x.strong));
  const strong = $derived(calc.totals.find((x) => x.strong));
  const totalText = (x: GenCalculator['totals'][number]) => (r[x.key] ? (x.text ? w(x.text, { count: r[x.key]! }) : money(r[x.key]!)) : '—');

  function add() {
    b.rows.push({ kind: calc.kinds[0]!.id, count: 1 });
    save();
  }
  function remove(i: number) {
    b.rows.splice(i, 1);
    save();
  }
  function markdown(): string {
    const l = calc.labels;
    const rows = b.rows.map((p) => `| ${p.name?.trim() || kindTitle(p.kind)} | ${kindTitle(p.kind)}${p.flag ? `, ${w(l.flag).toLowerCase()}` : ''} | ${p.count} | ${money(calcValue(calc, p))} |`);
    return [`| ${w(l.name)} | ${w(l.kind)} | ${w(l.count)} | ${w(l.value)} |`, '|---|---|---|---|', ...rows, '', ...calc.totals.map((x) => `- ${w(x.title)}: **${totalText(x)}**`)].join('\n');
  }
  async function toJournal() {
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), w(calc.title), markdown());
    if (!path) return;
    openPage(path);
    openTab('journal');
  }
</script>

<div class="view">
  <header class="head">
    <span class="spacer"></span>
    <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal} disabled={!b.rows.length}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
  </header>
  {#if calc.about}<p class="faint about"><Lead text={w(calc.about)} /></p>{/if}

  <table>
    <thead>
      <tr>
        <th>{w(calc.labels.name)}</th>
        <th>{w(calc.labels.kind)}</th>
        <th class="num">{w(calc.labels.count)}</th>
        {#if flagged}<th>{w(calc.labels.flag)}</th>{/if}
        <th class="num">{w(calc.labels.value)}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each b.rows as p, i (i)}
        <tr>
          <td><input type="text" bind:value={p.name} placeholder={kindTitle(p.kind)} oninput={save} /></td>
          <td>
            <select bind:value={p.kind} onchange={save}>
              {#each calc.kinds as k (k.id)}<option value={k.id}>{w(k.title)} — {money(k.value)}</option>{/each}
            </select>
          </td>
          <td class="num"><input type="number" min="0" step="1" bind:value={p.count} oninput={save} /></td>
          {#if flagged}<td><input type="checkbox" bind:checked={p.flag} onchange={save} title={w(calc.labels.flagHint)} /></td>{/if}
          <td class="num">{money(calcValue(calc, p))}</td>
          <td><button class="icon-btn" title={w(calc.labels.remove)} onclick={() => remove(i)}><X size={14} /></button></td>
        </tr>
      {/each}
    </tbody>
  </table>
  <button class="btn add" onclick={add}><Plus size={14} /> {w(calc.labels.add)}</button>

  <div class="options">
    {#each calc.inputs ?? [] as i (i.key)}
      <label>{w(i.title)}
        <input type="number" min={i.min ?? 0} step="1" bind:value={b.inputs[i.key]} oninput={save} />
      </label>
    {/each}
  </div>

  <section class="result">
    {#if strong}<div class="big">{money(r[strong.key] ?? 0)}</div>{/if}
    <dl>
      {#each shownTotals as x (x.key)}<dt>{w(x.title)}</dt><dd>{totalText(x)}</dd>{/each}
    </dl>
  </section>
  {#if calc.rules}<p class="faint note"><Lead text={w(calc.rules)} /></p>{/if}
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .spacer {
    flex: 1;
  }
  .about {
    margin: 6px 0 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    padding: 4px 6px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
  }
  td {
    padding: 3px 6px;
  }
  .num {
    text-align: right;
    white-space: nowrap;
  }
  td input[type='text'],
  td select {
    width: 100%;
  }
  td input[type='number'] {
    width: 80px;
  }
  .add {
    margin-top: 6px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin-top: 14px;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .options input[type='number'] {
    width: 110px;
  }
  .result {
    margin: 16px 0 8px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .big {
    font-size: 24px;
    font-weight: 600;
  }
  dl {
    display: grid;
    grid-template-columns: max-content auto;
    gap: 2px 16px;
    margin: 6px 0 0;
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
  }
  .note {
    font-size: 12px;
    line-height: 1.5;
  }
</style>
