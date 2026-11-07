<!-- Always there: the status of the sheets and the window with a QR code. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import { sheetUsage } from '../../../renderer/lib/sheetusage.svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { sheetResources } from '../../../systems/packs';
  import QrDialog from './QrDialog.svelte';
  import { connectPlayers, players } from './players.svelte';

  let {}: ModuleProps<'players'> = $props();

  onMount(() => {
    void connectPlayers();
    window.api.onPlayerRoll((who, r) => rolls.fromPhone(who, r.what, { total: r.total, ...(r.detail ? { detail: r.detail } : {}), ...(r.tone ? { tone: r.tone } : {}) }));
    sheetUsage.host = {
      used: (card) => store.state.players.used[card.id] ?? {},
      set: (card, key, used) => void dispatch('players', 'setUsed', { card: card.id, key, used }),
      reset: (card, id) => void dispatch('players', 'reset', { card: card.id, keys: sheetResources(card).resets[id] ?? [] }),
    };
  });
</script>

{#if players.qr}
  <QrDialog />
{/if}
