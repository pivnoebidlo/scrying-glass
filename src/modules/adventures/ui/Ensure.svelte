<!-- При открытии хранилища проверяет, что во всех приключениях есть стандартные папки. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { app }: ModuleProps<'adventures'> = $props();

  // Через $derived: app меняется после каждого действия, а проверять нужно только при смене хранилища.
  const root = $derived(app.vault.root);
  $effect(() => {
    if (root) dispatch('adventures', 'ensureFolders');
  });
</script>
