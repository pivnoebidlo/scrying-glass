<!-- ⌘1…⌘9 (Ctrl+1…9; the GM may move the row to other modifiers — shared/hotkeys.ts): switch on the scene with this
     number. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { activate } from '../apply';
  import { scenesFor } from '../types';
  import { comboFor, rowNumber } from '../../../shared/hotkeys';

  let { ms, app }: ModuleProps<'scenes'> = $props();

  function onkeydown(e: KeyboardEvent) {
    // Without ⌘/Ctrl the keys type text (⌥1 → ¡): not while the cursor is in a text field.
    const el = e.target as HTMLElement | null;
    const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || !!el?.isContentEditable;
    if (typing && !comboFor('scene').includes('Mod')) return;
    const n = rowNumber(e, 'scene');
    const sc = n ? scenesFor(ms, app.adventures)[n - 1] : undefined;
    if (!sc) return;
    e.preventDefault();
    activate(app, sc);
  }
</script>

<svelte:window {onkeydown} />
