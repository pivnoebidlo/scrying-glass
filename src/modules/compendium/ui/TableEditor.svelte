<!-- The editor of a roll table (an entry of the type `table`): no Markdown to write. The dice by buttons, the rows
     as ranges and results (merge, split, add), a grid — a second die for the columns; rolls and links to other tables
     go into a result by buttons; a table from a PDF or a site is pasted as text. It reads the entry's text and writes
     it back as a Markdown table (`body`) with the `roll` field (shared/rolltable.ts). -->
<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { Braces, ClipboardPaste, Dices, Grid3x3, Link, Merge, Plus, Split, X } from '@lucide/svelte';
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import { colsFor, coverage, diceSpan, modelMarkdown, numbersText, parseRollTable, rowsFor, TABLE_TYPE, tableModel, type EditRow, type Range, type TableModel } from '../../../shared/rolltable';
  import { allEntries } from './store.svelte';

  let { body = $bindable(), roll = $bindable(), title }: { body: string; roll: string; title: string } = $props();

  let model = $state<TableModel>(untrack(() => tableModel(body, roll, locale.lang === 'ru' ? 'к' : 'd')));
  // The letter of the dice: as the table already writes them, else in the interface language.
  const letter = $derived(/[кд]\d/i.test(model.dice) ? 'к' : /d\d/i.test(model.dice) ? 'd' : locale.lang === 'ru' ? 'к' : 'd');
  const DICE = [4, 6, 8, 10, 12, 20, 100];

  // Every change goes back into the entry.
  $effect(() => {
    const out = modelMarkdown($state.snapshot(model) as TableModel, t('cmpui.table.result'));
    untrack(() => {
      if (out.body !== body) body = out.body;
      if (out.roll !== roll) roll = out.roll;
    });
  });

  const grid = $derived(!!model.colDice);
  const width = $derived(grid ? model.cols.length : 1);
  const span = $derived(diceSpan(model.dice));
  const colSpan = $derived(model.colDice ? diceSpan(model.colDice) : null);
  const rowCheck = $derived(span ? coverage(model.rows, span) : null);
  const colCheck = $derived(colSpan ? coverage(model.cols, colSpan) : null);
  const empty = (rows: EditRow[]) => rows.every((r) => r.cells.every((c) => !c.trim()));

  // New rows for the die, the texts kept in order (a die changed on a filled table — only by the button).
  function relayRows() {
    if (!span) return;
    const old = model.rows;
    model.rows = rowsFor(span, width).map((r, i) => ({ ...r, cells: r.cells.map((_, k) => old[i]?.cells[k] ?? '') }));
  }
  function setDice(text: string) {
    model.dice = text;
    if (empty(model.rows)) relayRows();
  }
  function relayCols() {
    if (!colSpan) return;
    const n = colsFor(colSpan);
    model.cols = n;
    model.rows = model.rows.map((r) => ({ ...r, cells: n.map((_, k) => r.cells[k] ?? '') }));
  }
  function setColDice(text: string) {
    model.colDice = text;
    if (empty(model.rows)) relayCols();
  }
  function toggleGrid(on: boolean) {
    if (on) {
      model.colDice = `${letter}6`;
      model.cols = colsFor({ from: 1, to: 6 });
      model.rows = model.rows.map((r) => ({ ...r, cells: model.cols.map((_, k) => (k ? '' : (r.cells[0] ?? ''))) }));
    } else {
      model.colDice = null;
      model.cols = [];
      model.rows = model.rows.map((r) => ({ ...r, cells: [r.cells.filter((c) => c.trim()).join(' / ')] }));
    }
  }

  const blank = () => Array.from({ length: width }, () => '');
  function addRow() {
    const lastTo = model.rows.at(-1)?.to ?? (span ? span.from - 1 : 0);
    model.rows.push({ from: lastTo + 1, to: lastTo + 1, cells: blank() });
  }
  function merge(i: number) {
    const a = model.rows[i]!;
    const b = model.rows[i + 1];
    if (!b) return;
    model.rows.splice(i, 2, { from: Math.min(a.from, b.from), to: Math.max(a.to, b.to), cells: a.cells.map((c, k) => [c, b.cells[k] ?? ''].filter((x) => x.trim()).join(' / ')) });
  }
  function split(i: number) {
    const r = model.rows[i]!;
    if (r.from >= r.to) return;
    const mid = Math.floor((r.from + r.to) / 2);
    model.rows.splice(i, 1, { from: r.from, to: mid, cells: r.cells }, { from: mid + 1, to: r.to, cells: blank() });
  }
  function addCol() {
    const lastTo = model.cols.at(-1)?.to ?? 0;
    model.cols.push({ from: lastTo + 1, to: lastTo + 1 });
    for (const r of model.rows) r.cells.push('');
  }
  function removeCol(k: number) {
    if (model.cols.length <= 1) return;
    model.cols.splice(k, 1);
    for (const r of model.rows) r.cells.splice(k, 1);
  }
  const setNum = (r: Range, key: 'from' | 'to', v: string) => {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0) r[key] = n;
  };

  // Rolls and links go where the cursor was: the last cell in focus.
  let focus: { el: HTMLInputElement; row: number; col: number } | null = null;
  async function insert(text: string) {
    const f = focus ?? { el: null, row: model.rows.length - 1, col: 0 };
    const r = model.rows[f.row];
    if (!r) return;
    const v = r.cells[f.col] ?? '';
    const a = f.el?.selectionStart ?? v.length;
    const b = f.el?.selectionEnd ?? v.length;
    r.cells[f.col] = v.slice(0, a) + text + v.slice(b);
    await tick();
    if (f.el) {
      f.el.focus();
      f.el.setSelectionRange(a + text.length, a + text.length);
    }
  }

  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  function linkMenu(e: MouseEvent) {
    const tables = allEntries().filter((x) => x.entry.type === TABLE_TYPE && x.entry.title !== title);
    menu = {
      ...menuAt(e),
      items: tables.length
        ? tables.map((x) => ({ label: x.entry.title, action: () => void insert(`[[${x.entry.title}]]`) }))
        : [{ label: t('cmpui.table.noTables'), disabled: true, action: () => {} }],
    };
  }

  // A table from a PDF or a site: numbered lines, a Markdown table, or a list.
  let pasting = $state(false);
  let pasted = $state('');
  let pasteError = $state('');
  function takePasted() {
    const m = tableModel(pasted, '', letter);
    if (!parseRollTable(pasted)) return void (pasteError = t('cmpui.table.pasteNone'));
    model.dice = m.dice;
    model.colDice = m.colDice;
    model.cols = m.cols;
    model.rows = m.rows;
    if (!model.intro.trim() && m.intro.trim()) model.intro = m.intro;
    pasting = false;
    pasted = pasteError = '';
  }

  function tryRoll() {
    const table = parseRollTable(body, roll);
    if (table) rolls.table({ title: title || t('cmp.type.table'), table });
  }
