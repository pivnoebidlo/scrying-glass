<!-- При открытии хранилища проверяет, что во всех приключениях есть стандартные папки. Если систему открытого
     приключения отключили в настройках, оно скрывается — переключаемся на всё хранилище. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { adventureHidden } from '../../../shared/adventures';

  let { app }: ModuleProps<'adventures'> = $props();

  // Через $derived: app меняется после каждого действия, а проверять нужно только при смене хранилища.
  const root = $derived(app.vault.root);
  $effect(() => {
    if (root) dispatch('adventures', 'ensureFolders');
  });

  const hidden = $derived(adventureHidden(app.adventures, app.adventures.current));
  $effect(() => {
    if (hidden) dispatch('adventures', 'select', { path: null });
  });
</script>
