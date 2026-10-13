<!-- Вкладка бестиария: редактор карточки или выбранная карточка. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { bestiary, connectCards } from './cards.svelte';
  import CardEditor from './CardEditor.svelte';
  import CardView from './CardView.svelte';

  let { app }: ModuleProps<'bestiary'> = $props();

  onMount(connectCards);
</script>

{#if bestiary.draft}
  <CardEditor {app} draft={bestiary.draft} />
{:else}
  <CardView
    {app}
    ref={bestiary.selected}
    onselect={(r) => bestiary.select(r)}
    empty="Выберите существо в списке слева или создайте своё кнопкой «+»."
  />
{/if}
