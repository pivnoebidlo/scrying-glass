<!-- An easter egg: the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) anywhere in the GM's window, not while typing, rains d20s
     over it for a few seconds; one golden die lands in the middle with a natural 20. Only the GM sees it. -->
<script lang="ts">
  import { t } from '../lib/i18n.svelte';
  import { KONAMI, konamiStep } from '../lib/eggs/konami';

  const DURATION = 6400;
  const COLOURS = ['#8a5cf5', '#e0475b', '#2f9e8f', '#3b82f6', '#e8913a', '#6b7280', '#c2410c', '#0f766e'];

  let at = 0;
  let raining = $state(false);
  let toast = $state(false);
  let canvas = $state<HTMLCanvasElement>();

  function onkeydown(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.isContentEditable) return (at = 0), undefined;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    at = konamiStep(at, e.code);
    if (at < KONAMI.length) return;
    at = 0;
    if (!raining) start();
  }

  interface Die { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; n: number; colour: string; delay: number; gold?: boolean; bounces: number }

  let dice: Die[] = [];
  let began = 0;
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function start() {
    raining = true;
    toast = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setTimeout(stop, DURATION);
      return;
    }
    const w = innerWidth;
    dice = Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: -40 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 120,
      vy: 0,
      r: 12 + Math.random() * 16,
      a: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 8,
      n: 1 + Math.floor(Math.random() * 20),
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)]!,
      delay: Math.random() * 2200,
      bounces: 0,
    }));
    dice.push({ x: w / 2, y: -80, vx: 0, vy: 0, r: 44, a: 0, va: 6, n: 20, colour: '#d4a72c', delay: 2600, gold: true, bounces: 0 });
    began = last = performance.now();
    requestAnimationFrame(frame);
    // rAF stops in a covered window: the timer makes sure the rain ends.
    timer = setTimeout(stop, DURATION);
  }

  function stop() {
    clearTimeout(timer);
    raining = false;
    toast = false;
    dice = [];
  }

  function frame(now: number) {
    if (!raining || !canvas) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const ratio = devicePixelRatio || 1;
    const w = innerWidth;
    const h = innerHeight;
    if (canvas.width !== w * ratio) (canvas.width = w * ratio), (canvas.height = h * ratio);
    const g = canvas.getContext('2d')!;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, w, h);
    const t = now - began;
    const fade = Math.max(0, Math.min(1, (DURATION - t) / 800));
    for (const d of dice) {
      if (t < d.delay) continue;
      d.vy += 900 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.a += d.va * dt;
      const floor = d.gold ? h / 2 : h - d.r;
      if (d.y > floor && d.vy > 0 && d.bounces < 3) {
        d.y = floor;
        d.vy *= -0.45;
        d.vx *= 0.7;
        d.va *= 0.5;
        d.bounces++;
        if (d.gold && d.bounces === 3) (d.vy = 0), (d.va = 0);
      }
      if (d.gold && d.bounces >= 3) {
        d.y = floor;
        d.a += (Math.round(d.a / (Math.PI * 2)) * Math.PI * 2 - d.a) * Math.min(1, dt * 8);
      }
      g.globalAlpha = fade;
      drawD20(g, d);
    }
    g.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  // A d20 as on a die icon: a hexagon, the face triangle with the number and the edges to the corners.
  function drawD20(g: CanvasRenderingContext2D, d: Die) {
    g.save();
    g.translate(d.x, d.y);
    g.rotate(d.a);
    const r = d.r;
    const hex = Array.from({ length: 6 }, (_, i) => [Math.cos(-Math.PI / 2 + (i * Math.PI) / 3) * r, Math.sin(-Math.PI / 2 + (i * Math.PI) / 3) * r] as const);
    const tri = [[0, -r * 0.5], [r * 0.48, r * 0.33], [-r * 0.48, r * 0.33]] as const;
    g.beginPath();
    hex.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = d.colour;
    g.fill();
    g.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    g.lineWidth = Math.max(1, r / 14);
    g.stroke();
    g.beginPath();
    tri.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = 'rgba(255, 255, 255, 0.18)';
    g.fill();
    g.stroke();
    g.beginPath();
    for (const [a, b] of [[0, 0], [1, 1], [1, 2], [2, 3], [2, 4], [0, 5]] as const) {
      g.moveTo(tri[a]![0], tri[a]![1]);
      g.lineTo(hex[b]![0], hex[b]![1]);
    }
    g.stroke();
    g.fillStyle = d.gold ? '#3b2a00' : '#ffffff';
    g.font = `700 ${Math.round(r * (d.n > 9 ? 0.42 : 0.5))}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(d.n), 0, r * 0.08);
    g.restore();
  }
</script>

<svelte:window {onkeydown} />

{#if raining}
  <canvas class="rain" bind:this={canvas}></canvas>
  {#if toast}<div class="toast" role="status">{t('egg.konami')}</div>{/if}
{/if}

<style>
  .rain {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 900;
    pointer-events: none;
    -webkit-app-region: no-drag;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 48px;
    transform: translateX(-50%);
    z-index: 901;
    max-width: calc(100vw - 32px);
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    -webkit-app-region: no-drag;
    text-align: center;
  }
</style>
