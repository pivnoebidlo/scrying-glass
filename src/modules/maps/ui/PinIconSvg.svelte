<!-- Значок метки в интерфейсе (те же контуры, что на карте). Без значка — кружок цвета метки. -->
<script lang="ts">
  import { PIN_ICONS, type PinIcon } from '../icons';

  let { icon, size = 16, color }: { icon: PinIcon | undefined; size?: number; color?: string } = $props();
  const paths = $derived(PIN_ICONS[icon ?? 'pin']?.paths ?? []);
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if paths.length}
    {#each paths as d, i (i)}<path {d} />{/each}
  {:else}
    <circle cx="12" cy="12" r="6" fill={color ?? 'currentColor'} stroke="none" />
  {/if}
</svg>

<style>
  svg {
    flex: none;
  }
</style>
