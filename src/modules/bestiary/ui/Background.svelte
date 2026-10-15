<!-- Всегда на месте, пока открыто хранилище: выдвижная панель карточки, окна «Где хранить?» и «Что изменилось»
     (обновление персонажа из LSS) нужны и из боковой панели, и из любой вкладки, и из трекера. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { bestiary } from './cards.svelte';
  import PlacePicker from './PlacePicker.svelte';
  import CardDrawer from './CardDrawer.svelte';
  import LssUpdate from './LssUpdate.svelte';

  let { app }: ModuleProps<'bestiary'> = $props();
</script>

{#if bestiary.peeked}
  <CardDrawer {app} target={bestiary.peeked} />
{/if}

{#if bestiary.placeRequest}
  <PlacePicker {app} request={bestiary.placeRequest} />
{/if}

{#if bestiary.lssRequest}
  <LssUpdate request={bestiary.lssRequest} />
{/if}
