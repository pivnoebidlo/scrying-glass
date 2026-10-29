<!-- The builder's sheet step, its left side: the card's sections and fields as tiles with the values of the sample
     card — the way a GM will find them. A click chooses a field or a section (its settings — on the right), «＋ field»
     adds one to the section, «＋ section» — a section; 🎲 — the field rolls on a click. -->
<script lang="ts">
  import { Dices, Plus } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { evalFormula, loc, type FieldDef, type Loc, type PackStats, type SystemPack } from '../../../shared/syspack';
  import type { Selection } from './store.svelte';

  let {
    pack,
    stats,
    sel,
    disabled = false,
    onselect,
    onaddfield,
    onaddsection,
  }: {
    pack: SystemPack;
    stats: PackStats;
    sel: Selection;
    disabled?: boolean;
    onselect: (s: Selection) => void;
    onaddfield: (s: number) => void;
    onaddsection: () => void;
  } = $props();

  const L = (x: Loc | undefined) => loc(x, getLang());
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
  const value = (f: FieldDef) => stats[f.key];
  const boxes = (f: FieldDef) => Math.max(0, Math.min(12, typeof f.boxes === 'number' ? f.boxes : f.boxes ? num(stats[f.boxes]) : 0));
  const shown = (f: FieldDef): string => {
    const v = value(f);
    if (f.type === 'number') return String(num(v));
    if (f.type === 'formula') return String(Math.round(evalFormula(pack, stats, f.formula ?? '0') * 100) / 100);
    if (f.type === 'select') return typeof v === 'number' ? L(f.options?.[v]) : '—';
    if (f.type === 'text' || f.type === 'textarea') return String(v ?? '').trim() || '…';
    if (f.type === 'tags') return Array.isArray(v) && v.length ? v.join(', ') : '…';
    if (f.type === 'list') return (f.columns ?? []).map((c) => L(c.title)).join(' · ');
    if (f.type === 'slots') return (f.slots ?? []).map((g) => `${L(g.title)} ${g.count}`).join(' · ');
    return '';
  };
  const isSel = (s: number, i: number) => sel.kind === 'field' && sel.s === s && sel.f === i;
</script>

<div class="canvas">
  <p class="hint faint">{t('sb.sheetHint')}</p>
  {#each pack.sections as sec, s (s)}
    <div class="sec">
      <button class="sec-head" class:on={sel.kind === 'section' && sel.s === s} onclick={() => onselect({ kind: 'section', s })}>
        <h4>{L(sec.title) || '—'}</h4>
        {#if sec.kinds}<span class="faint kinds">· {sec.kinds.map((k) => t(`sb.kind.${k}`)).join(', ')}</span>{/if}
      </button>
      <div class="grid">
        {#each sec.fields as f, i (i)}
          {@const wide = f.type === 'textarea' || f.type === 'list' || f.type === 'slots' || f.type === 'tags'}
          <button class="field" class:wide class:on={isSel(s, i)} onclick={() => onselect({ kind: 'field', s, f: i })}>
            {#if f.roll}<span class="dice" title={t('sb.rollsOnClick')}><Dices size={12} /></span>{/if}
            <span class="title">{L(f.title) || f.key}</span>
            <span class="value">
              {#if f.type === 'dots'}
                {#each { length: f.max ?? 5 } as _, d (d)}<span class="dot" class:off={d >= num(value(f))}>●</span>{/each}
              {:else if f.type === 'track'}
                {#each { length: boxes(f) } as _, d (d)}<span class="box" class:on={d < num(value(f))}></span>{/each}
              {:else}
                {shown(f)}
              {/if}
            </span>
          </button>
        {/each}
        {#if !disabled}<button class="add" onclick={() => onaddfield(s)}><Plus size={12} /> {t('sb.addFieldShort')}</button>{/if}
      </div>
    </div>
  {/each}
  {#if !disabled}<button class="add section" onclick={onaddsection}><Plus size={12} /> {t('sb.addSectionShort')}</button>{/if}
</div>

<style>
  .canvas {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .hint {
    margin: 0;
    font-size: 12px;
  }
  .sec {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sec-head {
    display: flex;
    align-items: baseline;
    gap: 6px;
    align-self: flex-start;
    padding: 2px 6px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: none;
    color: inherit;
    text-align: left;
  }
  .sec-head:hover {
    background: var(--bg-hover);
  }
  .sec-head.on {
    border-color: var(--accent);
  }
  h4 {
    margin: 0;
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .kinds {
    font-size: 11px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 6px;
  }
  .field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 7px 9px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: inherit;
    text-align: left;
  }
  .field.wide {
    grid-column: span 2;
  }
  .field:hover {
    border-color: var(--text-faint);
  }
  .field.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .dice {
    position: absolute;
    top: 6px;
    right: 7px;
    color: var(--accent);
  }
  .title {
    padding-right: 16px;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .value {
    overflow: hidden;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    color: var(--accent);
    font-size: 12px;
    letter-spacing: 1px;
  }
  .dot.off {
    color: var(--text-faint);
  }
  .box {
    display: inline-block;
    width: 11px;
    height: 11px;
    margin-right: 2px;
    border: 1.5px solid var(--text-muted);
    border-radius: 2px;
  }
  .box.on {
    border-color: var(--danger);
    background: var(--danger);
  }
  .add {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 7px 9px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-faint);
    font-size: 12px;
    text-align: left;
  }
  .add:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .add.section {
    align-self: flex-start;
  }
</style>
