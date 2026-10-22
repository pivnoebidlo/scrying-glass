<!-- A clock's face: the filled wedges over the empty circle, the dividing lines on top. `color` — the fill. -->
<script lang="ts">
  import { clockSpokes, clockWedges } from '../draw';

  let { segments, filled, color, rim = 'currentColor', empty = 'transparent' }: { segments: number; filled: number; color: string; rim?: string; empty?: string } = $props();
</script>

<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill={empty} />
  {#each clockWedges(segments, filled) as d, i (i)}<path {d} fill={color} />{/each}
  <path d={clockSpokes(segments)} stroke={rim} stroke-width="3" />
  <circle cx="50" cy="50" r="46" fill="none" stroke={rim} stroke-width="5" />
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
