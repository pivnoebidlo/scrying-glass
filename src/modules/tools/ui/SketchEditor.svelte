<!-- The canvas editor: the tools on top, the canvas as the players see it, the base (paper, colour, picture) on the left.
     Saves itself; shown to the players, it saves after every line at once — they see the drawing as it goes. -->
<script lang="ts">
  import { hint, hotkeyLabel, matches } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import {
    ChevronLeft, Circle, Dices, Eraser, Eye, EyeOff, Highlighter, Image as ImageIcon, Minus, MoveUpRight, PaintBucket, PenLine, Send, Square, Trash2, Type,
    Undo2,
  } from '@lucide/svelte';
  import { onDestroy, untrack } from 'svelte';
  import { sendToTelegram, tgReady } from '../../telegram/ui/tg.svelte';
  import SketchView, { type SketchTool } from '../../../renderer/lib/sketch/SketchView.svelte';
  import FilePicker from '../../../renderer/lib/FilePicker.svelte';
  import { imageAspect } from '../../../renderer/lib/sketch/sketches.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { NOTE_EDGES, NOTE_FONTS, NOTE_PAPERS, NOTE_SHAPES, type NoteEdge, type NoteFont, type NotePaper, type NoteShape } from '../../../shared/notes';
  import {
    aspectOf, MAX_ITEMS, SKETCH_BACKS, SKETCH_COLORS, SKETCH_FRAMES, SKETCH_WIDTHS, sketchTitle, TEXT_SIZES,
    type Sketch, type SketchFill, type SketchFrame, type SketchItem, type SketchWidth, type TextSize,
  } from '../../../shared/sketch';
  import { assetUrl, prettyName } from '../../../shared/vault';
  import { ui } from './ui.svelte';

  let { path }: { path: string } = $props();

  let sketch = $state<Sketch | null>(null);
  let missing = $state(false);
  let saved = $state(true);
  let title = $state(untrack(() => sketchTitle(path)));

  window.api.readSketch(untrack(() => path)).then((s) => {
    if (s) sketch = s;
    else missing = true;
  });

  const shown = $derived(store.state.handouts.current === path);

  // Saved half a second after a change; on the players' screen — at once, so they see every line as it is drawn.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let first = true;
  $effect(() => {
    const snap = sketch && $state.snapshot(sketch);
    if (!snap) return;
    if (first) {
      first = false;
      return;
    }
    saved = false;
    clearTimeout(timer);
    timer = setTimeout(() => save(snap as Sketch), untrack(() => shown) ? 60 : 500);
  });
  let pending: Sketch | null = null;
  async function save(s: Sketch) {
    pending = s;
    await window.api.writeSketch(path, s);
    if (pending === s) saved = true;
  }
  onDestroy(() => {
    clearTimeout(timer);
    if (sketch && !saved) window.api.writeSketch(path, $state.snapshot(sketch) as Sketch);
  });

  async function rename() {
    const name = title.trim();
    if (!name || name === sketchTitle(path)) return (title = sketchTitle(path));
    const next = await window.api.renameSketch(path, name);
    if (next) ui.note = next;
  }

  // ---- Tools ----
  const TOOLS: { id: SketchTool; icon: typeof PenLine }[] = [
    { id: 'pen', icon: PenLine },
    { id: 'marker', icon: Highlighter },
    { id: 'line', icon: Minus },
    { id: 'arrow', icon: MoveUpRight },
    { id: 'rect', icon: Square },
    { id: 'ellipse', icon: Circle },
    { id: 'area', icon: PaintBucket },
    { id: 'text', icon: Type },
    { id: 'eraser', icon: Eraser },
  ];
  let tool = $state<SketchTool>('pen');
  let color = $state<string>(SKETCH_COLORS[0]);
  let width = $state<SketchWidth>('medium');
  let fill = $state<SketchFill>('none');
  let font = $state<NoteFont>('marck');
  let size = $state<TextSize>('medium');

  // Undo (⌘Z, the button): the items before each change — a line, an erase, «clear».
  let history = $state<SketchItem[][]>([]);
  function setItems(next: SketchItem[]) {
    if (!sketch) return;
    history = [...history.slice(-99), $state.snapshot(sketch.items) as SketchItem[]];
    sketch.items = next;
  }
  function undo() {
    if (!sketch || !history.length) return;
    sketch.items = history.at(-1)!;
    history = history.slice(0, -1);
  }

  const edit = $derived(
    sketch
      ? {
          tool,
          color,
          width: SKETCH_WIDTHS[width],
          fill,
          font,
          size: TEXT_SIZES[size],
          onadd: (it: SketchItem) => sketch && sketch.items.length < MAX_ITEMS && setItems([...sketch.items, it]),
          onerase: (i: number) => sketch && setItems(sketch.items.filter((_, j) => j !== i)),
        }
      : null,
  );

  function onkeydown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    if (matches(e, 'noteUndo') && history.length) {
      e.preventDefault();
      undo();
    }
  }

  // ---- The base ----
  let picking = $state(false);
  function setBase(kind: 'paper' | 'color') {
    if (!sketch) return;
    if (kind === 'paper') sketch.base = { kind, paper: 'parchment', edge: 'straight', shape: 'landscape' };
    else sketch.base = { kind, color: SKETCH_BACKS[0] };
    sketch.aspect = aspectOf(sketch.base, kind === 'color' ? SKETCH_FRAMES.landscape : 1);
  }
  async function pickImage(p: string | undefined) {
    picking = false;
    if (!sketch || !p) return;
    const a = await imageAspect(assetUrl(p));
    sketch.base = { kind: 'image', path: p };
    sketch.aspect = aspectOf(sketch.base, a);
  }
  function setPaper(field: 'paper' | 'edge' | 'shape', value: string) {
    if (sketch?.base.kind !== 'paper') return;
    sketch.base = { ...sketch.base, [field]: value };
    sketch.aspect = aspectOf(sketch.base, sketch.aspect);
  }
  const frameNow = $derived(sketch ? (Object.entries(SKETCH_FRAMES).find(([, a]) => Math.abs(a - sketch!.aspect) < 0.01)?.[0] as SketchFrame | undefined) : undefined);

  const fontGroups = Object.entries(NOTE_FONTS).reduce<Record<string, [NoteFont, string][]>>((acc, [id, f]) => {
    (acc[f.group] ??= []).push([id as NoteFont, f.title]);
    return acc;
  }, {});
  const shapes = $derived(tool === 'rect' || tool === 'ellipse');
  const lines = $derived(tool === 'pen' || tool === 'line' || tool === 'arrow' || shapes);
