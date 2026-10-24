<!-- The editor of a card of a pack system: every field of the sections this kind of card has, by its type — numbers,
     texts, choices, dots and boxes (a click sets, on the last one — one less), tags, rows of a list. Formulas are
     shown, not edited. -->
<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import { markdownKeys } from '../../renderer/lib/markdownKeys';
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { CardKind } from '../../shared/cards';
  import { blankStats, boxesOf, evalFormula, loc, sectionsFor, slotGroups, type ColumnDef, type FieldDef, type PackSlot, type PackStats, type SystemPack } from '../../shared/syspack';
  import { packOf } from '../packs';

  let {
    stats = $bindable(),
    system,
    lang = 'en',
    kind = 'monster',
    draft,
  }: { stats: PackStats; system: string; lang?: string; kind?: CardKind; draft?: SystemPack } = $props();

  // draft — a pack not saved yet (the builder's preview).
  const pack = $derived(draft ?? (packOf(system) as SystemPack));
  // A card of another system (or an older one) — start from the pack's blank values, keep what fits.
  $effect.pre(() => {
    if (pack && (!stats || typeof stats !== 'object' || Array.isArray(stats))) stats = blankStats(pack, kind);
  });
  const L = (x: Parameters<typeof loc>[0]) => loc(x, lang);
  const int = (f: { min?: number; max?: number }, v: string) => {
    const n = Math.round(Number(v) || 0);
    return Math.max(f.min ?? -9999, Math.min(f.max ?? 9999, n));
  };
  const str = (key: string) => (typeof stats[key] === 'string' ? (stats[key] as string) : '');
  const num = (key: string) => (typeof stats[key] === 'number' ? (stats[key] as number) : 0);
  const setMarks = (key: string, n: number) => (stats[key] = num(key) === n ? n - 1 : n);
  const rows = (f: FieldDef) => (Array.isArray(stats[f.key]) ? (stats[f.key] as Record<string, unknown>[]) : []);
  const tags = (f: FieldDef) => (Array.isArray(stats[f.key]) ? (stats[f.key] as string[]) : []);
  const blankRow = (cols: ColumnDef[]) => Object.fromEntries(cols.map((c) => [c.key, c.type === 'number' || c.type === 'dots' ? 0 : '']));
  function setRow(f: FieldDef, i: number, key: string, v: unknown) {
    stats[f.key] = rows(f).map((r, j) => (j === i ? { ...r, [key]: v } : r));
  }
  // A cell of a slots field changed (the list grows to that place).
  function setSlot(f: FieldDef, i: number, change: Partial<PackSlot>) {
    const list = Array.isArray(stats[f.key]) ? [...(stats[f.key] as PackSlot[])] : [];
    while (list.length <= i) list.push({ name: '' });
    list[i] = { ...list[i]!, ...change };
    stats[f.key] = list;
  }
  let newTag = $state<Record<string, string>>({});
  function addTag(f: FieldDef) {
    const v = (newTag[f.key] ?? '').trim();
    if (v) stats[f.key] = [...tags(f), v];
    newTag[f.key] = '';
  }
</script>

