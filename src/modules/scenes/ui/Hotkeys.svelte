<!-- ⌘1…⌘9 (Ctrl+1…9): включить сцену с этим номером. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { activate } from '../apply';
  import { scenesFor } from '../types';

  let { ms, app }: ModuleProps<'scenes'> = $props();

  function onkeydown(e: KeyboardEvent) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    const n = Number(e.key);
    const sc = Number.isInteger(n) && n >= 1 && n <= 9 ? scenesFor(ms, app.adventures.current)[n - 1] : undefined;
    if (!sc) return;
    e.preventDefault();
    activate(app, sc);
  }
</script>

<svelte:window {onkeydown} />
