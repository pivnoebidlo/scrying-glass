<!-- A layout's preview, with room numbers and marks (the map itself goes without them). -->
<script lang="ts">
  import { drawLayout, type LayoutMark } from './draw';
  import type { Layout } from './layout';

  let { layout, marks = [] }: { layout: Layout; marks?: LayoutMark[] } = $props();
  let canvas = $state<HTMLCanvasElement>();
  const CELL = 22;

  $effect(() => {
    if (!canvas) return;
    canvas.width = layout.w * CELL;
    canvas.height = layout.h * CELL;
    drawLayout(canvas.getContext('2d')!, layout, CELL, { labels: (i) => String(i + 1), marks });
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    display: block;
    max-width: 100%;
    max-height: 70vh;
    margin: 0 auto;
    border-radius: var(--radius-m);
  }
</style>
