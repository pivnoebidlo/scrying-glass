<!-- Экран игроков: карта (над фоном, под портретами). -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dataOf } from '../data';
  import { tokenViews } from '../tokens';
  import PlayerMap from './PlayerMap.svelte';

  let { ms, app }: ModuleProps<'maps'> = $props();
</script>

{#key ms.current}
  {#if ms.current}
    {@const data = dataOf(ms, ms.current)}
    <div class="map" transition:fade|global={{ duration: 500 }}>
      <PlayerMap path={ms.current} {data} tokens={tokenViews(data.tokens, app.initiative).filter((t) => !t.hidden)} pinSize={ms.pinSize} />
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
