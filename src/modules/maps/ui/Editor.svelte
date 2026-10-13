<!-- Вкладка «Карты»: редактор мастера. Туман полупрозрачный, рамкой — то, что видят игроки. -->
<script lang="ts">
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { untrack } from 'svelte';
  import {
    Brush, Eraser, Eye, EyeOff, Grid3x3, Hand, MapPin, MapPinPlus, Maximize, Move, ScanEye, SquareDashed, SquareDashedMousePointer, Undo2,
  } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { playerDisplay } from '../../../renderer/lib/nav';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { vaultUrl } from '../../../shared/vault';
  import { dataOf } from '../data';
  import { mapGroups, mapName } from '../library';
  import {
    applyFogOp, buildFog, drawMap, drawPins, fitCanvas, fogCanvas, loadImage, pinHead, visibleArea, type LoadedImage, type Xf,
  } from '../render';
  import { FULL_VIEW, type FogOp, type MapPin as Pin, type MapView } from '../types';
  import PinPanel from './PinPanel.svelte';
  import { ui, type Tool } from './ui.svelte';

  let { ms, app }: ModuleProps<'maps'> = $props();

  const groups = $derived(app.vault.tree ? mapGroups(app.vault.tree, app.vault.name, ms, app.adventures) : []);
  const known = $derived(new Set(groups.flatMap((g) => g.items)));
  // Открыта выбранная карта, иначе та, что у игроков, иначе первая.
  const path = $derived(
    ui.selected && known.has(ui.selected) ? ui.selected : (ms.current ?? groups[0]?.items[0] ?? null)
  );
  const data = $derived(path ? dataOf(ms, path) : null);
  const shown = $derived(!!path && ms.current === path);

  const TOOLS: { id: Tool; title: string; icon: typeof Hand }[] = [
    { id: 'pan', title: 'Рука: двигать карту (или пробел / средняя кнопка)', icon: Hand },
    { id: 'reveal', title: 'Открыть кистью', icon: Brush },
    { id: 'hide', title: 'Скрыть кистью', icon: Eraser },
    { id: 'revealRect', title: 'Открыть прямоугольник', icon: SquareDashedMousePointer },
    { id: 'hideRect', title: 'Скрыть прямоугольник', icon: SquareDashed },
    { id: 'view', title: 'Двигать область, которую видят игроки', icon: Move },
    { id: 'pin', title: 'Метки: щелчок — поставить, метку можно перетащить', icon: MapPinPlus },
  ];

  // Метки этой карты; выбранная — та, что открыта в панели.
  const pins = $derived(data?.pins ?? []);
  const pin = $derived(pins.find((p) => p.id === ui.pin) ?? null);

  let canvas = $state<HTMLCanvasElement>();
  let img = $state.raw<LoadedImage | null>(null);
  let fog: HTMLCanvasElement | null = null;
  // Вид мастера: свой, у игроков — другой (data.view).
  let xf: Xf = { s: 1, ox: 0, oy: 0 };
  let fitted = false;
  let spaceDown = $state(false);
  let pointer: { x: number; y: number } | null = null;
  let viewPreview: MapView | null = null;

  type Drag =
    | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
    | { kind: 'brush'; op: Extract<FogOp, { kind: 'brush' }>; lx: number; ly: number }
    | { kind: 'rect'; mode: 'reveal' | 'hide'; x0: number; y0: number; x1: number; y1: number }
    | { kind: 'view'; sx: number; sy: number; view0: MapView }
    | { kind: 'pin'; id: string; sx: number; sy: number; x0: number; y0: number; moved: boolean };
  let drag = $state.raw<Drag | null>(null);
  // Метка, которую сейчас тащат: её новое место до отпускания мыши.
  let pinPreview: { id: string; x: number; y: number } | null = null;
  let overPin = $state(false);
  const PIN_R = 9;

  const dpr = () => window.devicePixelRatio || 1;

  // ---- Загрузка карты ----
  $effect(() => {
    const p = path;
    img = null;
    fog = null;
    fitted = false;
    if (!p) return;
    let cancelled = false;
    loadImage(vaultUrl(p)).then((i) => !cancelled && (img = i), () => {});
    return () => (cancelled = true);
  });

  $effect(() => {
    const f = data?.fog;
    const i = img;
    if (!f || !i) return;
    untrack(() => {
      fog ??= fogCanvas(i.w, i.h);
      buildFog(f, fog);
      draw();
    });
  });

  $effect(() => {
    void data?.view;
    void data?.grid;
    void data?.pins;
    void ui.pin;
    untrack(draw);
  });

  // Другая карта — метка с прошлой не выбрана.
  $effect(() => {
    void path;
    untrack(() => (ui.pin = null));
  });

  // ---- Рисование ----
  function fit(c: HTMLCanvasElement, i: LoadedImage) {
    const pad = 24 * dpr();
    const s = Math.min((c.width - pad * 2) / i.w, (c.height - pad * 2) / i.h);
    xf = { s, ox: (c.width - i.w * s) / 2, oy: (c.height - i.h * s) / 2 };
  }

  function draw() {
    const c = canvas;
    if (!img || !fog || !c || !data) return;
    fitCanvas(c);
    if (!fitted) {
      fit(c, img);
      fitted = true;
    }
    const ctx = c.getContext('2d')!;
    drawMap(ctx, img, fog, xf, { fogAlpha: 0.6, fogBlur: 0, grid: data.grid });
    const pv = pinPreview;
    drawPins(ctx, pv ? pins.map((p) => (p.id === pv.id ? { ...p, x: pv.x, y: pv.y } : p)) : pins, img, xf, {
      r: PIN_R * dpr(),
      font: `600 ${12 * dpr()}px -apple-system, system-ui, sans-serif`,
      master: { selected: ui.pin },
    });

    // Что видят игроки: обзор, вписанный в экран с его пропорциями.
    const d = playerDisplay();
    const v = visibleArea(viewPreview ?? data.view, img, d ? d.width / d.height : 16 / 9);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const rx = v.x * img.w * xf.s + xf.ox;
    const ry = v.y * img.h * xf.s + xf.oy;
    const rw = v.w * img.w * xf.s;
    const rh = v.h * img.h * xf.s;
    ctx.lineWidth = 2 * dpr();
    ctx.strokeStyle = shown ? '#8a5cf5' : 'rgba(138, 92, 245, 0.55)';
    ctx.setLineDash(shown ? [] : [8 * dpr(), 6 * dpr()]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.setLineDash([]);
    ctx.font = `${12 * dpr()}px -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(shown ? 'видят игроки' : 'увидят игроки', rx + 6 * dpr(), ry - 6 * dpr());

    if (drag?.kind === 'rect') {
      const x = Math.min(drag.x0, drag.x1);
      const y = Math.min(drag.y0, drag.y1);
      ctx.fillStyle = drag.mode === 'reveal' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(x, y, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0));
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1 * dpr();
      ctx.strokeRect(x, y, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0));
    }

    if (pointer && (ui.tool === 'reveal' || ui.tool === 'hide') && !spaceDown) {
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, ui.brush * dpr(), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5 * dpr();
      ctx.stroke();
    }
  }

  // ---- Мышь ----
  // Точка события в пикселях canvas (от clientX: offsetX бывает неточным, например у программных событий).
  const at = (e: PointerEvent | WheelEvent) => {
    const r = canvas!.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr(), y: (e.clientY - r.top) * dpr() };
  };
  const toMap = (p: { x: number; y: number }) => ({
    x: (p.x - xf.ox) / xf.s / img!.w,
    y: (p.y - xf.oy) / xf.s / img!.h,
  });

  // Метка под точкой canvas (сверху — последняя поставленная).
  function pinAt(p: { x: number; y: number }): Pin | null {
    if (!img) return null;
    const r = PIN_R * dpr();
    for (let i = pins.length - 1; i >= 0; i--) {
      const h = pinHead(pins[i]!, img, xf, r);
      const tip = h.y + r * 1.9;
      if (Math.hypot(p.x - h.x, p.y - h.y) <= r * 1.4 || (Math.abs(p.x - h.x) < r * 0.6 && p.y > h.y && p.y <= tip)) return pins[i]!;
    }
    return null;
  }

  function down(e: PointerEvent) {
    if (!img || !fog || !path || !data || !canvas) return;
    // Недописанное название или заметка сохраняются до того, как выбор метки сменится.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      canvas.setPointerCapture(e.pointerId); // чтобы мазок не обрывался, если мышь ушла за край
    } catch {
      /* бывает у необычных устройств ввода; рисовать можно и без захвата */
    }
    const p = at(e);
    const hit = e.button === 0 && !spaceDown && (ui.tool === 'pin' || ui.tool === 'pan') ? pinAt(p) : null;
    if (hit) {
      ui.pin = hit.id;
      drag = { kind: 'pin', id: hit.id, sx: p.x, sy: p.y, x0: hit.x, y0: hit.y, moved: false };
    } else if (e.button === 0 && !spaceDown && ui.tool === 'pin') {
      const m = toMap(p);
      if (m.x < 0 || m.y < 0 || m.x > 1 || m.y > 1) return;
      const id = crypto.randomUUID();
      dispatch('maps', 'addPin', { path, pin: { id, x: m.x, y: m.y, title: '', note: '', color: ui.pinColor, shown: ui.pinShown } });
      ui.pin = id;
      focusTitle = true;
    } else if (e.button === 1 || spaceDown || ui.tool === 'pan') {
      drag = { kind: 'pan', sx: p.x, sy: p.y, ox: xf.ox, oy: xf.oy };
    } else if (ui.tool === 'reveal' || ui.tool === 'hide') {
      const m = toMap(p);
      const op: Extract<FogOp, { kind: 'brush' }> = {
        mode: ui.tool === 'reveal' ? 'reveal' : 'hide',
        kind: 'brush',
        r: (ui.brush * dpr()) / xf.s / img.w,
        points: [m.x, m.y],
      };
      drag = { kind: 'brush', op, lx: p.x, ly: p.y };
      applyFogOp(fog, { ...op, points: [m.x, m.y] });
    } else if (ui.tool === 'revealRect' || ui.tool === 'hideRect') {
      drag = { kind: 'rect', mode: ui.tool === 'revealRect' ? 'reveal' : 'hide', x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    } else if (ui.tool === 'view') {
      drag = { kind: 'view', sx: p.x, sy: p.y, view0: data.view };
    }
    draw();
  }

  function move(e: PointerEvent) {
    const p = at(e);
    pointer = p;
    if (!drag) overPin = (ui.tool === 'pin' || ui.tool === 'pan') && !spaceDown && !!pinAt(p);
    if (!drag || !img || !fog) return draw();
    if (drag.kind === 'pan') {
      xf = { ...xf, ox: drag.ox + p.x - drag.sx, oy: drag.oy + p.y - drag.sy };
    } else if (drag.kind === 'brush') {
      // Новая точка — не чаще, чем раз в 3 точки экрана: мазок остаётся лёгким.
      if (Math.hypot(p.x - drag.lx, p.y - drag.ly) < 3 * dpr()) return;
      const a = toMap({ x: drag.lx, y: drag.ly });
      const b = toMap(p);
      drag.op.points.push(b.x, b.y);
      applyFogOp(fog, { ...drag.op, points: [a.x, a.y, b.x, b.y] });
      drag = { ...drag, lx: p.x, ly: p.y };
    } else if (drag.kind === 'rect') {
      drag = { ...drag, x1: p.x, y1: p.y };
    } else if (drag.kind === 'pin') {
      // Сдвиг меньше 3 точек — это был щелчок, метка остаётся на месте.
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) < 3 * dpr()) return;
      // Рука двигает карту, метки тащит только их инструмент.
      if (ui.tool !== 'pin') return;
      drag = { ...drag, moved: true };
      const clamp = (v: number) => Math.min(1, Math.max(0, v));
      pinPreview = {
        id: drag.id,
        x: clamp(drag.x0 + (p.x - drag.sx) / xf.s / img.w),
        y: clamp(drag.y0 + (p.y - drag.sy) / xf.s / img.h),
      };
    } else if (drag.kind === 'view') {
      const dx = (p.x - drag.sx) / xf.s / img.w;
      const dy = (p.y - drag.sy) / xf.s / img.h;
      viewPreview = { ...drag.view0, x: drag.view0.x + dx, y: drag.view0.y + dy };
    }
    draw();
  }

  async function up() {
    const d = drag;
    drag = null;
    if (!d || !path || !img) return draw();
    if (d.kind === 'brush') {
      await dispatch('maps', 'addFog', { path, op: d.op });
    } else if (d.kind === 'rect') {
      const a = toMap({ x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1) });
      const b = toMap({ x: Math.max(d.x0, d.x1), y: Math.max(d.y0, d.y1) });
      if (b.x - a.x > 0.002 && b.y - a.y > 0.002) {
        await dispatch('maps', 'addFog', { path, op: { mode: d.mode, kind: 'rect', x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y } });
      }
    } else if (d.kind === 'pin' && pinPreview) {
      const pv = pinPreview;
      await dispatch('maps', 'updatePin', { path, id: pv.id, changes: { x: pv.x, y: pv.y } });
      pinPreview = null;
    } else if (d.kind === 'view' && viewPreview) {
      await dispatch('maps', 'setView', { path, view: viewPreview });
      viewPreview = null;
    }
    draw();
  }

  function wheel(e: WheelEvent) {
    if (!img) return;
    e.preventDefault();
    const p = at(e);
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    const s = Math.min(Math.max(xf.s * k, 0.02), 20);
    const f = s / xf.s;
    xf = { s, ox: p.x - (p.x - xf.ox) * f, oy: p.y - (p.y - xf.oy) * f };
    draw();
  }

  function leave() {
    pointer = null;
    draw();
  }

  // ---- Клавиатура: пробел — рука, ⌘Z — отменить ----
  const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

  function keydown(e: KeyboardEvent) {
    if (typing(e)) return;
    if (e.key === 'Escape' && ui.pin) {
      ui.pin = null;
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && pin && path) {
      e.preventDefault();
      removePin(pin);
    } else if (e.code === 'Space') {
      e.preventDefault();
      spaceDown = true;
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && path) {
      e.preventDefault();
      dispatch('maps', 'undoFog', { path });
    }
  }

  function keyup(e: KeyboardEvent) {
    if (e.code === 'Space') spaceDown = false;
  }

  // canvas появляется, только когда есть карта.
  $effect(() => {
    const c = canvas;
    if (!c) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(c);
    return () => ro.disconnect();
  });

  // ---- Метки ----
  let focusTitle = $state(false);

  function removePin(p: Pin) {
    if (!path) return;
    if ((p.title || p.note) && !confirm(`Удалить метку${p.title ? ` «${p.title}»` : ''}?`)) return;
    if (ui.pin === p.id) ui.pin = null;
    dispatch('maps', 'removePin', { path, id: p.id });
  }

  // Показать метку в середине окна (из списка меток).
  function centerOn(p: Pin) {
    if (!img || !canvas) return;
    ui.pin = p.id;
    xf = { ...xf, ox: canvas.width / 2 - p.x * img.w * xf.s, oy: canvas.height / 2 - p.y * img.h * xf.s };
    draw();
  }

  // ---- Кнопки ----
  function showMineToPlayers() {
    if (!img || !path || !canvas) return;
    const view = {
      x: -xf.ox / xf.s / img.w,
      y: -xf.oy / xf.s / img.h,
      w: canvas.width / xf.s / img.w,
      h: canvas.height / xf.s / img.h,
    };
    dispatch('maps', 'setView', { path, view });
  }

  function resetFog(base: 'hidden' | 'revealed') {
    if (!path) return;
    const what = base === 'hidden' ? 'Скрыть всю карту' : 'Открыть всю карту';
    if (confirm(`${what}? Историю тумана нельзя будет отменить.`)) dispatch('maps', 'resetFog', { path, base });
  }

  const cursor = $derived(
    drag?.kind === 'pin'
      ? ui.tool === 'pin' ? 'grabbing' : 'pointer'
      : overPin
        ? ui.tool === 'pin' ? 'grab' : 'pointer'
        : spaceDown || ui.tool === 'pan'
      ? drag?.kind === 'pan'
        ? 'grabbing'
        : 'grab'
      : ui.tool === 'reveal' || ui.tool === 'hide'
        ? 'none'
        : ui.tool === 'view'
          ? 'move'
          : 'crosshair'
  );
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} />

<div class="editor">
  {#if path && data}
    <header class="toolbar">
      <div class="title" title={path}>{mapName(path)}</div>
      <button class="btn" class:primary={!shown} onclick={() => dispatch('maps', shown ? 'clear' : 'show', { path })}>
        {#if shown}<EyeOff size={14} /> Убрать у игроков{:else}<Eye size={14} /> Показать игрокам{/if}
      </button>

      <div class="sep"></div>
      <div class="seg">
        {#each TOOLS as t (t.id)}
          <button class:active={ui.tool === t.id} title={t.title} onclick={() => (ui.tool = t.id)}><t.icon size={15} /></button>
        {/each}
      </div>
      {#if ui.tool === 'reveal' || ui.tool === 'hide'}
        <div class="brush" title="Размер кисти"><Slider value={ui.brush} min={8} max={160} step={1} oninput={(v) => (ui.brush = v)} /></div>
      {/if}
      {#if ui.tool === 'pin'}
        <button
          class="btn"
          title={ui.pinShown ? 'Новые метки игроки видят сразу' : 'Новые метки видны только вам, показать игрокам — в метке'}
          onclick={() => (ui.pinShown = !ui.pinShown)}
        >
          {#if ui.pinShown}<Eye size={14} /> Новые — игрокам{:else}<EyeOff size={14} /> Новые — только мне{/if}
        </button>
      {/if}
      <button class="icon-btn" title="Отменить (⌘Z)" disabled={!data.fog.ops.length} onclick={() => dispatch('maps', 'undoFog', { path })}>
        <Undo2 size={15} />
      </button>
      <button class="btn" onclick={() => resetFog('revealed')}>Открыть всё</button>
      <button class="btn" onclick={() => resetFog('hidden')}>Скрыть всё</button>

      <div class="sep"></div>
      <button class="btn" title="Игроки видят всю карту" onclick={() => dispatch('maps', 'setView', { path, view: FULL_VIEW })}>
        <Maximize size={14} /> Вся карта
      </button>
      <button class="btn" title="Игроки видят то же, что сейчас видно здесь" onclick={showMineToPlayers}>
        <ScanEye size={14} /> Как у меня
      </button>

      <div class="sep"></div>
      <button
        class="icon-btn"
        class:active={data.grid.on}
        title="Сетка"
        onclick={() => dispatch('maps', 'setGrid', { path, grid: { on: !data.grid.on } })}
      >
        <Grid3x3 size={15} />
      </button>
      {#if data.grid.on}
        <div class="cells" title="Клеток по ширине карты">
          <Slider value={data.grid.cells} min={5} max={100} step={0.5} onchange={(v) => dispatch('maps', 'setGrid', { path, grid: { cells: v } })} />
          <span class="faint">{data.grid.cells}</span>
        </div>
      {/if}

      <div class="sep"></div>
      <button class="btn" class:on={ui.pinList} title="Список меток на этой карте" onclick={() => (ui.pinList = !ui.pinList)}>
        <MapPin size={14} /> Метки{#if pins.length}<span class="faint">&nbsp;{pins.length}</span>{/if}
      </button>
    </header>

    <div class="stage">
      <canvas
        bind:this={canvas}
        style:cursor
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={up}
        onpointerleave={leave}
        onwheel={wheel}
      ></canvas>
      {#if !img}<div class="loading faint">Загрузка карты…</div>{/if}
      {#if pin || ui.pinList}
        <PinPanel {path} {pins} {pin} bind:focusTitle onpick={centerOn} onremove={removePin} />
      {/if}
    </div>
  {:else}
    <div class="empty faint">
      <p>Карт пока нет.</p>
      <p>
        Положите картинки в папку <RoleFolderNames role="maps" /> — в приключении или главе. Любую другую картинку
        можно открыть как карту кнопкой на её карточке.
      </p>
    </div>
  {/if}
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .title {
    max-width: 220px;
    margin-right: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .sep {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--border);
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
    width: 28px;
    height: 24px;
    border: 0;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg button:hover {
    color: var(--text-normal);
  }
  .seg button.active {
    background: var(--accent);
    color: #fff;
  }
  .brush {
    width: 100px;
  }
  .cells {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 140px;
    font-size: 12px;
  }
  .btn.on {
    border-color: var(--accent);
    color: var(--accent);
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    background: #111;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
  }
  .loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .empty {
    max-width: 460px;
    margin: 60px auto;
    text-align: center;
  }
</style>
