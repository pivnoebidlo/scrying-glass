<!-- Telegram's background parts of the control window: the send dialog, the toast of a new message, and the table
     that follows the adventure. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import SendDialog from './SendDialog.svelte';
  import Toast from './Toast.svelte';
  import { followAdventure, sendToTelegram, tg } from './tg.svelte';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import { markdownToTelegram } from '../../../shared/telegram';

  let props: ModuleProps<'telegram'> = $props();
  // The adventure (of this vault) picks its table.
  const adventure = $derived(`${props.app.vault.root ?? ''}|${props.app.adventures.current ?? ''}`);
  $effect(() => followAdventure(adventure));
  // A roll table's result from the roll log: only when a bot is set up.
  $effect(() => {
    rolls.telegram = tg.status?.configured ? (title, markdown) => sendToTelegram({ kind: 'text', title, html: markdownToTelegram(`**${title}**\n${markdown}`) }) : null;
  });
</script>

<SendDialog {...props} />
<Toast />
