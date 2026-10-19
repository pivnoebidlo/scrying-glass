<!-- Telegram's background parts of the control window: the send dialog and the toast of a new message. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import SendDialog from './SendDialog.svelte';
  import Toast from './Toast.svelte';

  let props: ModuleProps<'telegram'> = $props();
</script>

<SendDialog {...props} />
<Toast />