</script>

<div class="te">
  <div class="dice">
    <span class="label">{grid ? t('cmpui.table.rowsDie') : t('cmpui.table.die')}</span>
    {#each DICE as d (d)}
      <button type="button" class="die" class:on={model.dice === `${letter}${d}`} onclick={() => setDice(`${letter}${d}`)}>{letter}{d}</button>
    {/each}
    <button type="button" class="die" class:on={model.dice === `2${letter}6`} onclick={() => setDice(`2${letter}6`)}>2{letter}6</button>
    <input class="own" type="text" value={model.dice} title={t('cmpui.table.ownDie')} onchange={(e) => setDice(e.currentTarget.value.trim())} />
    <label class="grid-on" title={t('cmpui.table.gridHint')}><input type="checkbox" checked={grid} onchange={(e) => toggleGrid(e.currentTarget.checked)} /> <Grid3x3 size={13} /> {t('cmpui.table.grid')}</label>
  </div>
  {#if grid}
    <div class="dice">
      <span class="label">{t('cmpui.table.colsDie')}</span>
      {#each DICE.slice(0, 5) as d (d)}
        <button type="button" class="die" class:on={model.colDice === `${letter}${d}`} onclick={() => setColDice(`${letter}${d}`)}>{letter}{d}</button>
      {/each}
      <input class="own" type="text" value={model.colDice} title={t('cmpui.table.ownDie')} onchange={(e) => setColDice(e.currentTarget.value.trim())} />
    </div>
  {/if}
  {#if !span}<p class="warn">{t('cmpui.table.badDie', { dice: model.dice })}</p>{/if}
  {#if rowCheck && (rowCheck.gaps.length || rowCheck.overlaps.length)}
    <p class="warn">
      {#if rowCheck.gaps.length}{t('cmpui.table.gaps', { list: numbersText(rowCheck.gaps) })}{/if}
      {#if rowCheck.overlaps.length}{t('cmpui.table.overlaps', { list: numbersText(rowCheck.overlaps) })}{/if}
      <button type="button" class="link" onclick={relayRows}>{t('cmpui.table.relay', { dice: model.dice })}</button>
    </p>
  {/if}
  {#if grid && colCheck && (colCheck.gaps.length || colCheck.overlaps.length)}
    <p class="warn">
      {t('cmpui.table.colsProblem')}
      <button type="button" class="link" onclick={relayCols}>{t('cmpui.table.relay', { dice: model.colDice ?? '' })}</button>
    </p>
  {/if}

  <div class="tools">
    <button type="button" class="btn" title={t('cmpui.table.rollInHint')} onclick={() => insert(`{1${letter}6}`)}><Braces size={13} /> {t('cmpui.table.rollIn')}</button>
    <button type="button" class="btn" title={t('cmpui.table.linkHint')} onclick={linkMenu}><Link size={13} /> {t('cmpui.table.link')}</button>
    <button type="button" class="btn" onclick={() => ((pasting = true), (pasteError = ''))}><ClipboardPaste size={13} /> {t('cmpui.table.paste')}</button>
    <div class="spacer"></div>
    <button type="button" class="btn" title={t('cmpui.table.tryHint')} onclick={tryRoll}><Dices size={13} /> {t('lib.rollTable')}</button>
  </div>

  <table>
    <thead>
      <tr>
        <th class="range">{grid ? `${model.dice} \\ ${model.colDice}` : model.dice}</th>
        {#if grid}
          {#each model.cols as c, k (k)}
            <th>
              <span class="nums">
                <input type="text" inputmode="numeric" value={c.from} onchange={(e) => setNum(c, 'from', e.currentTarget.value)} />–<input type="text" inputmode="numeric" value={c.to} onchange={(e) => setNum(c, 'to', e.currentTarget.value)} />
              </span>
              {#if model.cols.length > 1}<button type="button" class="icon-btn" title={t('cmpui.table.removeCol')} onclick={() => removeCol(k)}><X size={12} /></button>{/if}
            </th>
          {/each}
          <th class="act"><button type="button" class="icon-btn" title={t('cmpui.table.addCol')} onclick={addCol}><Plus size={13} /></button></th>
        {:else}
          <th>{t('cmpui.table.result')}</th>
          <th class="act"></th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each model.rows as r, i (i)}
        <tr>
          <td class="range">
            <span class="nums">
              <input type="text" inputmode="numeric" value={r.from} onchange={(e) => setNum(r, 'from', e.currentTarget.value)} />–<input type="text" inputmode="numeric" value={r.to} onchange={(e) => setNum(r, 'to', e.currentTarget.value)} />
            </span>
          </td>
          {#each r.cells.slice(0, width) as _, k (k)}
            <td><input class="cell" type="text" bind:value={r.cells[k]} onfocus={(e) => (focus = { el: e.currentTarget, row: i, col: k })} /></td>
          {/each}
          <td class="act">
            {#if r.from < r.to}<button type="button" class="icon-btn" title={t('cmpui.table.split')} onclick={() => split(i)}><Split size={12} /></button>{/if}
            {#if i < model.rows.length - 1}<button type="button" class="icon-btn" title={t('cmpui.table.merge')} onclick={() => merge(i)}><Merge size={12} /></button>{/if}
            <button type="button" class="icon-btn" title={t('cmpui.table.removeRow')} onclick={() => model.rows.splice(i, 1)}><X size={12} /></button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  <button type="button" class="btn add" onclick={addRow}><Plus size={13} /> {t('cmpui.table.addRow')}</button>

  <label class="intro">
    <span>{t('cmpui.table.intro')}</span>
    <textarea rows="3" bind:value={model.intro} placeholder={t('cmpui.table.introPh')}></textarea>
  </label>
</div>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

{#if pasting}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && (pasting = false)}>
    <div class="modal">
      <h3>{t('cmpui.table.pasteTitle')}</h3>
      <p class="faint">{t('cmpui.table.pasteAbout')}</p>
      <!-- svelte-ignore a11y_autofocus -->
      <textarea rows="12" bind:value={pasted} autofocus placeholder={'1–2 …\n3–4 …\n5–6 …'}></textarea>
      {#if pasteError}<p class="warn">{pasteError}</p>{/if}
      <div class="row">
        <button type="button" class="btn" onclick={() => (pasting = false)}>{t('cmpui.cancel')}</button>
        <button type="button" class="btn primary" disabled={!pasted.trim()} onclick={takePasted}>{t('cmpui.table.pasteTake')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .te {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dice,
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .label {
    min-width: 90px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .die {
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .die:hover {
    color: var(--text-normal);
  }
  .die.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    color: var(--text-normal);
  }
  .own {
    width: 90px;
    padding: 2px 6px;
    font-size: 12px;
  }
  .grid-on {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 10px;
    font-size: 12px;
    cursor: pointer;
  }
  .spacer {
    flex: 1;
  }
  .warn {
    margin: 0;
    color: var(--warning);
    font-size: 12px;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
  }
  th,
  td {
    padding: 2px 3px;
    border-bottom: 1px solid var(--border);
  }
  .range {
    width: 1%;
    white-space: nowrap;
  }
  .nums {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .nums input {
    width: 34px;
    padding: 2px 4px;
    text-align: right;
  }
  .cell {
    box-sizing: border-box;
    width: 100%;
    min-width: 60px;
  }
  .act {
    width: 1%;
    white-space: nowrap;
  }
  .add {
    align-self: flex-start;
  }
  .intro {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(560px, 92vw);
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  .modal h3,
  .modal p {
    margin: 0;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
