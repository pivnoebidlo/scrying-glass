<!-- The map being edited: the picture drawn from the layout (mapgen/draw.ts) and an overlay — the grid, the cell under
     the cursor, the chosen thing, the rectangle being drawn. The mouse paints, puts things down, picks and moves them;
     the right button takes away. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { drawLayout } from '../mapgen/draw';
  import type { Layout } from '../mapgen/layout';
  import {
    addBuilding, addHouse, addRoom, misfit, placeAsset, brushCells, brushesFor, footprint, lineCells, moveProps, normRect, paint, placeProp, propAt, propsIn, MAX_STRETCH, removeProp, STRETCH, stretchProp, swapKind, toggleDoor, togglePillar, toggleRoof, toggleTower, wipe,
  } from './edit';
  import { editor } from './store.svelte';
  import { assets } from './assets.svelte';

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
    // Again when a picture of the GM's has loaded.
    void assets.rev;
    drawLayout(base.getContext('2d')!, layout, c, editor.numbers ? { labels: (i) => String(i + 1) } : {});
  });

  // The overlay: cheap, on every move of the mouse.
  $effect(() => {
    if (!over) return;
    over.width = layout.w * c;
    over.height = layout.h * c;
    const ctx = over.getContext('2d')!;
    if (editor.grid) {
      // Dark lines on a light picture; light ones on dark rock and at night, or the grid is lost.
      ctx.strokeStyle = layout.light === 'night' || layout.light === 'dusk' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.18)';
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
      // The handles to pull: corners and sides of a thing that stretches.
      if (STRETCH.includes(sel.kind)) {
        ctx.fillStyle = '#f2c14e';
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 1.5;
        for (const [hx, hy] of handlesOf(sel)) {
          ctx.fillRect(hx - 5, hy - 5, 10, 10);
          ctx.strokeRect(hx - 5, hy - 5, 10, 10);
        }
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
        const a = editor.prop === 'asset' ? editor.asset : null;
        const f = a ? (editor.face % 2 ? { w: a.h, h: a.w } : { w: a.w, h: a.h }) : footprint(editor.prop, editor.face);
        // Red where it would not go down.
        box(hover.x, hover.y, f.w, f.h, misfit(layout, { kind: editor.prop, x: hover.x, y: hover.y, ...f }) ? '#e0523a' : '#a78bfa');
      } else if (editor.mode === 'brush' && !brush.rect && !brush.toggle) {
        const cells = brushCells(hover.x, hover.y, editor.size);
        const xs = cells.map((p) => p.x);
        const ys = cells.map((p) => p.y);
        box(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1, '#a78bfa');
      } else box(hover.x, hover.y, 1, 1, '#a78bfa');
    }
  });

  // Why the thing would not go down there, in words under the map.
  const tellMisfit = (l: typeof layout, p: Parameters<typeof misfit>[1]) => {
    const why = misfit(l, p);
    if (why) editor.tell(t(`mapedit.misfit.${why}` as never));
  };

  const cellAt = (e: PointerEvent) => {
    const r = over!.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * layout.w), y: Math.floor(((e.clientY - r.top) / r.height) * layout.h) };
  };

  // `wipe`: the eraser — things, doors and the rest go with the ground.
  let stroke: { last: { x: number; y: number }; started: boolean; ch: string; wipe?: boolean } | null = null;
  // Moving the picked things: the cell the pointer was last at.
  let drag: { last: { x: number; y: number }; started: boolean } | null = null;
  // A rectangle that picks the things in it.
  let band = $state<{ a: { x: number; y: number }; b: { x: number; y: number }; add: boolean } | null>(null);
  // Dragging the map about: looking, the middle button, or Space held.
  let pan: { x: number; y: number; left: number; top: number } | null = null;
  let space = $state(false);
  const hand = $derived(editor.viewing || space);
  // Pulling a side or a corner: which way (-1 left / top, 1 right / bottom, 0 that side stays) and the thing as it was.
  type Side = { sx: -1 | 0 | 1; sy: -1 | 0 | 1 };
  let pull: (Side & { index: number; started: boolean; from: { x: number; y: number; w: number; h: number } }) | null = null;
  const SIDES: Side[] = [
    { sx: -1, sy: -1 }, { sx: 1, sy: -1 }, { sx: -1, sy: 1 }, { sx: 1, sy: 1 },
    { sx: 0, sy: -1 }, { sx: 0, sy: 1 }, { sx: -1, sy: 0 }, { sx: 1, sy: 0 },
  ];
  const handleAt = (q: { x: number; y: number; w: number; h: number }, s: Side): [number, number] => [
    (q.x + (q.w * (s.sx + 1)) / 2) * c,
    (q.y + (q.h * (s.sy + 1)) / 2) * c,
  ];
  // The sides only when the thing is large enough on screen to tell them from the corners.
  const sidesOf = (q: { w: number; h: number }) => SIDES.filter((s) => (s.sx && s.sy) || (s.sx ? q.h * c >= 36 : q.w * c >= 36));
  const handlesOf = (q: { x: number; y: number; w: number; h: number }) => sidesOf(q).map((s) => handleAt(q, s));
  // The handle of the chosen thing under the pointer.
  const onCorner = (e: PointerEvent): Side | null => {
    const sel = layout.props?.[editor.selected];
    if (!sel || !STRETCH.includes(sel.kind)) return null;
    const r = over!.getBoundingClientRect();
    const k = r.width / (layout.w * c);
    const px = (e.clientX - r.left) / k;
    const py = (e.clientY - r.top) / k;
    return sidesOf(sel).find((s) => {
      const [hx, hy] = handleAt(sel, s);
      return Math.abs(px - hx) < 10 && Math.abs(py - hy) < 10;
    }) ?? null;
  };
  const cursorOf = (s: Side | null) => (!s ? '' : s.sx && s.sy ? (s.sx === s.sy ? 'nwse-resize' : 'nesw-resize') : s.sx ? 'ew-resize' : 'ns-resize');
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
    const next = stroke.wipe ? wipe(editor.layout, cells, stroke.ch) : paint(editor.layout, cells, stroke.ch);
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
    // The right button takes away: with things in hand the topmost thing first; with a brush, or where there is no
    // thing, everything under it (the eraser).
    if (e.button === 2) {
      if (editor.mode !== 'brush') {
        const i = propAt(l, p.x, p.y);
        if (i >= 0) {
          editor.change(removeProp(l, i));
          editor.picked = [];
          return;
        }
      }
      stroke = { last: p, started: false, ch: erase, wipe: true };
      paintTo(p);
      return;
    }
    const side = editor.mode !== 'brush' ? onCorner(e) : null;
    const was = layout.props?.[editor.selected];
    if (side && was) {
      pull = { ...side, index: editor.selected, started: false, from: { x: was.x, y: was.y, w: was.w, h: was.h } };
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
    if (editor.mode === 'place' && editor.prop === 'asset') {
      if (!editor.asset) return;
      // A random variant of the thing each time, if asked.
      const thing = editor.assetAny ? assets.byBase.get(editor.asset.base) : null;
      const a = thing ? thing.variants[Math.floor(Math.random() * thing.variants.length)]! : editor.asset;
      const { layout: next, index } = placeAsset(l, a, p.x, p.y, editor.face);
      if (index >= 0) {
        editor.change(next);
        editor.selected = index;
      } else tellMisfit(l, { kind: 'asset', x: p.x, y: p.y, ...(editor.face % 2 ? { w: a.h, h: a.w } : { w: a.w, h: a.h }) });
      return;
    }
    if (editor.mode === 'place' && editor.prop) {
      const { layout: next, index } = placeProp(l, editor.prop, p.x, p.y, editor.face, editor.tint ?? Math.random());
      if (index >= 0) {
        editor.change(next);
        editor.selected = index;
      } else tellMisfit(l, { kind: editor.prop, x: p.x, y: p.y, ...footprint(editor.prop, editor.face) });
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
    stroke = { last: e.shiftKey && lastPainted ? lastPainted : p, started: false, ch: brush.cell!, wipe: brush.id === 'erase' };
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
    over!.style.cursor = cursorOf(pull ?? (editor.mode !== 'brush' ? onCorner(e) : null));
    if (stroke) paintTo(p);
    else if (rect) rect = { a: rect.a, b: p };
    else if (band) band = { ...band, b: p };
    else if (pull && editor.layout) {
      const f = pull.from;
      // The opposite side stays where it was; the pulled one follows the pointer, no further than the largest size.
      const span = (lo: number, hi: number, dir: number, at: number) =>
        dir > 0 ? [lo, Math.min(lo + MAX_STRETCH - 1, Math.max(lo, at))] : dir < 0 ? [Math.max(hi - MAX_STRETCH + 1, Math.min(hi, at)), hi] : [lo, hi];
      const [x0, x1] = span(f.x, f.x + f.w - 1, pull.sx, p.x);
      const [y0, y1] = span(f.y, f.y + f.h - 1, pull.sy, p.y);
      {
        const next = stretchProp(editor.layout, pull.index, x1! - x0! + 1, y1! - y0! + 1, x0, y0);
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
