<!-- Tools → System builder: a role-playing system as a pack (shared/syspack.ts) without writing JSON. On the left —
     the system, its sections and fields, the tracker; in the middle — what is selected; on the right — the card as it
     will look (and its values to try rolls with). Saved to the library by the core; a built-in pack is read only
     («Make a copy»). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { ArrowDown, ArrowUp, CloudUpload, Copy, Download, FilePlus, Save, Trash2, Upload } from '@lucide/svelte';
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
  import SheetCanvas from './SheetCanvas.svelte';
  import TemplatePick from './TemplatePick.svelte';
  import { builder, type Step, copySystem, deleteSystem, freeKey, importSystem, isDirty, newSystem, packError, packs, pickSystem, saveSystem } from './store.svelte';

  const KINDS: CardKind[] = ['monster', 'npc', 'character'];
  const STEPS: Step[] = ['about', 'sheet', 'tracker', 'compendium', 'trial'];
  // «New system» asks what to start from.
  let choosing = $state(false);

  const d = $derived(builder.draft);
  const ro = $derived(builder.readonly);
  const L = (x: Parameters<typeof loc>[0]) => loc(x, getLang());
  const allKeys = $derived(d ? [...fieldMap(d).keys()] : []);
  const names = $derived(d ? Object.fromEntries([...fieldMap(d)].map(([k, x]) => [k, L(x.title) || k])) : {});
  const fieldCount = $derived(d ? d.sections.reduce((n, x) => n + x.fields.length, 0) : 0);
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
    select({ kind: 'none' });
  }
  // A field dragged on the sheet: to section `to.s`, before its field `to.f`.
  function dropField(from: { s: number; f: number }, to: { s: number; f: number }) {
    if (!d || !d.sections[from.s] || !d.sections[to.s]) return;
    let at = to.f;
    if (from.s === to.s && at > from.f) at--;
    if (from.s === to.s && at === from.f) return;
    const [x] = d.sections[from.s]!.fields.splice(from.f, 1);
    d.sections[to.s]!.fields.splice(at, 0, x!);
    select({ kind: 'field', s: to.s, f: at });
  }
  // A field to another section (to its end).
  function moveField(s: number, f: number, to: number) {
    if (!d || s === to || !d.sections[to]) return;
    const [x] = d.sections[s]!.fields.splice(f, 1);
    d.sections[to]!.fields.push(x!);
    select({ kind: 'field', s: to, f: d.sections[to]!.fields.length - 1 });
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
        leave(() => (id ? pickSystem(id) : (choosing = true)));
      }}
    >
      <option value="" disabled={!!d && !builder.was && !ro}>{d && !builder.was && !ro ? L(d.title) : t('sb.pick')}</option>
      {#if own.length}<optgroup label={t('sb.system')}>{#each own as p (p.id)}<option value={p.id}>{L(p.title)}</option>{/each}</optgroup>{/if}
      <optgroup label={t('sb.builtin')}>{#each builtin as p (p.id)}<option value={p.id}>{L(p.title)}</option>{/each}</optgroup>
    </select>
    <button class="btn" onclick={() => leave(() => (choosing = true))}><FilePlus size={14} /> {t('sb.new')}</button>
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
  <p class="faint intro"><Lead text={t('sb.about')} /></p>
  {#if builder.error}<p class="err">{builder.error}</p>{:else if invalid && d && !ro}<p class="warn">{t('sb.invalid', { what: invalid })}</p>{:else if builder.status}<p class="faint">{builder.status}</p>{:else if dirty}<p class="faint">{t('sb.unsaved')}</p>{/if}
  {#if ro && d}<p class="note">{t('sb.readonly')}</p>{/if}

  {#if d}
    <div class="steps" role="tablist">
      {#each STEPS as st (st)}
        <button role="tab" aria-selected={builder.step === st} onclick={() => (builder.step = st)}>
          {t(`sb.step.${st}`)}{#if st === 'sheet'}<span class="count">{fieldCount}</span>{:else if st === 'compendium'}<span class="count">{d.compendium?.length ?? 0}</span>{/if}
        </button>
      {/each}
    </div>

    {#if builder.step === 'about'}
      <section class="pane">
        <label class="row"><span>{t('sb.name')}</span><LocInput value={d.title} set={(v) => (d.title = v)} disabled={ro} /></label>
        <label class="row"><span>{t('sb.aboutSystem')}</span><LocInput value={d.about} set={(v) => (d.about = v || undefined)} placeholder={t('sb.aboutHint')} disabled={ro} /></label>
        <label class="row"><span>{t('sb.license')}</span><textarea rows="3" disabled={ro} placeholder={t('sb.licensePh')} value={d.license ?? ''} oninput={(e) => (d.license = e.currentTarget.value || undefined)}></textarea></label>
        <label class="row"><span>{t('sb.author')}</span><input type="text" disabled={ro} value={d.author ?? ''} oninput={(e) => (d.author = e.currentTarget.value || undefined)} /></label>
        <label class="row"><span>{t('sb.subtitle')}</span><LocInput value={d.subtitle} set={(v) => (d.subtitle = v || undefined)} placeholder={t('sb.subtitleHint')} disabled={ro} /></label>
        <details>
          <summary>{t('sb.more')}</summary>
          <div class="more">
            <label class="row" title={t('sb.idHint')}><span>{t('sb.id')}</span><input type="text" class="mono" disabled={ro} value={d.id} oninput={(e) => (d.id = e.currentTarget.value.trim().toLowerCase())} /></label>
            <p class="faint small"><Lead text={t('sb.idHint')} /></p>
            <div class="row"><span>{t('sb.rank')}</span><FormulaInput value={d.rank ?? ''} set={(v) => (d.rank = v || undefined)} keys={allKeys} {names} disabled={ro} /></div>
          </div>
        </details>
      </section>
    {:else if builder.step === 'sheet'}
      <div class="sheet-step">
        <SheetCanvas pack={d} stats={builder.previewStats} sel={builder.sel} disabled={ro} onselect={select} onaddfield={(s) => addField(s)} onaddsection={addSection} onmove={dropField} />
        <section class="pane inspector">
          {#if builder.sel.kind === 'section' && d.sections[builder.sel.s]}
            {@const s = builder.sel.s}
            {@const sec = d.sections[s]!}
            <div class="ihead">
              <h3>{t('sb.section')}</h3>
              {#if !ro}
                <span class="tools">
                  <button class="icon-btn" title={t('sb.up')} disabled={s === 0} onclick={() => (move(d.sections, s, -1), select({ kind: 'section', s: s - 1 }))}><ArrowUp size={14} /></button>
                  <button class="icon-btn" title={t('sb.down')} disabled={s === d.sections.length - 1} onclick={() => (move(d.sections, s, 1), select({ kind: 'section', s: s + 1 }))}><ArrowDown size={14} /></button>
                  <button class="icon-btn" title={t('sb.remove')} onclick={() => removeSection(s)}><Trash2 size={14} /></button>
                </span>
              {/if}
            </div>
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
          {:else if builder.sel.kind === 'field' && d.sections[builder.sel.s]?.fields[builder.sel.f]}
            {@const s = builder.sel.s}
            {@const i = builder.sel.f}
            <div class="ihead">
              <h3>{L(d.sections[s]!.fields[i]!.title) || t('sb.field')}</h3>
              {#if !ro}
                <span class="tools">
                  <button class="icon-btn" title={t('sb.up')} disabled={i === 0} onclick={() => (move(d.sections[s]!.fields, i, -1), select({ kind: 'field', s, f: i - 1 }))}><ArrowUp size={14} /></button>
                  <button class="icon-btn" title={t('sb.down')} disabled={i === d.sections[s]!.fields.length - 1} onclick={() => (move(d.sections[s]!.fields, i, 1), select({ kind: 'field', s, f: i + 1 }))}><ArrowDown size={14} /></button>
                  <button class="icon-btn" title={t('sb.remove')} onclick={() => removeField(s, i)}><Trash2 size={14} /></button>
                </span>
              {/if}
            </div>
            {#if d.sections.length > 1 && !ro}
              <label class="row"><span>{t('sb.inSection')}</span>
                <select value={s} onchange={(e) => moveField(s, i, Number(e.currentTarget.value))}>
                  {#each d.sections as x, k (k)}<option value={k}>{L(x.title) || '—'}</option>{/each}
                </select>
              </label>
            {/if}
            {#key `${s}/${i}`}
              <FieldPanel bind:f={d.sections[s]!.fields[i]!} keys={allKeys} disabled={ro} onkey={renameKey} />
            {/key}
          {:else}
            <p class="faint">{t('sb.pickOnSheet')}</p>
          {/if}
        </section>
      </div>
    {:else if builder.step === 'tracker'}
      <section class="pane narrow">
        <TrackerPanel bind:pack={builder.draft!} disabled={ro} />
      </section>
    {:else if builder.step === 'compendium'}
      <section class="pane">
        <CompendiumPanel bind:pack={builder.draft!} disabled={ro} />
      </section>
    {:else if builder.step === 'trial' && preview}
      <div class="trial">
        <div class="pv-head">
          <select value={builder.previewKind} onchange={(e) => setKind(e.currentTarget.value as 'monster' | 'npc' | 'character')}>
            {#each KINDS as k (k)}<option value={k}>{t(`sb.kind.${k}`)}</option>{/each}
          </select>
          <span class="faint small">{t('sb.trialHint')}</span>
        </div>
        {#key d.sections.length}
          <div class="trial-cols">
            <div class="pane"><PackSheet card={preview} draft={d} /></div>
            <div class="pane"><PackEditor bind:stats={builder.previewStats} system={d.id} lang={getLang()} kind={builder.previewKind} draft={d} /></div>
          </div>
        {/key}
      </div>
    {/if}
    {#if problems.length && builder.step !== 'compendium'}
      <div class="problems">
        <b>{t('sb.problems')}</b>
        {#each problems as p, i (i)}
          <div><code>{p.where}</code>: <code>{p.text}</code> — {p.broken ? t('sb.broken') : t('sb.unknown', { list: p.unknown.join(', ') })}</div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="empty">
      <button class="btn primary" onclick={() => (choosing = true)}><FilePlus size={14} /> {t('sb.new')}</button>
    </div>
  {/if}
</div>

{#if choosing}
  <TemplatePick onpick={(id) => ((choosing = false), newSystem(id))} onclose={() => (choosing = false)} />
{/if}

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
  .steps {
    display: flex;
    gap: 2px;
    margin-top: 10px;
    overflow-x: auto;
    border-bottom: 1px solid var(--border);
  }
  .steps button {
    padding: 8px 12px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .steps button[aria-selected='true'] {
    border-bottom-color: var(--accent);
    color: var(--text-normal);
    font-weight: 600;
  }
  .count {
    margin-left: 5px;
    color: var(--text-faint);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .pane {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    margin-top: 12px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .pane.narrow {
    max-width: 720px;
  }
  /* The sheet step: the sheet, and the chosen thing beside it (under it, narrow). */
  .sheet-step {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    margin-top: 12px;
  }
  .sheet-step .pane {
    margin-top: 0;
  }
  @container (min-width: 640px) {
    .sheet-step {
      grid-template-columns: minmax(0, 1fr) minmax(290px, 400px);
    }
    .inspector {
      position: sticky;
      top: 8px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
    }
  }
  .ihead {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ihead h3 {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tools {
    display: flex;
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
  textarea {
    resize: vertical;
  }
  details summary {
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
  .problems {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
    color: var(--warning);
    font-size: 12px;
  }
  .trial {
    margin-top: 12px;
  }
  .pv-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .trial-cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  @container (min-width: 900px) {
    .trial-cols {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    }
  }
  .empty {
    margin-top: 40px;
    text-align: center;
  }
</style>
