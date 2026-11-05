<!-- Always there: the status of the sheets and the window with a QR code. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import QrDialog from './QrDialog.svelte';
  import { connectPlayers, players } from './players.svelte';

  let {}: ModuleProps<'players'> = $props();

  onMount(() => void connectPlayers());
</script>

{#if players.qr}
  <QrDialog />
{/if}
