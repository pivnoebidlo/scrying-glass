<!-- Tools → System builder: a role-playing system as a pack (shared/syspack.ts) without writing JSON. On the left —
     the system, its sections and fields, the tracker; in the middle — what is selected; on the right — the card as it
     will look (and its values to try rolls with). Saved to the library by the core; a built-in pack is read only
     («Make a copy»). -->
<script lang="ts">
  import { ArrowDown, ArrowUp, BookOpen, CloudUpload, Copy, Download, FilePlus, Save, Swords, Trash2, Upload, X } from '@lucide/svelte';
  import { repo } from '../../repo/ui/repo.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { Card, CardKind } from '../../../shared/cards';
  import { getLang } from '../../../shared/i18n';
  import { blankStats, fieldMap, formulaProblems, loc, newField, validatePack, type FieldType, type SystemPack } from '../../../shared/syspack';
  import PackSheet from '../../../systems/pack/Sheet.svelte';
  import PackEditor from '../../../systems/pack/Editor.svelte';
  import FieldPanel from './FieldPanel.svelte';
  import FormulaInput from './FormulaInput.svelte';
  import LocInput from './LocInput.svelte';
  import TrackerPanel from './TrackerPanel.svelte';
  import CompendiumPanel from './CompendiumPanel.svelte';
  import { builder, copySystem, deleteSystem, freeKey, importSystem, isDirty, newSystem, packError, packs, pickSystem, saveSystem } from './store.svelte';

  const KINDS: CardKind[] = ['monster', 'npc', 'character'];
  let previewTab = $state<'card' | 'values'>('card');

  const d = $derived(builder.draft);
  const ro = $derived(builder.readonly);
  const L = (x: Parameters<typeof loc>[0]) => loc(x, getLang());
  const allKeys = $derived(d ? [...fieldMap(d).keys()] : []);
  const invalid = $derived.by(() => {
    if (!d) return '';
    const r = validatePack($state.snapshot(d));
    return typeof r === 'string' ? packError(`syspack:${r}`) : '';
  });
  const problems = $derived(d && !invalid ? formulaProblems($state.snapshot(d) as SystemPack) : []);
  const dirty = $derived(isDirty());
  const own = $derived(packs().filter((p) => p.own));
  const builtin = $derived(packs().filter((p) => !p.own));
  const preview = $derived(
    d ? ({ format: 1, id: 'preview', kind: builder.previewKind, system: d.id, lang: getLang(), name: t('sb.sample'), stats: builder.previewStats } as unknown as Card<Record<string, unknown>>) : null,
  );

  function leave(go: () => void) {
    if (!dirty || confirm(t('sb.leaveAsk'))) go();
  }
  function select(sel: typeof builder.sel) {
    builder.sel = sel;
  }

  // ---- Sections and fields ----
  function addSection() {
    if (!d) return;
    const taken = new Set(d.sections.map((s) => s.id));
    d.sections.push({ id: freeKey(t('sb.newSection'), taken), title: t('sb.newSection'), fields: [] });
    select({ kind: 'section', s: d.sections.length - 1 });
  }
  function addField(s: number, type: FieldType = 'number') {
    if (!d) return;
    const key = freeKey(t('sb.newField'), new Set(allKeys));
    d.sections[s]!.fields.push(newField(type, key, t('sb.newField')));
    select({ kind: 'field', s, f: d.sections[s]!.fields.length - 1 });
  }
  function move<T>(list: T[], i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  function removeSection(s: number) {
    if (!d) return;
    d.sections.splice(s, 1);
    select({ kind: 'system' });
  }
  function removeField(s: number, f: number) {
    if (!d) return;
    const key = d.sections[s]!.fields[f]!.key;
    d.sections[s]!.fields.splice(f, 1);
    d.tracker.cells = d.tracker.cells?.filter((k) => k !== key);
    if (d.tracker.hp === key) delete d.tracker.hp;
    select({ kind: 'section', s });
  }

  // A field's key renamed: formulas, tracks, the tracker and the subtitle follow it.
  function renameKey(from: string, to: string) {
    if (!d) return;
    const re = new RegExp(`(?<![\\w.])${from}(?![\\w])`, 'g');
    const fix = (text: string) => text.replace(re, to);
    for (const sec of d.sections) {
      for (const f of sec.fields) {
        if (f.key === from) f.key = to;
        if (f.formula) f.formula = fix(f.formula);
        if (f.boxes === from) f.boxes = to;
        const r = f.roll as Record<string, unknown> | undefined;
        if (r) for (const k of ['bonus', 'target', 'count', 'sides']) if (typeof r[k] === 'string') r[k] = fix(r[k] as string);
      }
    }
    if (d.rank) d.rank = fix(d.rank);
    const sub = (x: string) => x.replaceAll(`{${from}}`, `{${to}}`);
    if (typeof d.subtitle === 'string') d.subtitle = sub(d.subtitle);
    else if (d.subtitle) d.subtitle = Object.fromEntries(Object.entries(d.subtitle).map(([k, v]) => [k, sub(v)]));
    const tr = d.tracker;
    if (tr.hp === from) tr.hp = to;
    tr.cells = tr.cells?.map((k) => (k === from ? to : k));
    if (tr.init.type === 'roll' && tr.init.bonus) tr.init.bonus = fix(tr.init.bonus);
    if (tr.init.type === 'value') tr.init.value = fix(tr.init.value);
    if (to !== from && from in builder.previewStats) {
      builder.previewStats[to] = builder.previewStats[from];
      delete builder.previewStats[from];
    }
  }

  const setKind = (k: 'monster' | 'npc' | 'character') => {
    builder.previewKind = k;
    if (d) builder.previewStats = { ...blankStats($state.snapshot(d) as SystemPack, k), ...builder.previewStats };
  };
</script>

<div class="view">
  <header class="head">
    <h2>{t('sb.title')}</h2>
    <select
      class="pick"
      value={builder.was ?? (d && ro ? d.id : '')}
      onchange={(e) => {
        const id = e.currentTarget.value;
        leave(() => (id ? pickSystem(id) : newSystem()));
      }}
    >
      <option value="" disabled={!!d && !builder.was && !ro}>{d && !builder.was && !ro ? L(d.title) : t('sb.pick')}</option>
      {#if own.length}<optgroup label={t('sb.system')}>{#each own as p (p.id)}<option value={p.id}>{L(p.title)}</option>{/each}</optgroup>{/if}
      <optgroup label={t('sb.builtin')}>{#each builtin as p (p.id)}<option value={p.id}>{L(p.title)}</option>{/each}</optgroup>
    </select>
    <button class="btn" onclick={() => leave(newSystem)}><FilePlus size={14} /> {t('sb.new')}</button>
    <button class="btn" onclick={() => leave(importSystem)}><Upload size={14} /> {t('sb.import')}</button>
    <div class="spacer"></div>
    {#if d && ro}<button class="btn" onclick={copySystem}><Copy size={14} /> {t('sb.copy')}</button>{/if}
    {#if d && builder.was}
      <button class="btn" disabled={dirty} title={dirty ? t('sb.publishSaveFirst') : t('sb.publishHint')} onclick={() => (repo.publishSystem = builder.was)}><CloudUpload size={14} /> {t('sb.publish')}</button>
      <button class="icon-btn" title={t('sb.export')} onclick={() => window.api.exportSystem(builder.was!)}><Download size={15} /></button>
      <button class="icon-btn" title={t('sb.delete')} onclick={deleteSystem}><Trash2 size={15} /></button>
    {/if}
    {#if d && !ro}
      <button class="btn primary" disabled={!dirty || !!invalid} onclick={saveSystem}><Save size={14} /> {t('sb.save')}</button>
    {/if}
  </header>
  <p class="faint intro">{t('sb.about')}</p>
  {#if builder.error}<p class="err">{builder.error}</p>{:else if invalid && d && !ro}<p class="warn">{t('sb.invalid', { what: invalid })}</p>{:else if builder.status}<p class="faint">{builder.status}</p>{:else if dirty}<p class="faint">{t('sb.unsaved')}</p>{/if}
  {#if ro && d}<p class="note">{t('sb.readonly')}</p>{/if}

  {#if d}
    <div class="body">
      <nav class="tree">
        <button class="item" class:on={builder.sel.kind === 'system'} onclick={() => select({ kind: 'system' })}><b>{L(d.title) || t('sb.system')}</b></button>
        <div class="label">{t('sb.sections')}</div>
        {#each d.sections as sec, s (s)}
          <div class="sec">
            <button class="item sec-title" class:on={builder.sel.kind === 'section' && builder.sel.s === s} onclick={() => select({ kind: 'section', s })}>{L(sec.title) || '—'}</button>
            {#if !ro}
              <span class="tools">
                <button class="icon-btn" title={t('sb.up')} onclick={() => move(d.sections, s, -1)}><ArrowUp size={12} /></button>
                <button class="icon-btn" title={t('sb.down')} onclick={() => move(d.sections, s, 1)}><ArrowDown size={12} /></button>
                <button class="icon-btn" title={t('sb.remove')} onclick={() => removeSection(s)}><X size={12} /></button>
              </span>
            {/if}
          </div>
          {#each sec.fields as f, i (i)}
            <div class="fld">
              <button class="item" class:on={builder.sel.kind === 'field' && builder.sel.s === s && builder.sel.f === i} onclick={() => select({ kind: 'field', s, f: i })}>
                {L(f.title) || f.key}
                <span class="faint type">{t(`sb.ft.${f.type}`)}{f.roll ? ' · 🎲' : ''}</span>
              </button>
              {#if !ro}
                <span class="tools">
                  <button class="icon-btn" title={t('sb.up')} onclick={() => move(sec.fields, i, -1)}><ArrowUp size={12} /></button>
                  <button class="icon-btn" title={t('sb.down')} onclick={() => move(sec.fields, i, 1)}><ArrowDown size={12} /></button>
                  <button class="icon-btn" title={t('sb.remove')} onclick={() => removeField(s, i)}><X size={12} /></button>
                </span>
              {/if}
            </div>
          {/each}
          {#if !ro}<button class="add" onclick={() => addField(s)}>{t('sb.addField')}</button>{/if}
        {/each}
        {#if !ro}<button class="add" onclick={addSection}>{t('sb.addSection')}</button>{/if}
        <button class="item tracker" class:on={builder.sel.kind === 'tracker'} onclick={() => select({ kind: 'tracker' })}><Swords size={13} /> {t('sb.tracker')}</button>
        <button class="item tracker" class:on={builder.sel.kind === 'compendium'} onclick={() => select({ kind: 'compendium' })}>
          <BookOpen size={13} /> {t('sb.compendium')}<span class="faint type">{d.compendium?.length ?? 0}</span>
        </button>
      </nav>

      <section class="middle">
        {#if builder.sel.kind === 'system'}
          <h3>{t('sb.system')}</h3>
          <label class="row"><span>{t('sb.name')}</span><LocInput value={d.title} set={(v) => (d.title = v)} disabled={ro} /></label>
          <label class="row" title={t('sb.idHint')}><span>{t('sb.id')}</span><input type="text" class="mono" disabled={ro} value={d.id} oninput={(e) => (d.id = e.currentTarget.value.trim().toLowerCase())} /></label>
          <p class="faint small">{t('sb.idHint')}</p>
          <label class="row"><span>{t('sb.author')}</span><input type="text" disabled={ro} value={d.author ?? ''} oninput={(e) => (d.author = e.currentTarget.value || undefined)} /></label>
          <label class="row"><span>{t('sb.license')}</span><textarea rows="3" disabled={ro} placeholder={t('sb.licensePh')} value={d.license ?? ''} oninput={(e) => (d.license = e.currentTarget.value || undefined)}></textarea></label>
          <label class="row"><span>{t('sb.subtitle')}</span><LocInput value={d.subtitle} set={(v) => (d.subtitle = v || undefined)} placeholder={t('sb.subtitleHint')} disabled={ro} /></label>
          <div class="row"><span>{t('sb.rank')}</span><FormulaInput value={d.rank ?? ''} set={(v) => (d.rank = v || undefined)} keys={allKeys} disabled={ro} /></div>
        {:else if builder.sel.kind === 'section' && d.sections[builder.sel.s]}
          {@const sec = d.sections[builder.sel.s]!}
          <h3>{t('sb.section')}</h3>
          <label class="row"><span>{t('sb.name')}</span><LocInput value={sec.title} set={(v) => (sec.title = v)} disabled={ro} /></label>
          <div class="row">
            <span>{t('sb.sectionKinds')}</span>
            {#each KINDS as k (k)}
              <label class="check">
                <input
                  type="checkbox"
                  disabled={ro}
                  checked={!sec.kinds || sec.kinds.includes(k)}
                  onchange={(e) => {
                    const now = (sec.kinds ?? KINDS).filter((x) => x !== k);
                    const next = e.currentTarget.checked ? [...now, k] : now;
                    if (next.length === KINDS.length || !next.length) delete sec.kinds;
                    else sec.kinds = next;
                  }}
                />
                {t(`sb.kind.${k}`)}
              </label>
            {/each}
          </div>
          {#if !ro}<button class="btn small" onclick={() => addField(builder.sel.kind === 'section' ? builder.sel.s : 0)}>{t('sb.addField')}</button>{/if}
        {:else if builder.sel.kind === 'field' && d.sections[builder.sel.s]?.fields[builder.sel.f]}
          {@const s = builder.sel.s}
          {@const i = builder.sel.f}
          <h3>{t('sb.field')}</h3>
          {#key `${s}/${i}`}
            <FieldPanel bind:f={d.sections[s]!.fields[i]!} keys={allKeys} disabled={ro} onkey={renameKey} />
          {/key}
        {:else if builder.sel.kind === 'tracker'}
          <h3>{t('sb.tracker')}</h3>
          <TrackerPanel bind:pack={builder.draft!} disabled={ro} />
        {:else if builder.sel.kind === 'compendium'}
          <h3>{t('sb.compendium')}</h3>
          <CompendiumPanel bind:pack={builder.draft!} disabled={ro} />
        {/if}
        {#if problems.length}
          <div class="problems">
            <b>{t('sb.problems')}</b>
            {#each problems as p, i (i)}
              <div><code>{p.where}</code>: <code>{p.text}</code> — {p.broken ? t('sb.broken') : t('sb.unknown', { list: p.unknown.join(', ') })}</div>
            {/each}
          </div>
        {/if}
      </section>

      <aside class="preview">
        <div class="pv-head">
          <b>{t('sb.preview')}</b>
          <select value={builder.previewKind} onchange={(e) => setKind(e.currentTarget.value as 'monster' | 'npc' | 'character')}>
            {#each KINDS as k (k)}<option value={k}>{t(`sb.kind.${k}`)}</option>{/each}
          </select>
          <div class="seg">
            <button class:on={previewTab === 'card'} onclick={() => (previewTab = 'card')}>{t('sb.previewCard')}</button>
            <button class:on={previewTab === 'values'} onclick={() => (previewTab = 'values')}>{t('sb.previewValues')}</button>
          </div>
        </div>
        <p class="faint small">{t('sb.previewHint')}</p>
        {#if preview}
          {#key d.sections.length}
            {#if previewTab === 'card'}
              <PackSheet card={preview} draft={d} />
            {:else}
              <PackEditor bind:stats={builder.previewStats} system={d.id} lang={getLang()} kind={builder.previewKind} draft={d} />
            {/if}
          {/key}
        {/if}
      </aside>
    </div>
  {:else}
    <div class="empty">
      <button class="btn primary" onclick={newSystem}><FilePlus size={14} /> {t('sb.new')}</button>
    </div>
  {/if}
</div>

<style>
  .view {
    padding: 16px 20px;
    container-type: inline-size;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0 8px 0 0;
    font-size: 18px;
  }
  .pick {
    max-width: 240px;
  }
  .spacer {
    flex: 1;
  }
  .intro {
    margin: 8px 0;
    max-width: 900px;
  }
  .err {
    color: var(--danger);
  }
  .warn {
    color: var(--warning);
  }
  .note {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  /* Narrow: the preview goes under the editor; wide enough — beside it. */
  .body {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    margin-top: 10px;
  }
  .preview {
    grid-column: 1 / -1;
  }
  @container (min-width: 1100px) {
    .body {
      grid-template-columns: 220px minmax(300px, 380px) minmax(0, 1fr);
    }
    .preview {
      grid-column: auto;
    }
  }
  .tree {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .label {
    margin: 10px 0 4px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .item {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 3px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--bg-active);
  }
  .sec,
  .fld {
    display: flex;
    align-items: center;
  }
  .sec-title {
    font-weight: 600;
  }
  .fld .item {
    padding-left: 18px;
  }
  .type {
    margin-left: auto;
    font-size: 11px;
    white-space: nowrap;
  }
  .tools {
    display: flex;
  }
  .tools :global(.icon-btn) {
    padding: 2px;
  }
  .add {
    align-self: flex-start;
    margin: 2px 0 4px 16px;
    padding: 1px 6px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
  }
  .add:hover {
    color: var(--accent);
  }
  .tracker {
    margin-top: 10px;
    flex: none;
  }
  .middle {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  h3 {
    margin: 0;
    font-size: 14px;
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
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mono {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }
  .small {
    margin: 0;
    font-size: 11px;
  }
  .btn.small {
    align-self: flex-start;
    padding: 2px 8px;
    font-size: 12px;
  }
  textarea {
    resize: vertical;
  }
  .problems {
    padding-top: 8px;
    border-top: 1px solid var(--border);
    color: var(--warning);
    font-size: 12px;
  }
  .preview {
    min-width: 0;
  }
  .pv-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .seg {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    padding: 2px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
  }
  .seg button.on {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .empty {
    margin-top: 40px;
    text-align: center;
  }
</style>
