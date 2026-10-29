<!-- Tools → Wild magic (D&D): a d100 (or the table's die) on a table of surges — ours, the Wand of Wonder of the
     adventure's edition (from the compendium) or the GM's own, pasted as text. The result (− / + move it by one),
     spells in it open the compendium; copy, to Telegram; the table itself and the rolls of this window below. -->
<script lang="ts">
  import { hint } from '../../../../shared/hotkeys';
  import { Check, Copy, Dices, Minus, Pencil, Plus, Send, Trash2, Zap } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { t } from '../../../../renderer/lib/i18n.svelte';
  import { entryHtml } from '../../../../renderer/lib/entry/markup';
  import { spellLinks } from '../../links';
  import { markdownToTelegram } from '../../../../shared/telegram';
  import { loadEntries } from '../../../../modules/compendium/ui/store.svelte';
  import { sendToTelegram, tgReady } from '../../../../modules/telegram/ui/tg.svelte';
  import { newOwnId, own, putOwn, remember, removeOwn, save, tables, wm, loadOwn } from './store.svelte';
  import { dieOf, isSurge, parseTable, rangeText, rollDie, rowFor, surgeOn, type Edition, type SurgeTable } from './tables';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../../shared/adventures';

  onMount(() => {
    void loadEntries();
    void loadOwn();
  });

  const list = $derived(tables());
  const table = $derived(list.find((x) => x.id === wm.table) ?? list[0]!);
  const isOwn = $derived(own.list.some((x) => x.id === table.id));

  // The roll shown: the last one on this table.
  let roll = $state<number | null>(null);
  let shownFor = $state('');
  $effect(() => {
    if (shownFor !== table.id) {
      shownFor = table.id;
      roll = wm.history.find((h) => h.table === table.id)?.roll ?? null;
    }
  });
  const row = $derived(roll === null ? null : rowFor(table, roll));

  function pick(id: string) {
    wm.table = id;
    save();
  }
  function rollNow() {
    show(rollDie(table.die));
  }

  // Does a surge happen: the d20 by the rules of the adventure's edition; a surge rolls the table at once.
  const edition = $derived<Edition>(currentSystem(store.state.adventures) === 'dnd5e-2014' ? '2014' : '2024');
  let check = $state<{ d20: number; surge: boolean } | null>(null);
  function checkNow() {
    const d20 = rollDie(20);
    check = { d20, surge: isSurge(d20, edition) };
    if (check.surge) rollNow();
  }
  // − / +: the GM moves the result by one (a bonus, a reroll of a neighbour).
  function shift(by: number) {
    if (roll === null) return;
    show(Math.min(table.die, Math.max(1, roll + by)));
  }
  function show(n: number) {
    roll = n;
    const r = rowFor(table, n);
    remember({ table: table.id, title: table.title, roll: n, text: r?.text ?? '' });
  }

  const markdown = () => (roll === null || !row ? '' : `**${table.title}** — ${roll}\n\n${row.text}`);
  let copied = $state(false);
  function copy() {
    void navigator.clipboard.writeText(markdown());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  const toTelegram = () => sendToTelegram({ kind: 'text', title: table.title, html: markdownToTelegram(markdown()) });

  function onkeydown(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (editing || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) return;
    if (e.code === 'Space' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      rollNow();
    }
  }

  // ---------- The GM's table: title and pasted text ----------
  let editing = $state<{ id: string; title: string; text: string } | null>(null);
  const preview = $derived(editing ? parseTable(editing.text) : []);
  function startNew() {
    editing = { id: newOwnId(), title: '', text: '' };
  }
  function startEdit() {
    const o = own.list.find((x) => x.id === table.id);
    if (o) editing = { ...o };
  }
  function saveEdit() {
    if (!editing || !preview.length) return;
    const title = editing.title.trim() || t('wild.ownUntitled');
    putOwn({ id: editing.id, title, text: editing.text });
    pick(editing.id);
    editing = null;
  }
  function remove() {
    if (!confirm(t('wild.deleteQ', { name: table.title }))) return;
    removeOwn(table.id);
  }

  const dieLabel = (x: SurgeTable) => t('wild.die', { die: x.die });
  const html = (text: string) => entryHtml(text);
</script>

<svelte:window {onkeydown} />

<div class="view">
  <header class="head">
    <h2>{t('wild.title')}</h2>
  </header>
  <p class="faint about">{t('wild.about')}</p>

  <div class="tables">
    {#each list as x (x.id)}
      <button class="chip" class:on={x.id === table.id && !editing} onclick={() => ((editing = null), pick(x.id))}>{x.title}</button>
    {/each}
    <button class="chip add" class:on={!!editing && !own.list.some((o) => o.id === editing?.id)} onclick={startNew}><Plus size={13} /> {t('wild.ownAdd')}</button>
  </div>

  {#if editing}
    <div class="editor">
      <input class="title-input" placeholder={t('wild.ownTitle')} bind:value={editing.title} />
      <textarea rows="12" placeholder={t('wild.ownPlaceholder')} bind:value={editing.text}></textarea>
      <p class="faint hint">
        {preview.length ? t('wild.ownParsed', { count: preview.length, die: dieOf(preview) }) : t('wild.ownEmpty')}
        {t('wild.ownPrivate')}
      </p>
      <div class="row">
        <button class="btn primary" disabled={!preview.length} onclick={saveEdit}>{t('wild.ownSave')}</button>
        <button class="btn" onclick={() => (editing = null)}>{t('lib.cancel')}</button>
      </div>
    </div>
  {:else}
    <div class="actions">
      <button class="btn primary big" title={hint(t('wild.roll', { die: table.die }), 'generate')} onclick={rollNow}><Dices size={16} /> {t('wild.roll', { die: table.die })}</button>
      {#if isOwn}
        <button class="icon-btn" title={t('wild.ownEdit')} onclick={startEdit}><Pencil size={15} /></button>
        <button class="icon-btn" title={t('wild.ownDelete')} onclick={remove}><Trash2 size={15} /></button>
      {/if}
      <button class="btn" title={t(`wild.checkHint${edition}` as never)} onclick={checkNow}><Zap size={15} /> {t('wild.check')}</button>
      {#if check}
        <span class="check" class:surge={check.surge}>{t(check.surge ? 'wild.checkSurge' : 'wild.checkCalm', { d20: check.d20, on: surgeOn(edition) })}</span>
      {/if}
    </div>

    {#if roll !== null}
      <section class="result">
        <div class="number">
          <button class="icon-btn" title={t('wild.minus')} disabled={roll <= 1} onclick={() => shift(-1)}><Minus size={14} /></button>
          <span class="roll">{roll}</span>
          <button class="icon-btn" title={t('wild.plus')} disabled={roll >= table.die} onclick={() => shift(1)}><Plus size={14} /></button>
        </div>
        <div class="text" use:spellLinks>
          {#if row}{@html html(row.text)}{:else}<p class="faint">{t('wild.noRow')}</p>{/if}
        </div>
        <div class="tools">
          <button class="icon-btn" title={t('wild.copy')} onclick={copy}>{#if copied}<Check size={15} />{:else}<Copy size={15} />{/if}</button>
          {#if tgReady()}<button class="icon-btn" title={t('wild.telegram')} onclick={toTelegram}><Send size={15} /></button>{/if}
        </div>
      </section>
    {/if}

    <details class="table">
      <summary>{t('wild.showTable')} <span class="faint">· {dieLabel(table)}, {t('wild.rows', { count: table.rows.length })}</span></summary>
      <table use:spellLinks>
        <tbody>
          {#each table.rows as r (r.from)}
            <tr class:hit={r === row}>
              <td class="range">{rangeText(r, table.die)}</td>
              <td>{@html html(r.text)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </details>

    {#if wm.history.length}
      <section class="history">
        <div class="history-head">
          <h3>{t('wild.history')}</h3>
          <button class="icon-btn" title={t('wild.clearHistory')} onclick={() => ((wm.history = []), save())}><Trash2 size={14} /></button>
        </div>
        <ul use:spellLinks>
          {#each wm.history as h, i (i)}
            <li><span class="faint">{h.title} · <strong>{h.roll}</strong></span> {@html html(h.text)}</li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .check {
    color: var(--text-muted);
  }
  .check.surge {
    color: var(--warning);
    font-weight: 600;
  }
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .about {
    margin: 6px 0 12px;
  }
  .tables {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .chip.add {
    border-style: dashed;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 14px 0 16px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .result {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .number {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .roll {
    min-width: 2.2em;
    font-size: 26px;
    font-weight: 600;
    text-align: center;
  }
  .text {
    flex: 1;
    line-height: 1.5;
    font-size: 15px;
  }
  .text :global(p) {
    margin: 4px 0;
  }
  .tools {
    display: flex;
    gap: 2px;
  }
  .table {
    margin-top: 16px;
  }
  summary {
    cursor: pointer;
    color: var(--text-muted);
  }
  table {
    width: 100%;
    margin-top: 8px;
    border-collapse: collapse;
    font-size: 13px;
    line-height: 1.45;
  }
  td {
    padding: 4px 8px;
    border-top: 1px solid var(--border);
    vertical-align: top;
  }
  td :global(p) {
    margin: 0;
  }
  .range {
    width: 4.5em;
    color: var(--text-muted);
    white-space: nowrap;
  }
  tr.hit td {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
  .history {
    margin-top: 20px;
  }
  .history-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .history h3 {
    margin: 0;
    font-size: 14px;
  }
  .history ul {
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
  }
  .history li {
    margin: 6px 0;
    line-height: 1.45;
  }
  .history li :global(p) {
    display: inline;
    margin: 0;
  }
  .editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
  }
  .title-input {
    max-width: 420px;
  }
  textarea {
    width: 100%;
    font-family: var(--font-mono, monospace);
    font-size: 12px;
  }
  .hint {
    margin: 0;
  }
  .row {
    display: flex;
    gap: 8px;
  }
</style>