</script>

<svelte:window {onkeydown} />

<div class="editor">
  <header class="bar">
    <button class="icon-btn" title={t('tools.note.back')} onclick={() => (ui.note = null)}><ChevronLeft size={16} /></button>
    <input class="title" type="text" bind:value={title} title={t('sketch.titleHint')} onchange={rename} onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
    <span class="faint status">{missing ? '' : saved ? t('tools.note.saved') : t('tools.note.saving')}</span>
    <div class="spacer"></div>
    {#if tgReady() && sketch}
      <button class="icon-btn" title={t('tg.noteHint')} onclick={() => sendToTelegram({ kind: 'note', path, title })}><Send size={15} /></button>
    {/if}
    <button class="btn" class:primary={!shown} disabled={!sketch} title={shown ? '' : t('sketch.liveHint')} onclick={() => dispatch('handouts', 'toggle', { path })}>
      {#if shown}<EyeOff size={14} /> {t('tools.note.removeFromPlayers')}{:else}<Eye size={14} /> {t('tools.note.showToPlayers')}{/if}
    </button>
  </header>

  {#if missing}
    <p class="faint empty">{t('sketch.cantRead')}</p>
  {:else if sketch}
    <div class="tools">
      <div class="seg">
        {#each TOOLS as d (d.id)}
          {@const Icon = d.icon}
          <button type="button" class:active={tool === d.id} title={t(`sketch.tool.${d.id}` as never)} aria-label={t(`sketch.tool.${d.id}` as never)} onclick={() => (tool = d.id)}><Icon size={15} /></button>
        {/each}
      </div>
      {#if tool !== 'eraser'}
        <div class="colors">
          {#each SKETCH_COLORS as c (c)}
            <button type="button" class="chip" class:active={color === c} style:--c={c} aria-label={c} onclick={() => (color = c)}></button>
          {/each}
          <label class="chip own" class:active={!(SKETCH_COLORS as readonly string[]).includes(color)} title={t('sketch.ownColor')} style:--c={color}>
            <input type="color" bind:value={color} />
          </label>
        </div>
      {/if}
      {#if lines}
        <div class="seg">
          {#each Object.entries(SKETCH_WIDTHS) as [w, v] (w)}
            <button type="button" class:active={width === w} title={t(`tools.note.penWidth.${w}` as never)} onclick={() => (width = w as SketchWidth)}><span class="dot-w" style:--w="{Math.max(2, v * 400)}px"></span></button>
          {/each}
        </div>
      {/if}
      {#if shapes}
        <div class="seg text">
          {#each ['none', 'tint', 'solid'] as f (f)}
            <button type="button" class:active={fill === f} onclick={() => (fill = f as SketchFill)}>{t(`sketch.fill.${f}` as never)}</button>
          {/each}
        </div>
      {/if}
      {#if tool === 'text'}
        <select bind:value={font} title={t('tools.note.font')}>
          {#each Object.entries(fontGroups) as [g, list] (g)}
            <optgroup label={g}>{#each list as [id, name] (id)}<option value={id}>{name}</option>{/each}</optgroup>
          {/each}
        </select>
        <div class="seg text">
          {#each Object.keys(TEXT_SIZES) as s (s)}
            <button type="button" class:active={size === s} onclick={() => (size = s as TextSize)}>{t(`sketch.size.${s}` as never)}</button>
          {/each}
        </div>
      {/if}
      <div class="spacer"></div>
      <button type="button" class="btn" disabled={!history.length} title={hint(t('tools.note.penUndo'), 'noteUndo')} onclick={undo}><Undo2 size={14} /></button>
      <button type="button" class="btn" disabled={!sketch.items.length} title={t('sketch.clear')} onclick={() => confirm(t('sketch.clearQ')) && setItems([])}><Trash2 size={14} /></button>
    </div>

    <div class="columns">
      <aside class="base">
        <h4>{t('sketch.base')}</h4>
        <div class="seg text">
          <button type="button" class:active={sketch.base.kind === 'paper'} onclick={() => sketch?.base.kind !== 'paper' && setBase('paper')}>{t('sketch.base.paper')}</button>
          <button type="button" class:active={sketch.base.kind === 'color'} onclick={() => sketch?.base.kind !== 'color' && setBase('color')}>{t('sketch.base.color')}</button>
          <button type="button" class:active={sketch.base.kind === 'image'} onclick={() => (picking = true)}>{t('sketch.base.image')}</button>
        </div>

        {#if sketch.base.kind === 'paper'}
          {@const b = sketch.base}
          <label class="field">
            <span>{t('tools.note.paper')}</span>
            <select value={b.paper} onchange={(e) => setPaper('paper', e.currentTarget.value as NotePaper)}>
              {#each Object.entries(NOTE_PAPERS) as [id, name] (id)}<option value={id}>{name}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span>{t('tools.note.edge')}</span>
            <select value={b.edge} onchange={(e) => setPaper('edge', e.currentTarget.value as NoteEdge)}>
              {#each Object.entries(NOTE_EDGES) as [id, name] (id)}<option value={id}>{name}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span>{t('tools.note.shape')}</span>
            <select value={b.shape} onchange={(e) => setPaper('shape', e.currentTarget.value as NoteShape)}>
              {#each Object.entries(NOTE_SHAPES) as [id, s] (id)}<option value={id}>{s.title}</option>{/each}
            </select>
          </label>
          <button type="button" class="btn" title={t('tools.note.reshuffleHint')} onclick={() => sketch && (sketch.seed = Math.floor(Math.random() * 1e9))}><Dices size={14} /> {t('tools.note.reshuffle')}</button>
        {:else if sketch.base.kind === 'color'}
          {@const b = sketch.base}
          <div class="colors wrap">
            {#each SKETCH_BACKS as c (c)}
              <button type="button" class="chip big" class:active={b.color === c} style:--c={c} aria-label={c} onclick={() => sketch && (sketch.base = { kind: 'color', color: c })}></button>
            {/each}
            <label class="chip big own" title={t('sketch.ownColor')} style:--c={b.color}>
              <input type="color" value={b.color} oninput={(e) => sketch && (sketch.base = { kind: 'color', color: e.currentTarget.value })} />
            </label>
          </div>
          <div class="field">
            <span>{t('sketch.frame')}</span>
            <div class="seg text">
              {#each Object.entries(SKETCH_FRAMES) as [id, a] (id)}
                <button type="button" class:active={frameNow === id} onclick={() => sketch && (sketch.aspect = a)}>{t(`sketch.frame.${id}` as never)}</button>
              {/each}
            </div>
          </div>
        {:else}
          <p class="picked" title={sketch.base.path}><ImageIcon size={14} /> {prettyName(sketch.base.path)}</p>
          <button type="button" class="btn" onclick={() => (picking = true)}>{t('sketch.otherImage')}</button>
          <small class="faint">{t('sketch.imageNote')}</small>
        {/if}

        <small class="faint help">{t(`sketch.help.${tool}` as never)}</small>
        <small class="faint help">{t('sketch.helpUndo', { keys: hotkeyLabel('noteUndo') })}</small>
      </aside>

      <div class="stage">
        <SketchView {sketch} {edit} shadow />
      </div>
    </div>
  {/if}
</div>

{#if picking && store.state.vault.tree}
  <FilePicker tree={store.state.vault.tree} prefer="handouts" onpick={(p) => pickImage(p[0])} onclose={() => (picking = false)} />
{/if}

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    min-width: 220px;
    padding: 3px 6px;
    border-color: transparent;
    background: none;
    font-size: 17px;
    font-weight: 600;
  }
  .title:hover,
  .title:focus {
    border-color: var(--border);
  }
  .status {
    font-size: 12px;
  }
  .spacer {
    flex: 1;
  }
  .empty {
    padding: 30px 20px;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
  }
  .seg {
    display: flex;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 26px;
    padding: 0 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg.text button {
    padding: 0 9px;
    white-space: nowrap;
    font-size: 12px;
  }
  .seg button:hover {
    color: var(--text-normal);
  }
  .seg button.active {
    background: var(--accent);
    color: var(--on-accent);
  }
  .dot-w {
    display: inline-block;
    width: 14px;
    height: var(--w);
    border-radius: 999px;
    background: currentColor;
  }
  .colors {
    display: flex;
    gap: 4px;
  }
  .colors.wrap {
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    position: relative;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: var(--c);
    cursor: pointer;
  }
  .chip.big {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-s);
  }
  .chip.active {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  /* Own colour: a rainbow ring around the colour; the colour input itself is invisible over it. */
  .chip.own {
    background:
      radial-gradient(circle, var(--c) 45%, transparent 47%),
      conic-gradient(#e53935, #fdd835, #43a047, #1e88e5, #8e24aa, #e53935);
  }
  .chip.own input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .columns {
    display: grid;
    grid-template-columns: 240px 1fr;
    flex: 1;
    min-height: 0;
  }
  .base {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    overflow: auto;
    border-right: 1px solid var(--border);
  }
  .base h4 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
  }
  .base .seg {
    align-self: flex-start;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .picked {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    font-size: 11px;
  }
  .help {
    margin-top: 6px;
  }
  .stage {
    min-height: 0;
    padding: 24px;
    background: #17130f;
  }
</style>
