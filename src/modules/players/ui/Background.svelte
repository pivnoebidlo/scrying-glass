<!-- Always there: the status of the sheets and the window with a QR code. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { sheetUsage } from '../../../renderer/lib/sheetusage.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import QrDialog from './QrDialog.svelte';
  import { connectPlayers, players } from './players.svelte';

  let {}: ModuleProps<'players'> = $props();

  onMount(() => {
    void connectPlayers();
    sheetUsage.host = {
      used: (card) => store.state.players.used[card.id] ?? {},
      set: (card, key, used) => void dispatch('players', 'setUsed', { card: card.id, key, used }),
      rest: (card) => void dispatch('players', 'rest', { card: card.id }),
    };
  });
</script>

{#if players.qr}
  <QrDialog />
{/if}
