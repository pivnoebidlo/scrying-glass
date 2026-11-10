<!-- The map being edited: the picture drawn from the layout (mapgen/draw.ts) and an overlay — the grid, the cell under
     the cursor, the chosen thing, the rectangle being drawn. The mouse paints, puts things down, picks and moves them;
     the right button takes away. -->
<script lang="ts">
  import { drawLayout } from '../mapgen/draw';
  import type { Layout } from '../mapgen/layout';
  import {
    addBuilding, addHouse, addRoom, brushCells, brushesFor, footprint, lineCells, moveProps, normRect, paint, placeProp, propAt, propsIn, removeProp, STRETCH, stretchProp, swapKind, toggleDoor, togglePillar, toggleRoof, toggleTower,
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
    // The mimic: a chest to the players, to the master a chest that looks back (and bites when it is woken).
    (layout.props ?? []).forEach((q, i) => {
      if (q.kind !== 'mimic') return;
      const px = (q.x + q.w / 2) * c;
      const py = (q.y + q.h / 2) * c;
      if (chomp?.i === i) {
        ctx.fillStyle = '#7a1f2b';
        ctx.fillRect(px - c * 0.3, py - c * 0.07, c * 0.6, c * 0.14);
        ctx.fillStyle = '#f4efe2';
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const tx = px - c * 0.3 + (k + 0.5) * c * 0.1;
          ctx.moveTo(tx - c * 0.045, py - c * 0.07);
          ctx.lineTo(tx, py + c * 0.02);
          ctx.lineTo(tx + c * 0.045, py - c * 0.07);
        }
        ctx.fill();
      }
      for (const dx of [-0.16, 0.16]) {
        ctx.fillStyle = '#f6f1e4';
        ctx.beginPath();
        ctx.arc(px + dx * c, py - c * 0.13, c * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1208';
        ctx.beginPath();
        ctx.arc(px + dx * c + (hover ? Math.sign(hover.x + 0.5 - q.x - q.w / 2) * c * 0.025 : 0), py - c * 0.13 + (hover ? Math.sign(hover.y + 0.5 - q.y - q.h / 2) * c * 0.025 : 0), c * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (editor.viewing) return;
    for (const i of editor.picked) {
      const q = layout.props?.[i];
      if (q && i !== editor.selected) box(q.x, q.y, q.w, q.h, '#f2c14e', true);
    }
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
    if (band) {
      const r = normRect(band.a, band.b);
      box(r.x, r.y, r.w, r.h, '#f2c14e', true);
    } else if (rect) {
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
  // Moving the picked things: the cell the pointer was last at.
  let drag: { last: { x: number; y: number }; started: boolean } | null = null;
  // A rectangle that picks the things in it.
  let band = $state<{ a: { x: number; y: number }; b: { x: number; y: number }; add: boolean } | null>(null);
  // Dragging the map about: looking, the middle button, or Space held.
  let pan: { x: number; y: number; left: number; top: number } | null = null;
  let space = $state(false);
  const hand = $derived(editor.viewing || space);
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
  // A chest woken a moment ago: its teeth show.
  let chomp = $state<{ i: number } | null>(null);
  function dblclick(e: MouseEvent) {
    if (!editor.layout || editor.viewing || editor.mode !== 'select') return;
    const r = over!.getBoundingClientRect();
    const p = { x: Math.floor(((e.clientX - r.left) / r.width) * layout.w), y: Math.floor(((e.clientY - r.top) / r.height) * layout.h) };
    const i = propAt(editor.layout, p.x, p.y);
    const kind = editor.layout.props?.[i]?.kind;
    if (kind !== 'chest' && kind !== 'mimic') return;
    editor.change(swapKind(editor.layout, i, kind === 'chest' ? 'mimic' : 'chest'));
    if (kind === 'chest') {
      chomp = { i };
      setTimeout(() => (chomp = null), 700);
    }
  }

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
    if (!editor.layout) return;
    if (hand || e.button === 1) {
      const box = over!.closest('.scroll');
      if (!box) return;
      e.preventDefault();
      over!.setPointerCapture(e.pointerId);
      pan = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop };
      over!.style.cursor = 'grabbing';
      return;
    }
    if (e.button !== 0 && e.button !== 2) return;
    over!.setPointerCapture(e.pointerId);
    const p = cellAt(e);
    const l = editor.layout;
    // The right button takes away: a thing in its modes, the ground under the brush.
    if (e.button === 2) {
      if (editor.mode !== 'brush') {
        const i = propAt(l, p.x, p.y);
        if (i >= 0) {
          editor.change(removeProp(l, i));
          editor.picked = [];
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
      // Shift: add to the picked or take away; nothing under the pointer — a rectangle to pick with.
      if (i < 0) {
        band = { a: p, b: p, add: e.shiftKey };
        if (!e.shiftKey) editor.picked = [];
        return;
      }
      if (e.shiftKey) {
        editor.picked = editor.picked.includes(i) ? editor.picked.filter((n) => n !== i) : [...editor.picked, i];
        return;
      }
      // A thing among the picked moves them all; another one is picked alone.
      if (!editor.picked.includes(i)) editor.picked = [i];
      else editor.picked = [...editor.picked.filter((n) => n !== i), i];
      drag = { last: p, started: false };
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
      const fn = brush.id === 'door' ? toggleDoor : brush.id === 'tower' ? toggleTower : brush.id === 'roof' ? toggleRoof : togglePillar;
      editor.change(fn(l, p.x, p.y));
      return;
    }
    stroke = { last: e.shiftKey && lastPainted ? lastPainted : p, started: false, ch: brush.cell! };
    paintTo(p);
  }

  function move(e: PointerEvent) {
    if (pan) {
      const box = over!.closest('.scroll');
      if (box) {
        box.scrollLeft = pan.left - (e.clientX - pan.x);
        box.scrollTop = pan.top - (e.clientY - pan.y);
      }
      return;
    }
    if (hand) {
      over!.style.cursor = 'grab';
      hover = null;
      return;
    }
    const p = cellAt(e);
    if (!hover || hover.x !== p.x || hover.y !== p.y) hover = p;
    over!.style.cursor = pull || (editor.mode !== 'brush' && onCorner(e)) ? 'nwse-resize' : '';
    if (stroke) paintTo(p);
    else if (rect) rect = { a: rect.a, b: p };
    else if (band) band = { ...band, b: p };
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
      const next = moveProps(editor.layout, editor.picked, p.x - drag.last.x, p.y - drag.last.y);
      if (next !== editor.layout) {
        editor.change(next, drag.started);
        drag.started = true;
        drag.last = p;
      }
    }
  }

  function up() {
    if (pan) {
      pan = null;
      over!.style.cursor = hand ? 'grab' : '';
      return;
    }
    if (band && editor.layout) {
      const found = propsIn(editor.layout, normRect(band.a, band.b));
      editor.picked = band.add ? [...editor.picked.filter((i) => !found.includes(i)), ...found] : found;
    }
    band = null;
    if (rect && editor.layout) {
      const r = normRect(rect.a, rect.b);
      editor.change(brush.id === 'house' ? addHouse(editor.layout, r) : brush.id === 'build' ? addBuilding(editor.layout, r) : addRoom(editor.layout, r));
    }
    stroke = null;
    rect = null;
    drag = null;
    pull = null;
  }

  // Space held: the hand for a moment.
  function keys(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    if (e.code !== 'Space' || (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.tagName === 'BUTTON'))) return;
    e.preventDefault();
    space = e.type === 'keydown';
    if (over) over.style.cursor = space || editor.viewing ? 'grab' : '';
  }

</script>

<svelte:window onkeydown={keys} onkeyup={keys} />

<div class="stack" style:width="{layout.w * c}px" style:height="{layout.h * c}px">
  <canvas bind:this={base} aria-hidden="true"></canvas>
  <canvas
    bind:this={over}
    class="over"
    aria-label={editor.title}
    class:hand
    onpointerdown={down}
    onauxclick={(e) => e.preventDefault()}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onpointerleave={() => (hover = null)}
    oncontextmenu={(e) => e.preventDefault()}
    ondblclick={dblclick}
  ></canvas>
</div>

<style>
  .stack {
    position: relative;
    flex-shrink: 0;
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
  .over.hand {
    cursor: grab;
  }
</style>
