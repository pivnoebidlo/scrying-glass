<!-- Loads the schedule when the window opens (the right panel's block may be folded and not mounted). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { loadSchedule } from './store.svelte';

  let {}: ModuleProps<'schedule'> = $props();
  onMount(() => void loadSchedule());
</script>
