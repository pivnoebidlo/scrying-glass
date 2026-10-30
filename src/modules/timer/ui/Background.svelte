<!-- The timer's part of the GM window that is always there: the signal when time is up and the GM's bar. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Chime from './Chime.svelte';
  import GmBar from './GmBar.svelte';

  let props: ModuleProps<'timer'> = $props();
</script>

<Chime {...props} />
<GmBar {...props} />
