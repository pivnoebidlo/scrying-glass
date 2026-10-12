<!-- Всегда на месте, пока открыто хранилище: окно «Где хранить?» может понадобиться и из боковой панели,
     и из вкладки, и из трекера. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { bestiary } from './cards.svelte';
  import PlacePicker from './PlacePicker.svelte';

  let { app }: ModuleProps<'bestiary'> = $props();
</script>

{#if bestiary.placeRequest}
  <PlacePicker {app} request={bestiary.placeRequest} />
{/if}
