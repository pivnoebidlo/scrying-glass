<!-- A QR code: dark squares on white whatever the theme, or cameras will not read it. -->
<script lang="ts">
  import { encode } from 'uqr';

  let { text }: { text: string } = $props();

  const qr = $derived(encode(text, { ecc: 'M', border: 2 }));
  const squares = $derived(qr.data.flatMap((row, y) => row.flatMap((on, x) => (on ? [`M${x} ${y}h1v1h-1z`] : []))).join(''));
</script>

<svg viewBox="0 0 {qr.size} {qr.size}" shape-rendering="crispEdges" role="img" aria-label={text}>
  <rect width={qr.size} height={qr.size} fill="#ffffff" />
  <path d={squares} fill="#000000" />
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
