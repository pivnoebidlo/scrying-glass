<script lang="ts">
  import Stage from '../lib/Stage.svelte';
  import { store } from '../lib/store.svelte';
</script>

<Stage app={store.state} />
