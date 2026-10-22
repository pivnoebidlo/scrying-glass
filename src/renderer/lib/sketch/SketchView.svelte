<!-- A canvas: the base (a sheet of the notes' paper, a colour or a picture of the vault) and the drawing over it.
     Fits its parent keeping the canvas's proportions; everything is in fractions of the canvas, so a tile, the editor
     and the player screen look alike. `edit` — the editor: a drag draws with the tool, the eraser takes away the item
     under the pointer, the text tool opens a field where it was clicked. -->
<script module lang="ts">
  import type { NoteFont } from '../../../shared/notes';
  import type { SketchFill, SketchItem, SketchShapeKind } from '../../../shared/sketch';
  export type SketchTool = 'pen' | 'marker' | SketchShapeKind | 'area' | 'text' | 'eraser';
  export interface SketchEdit {
    tool: SketchTool;
    color: string;
    width: number;
    fill: SketchFill;
    font: NoteFont;
    size: number;
    onadd: (item: SketchItem) => void;
    onerase: (i: number) => void;
  }
</script>

<script lang="ts">
  import '../note/fonts.css';
  import NotePaper from '../note/NotePaper.svelte';
  import { NOTE_FONTS, newNote } from '../../../shared/notes';
  import { assetUrl, thumb } from '../../../shared/vault';
  import {
    areaPath, arrowPath, itemAt, MARKER_WIDTH, strokePath, TEXT_MAX, TINT_ALPHA,
    type Sketch,
  } from '../../../shared/sketch';

  let { sketch, small = false, shadow = false, edit }: { sketch: Sketch; small?: boolean; shadow?: boolean; edit?: SketchEdit | null } = $props();

  const W = 1000;
  const H = $derived(Math.round(W / sketch.aspect));
  const uid = 's' + Math.random().toString(36).slice(2, 9);

  // A sheet of paper: a note without text, with the canvas's seed (its own stains and edges).
  const paper = $derived(sketch.base.kind === 'paper' ? { ...newNote(), paper: sketch.base.paper, edge: sketch.base.edge, shape: sketch.base.shape, seed: sketch.seed } : null);
  const image = $derived(sketch.base.kind === 'image' ? (small ? thumb(assetUrl(sketch.base.path), 480) : assetUrl(sketch.base.path)) : null);
  // Text on a picture or a dark colour needs an outline to be read.
  const light = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return 0.299 * r! + 0.587 * g! + 0.114 * b! > 150;
  };
  const halo = (c: string) => (sketch.base.kind === 'paper' ? null : light(c) ? '#000000' : '#ffffff');

  const fillOf = (c: string, f: SketchFill) => (f === 'none' ? 'none' : c);
  const fillOpacity = (f: SketchFill) => (f === 'tint' ? TINT_ALPHA : 1);

  // ---- Drawing ----
  let live = $state<SketchItem | null>(null);
  let typing = $state<{ x: number; y: number; text: string } | null>(null);
  let field = $state<HTMLTextAreaElement>();
  $effect(() => {
    if (typing && field) field.focus();
  });

  function down(e: PointerEvent) {
    const ed = edit;
    if (!ed || e.button !== 0) return;
    e.preventDefault();
    const box = (e.currentTarget as Element).getBoundingClientRect();
    const at = (ev: PointerEvent) => [(ev.clientX - box.left) / box.width, (ev.clientY - box.top) / box.height] as [number, number];
    const [x0, y0] = at(e);
    const r4 = (v: number) => +v.toFixed(4);
    const track = (move: (ev: PointerEvent) => void, up: () => void) => {
      const done = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', done);
        up();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', done);
    };

    if (ed.tool === 'eraser') {
      const erase = (ev: PointerEvent) => {
        const [x, y] = at(ev);
        const i = itemAt(sketch.items, x, y, box.width, box.height);
        if (i >= 0) ed.onerase(i);
      };
      erase(e);
      return track(erase, () => {});
    }
    if (ed.tool === 'text') {
      if (typing) commitText();
      typing = { x: x0, y: y0, text: '' };
      return;
    }
    if (ed.tool === 'pen' || ed.tool === 'marker' || ed.tool === 'area') {
      const pts = [r4(x0), r4(y0)];
      const make = (): SketchItem =>
        ed.tool === 'area'
          ? { t: 'area', color: ed.color, points: [...pts] }
          : { t: 'pen', color: ed.color, width: ed.tool === 'marker' ? MARKER_WIDTH : ed.width, points: [...pts], ...(ed.tool === 'marker' ? { marker: true } : {}) };
      live = make();
      return track(
        (ev) => {
          const [x, y] = at(ev);
          if (Math.hypot((x - pts.at(-2)!) * box.width, (y - pts.at(-1)!) * box.height) < 2) return;
          pts.push(r4(x), r4(y));
          live = make();
        },
        () => {
          live = null;
          if (ed.tool === 'area' && pts.length < 6) return;
          if (pts.length < 4) pts.push(r4(x0 + 0.0005), r4(y0));
          ed.onadd(make());
        },
      );
    }
    // Shapes: from the press to the pointer; Shift — a square, a circle, a line at a multiple of 15°.
    const tool = ed.tool;
    const make = (ev: PointerEvent): SketchItem => {
      let [x, y] = at(ev);
      if (ev.shiftKey) {
        const dx = (x - x0) * box.width;
        const dy = (y - y0) * box.height;
        if (tool === 'line' || tool === 'arrow') {
          const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12);
          const len = Math.hypot(dx, dy);
          x = x0 + (Math.cos(a) * len) / box.width;
          y = y0 + (Math.sin(a) * len) / box.height;
        } else {
          const side = Math.max(Math.abs(dx), Math.abs(dy));
          x = x0 + (Math.sign(dx) * side) / box.width;
          y = y0 + (Math.sign(dy) * side) / box.height;
        }
      }
      return { t: tool, color: ed.color, width: ed.width, x1: r4(x0), y1: r4(y0), x2: r4(x), y2: r4(y), fill: tool === 'rect' || tool === 'ellipse' ? ed.fill : 'none' };
    };
    live = make(e);
    track(
      (ev) => (live = make(ev)),
      () => {
        const it = live as Extract<SketchItem, { x1: number }> | null;
        live = null;
        // A click without a drag draws nothing.
        if (it && Math.hypot((it.x2 - it.x1) * box.width, (it.y2 - it.y1) * box.height) > 3) ed.onadd(it);
      },
    );
  }

  function commitText() {
    const tx = typing;
    typing = null;
    if (!edit || !tx || !tx.text.trim()) return;
    edit.onadd({ t: 'text', color: edit.color, x: tx.x, y: tx.y, size: edit.size, font: edit.font, text: tx.text.trim().slice(0, TEXT_MAX) });
  }
  function textKey(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Escape') typing = null;
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitText();
    }
  }
  // The tool changed or the editor closed — a started text is kept.
  $effect(() => {
    if (edit?.tool !== 'text' && typing) commitText();
  });
