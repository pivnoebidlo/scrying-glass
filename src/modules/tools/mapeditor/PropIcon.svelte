<!-- A thing of the palette, drawn the way it is on the map. -->
<script lang="ts">
  import { drawProps } from '../mapgen/draw-props';
  import type { PropKind } from '../mapgen/furnish';
  import type { Layout } from '../mapgen/layout';
  import { footprint } from './edit';

  let { kind }: { kind: PropKind } = $props();
  let canvas = $state<HTMLCanvasElement>();
  const C = 20;

  $effect(() => {
    if (!canvas) return;
    const f = footprint(kind, 0);
    canvas.width = f.w * C * 2;
    canvas.height = f.h * C * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    drawProps(ctx, { props: [{ kind, x: 0, y: 0, ...f, tint: 0.1 }] } as unknown as Layout, C);
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    display: block;
    max-width: 40px;
    max-height: 30px;
    width: auto;
    height: auto;
  }
</style>
