<!-- Telegram's background parts of the control window: the send dialog, the toast of a new message, and the table
     that follows the adventure. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import SendDialog from './SendDialog.svelte';
  import Toast from './Toast.svelte';
  import { followAdventure } from './tg.svelte';

  let props: ModuleProps<'telegram'> = $props();
  // The adventure (of this vault) picks its table.
  const adventure = $derived(`${props.app.vault.root ?? ''}|${props.app.adventures.current ?? ''}`);
  $effect(() => followAdventure(adventure));
</script>

<SendDialog {...props} />
<Toast />
