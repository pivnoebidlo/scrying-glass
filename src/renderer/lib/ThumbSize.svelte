<!-- Ползунок размера миниатюр для панели над сеткой картинок. -->
<script lang="ts">
  import { Image } from '@lucide/svelte';
  import Slider from './Slider.svelte';
  import { THUMB_LIMITS, thumbs, type ThumbGrid } from './thumbs.svelte';

  let { grid }: { grid: ThumbGrid } = $props();
  const lim = $derived(THUMB_LIMITS[grid]);
</script>

<div class="size" title="Размер миниатюр (двойной щелчок — по умолчанию)" ondblclick={() => (thumbs[grid] = lim.def)} role="group">
  <Image size={12} />
  <div class="slider">
    <Slider value={thumbs[grid]} min={lim.min} max={lim.max} step={10} oninput={(v) => (thumbs[grid] = v)} />
  </div>
  <Image size={17} />
</div>

<style>
  .size {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-faint);
  }
  .slider {
    width: 110px;
  }
</style>