</script>

{#snippet draw(it: SketchItem)}
  {#if it.t === 'pen'}
    <path d={strokePath(it.points, W, H)} fill="none" stroke={it.color} stroke-width={it.width * W} opacity={it.marker ? 0.42 : 1} stroke-linecap={it.marker ? 'butt' : 'round'} />
  {:else if it.t === 'area'}
    <path d={areaPath(it.points, W, H)} fill={it.color} fill-opacity={TINT_ALPHA} stroke={it.color} stroke-opacity="0.6" stroke-width="2" />
  {:else if it.t === 'line'}
    <line x1={it.x1 * W} y1={it.y1 * H} x2={it.x2 * W} y2={it.y2 * H} stroke={it.color} stroke-width={it.width * W} />
  {:else if it.t === 'arrow'}
    <path d={arrowPath(it.x1 * W, it.y1 * H, it.x2 * W, it.y2 * H, it.width * W)} fill="none" stroke={it.color} stroke-width={it.width * W} />
  {:else if it.t === 'rect'}
    <rect
      x={Math.min(it.x1, it.x2) * W}
      y={Math.min(it.y1, it.y2) * H}
      width={Math.abs(it.x2 - it.x1) * W}
      height={Math.abs(it.y2 - it.y1) * H}
      fill={fillOf(it.color, it.fill)}
      fill-opacity={fillOpacity(it.fill)}
      stroke={it.color}
      stroke-width={it.width * W}
    />
  {:else if it.t === 'ellipse'}
    <ellipse
      cx={((it.x1 + it.x2) / 2) * W}
      cy={((it.y1 + it.y2) / 2) * H}
      rx={(Math.abs(it.x2 - it.x1) / 2) * W}
      ry={(Math.abs(it.y2 - it.y1) / 2) * H}
      fill={fillOf(it.color, it.fill)}
      fill-opacity={fillOpacity(it.fill)}
      stroke={it.color}
      stroke-width={it.width * W}
    />
  {:else if it.t === 'text'}
    {@const lines = it.text.split('\n')}
    {@const h = halo(it.color)}
    <text
      x={it.x * W}
      y={it.y * H - ((lines.length - 1) * it.size * W * 1.15) / 2}
      font-family="'{NOTE_FONTS[it.font].family}', serif"
      font-size={it.size * W}
      fill={it.color}
      stroke={h ?? 'none'}
      stroke-width={h ? it.size * W * 0.12 : 0}
      paint-order="stroke"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {#each lines as l, i (i)}<tspan x={it.x * W} dy={i ? it.size * W * 1.15 : 0}>{l}</tspan>{/each}
    </text>
  {/if}
{/snippet}

<div class="fit">
  <div class="sheet" class:shadow style:aspect-ratio={sketch.aspect} style:--a={sketch.aspect}>
    {#if paper}
      <div class="base"><NotePaper note={paper} /></div>
    {:else if image}
      <img class="base" src={image} alt="" draggable="false" />
    {:else if sketch.base.kind === 'color'}
      <div class="base" style:background={sketch.base.color}></div>
    {/if}

    <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
      {#if paper}
        <!-- On paper the lines are a little rough at the edge, like ink. -->
        <defs>
          <filter id="{uid}-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed={sketch.seed % 997} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
          </filter>
        </defs>
      {/if}
      <g filter={paper ? `url(#${uid}-ink)` : undefined} stroke-linecap="round" stroke-linejoin="round">
        {#each sketch.items as it, i (i)}{@render draw(it)}{/each}
        {#if live}{@render draw(live)}{/if}
      </g>
    </svg>

    {#if edit}
      <div class="edit {edit.tool}" role="presentation" onpointerdown={down}></div>
      {#if typing}
        <textarea
          class="type"
          bind:this={field}
          bind:value={typing.text}
          maxlength={TEXT_MAX}
          rows="1"
          style:left="{typing.x * 100}%"
          style:top="{typing.y * 100}%"
          style:font-family="'{NOTE_FONTS[edit.font].family}', serif"
          style:font-size="{edit.size * 100}cqw"
          style:color={edit.color}
          onkeydown={textKey}
          onblur={commitText}
        ></textarea>
      {/if}
    {/if}
  </div>
</div>

<style>
  .fit {
    container-type: size;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }
  .sheet {
    container-type: inline-size;
    position: relative;
    width: min(100cqw, calc(100cqh * var(--a, 1)));
    max-height: 100cqh;
  }
  .sheet.shadow {
    filter: drop-shadow(0 1.2cqw 3cqw rgba(0, 0, 0, 0.6));
  }
  .base,
  svg,
  .edit {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  img.base {
    object-fit: fill;
    user-select: none;
  }
  svg {
    pointer-events: none;
    overflow: visible;
  }
  .edit {
    cursor: crosshair;
    touch-action: none;
  }
  .edit.eraser {
    cursor: cell;
  }
  .edit.text {
    cursor: text;
  }
  .type {
    position: absolute;
    z-index: 2;
    min-width: 6em;
    padding: 0 0.2em;
    transform: translate(-50%, -50%);
    border: 1px dashed currentColor;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.15);
    line-height: 1.15;
    text-align: center;
    resize: none;
    field-sizing: content;
    outline: none;
  }
</style>
