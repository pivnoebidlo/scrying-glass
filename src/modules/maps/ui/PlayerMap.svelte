<!-- Одна карта на экране игроков: туман непрозрачный, при смене обзора вид плавно переезжает. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { vaultUrl } from '../../../shared/vault';
  import { buildFog, drawMap, drawPins, fitCanvas, fitView, fogCanvas, loadImage, type LoadedImage } from '../render';
  import type { MapData, MapView } from '../types';

  let { path, data, pinSize = 1 }: { path: string; data: MapData; pinSize?: number } = $props();

  let canvas: HTMLCanvasElement;
  let img = $state.raw<LoadedImage | null>(null);
  let fog: HTMLCanvasElement | null = null;
  // Обзор, который сейчас на экране (во время перехода — промежуточный).
  let shown: MapView | null = null;
  let anim = 0;
  let finish: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const src = vaultUrl(path);
    let cancelled = false;
    loadImage(src).then((i) => !cancelled && (img = i), () => {});
    return () => (cancelled = true);
  });

  function draw() {
    if (!img || !fog || !shown || !canvas) return;
    fitCanvas(canvas);
    const ctx = canvas.getContext('2d')!;
    const xf = fitView(shown, img, canvas.width, canvas.height);
    drawMap(ctx, img, fog, xf, {
      fogAlpha: 1,
      fogBlur: Math.max(canvas.width, canvas.height) * 0.006,
      grid: data.grid,
    });
    // Метки, которые мастер показал, — поверх тумана: место игрокам уже известно.
    const r = Math.min(canvas.width, canvas.height) * 0.016 * pinSize;
    drawPins(ctx, data.pins.filter((p) => p.shown), img, xf, { r, font: `${r * 1.5}px Georgia, serif` });
  }

  // Туман перестраивается, когда меняются его операции.
  $effect(() => {
    const f = data.fog;
    const i = img;
    if (!i) return;
    untrack(() => {
      fog ??= fogCanvas(i.w, i.h);
      buildFog(f, fog);
      draw();
    });
  });

  // Сетка и метки перерисовываются сразу.
  $effect(() => {
    void data.grid;
    void data.pins;
    void pinSize;
    untrack(draw);
  });

  // Обзор: первый раз — сразу, дальше — плавный переход за 0,6 с.
  $effect(() => {
    const target = data.view;
    if (!img) return;
    untrack(() => {
      cancelAnimationFrame(anim);
      clearTimeout(finish);
      const from = shown;
      // Окно не видно (например, перекрыто): анимировать незачем, requestAnimationFrame всё равно стоит.
      if (!from || document.visibilityState === 'hidden') {
        shown = target;
        draw();
        return;
      }
      const t0 = performance.now();
      const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
      const step = () => {
        const k = ease(Math.min(1, (performance.now() - t0) / 600));
        shown = {
          x: from.x + (target.x - from.x) * k,
          y: from.y + (target.y - from.y) * k,
          w: from.w + (target.w - from.w) * k,
          h: from.h + (target.h - from.h) * k,
        };
        draw();
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
      // Страховка: если кадры анимации не приходят, вид всё равно встанет на место.
      finish = setTimeout(() => {
        cancelAnimationFrame(anim);
        shown = target;
        draw();
      }, 700);
    });
  });

  $effect(() => {
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(anim);
      clearTimeout(finish);
    };
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