{#if pack}
  {#each sectionsFor(pack, kind) as sec (sec.id)}
    <section>
      <h4>{L(sec.title)}</h4>
      <div class="grid">
        {#each sec.fields.filter((f) => !['textarea', 'list', 'tags', 'slots'].includes(f.type)) as f (f.key)}
          <label class="field" class:small={f.type === 'number' || f.type === 'formula'} title={L(f.hint)}>
            <span>{L(f.title)}</span>
            {#if f.type === 'number'}
              <input type="number" min={f.min} max={f.max} value={num(f.key)} onchange={(e) => (stats[f.key] = int(f, e.currentTarget.value))} />
            {:else if f.type === 'text'}
              <input type="text" value={str(f.key)} oninput={(e) => (stats[f.key] = e.currentTarget.value)} />
            {:else if f.type === 'select'}
              <select value={typeof stats[f.key] === 'number' ? stats[f.key] : -1} onchange={(e) => (stats[f.key] = Number(e.currentTarget.value) < 0 ? undefined : Number(e.currentTarget.value))}>
                <option value={-1}>{t('pack.empty')}</option>
                {#each f.options ?? [] as o, i (i)}<option value={i}>{L(o)}</option>{/each}
              </select>
            {:else if f.type === 'dots'}
              <span class="marks">
                {#each { length: f.max ?? 5 } as _, i (i)}
                  <button type="button" class="dot" class:on={i < num(f.key)} aria-label={String(i + 1)} onclick={(e) => (e.preventDefault(), setMarks(f.key, i + 1))}></button>
                {/each}
              </span>
            {:else if f.type === 'track'}
              <span class="marks">
                {#each { length: boxesOf(pack, stats, f) } as _, i (i)}
                  <button type="button" class="box" class:on={i < num(f.key)} aria-label={String(i + 1)} onclick={(e) => (e.preventDefault(), setMarks(f.key, i + 1))}></button>
                {/each}
              </span>
            {:else if f.type === 'formula'}
              <output>{Math.round(evalFormula(pack, stats, f.key) * 100) / 100}</output>
            {/if}
          </label>
        {/each}
      </div>
      {#each sec.fields.filter((f) => ['textarea', 'list', 'tags', 'slots'].includes(f.type)) as f (f.key)}
        <div class="wide">
          <span class="lbl">{L(f.title)}</span>
          {#if f.type === 'textarea'}
            <textarea rows="4" use:markdownKeys value={str(f.key)} oninput={(e) => (stats[f.key] = e.currentTarget.value)}></textarea>
          {:else if f.type === 'slots'}
            {#each slotGroups(f, stats[f.key]) as g, gi (gi)}
              <div class="slot-group">
                <span class="lbl">{L(g.title)}</span>
                {#each g.cells as c (c.i)}
                  <span class="slot" class:cond={c.slot.condition}>
                    <input type="text" value={c.slot.name ?? ''} oninput={(e) => setSlot(f, c.i, { name: e.currentTarget.value })} />
                    <span class="usage" title={t('pack.usage')}>
                      {#each [1, 2, 3] as u (u)}
                        <button type="button" class="dot" class:on={(c.slot.usage ?? 0) >= u} aria-label={String(u)} onclick={() => setSlot(f, c.i, { usage: (c.slot.usage ?? 0) === u ? u - 1 : u })}></button>
                      {/each}
                    </span>
                    <button type="button" class="cond-btn" class:on={c.slot.condition} title={t('pack.slotCondition')} onclick={() => setSlot(f, c.i, { condition: !c.slot.condition })}>!</button>
                  </span>
                {/each}
              </div>
            {/each}
          {:else if f.type === 'tags'}
            <div class="tags">
              {#each tags(f) as tag, i (i)}
                <span class="tag">{tag}<button type="button" class="icon-btn" title={t('pack.removeRow')} onclick={() => (stats[f.key] = tags(f).filter((_, j) => j !== i))}><X size={11} /></button></span>
              {/each}
              <input
                type="text"
                class="new-tag"
                placeholder={t('pack.addTag')}
                value={newTag[f.key] ?? ''}
                oninput={(e) => (newTag[f.key] = e.currentTarget.value)}
                onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(f))}
                onblur={() => addTag(f)}
              />
            </div>
          {:else}
            <table>
              <thead><tr>{#each f.columns ?? [] as c (c.key)}<th>{L(c.title)}</th>{/each}<th></th></tr></thead>
              <tbody>
                {#each rows(f) as row, i (i)}
                  <tr>
                    {#each f.columns ?? [] as c (c.key)}
                      <td>
                        {#if c.type === 'number' || c.type === 'dots'}
                          <input type="number" class="n" min="0" max={c.max} value={Number(row[c.key] ?? 0)} onchange={(e) => setRow(f, i, c.key, int(c, e.currentTarget.value))} />
                        {:else}
                          <input type="text" value={String(row[c.key] ?? '')} oninput={(e) => setRow(f, i, c.key, e.currentTarget.value)} />
                        {/if}
                      </td>
                    {/each}
                    <td><button type="button" class="icon-btn" title={t('pack.removeRow')} onclick={() => (stats[f.key] = rows(f).filter((_, j) => j !== i))}><X size={13} /></button></td>
                  </tr>
                {/each}
              </tbody>
            </table>
            <button type="button" class="btn small" onclick={() => (stats[f.key] = [...rows(f), blankRow(f.columns ?? [])])}><Plus size={13} /> {t('pack.addRow')}</button>
          {/if}
        </div>
      {/each}
    </section>
  {/each}
{/if}

<style>
  section {
    margin-bottom: 18px;
  }
  h4 {
    margin: 0 0 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin: 8px 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 160px;
  }
  .field.small {
    width: 90px;
  }
  .field > span:first-child,
  .lbl {
    color: var(--text-faint);
    font-size: 11px;
  }
  output {
    padding: 4px 0;
    font-weight: 600;
  }
  .marks {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    padding: 4px 0;
  }
  .dot,
  .box {
    width: 14px;
    height: 14px;
    padding: 0;
    border: 1px solid var(--text-muted);
    background: none;
    cursor: pointer;
  }
  .dot {
    border-radius: 50%;
  }
  .box {
    border-radius: 3px;
  }
  .dot.on,
  .box.on {
    border-color: var(--accent);
    background: var(--accent);
  }
  .wide {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 10px 0;
  }
  textarea {
    resize: vertical;
  }
  .slot-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 2px 0;
  }
  .slot-group .lbl {
    width: 70px;
  }
  .slot {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .slot.cond {
    border-color: var(--danger);
  }
  .slot input {
    width: 120px;
  }
  .usage {
    display: inline-flex;
    gap: 2px;
  }
  .usage .dot {
    width: 9px;
    height: 9px;
  }
  .cond-btn {
    width: 18px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    color: var(--text-faint);
    font-weight: 700;
    cursor: pointer;
  }
  .cond-btn.on {
    border-color: var(--danger);
    background: var(--danger);
    color: var(--bg-primary);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 2px 1px 8px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  .new-tag {
    width: 140px;
  }
  table {
    border-collapse: collapse;
  }
  th {
    padding: 2px 4px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 400;
    text-align: left;
  }
  td {
    padding: 2px 4px 2px 0;
  }
  td input {
    width: 100%;
    min-width: 120px;
  }
  td input.n {
    width: 64px;
    min-width: 0;
  }
  .btn.small {
    align-self: flex-start;
    padding: 2px 8px;
    font-size: 12px;
  }
</style>
