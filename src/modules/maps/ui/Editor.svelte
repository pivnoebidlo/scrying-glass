<!-- Вкладка «Карты»: редактор мастера. Туман полупрозрачный, рамкой — то, что видят игроки. -->
<script lang="ts">
  import { hint } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { untrack } from 'svelte';
  import {
    Brush, CircleUserRound, Cloud, Eraser, Eye, EyeOff, Grid2x2X, Grid3x3, Hand, Hexagon, List, Move3d, UsersRound, MapPin, MapPinPlus, Maximize, Move, ScanEye, Shield, SquareDashed, SquareDashedMousePointer, Swords, Undo2,
  } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { playerDisplay } from '../../../renderer/lib/nav';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { vaultUrl } from '../../../shared/vault';
  import { dataOf } from '../data';
  import { mapGroups } from '../library';
  import {
    applyFogOp, buildFog, drawMap, drawPins, fitCanvas, fogCanvas, loadImage, pinHead, visibleArea, type LoadedImage, type Xf,
  } from '../render';
  import { FULL_VIEW, GRID_STYLE, type FogOp, type MapData, type MapPin as Pin, type MapToken, type MapView } from '../types';
  import { drawTokens, snap, tokenCell, tokenViews, type TokenView } from '../tokens';
  import { periodOf, shapeOf, type GridShape } from '../grid';
  import type { CardSummary } from '../../../shared/cards';
  import { cardAsset } from '../../../shared/cards';
  import { visibleIn } from '../../../shared/adventures';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { caption, imageGroups } from '../../portraits/library';
  import PinPanel from './PinPanel.svelte';
  import TokenPanel from './TokenPanel.svelte';
  import { ui, type Tab, type Tool } from './ui.svelte';

  let { ms, app }: ModuleProps<'maps'> = $props();

  const groups = $derived(app.vault.tree ? mapGroups(app.vault.tree, app.vault.name, ms, app.adventures) : []);
  const known = $derived(new Set(groups.flatMap((g) => g.items)));
  // Открыта выбранная карта, иначе та, что у игроков, иначе первая.
  const path = $derived(
    ui.selected && known.has(ui.selected) ? ui.selected : (ms.current ?? groups[0]?.items[0] ?? null)
  );
  const data = $derived(path ? dataOf(ms, path) : null);
  const shown = $derived(!!path && ms.current === path);

  type ToolDef = { id: Tool; icon: typeof Hand };
  const PAN: ToolDef = { id: 'pan', icon: Hand };
  // The sections of the top row and the tools of each (the hand in all of them).
  const TABS: { id: Tab; icon: typeof Hand }[] = [
    { id: 'fog', icon: Cloud },
    { id: 'view', icon: ScanEye },
    { id: 'grid', icon: Grid3x3 },
    { id: 'tokens', icon: UsersRound },
    { id: 'pins', icon: MapPin },
  ];
  const TAB_TOOLS: Record<Tab, ToolDef[]> = {
    fog: [
      PAN,
      { id: 'reveal', icon: Brush },
      { id: 'hide', icon: Eraser },
      { id: 'revealRect', icon: SquareDashedMousePointer },
      { id: 'hideRect', icon: SquareDashed },
    ],
    view: [PAN, { id: 'view', icon: Move }],
    grid: [PAN, { id: 'grid', icon: Move3d }],
    tokens: [PAN, { id: 'token', icon: CircleUserRound }],
    pins: [PAN, { id: 'pin', icon: MapPinPlus }],
  };
  // The tool a section starts with; the fog remembers the last one.
  let fogTool: Tool = 'reveal';
  const START: Record<Exclude<Tab, 'fog'>, Tool> = { view: 'view', grid: 'pan', tokens: 'token', pins: 'pin' };

  function openTab(tab: Tab) {
    if (ui.tab === 'fog' && ui.tool !== 'pan') fogTool = ui.tool;
    ui.tab = tab;
    ui.tool = tab === 'fog' ? fogTool : START[tab];
    if (tab === 'tokens') ui.tokenList = true;
  }

  // Метки этой карты; выбранная — та, что открыта в панели.
  const pins = $derived(data?.pins ?? []);
  const pin = $derived(pins.find((p) => p.id === ui.pin) ?? null);
  // Жетоны с состоянием участников боя (ход, ранения, побеждён).
  const tokens = $derived(data ? tokenViews(data.tokens, app.initiative) : []);

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
    | { kind: 'resize'; handle: Handle; r0: Rect }
    | { kind: 'pin'; id: string; sx: number; sy: number; x0: number; y0: number; moved: boolean }
    | { kind: 'grid'; sx: number; sy: number; ox: number; oy: number }
    | { kind: 'token'; id: string; sx: number; sy: number; x0: number; y0: number; moved: boolean };
  let drag = $state.raw<Drag | null>(null);
  // Метка, которую сейчас тащат: её новое место до отпускания мыши.
  let pinPreview: { id: string; x: number; y: number } | null = null;
  let tokenPreview: { id: string; x: number; y: number } | null = null;
  let hoverToken: string | null = null;
  // Сдвиг сетки, пока его тащат.
  let gridPreview: { ox: number; oy: number } | null = null;
  let overPin = $state(false);
  const PIN_R = 11;

  const dpr = () => window.devicePixelRatio || 1;

  // Zoom and pan redraw once a frame, however many events come in it.
  let frameReq = 0;
  function redraw() {
    if (frameReq) return;
    frameReq = requestAnimationFrame(() => {
      frameReq = 0;
      draw();
    });
  }

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
    void data?.tokenScale;
    void ui.tokenScale;
    void ui.pin;
    void tokens;
    void ui.token;
    void ui.tool;
    untrack(draw);
  });

  // Другая карта — метка с прошлой не выбрана.
  $effect(() => {
    void path;
    untrack(() => {
      ui.pin = null;
      ui.token = null;
      ui.follow = false;
    });
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
    const tv = tokenPreview;
    const i = img;
    drawMap(ctx, img, fog, xf, {
      fogAlpha: 0.6,
      fogBlur: 0,
      grid: gridPreview ? { ...data.grid, ...gridPreview } : data.grid,
      underFog: (c) =>
        drawTokens(c, tv ? tokens.map((t) => (t.id === tv.id ? { ...t, x: tv.x, y: tv.y } : t)) : tokens, i, xf, {
          cell: tokenCell(live(data), i.w),
          onload: draw,
          master: { selected: ui.token, hover: hoverToken, font: `500 ${11 * dpr()}px -apple-system, system-ui, sans-serif` },
        }),
    });
    const pv = pinPreview;
    drawPins(ctx, pv ? pins.map((p) => (p.id === pv.id ? { ...p, x: pv.x, y: pv.y } : p)) : pins, img, xf, {
      r: PIN_R * dpr(),
      font: `600 ${12 * dpr()}px -apple-system, system-ui, sans-serif`,
      master: { selected: ui.pin },
    });

    // Что видят игроки: обзор, вписанный в экран с его пропорциями.
    const fr = frame()!;
    const [rx, ry, rw, rh] = [fr.x, fr.y, fr.w, fr.h];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineWidth = 2 * dpr();
    ctx.strokeStyle = shown ? '#8a5cf5' : 'rgba(138, 92, 245, 0.55)';
    ctx.setLineDash(shown ? [] : [8 * dpr(), 6 * dpr()]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.setLineDash([]);
    ctx.font = `${12 * dpr()}px -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(shown ? t('maps.playersSee') : t('maps.playersWillSee'), rx + 6 * dpr(), ry - 6 * dpr());
    // The frame tool: handles to resize it.
    if (ui.tool === 'view') {
      const k = 4 * dpr();
      for (const [hx, hy] of Object.values(handlePoints(fr))) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(hx - k, hy - k, k * 2, k * 2);
        ctx.strokeRect(hx - k, hy - k, k * 2, k * 2);
      }
    }

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
    if (ui.follow) followSoon();
  }

  // ---- The players' frame ----
  type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  type Rect = { x: number; y: number; w: number; h: number };
  // The frame players see, in canvas pixels (the view fitted to their screen's proportions).
  function frame(view?: MapView): Rect | null {
    if (!img || !data) return null;
    const d = playerDisplay();
    const v = visibleArea(view ?? viewPreview ?? data.view, img, d ? d.width / d.height : 16 / 9);
    return { x: v.x * img.w * xf.s + xf.ox, y: v.y * img.h * xf.s + xf.oy, w: v.w * img.w * xf.s, h: v.h * img.h * xf.s };
  }
  function handlePoints(r: Rect): Record<Handle, [number, number]> {
    const [l, c, rt, t, m, b] = [r.x, r.x + r.w / 2, r.x + r.w, r.y, r.y + r.h / 2, r.y + r.h];
    return { nw: [l, t], n: [c, t], ne: [rt, t], e: [rt, m], se: [rt, b], s: [c, b], sw: [l, b], w: [l, m] };
  }
  function handleAt(p: { x: number; y: number }): Handle | null {
    const r = frame();
    if (!r) return null;
    const near = 8 * dpr();
    for (const [h, [hx, hy]] of Object.entries(handlePoints(r)) as [Handle, [number, number]][]) {
      if (Math.abs(p.x - hx) <= near && Math.abs(p.y - hy) <= near) return h;
    }
    // Anywhere along an edge, not only at its middle.
    const inX = p.x > r.x && p.x < r.x + r.w;
    const inY = p.y > r.y && p.y < r.y + r.h;
    if (inX && Math.abs(p.y - r.y) <= near) return 'n';
    if (inX && Math.abs(p.y - r.y - r.h) <= near) return 's';
    if (inY && Math.abs(p.x - r.x) <= near) return 'w';
    if (inY && Math.abs(p.x - r.x - r.w) <= near) return 'e';
    return null;
  }
  // The frame resized by a handle: the opposite side (or corner) stays, the proportions stay the players' screen's;
  // an edge grows the other way about the middle.
  function resized(r0: Rect, h: Handle, p: { x: number; y: number }): Rect {
    const a = r0.w / r0.h;
    const min = 24 * dpr();
    const west = h.includes('w');
    const north = h.includes('n');
    const ax = west ? r0.x + r0.w : r0.x;
    const ay = north ? r0.y + r0.h : r0.y;
    let w: number;
    if (h === 'n' || h === 's') w = Math.abs(p.y - ay) * a;
    else if (h === 'e' || h === 'w') w = Math.abs(p.x - ax);
    else w = Math.max(Math.abs(p.x - ax), Math.abs(p.y - ay) * a);
    w = Math.max(w, min * a);
    const hh = w / a;
    const x = h === 'n' || h === 's' ? r0.x + r0.w / 2 - w / 2 : west ? ax - w : ax;
    const y = h === 'e' || h === 'w' ? r0.y + r0.h / 2 - hh / 2 : north ? ay - hh : ay;
    return { x, y, w, h: hh };
  }
  const toView = (r: Rect): MapView => ({ x: (r.x - xf.ox) / xf.s / img!.w, y: (r.y - xf.oy) / xf.s / img!.h, w: r.w / xf.s / img!.w, h: r.h / xf.s / img!.h });
  const HANDLE_CURSOR: Record<Handle, string> = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };
  let hoverHandle = $state<Handle | null>(null);

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

  // Жетон под точкой canvas (сверху — маленькие, их рисуют последними).
  function tokenAt(p: { x: number; y: number }): TokenView | null {
    if (!img || !data) return null;
    const cell = tokenCell(live(data), img.w) * xf.s;
    let best: TokenView | null = null;
    for (const t of tokens) {
      const d = Math.hypot(p.x - (t.x * img.w * xf.s + xf.ox), p.y - (t.y * img.h * xf.s + xf.oy));
      if (d <= (t.size * cell) / 2 && (!best || t.size <= best.size)) best = t;
    }
    return best;
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
    const tok = !hit && e.button === 0 && !spaceDown && (ui.tool === 'token' || ui.tool === 'pan') ? tokenAt(p) : null;
    if (tok) {
      ui.token = tok.id;
      ui.pin = null;
      ui.tokenList = true;
      ui.tab = 'tokens';
      drag = { kind: 'token', id: tok.id, sx: p.x, sy: p.y, x0: tok.x, y0: tok.y, moved: false };
    } else if (hit) {
      ui.token = null;
      ui.pin = hit.id;
      ui.tab = 'pins';
      drag = { kind: 'pin', id: hit.id, sx: p.x, sy: p.y, x0: hit.x, y0: hit.y, moved: false };
    } else if (e.button === 0 && !spaceDown && ui.tool === 'pin') {
      const m = toMap(p);
      if (m.x < 0 || m.y < 0 || m.x > 1 || m.y > 1) return;
      const id = crypto.randomUUID();
      dispatch('maps', 'addPin', { path, pin: { id, x: m.x, y: m.y, title: '', note: '', color: ui.pinColor, icon: ui.pinIcon, shown: ui.pinShown } });
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
      ui.follow = false;
      const h = handleAt(p);
      const r0 = frame();
      drag = h && r0 ? { kind: 'resize', handle: h, r0 } : { kind: 'view', sx: p.x, sy: p.y, view0: data.view };
    } else if (ui.tool === 'grid') {
      drag = { kind: 'grid', sx: p.x, sy: p.y, ox: data.grid.ox ?? 0, oy: data.grid.oy ?? 0 };
    }
    draw();
  }

  function move(e: PointerEvent) {
    const p = at(e);
    pointer = p;
    hoverToken = drag ? null : (tokenAt(p)?.id ?? null);
    if (!drag) hoverHandle = ui.tool === 'view' && !spaceDown ? handleAt(p) : null;
    if (!drag)
      overPin =
        !spaceDown &&
        (((ui.tool === 'pin' || ui.tool === 'pan') && !!pinAt(p)) || ((ui.tool === 'token' || ui.tool === 'pan') && !!tokenAt(p)));
    if (!drag || !img || !fog) return draw();
    if (drag.kind === 'pan') {
      xf = { ...xf, ox: drag.ox + p.x - drag.sx, oy: drag.oy + p.y - drag.sy };
      return redraw();
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
    } else if (drag.kind === 'token') {
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) < 3 * dpr()) return;
      if (ui.tool !== 'token') return;
      drag = { ...drag, moved: true };
      tokenPreview = { id: drag.id, x: drag.x0 + (p.x - drag.sx) / xf.s / img.w, y: drag.y0 + (p.y - drag.sy) / xf.s / img.h };
    } else if (drag.kind === 'grid' && data) {
      // The offset is a fraction of the pattern's period (for hexes it is longer than a cell along one axis).
      const { px, py } = periodOf(data.grid, img.w);
      const frac = (v: number) => ((v % 1) + 1) % 1;
      gridPreview = { ox: frac(drag.ox + (p.x - drag.sx) / (px * xf.s)), oy: frac(drag.oy + (p.y - drag.sy) / (py * xf.s)) };
    } else if (drag.kind === 'resize') {
      viewPreview = toView(resized(drag.r0, drag.handle, p));
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
    } else if (d.kind === 'token' && tokenPreview && data) {
      const tv = tokenPreview;
      const t = data.tokens.find((x) => x.id === tv.id);
      const at = data.grid.on && t ? snap(tv.x, tv.y, t.size, data.grid, img) : tv;
      await dispatch('maps', 'updateToken', { path, id: tv.id, changes: { x: at.x, y: at.y } });
      tokenPreview = null;
    } else if (d.kind === 'grid' && gridPreview) {
      await dispatch('maps', 'setGrid', { path, grid: gridPreview });
      gridPreview = null;
    } else if ((d.kind === 'view' || d.kind === 'resize') && viewPreview) {
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
    redraw();
  }

  function leave() {
    pointer = null;
    hoverToken = null;
    draw();
  }

  // ---- Клавиатура: пробел — рука, ⌘Z — отменить ----
  const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

  function keydown(e: KeyboardEvent) {
    if (typing(e)) return;
    if (e.key === 'Escape' && (ui.pin || ui.token)) {
      ui.pin = null;
      ui.token = null;
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && pin && path) {
      e.preventDefault();
      removePin(pin);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && ui.token && path) {
      e.preventDefault();
      dispatch('maps', 'removeToken', { path, id: ui.token });
      ui.token = null;
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
    if ((p.title || p.note) && !confirm(t('maps.confirmDeletePin', { name: p.title ? ` ${t('common.quote', { text: p.title })}` : '' }))) return;
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

  // ---- Жетоны ----
  // Масштаб жетонов с учётом ползунка, который сейчас тянут.
  const live = (d: MapData): MapData => (ui.tokenScale === null ? d : { ...d, tokenScale: ui.tokenScale });
  type NewToken = Omit<MapToken, 'id' | 'x' | 'y'>;

  // Поставить жетоны в середине того, что видят игроки (сначала партия), на свободные места: по кольцам вокруг
  // середины, занятые жетонами клетки пропускаются. С сеткой — по клеткам.
  function placeTokens(list: NewToken[]) {
    if (!path || !data || !img || !list.length) return;
    const d = data;
    const im = img;
    const sorted = [...list].sort((a, b) => Number(b.side === 'party') - Number(a.side === 'party'));
    const cell = tokenCell(live(d), im.w);
    const step = cell * 1.2;
    const cx = (d.view.x + d.view.w / 2) * im.w;
    const cy = (d.view.y + d.view.h / 2) * im.h;
    const taken = d.tokens.map((t) => ({ x: t.x * im.w, y: t.y * im.h, r: (t.size * cell) / 2 }));
    const free = (x: number, y: number, r: number) => taken.every((t) => Math.hypot(t.x - x, t.y - y) >= (t.r + r) * 0.95);
    const tokens: MapToken[] = [];
    for (const t of sorted) {
      const r = (t.size * cell) / 2;
      let at = { x: cx / im.w, y: cy / im.h };
      search: for (let ring = 0; ring < 40; ring++) {
        for (let dy = -ring; dy <= ring; dy++) {
          for (let dx = -ring; dx <= ring; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
            const p = { x: (cx + dx * step * t.size) / im.w, y: (cy + dy * step * t.size) / im.h };
            const q = d.grid.on ? snap(p.x, p.y, t.size, d.grid, im) : p;
            if (q.x < 0 || q.y < 0 || q.x > 1 || q.y > 1) continue;
            if (free(q.x * im.w, q.y * im.h, r)) {
              at = q;
              break search;
            }
          }
        }
      }
      taken.push({ x: at.x * im.w, y: at.y * im.h, r });
      tokens.push({ id: crypto.randomUUID(), ...at, ...t });
    }
    dispatch('maps', 'addTokens', { path, tokens });
  }

  // Участники текущего боя, которых ещё нет на этой карте. Жетон, уже стоящий без боя с тем же именем (например,
  // герой, поставленный «Партией»), не дублируется, а привязывается к участнику; сначала — с тем же портретом.
  async function addFight() {
    if (!data || !path) return;
    const on = new Set(data.tokens.map((t) => t.combatant));
    const loose = data.tokens.filter((t) => !t.combatant);
    const fresh: NewToken[] = [];
    for (const c of app.initiative.combatants) {
      if (on.has(c.id)) continue;
      const same = loose.findIndex((t) => t.name === c.name && t.portrait === c.portrait);
      const i = same >= 0 ? same : loose.findIndex((t) => t.name === c.name);
      if (i >= 0) {
        await dispatch('maps', 'updateToken', { path, id: loose[i]!.id, changes: { combatant: c.id } });
        loose.splice(i, 1);
      } else fresh.push({ size: 1, name: c.name, portrait: c.portrait, side: c.side, hidden: false, combatant: c.id });
    }
    placeTokens(fresh);
  }

  // Жетон по карточке (NPC, монстр, герой) — без боя.
  function addCard(c: CardSummary) {
    placeTokens([{ size: 1, name: c.name, portrait: c.portrait ? cardAsset(c.ref.scope, c.portrait) : null, side: c.side, hidden: false }]);
  }

  // Партия текущего приключения: карточки персонажей игроков и портреты из папок партии, кого ещё нет на карте.
  async function addParty() {
    if (!data) return;
    await connectCards();
    const has = (name: string, portrait: string | null) => data!.tokens.some((t) => t.name === name && t.portrait === portrait);
    const list: NewToken[] = [];
    for (const c of bestiary.all) {
      if (c.kind !== 'character' || c.ref.scope !== 'vault' || c.folder === undefined || !visibleIn(app.adventures, c.folder)) continue;
      const portrait = c.portrait ? cardAsset(c.ref.scope, c.portrait) : null;
      if (!has(c.name, portrait)) list.push({ size: 1, name: c.name, portrait, side: 'party', hidden: false });
    }
    const tree = app.vault.tree;
    for (const g of tree ? imageGroups(tree, app.vault.name, 'party', app.adventures) : []) {
      for (const f of g.items) {
        if (bestiary.cardFor(f.path)) continue;
        const name = caption(app.portraits, f.path);
        if (!has(name, f.path)) list.push({ size: 1, name, portrait: f.path, side: 'party', hidden: false });
      }
    }
    placeTokens(list);
    return list.length;
  }

  // ---- Кнопки ----
  // What the master sees here, as the players' view.
  function mine(): MapView | null {
    if (!img || !canvas) return null;
    return { x: -xf.ox / xf.s / img.w, y: -xf.oy / xf.s / img.h, w: canvas.width / xf.s / img.w, h: canvas.height / xf.s / img.h };
  }

  // «Like mine» held down: every move and zoom here goes to the players once it settles (sending each step would
  // send the whole state to every window many times a second).
  let followTimer: ReturnType<typeof setTimeout> | null = null;
  function followSoon() {
    if (followTimer) clearTimeout(followTimer);
    followTimer = setTimeout(() => {
      followTimer = null;
      const v = mine();
      const cur = data?.view;
      if (!ui.follow || !v || !path || !cur) return;
      const same = Math.abs(v.x - cur.x) + Math.abs(v.y - cur.y) + Math.abs(v.w - cur.w) + Math.abs(v.h - cur.h) < 1e-4;
      if (!same) dispatch('maps', 'setView', { path, view: v });
    }, 150);
  }

  // The grid's shape, or none (the grid off).
  function setShape(shape: GridShape | null) {
    if (!path) return;
    if (!shape && ui.tool === 'grid') ui.tool = 'pan';
    dispatch('maps', 'setGrid', { path, grid: shape ? { on: true, shape } : { on: false } });
  }

  function toggleFollow() {
    ui.follow = !ui.follow;
    // The frame tool would end following on the first drag: the hand moves the map.
    if (ui.follow) {
      ui.tool = 'pan';
      followSoon();
    }
  }

  // Tokens: how many of the fight are not on the map, the size slider, «Party» with nothing to add.
  const missing = $derived(data ? app.initiative.combatants.filter((c) => !data.tokens.some((t) => t.combatant === c.id)).length : 0);
  const shownScale = $derived(ui.tokenScale ?? data?.tokenScale ?? 1);
  let partyStatus = $state('');
  async function partyClick() {
    const n = await addParty();
    partyStatus = n ? '' : t('maps.allParty');
    if (partyStatus) setTimeout(() => (partyStatus = ''), 3000);
  }

  function resetFog(base: 'hidden' | 'revealed') {
    if (!path) return;
    const what = base === 'hidden' ? t('maps.hideAll') : t('maps.revealAllQ');
    if (confirm(t('maps.resetConfirm', { what }))) dispatch('maps', 'resetFog', { path, base });
  }

  const cursor = $derived(
    drag?.kind === 'resize'
      ? HANDLE_CURSOR[drag.handle]
      : hoverHandle && !drag
        ? HANDLE_CURSOR[hoverHandle]
        : drag?.kind === 'pin' || drag?.kind === 'token'
      ? ui.tool === 'pin' || ui.tool === 'token' ? 'grabbing' : 'pointer'
      : overPin
        ? ui.tool === 'pin' || ui.tool === 'token' ? 'grab' : 'pointer'
        : spaceDown || ui.tool === 'pan'
      ? drag?.kind === 'pan'
        ? 'grabbing'
        : 'grab'
      : ui.tool === 'reveal' || ui.tool === 'hide'
        ? 'none'
        : ui.tool === 'view' || ui.tool === 'grid'
          ? 'move'
          : 'crosshair'
  );
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} />

<div class="editor">
  {#if path && data}
    <header class="toolbar">
      <div class="tabs-row">
        <nav class="tabs">
          {#each TABS as tab (tab.id)}
            <button class:active={ui.tab === tab.id} onclick={() => openTab(tab.id)}>
              <tab.icon size={14} /> {t(`maps.tab.${tab.id}`)}
              {#if tab.id === 'tokens' && data.tokens.length}<span class="count">{data.tokens.length}</span>{/if}
              {#if tab.id === 'pins' && pins.length}<span class="count">{pins.length}</span>{/if}
            </button>
          {/each}
        </nav>
        <button class="btn show" class:primary={!shown} onclick={() => dispatch('maps', shown ? 'clear' : 'show', { path })}>
          {#if shown}<EyeOff size={14} /> {t('maps.removeFromPlayers')}{:else}<Eye size={14} /> {t('maps.showToPlayers')}{/if}
        </button>
      </div>

      <div class="options">
        <div class="seg">
          {#each TAB_TOOLS[ui.tab] as tool (tool.id)}
            <button class:active={ui.tool === tool.id} disabled={tool.id === 'grid' && !data.grid.on} title={t(`maps.tool.${tool.id}`)} onclick={() => (ui.tool = tool.id)}><tool.icon size={15} /></button>
          {/each}
        </div>

        {#if ui.tab === 'fog'}
          {#if ui.tool === 'reveal' || ui.tool === 'hide'}
            <label class="opt" title={t('maps.brush')}><span>{t('maps.brushShort')}</span><span class="slider"><Slider value={ui.brush} min={8} max={160} step={1} oninput={(v) => (ui.brush = v)} /></span></label>
          {/if}
          <div class="sep"></div>
          <button class="icon-btn" title={hint(t('maps.undo'), 'mapUndo')} disabled={!data.fog.ops.length} onclick={() => dispatch('maps', 'undoFog', { path })}>
            <Undo2 size={15} />
          </button>
          <button class="btn" onclick={() => resetFog('revealed')}>{t('maps.revealAll')}</button>
          <button class="btn" onclick={() => resetFog('hidden')}>{t('maps.hideAllBtn')}</button>
        {:else if ui.tab === 'view'}
          <div class="sep"></div>
          <button class="btn" title={t('maps.wholeMapHint')} onclick={() => { ui.follow = false; dispatch('maps', 'setView', { path, view: FULL_VIEW }); }}>
            <Maximize size={14} /> {t('maps.wholeMap')}
          </button>
          <button class="btn" class:on={ui.follow} aria-pressed={ui.follow} title={t('maps.likeMineHint')} onclick={toggleFollow}>
            <ScanEye size={14} /> {t('maps.likeMine')}
          </button>
          {#if ui.follow}<span class="faint note">{t('maps.followOn')}</span>{/if}
        {:else if ui.tab === 'grid'}
          <div class="seg">
            <button class:active={!data.grid.on} title={t('maps.gridOff')} onclick={() => setShape(null)}><Grid2x2X size={15} /></button>
            <button class:active={data.grid.on && shapeOf(data.grid) === 'square'} title={t('maps.shape.square')} onclick={() => setShape('square')}><Grid3x3 size={15} /></button>
            <button class:active={data.grid.on && shapeOf(data.grid) === 'hex-pointy'} title={t('maps.shape.hex-pointy')} onclick={() => setShape('hex-pointy')}><Hexagon size={15} /></button>
            <button class:active={data.grid.on && shapeOf(data.grid) === 'hex-flat'} title={t('maps.shape.hex-flat')} onclick={() => setShape('hex-flat')}><span class="flat"><Hexagon size={15} /></span></button>
          </div>
          {#if data.grid.on}
            <div class="sep"></div>
            <label class="opt" title={t('maps.cellsHint')}>
              <span>{t('maps.cells')}</span>
              <span class="slider wide"><Slider value={data.grid.cells} min={5} max={100} step={0.5} onchange={(v) => dispatch('maps', 'setGrid', { path, grid: { cells: v } })} /></span>
              <input
                type="number"
                min="2"
                max="200"
                step="0.1"
                value={data.grid.cells}
                onchange={(e) => {
                  const v = Number(e.currentTarget.value);
                  if (v > 0) dispatch('maps', 'setGrid', { path, grid: { cells: v } });
                }}
              />
            </label>
            <div class="sep"></div>
            <label class="opt" title={t('maps.gridWidth')}>
              <span>{t('maps.gridWidthShort')}</span>
              <span class="slider"><Slider value={data.grid.width ?? GRID_STYLE.width} min={0.5} max={8} step={0.5} onchange={(v) => dispatch('maps', 'setGrid', { path, grid: { width: v } })} /></span>
            </label>
            <label class="opt" title={t('maps.gridAlpha')}>
              <span>{t('maps.gridAlphaShort')}</span>
              <span class="slider"><Slider value={data.grid.alpha ?? GRID_STYLE.alpha} min={0.05} max={1} step={0.05} onchange={(v) => dispatch('maps', 'setGrid', { path, grid: { alpha: v } })} /></span>
            </label>
            <label class="opt color" title={t('maps.gridColor')}>
              <input type="color" value={data.grid.color ?? GRID_STYLE.color} onchange={(e) => dispatch('maps', 'setGrid', { path, grid: { color: e.currentTarget.value } })} />
            </label>
          {/if}
        {:else if ui.tab === 'tokens'}
          <div class="sep"></div>
          <button class="btn" disabled={!missing} title={t('maps.fromFightHint')} onclick={addFight}>
            <Swords size={14} /> {t('maps.fromFight')}{missing ? ` (${missing})` : ''}
          </button>
          <button class="btn" title={t('maps.partyHint')} onclick={partyClick}><Shield size={14} /> {t('maps.party')}</button>
          {#if partyStatus}<span class="faint note">{partyStatus}</span>{/if}
          <div class="sep"></div>
          <label class="opt" title={t('maps.scaleHint')}>
            <span>{t('maps.size')}</span>
            <span class="slider">
              <Slider value={shownScale} min={0.25} max={4} step={0.05} oninput={(v) => (ui.tokenScale = v)} onchange={(v) => dispatch('maps', 'setTokenScale', { path, value: v }).then(() => (ui.tokenScale = null))} />
            </span>
            <span class="faint pct">{Math.round(shownScale * 100)}%</span>
          </label>
          <div class="sep"></div>
          <button class="btn" class:on={ui.tokenList} aria-pressed={ui.tokenList} title={t('maps.tokensHint')} onclick={() => (ui.tokenList = !ui.tokenList)}>
            <List size={14} /> {t('maps.list')}
          </button>
        {:else if ui.tab === 'pins'}
          <div class="sep"></div>
          <button
            class="btn"
            title={ui.pinShown ? t('maps.newPinsShownHint') : t('maps.newPinsHiddenHint')}
            onclick={() => (ui.pinShown = !ui.pinShown)}
          >
            {#if ui.pinShown}<Eye size={14} /> {t('maps.newToPlayers')}{:else}<EyeOff size={14} /> {t('maps.newOnlyMe')}{/if}
          </button>
          <div class="sep"></div>
          <button class="btn" class:on={ui.pinList} aria-pressed={ui.pinList} title={t('maps.pinsHint')} onclick={() => (ui.pinList = !ui.pinList)}>
            <List size={14} /> {t('maps.list')}
          </button>
        {/if}
      </div>
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
      {#if !img}<div class="loading faint">{t('maps.loading')}</div>{/if}
      {#if ui.tab === 'tokens' && ui.tokenList}
        <TokenPanel {path} {tokens} {data} onaddcard={addCard} />
      {:else if ui.tab === 'pins' && (pin || ui.pinList)}
        <PinPanel {path} {pins} {pin} bind:focusTitle onpick={centerOn} onremove={removePin} />
      {/if}
    </div>
  {:else}
    <div class="empty faint">
      <p>{t('maps.none')}</p>
      <p>
        {t('maps.putPictures')} <RoleFolderNames role="maps" /> {t('maps.inAdventureAny')}
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
    border-bottom: 1px solid var(--border);
  }
  .tabs-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 0;
  }
  .tabs {
    display: flex;
    flex: 1;
    gap: 2px;
    min-width: 0;
    overflow-x: auto;
  }
  .tabs button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px 7px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--text-muted);
    font: inherit;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
  }
  .tabs button:hover {
    color: var(--text-normal);
  }
  .tabs button.active {
    border-bottom-color: var(--accent);
    color: var(--text-normal);
  }
  .count {
    color: var(--text-faint);
    font-size: 11px;
  }
  .show {
    margin-bottom: 6px;
  }
  /* One row: the sliders give way when it is narrow. */
  .options {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    overflow: hidden;
    gap: 6px;
    min-height: 40px;
    padding: 6px 12px;
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
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
  .flat {
    display: grid;
    transform: rotate(90deg);
  }
  .seg button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .seg button.active {
    background: var(--accent);
    color: var(--on-accent);
  }
  .opt {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
  }
  .opt .slider {
    flex: 0 1 90px;
    min-width: 36px;
  }
  .opt .slider.wide {
    flex-basis: 130px;
  }
  .options > .btn,
  .options > .seg,
  .options > .icon-btn {
    flex-shrink: 0;
  }
  .opt input[type='number'] {
    width: 56px;
    padding: 2px 4px;
  }
  .opt.color input {
    width: 28px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
  }
  .pct {
    width: 36px;
    text-align: right;
  }
  .note {
    font-size: 12px;
  }
  .btn.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
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
