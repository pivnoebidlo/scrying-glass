<!-- Экран игроков: карта (над фоном, под портретами). -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dataOf } from '../data';
  import PlayerMap from './PlayerMap.svelte';

  let { ms }: ModuleProps<'maps'> = $props();
</script>

{#key ms.current}
  {#if ms.current}
    <div class="map" transition:fade|global={{ duration: 500 }}>
      <PlayerMap path={ms.current} data={dataOf(ms, ms.current)} />
    </div>
  {/if}
{/key}

<style>
  .map {
    position: absolute;
    inset: 0;
    background: #000;
  }
</style>
