<!-- Всегда на месте, пока открыто хранилище: выдвижная панель карточки, окна «Где хранить?» и «Что изменилось»
     (обновление персонажа из экспорта — окно системы, SystemUi.importUpdate; нет — простой вопрос) нужны и из боковой
     панели, и из любой вкладки, и из трекера. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { systemUi } from '../../../systems/ui';
  import { bestiary } from './cards.svelte';
  import PlacePicker from './PlacePicker.svelte';
  import CardDrawer from './CardDrawer.svelte';

  let { app }: ModuleProps<'bestiary'> = $props();

  const request = $derived(bestiary.importRequest);
  const Update = $derived(request ? systemUi(request.next.system)?.importUpdate : undefined);
  // A system without its window: take everything from the export, or (on import) make a new card.
  $effect(() => {
    if (!request || Update) return;
    const name = request.current.name;
    if (request.import) request.resolve(confirm(t('best.askUpdateImport', { name })) ? { kind: 'update' } : { kind: 'new' });
    else request.resolve(confirm(t('best.askUpdate', { name })) ? { kind: 'update' } : { kind: 'cancel' });
  });
</script>

{#if bestiary.peeked}
  <CardDrawer {app} target={bestiary.peeked} />
{/if}

{#if bestiary.placeRequest}
  <PlacePicker {app} request={bestiary.placeRequest} />
{/if}

{#if request && Update}
  <Update {request} />
{/if}
