<!-- A note in the right panel's tray: the sheet in miniature (sizes of NotePaper are in cqw — it fits any tile). -->
<script lang="ts">
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
  import type { Note } from '../../../shared/notes';

  let { path }: { path: string } = $props();

  connectNotes();
  let note = $state.raw<Note | null>(null);
  $effect(() => {
    const p = path;
    void notes.rev;
    let stale = false;
    window.api.readNote(p).then((n) => !stale && (note = n));
    return () => (stale = true);
  });
</script>

<span class="paper">{#if note}<NotePaper {note} />{/if}</span>

<style>
  .paper {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    container-type: inline-size;
    pointer-events: none;
  }
</style>
