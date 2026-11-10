<!-- The map being edited: the picture drawn from the layout (mapgen/draw.ts) and an overlay — the grid, the cell under
     the cursor, the chosen thing, the rectangle being drawn. The mouse paints, puts things down, picks and moves them;
     the right button takes away. -->
<script lang="ts">
  import { drawLayout } from '../mapgen/draw';
  import type { Layout } from '../mapgen/layout';
  import {
    addHouse, addRoom, brushCells, brushesFor, footprint, lineCells, moveProp, normRect, paint, placeProp, propAt, removeProp, STRETCH, stretchProp, toggleDoor, togglePillar, toggleTower,
  } from './edit';
  import { editor } from './store.svelte';

  let { layout }: { layout: Layout } = $props();

  let base = $state<HTMLCanvasElement>();
  let over = $state<HTMLCanvasElement>();
  let hover = $state<{ x: number; y: number } | null>(null);
  let rect = $state<{ a: { x: number; y: number }; b: { x: number; y: number } } | null>(null);
  const c = $derived(editor.cell);
  const brush = $derived(brushesFor(layout.style).find((b) => b.id === editor.brush) ?? brushesFor(layout.style)[0]!);
  const erase = $derived(brushesFor(layout.style).find((b) => b.id === 'erase')!.cell!);

  // The picture: again whenever the layout or the scale changes.
  $effect(() => {
    if (!base) return;
    base.width = layout.w * c;
    base.height = layout.h * c;
    drawLayout(base.getContext('2d')!, layout, c, editor.numbers ? { labels: (i) => String(i + 1) } : {});
  });

  // The overlay: cheap, on every move of the mouse.
  $effect(() => {
    if (!over) return;
    over.width = layout.w * c;
    over.height = layout.h * c;
    const ctx = over.getContext('2d')!;
    if (editor.grid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < layout.w; x++) (ctx.moveTo(x * c + 0.5, 0), ctx.lineTo(x * c + 0.5, layout.h * c));
      for (let y = 1; y < layout.h; y++) (ctx.moveTo(0, y * c + 0.5), ctx.lineTo(layout.w * c, y * c + 0.5));
      ctx.stroke();
    }
    const box = (x: number, y: number, w: number, h: number, colour: string, dash = false) => {
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      if (dash) ctx.setLineDash([6, 4]);
      ctx.strokeRect(x * c + 1, y * c + 1, w * c - 2, h * c - 2);
      ctx.restore();
    };
    const sel = layout.props?.[editor.selected];
    if (sel) {
      box(sel.x, sel.y, sel.w, sel.h, '#f2c14e', true);
      // The corner to pull: a thing that stretches.
      if (STRETCH.includes(sel.kind)) {
        ctx.fillStyle = '#f2c14e';
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 1.5;
        ctx.fillRect((sel.x + sel.w) * c - 9, (sel.y + sel.h) * c - 9, 10, 10);
        ctx.strokeRect((sel.x + sel.w) * c - 9, (sel.y + sel.h) * c - 9, 10, 10);
      }
    }
    if (rect) {
      const r = normRect(rect.a, rect.b);
      box(r.x, r.y, r.w, r.h, '#a78bfa', true);
    } else if (hover) {
      if (editor.mode === 'place' && editor.prop) {
        const f = footprint(editor.prop, editor.face);
        box(hover.x, hover.y, f.w, f.h, '#a78bfa');
      } else if (editor.mode === 'brush' && !brush.rect && !brush.toggle) {
        const cells = brushCells(hover.x, hover.y, editor.size);
        const xs = cells.map((p) => p.x);
        const ys = cells.map((p) => p.y);
        box(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1, '#a78bfa');
      } else box(hover.x, hover.y, 1, 1, '#a78bfa');
    }
  });

  const cellAt = (e: PointerEvent) => {
    const r = over!.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * layout.w), y: Math.floor(((e.clientY - r.top) / r.height) * layout.h) };
  };

  let stroke: { last: { x: number; y: number }; started: boolean; ch: string } | null = null;
  let drag: { index: number; dx: number; dy: number; started: boolean } | null = null;
  let pull: { index: number; started: boolean } | null = null;
  // Is the pointer on the stretching corner of the chosen thing?
  const onCorner = (e: PointerEvent) => {
    const sel = layout.props?.[editor.selected];
    if (!sel || !STRETCH.includes(sel.kind)) return false;
    const r = over!.getBoundingClientRect();
    const k = r.width / (layout.w * c);
    const px = (e.clientX - r.left) / k;
    const py = (e.clientY - r.top) / k;
    return Math.abs(px - (sel.x + sel.w) * c) < 12 && Math.abs(py - (sel.y + sel.h) * c) < 12;
  };
  let lastPainted: { x: number; y: number } | null = null;

  function paintTo(to: { x: number; y: number }) {
    if (!stroke || !editor.layout) return;
    const cells = lineCells(stroke.last, to).flatMap((p) => brushCells(p.x, p.y, editor.size));
    const next = paint(editor.layout, cells, stroke.ch);
    if (next !== editor.layout) {
      editor.change(next, stroke.started);
      stroke.started = true;
    }
    stroke.last = to;
    lastPainted = to;
  }

  function down(e: PointerEvent) {
    if (!editor.layout || (e.button !== 0 && e.button !== 2)) return;
    over!.setPointerCapture(e.pointerId);
    const p = cellAt(e);
    const l = editor.layout;
    // The right button takes away: a thing in its modes, the ground under the brush.
    if (e.button === 2) {
      if (editor.mode !== 'brush') {
        const i = propAt(l, p.x, p.y);
        if (i >= 0) {
          editor.change(removeProp(l, i));
          editor.selected = -1;
        }
        return;
      }
      stroke = { last: p, started: false, ch: erase };
      paintTo(p);
      return;
    }
    if (editor.mode !== 'brush' && onCorner(e)) {
      pull = { index: editor.selected, started: false };
      return;
    }
    if (editor.mode === 'select') {
      const i = propAt(l, p.x, p.y);
      editor.selected = i;
      if (i >= 0) {
        editor.mode = 'select';
        const q = l.props![i]!;
        drag = { index: i, dx: p.x - q.x, dy: p.y - q.y, started: false };
      }
      return;
    }
    if (editor.mode === 'place' && editor.prop) {
      const { layout: next, index } = placeProp(l, editor.prop, p.x, p.y, editor.face, editor.tint ?? Math.random());
      if (index >= 0) {
        editor.change(next);
        editor.selected = index;
      }
      return;
    }
    if (brush.rect) {
      rect = { a: p, b: p };
      return;
    }
    if (brush.toggle) {
      const fn = brush.id === 'door' ? toggleDoor : brush.id === 'tower' ? toggleTower : togglePillar;
      editor.change(fn(l, p.x, p.y));
      return;
    }
    stroke = { last: e.shiftKey && lastPainted ? lastPainted : p, started: false, ch: brush.cell! };
    paintTo(p);
  }

  function move(e: PointerEvent) {
    const p = cellAt(e);
    if (!hover || hover.x !== p.x || hover.y !== p.y) hover = p;
    over!.style.cursor = pull || (editor.mode !== 'brush' && onCorner(e)) ? 'nwse-resize' : '';
    if (stroke) paintTo(p);
    else if (rect) rect = { a: rect.a, b: p };
    else if (pull && editor.layout) {
      const q = editor.layout.props?.[pull.index];
      if (q) {
        const next = stretchProp(editor.layout, pull.index, p.x - q.x + 1, p.y - q.y + 1);
        if (next !== editor.layout) {
          editor.change(next, pull.started);
          pull.started = true;
        }
      }
    } else if (drag && editor.layout) {
      const next = moveProp(editor.layout, drag.index, p.x - drag.dx, p.y - drag.dy);
      if (next !== editor.layout) {
        editor.change(next, drag.started);
        drag.started = true;
      }
    }
  }

  function up() {
    if (rect && editor.layout) {
      const r = normRect(rect.a, rect.b);
      editor.change(brush.id === 'house' ? addHouse(editor.layout, r) : addRoom(editor.layout, r));
    }
    stroke = null;
    rect = null;
    drag = null;
    pull = null;
  }

  function wheel(e: WheelEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    editor.cell = Math.min(72, Math.max(6, Math.round(editor.cell * (e.deltaY < 0 ? 1.12 : 0.89))));
  }
</script>

<div class="stack" style:width="{layout.w * c}px" style:height="{layout.h * c}px">
  <canvas bind:this={base} aria-hidden="true"></canvas>
  <canvas
    bind:this={over}
    class="over"
    aria-label={editor.title}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onpointerleave={() => (hover = null)}
    oncontextmenu={(e) => e.preventDefault()}
    onwheel={wheel}
  ></canvas>
</div>

<style>
  .stack {
    position: relative;
    flex-shrink: 0;
    margin: 16px;
  }
  canvas {
    position: absolute;
    inset: 0;
    display: block;
  }
  .over {
    cursor: crosshair;
    touch-action: none;
  }
</style>
