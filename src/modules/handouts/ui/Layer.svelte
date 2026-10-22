<!-- Экран игроков: раздатка по центру поверх затемнённой сцены, как лист, положенный на стол.
     Картинка — из хранилища, записка — из состояния (ядро читает её файл). -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';
  import EntryCard from '../../../renderer/lib/entry/EntryCard.svelte';
  import { isNotePath } from '../../../shared/notes';
  import { isSketchPath } from '../../../shared/sketch';
  import SketchView from '../../../renderer/lib/sketch/SketchView.svelte';
  import { vaultUrl } from '../../../shared/vault';

  let { ms }: ModuleProps<'handouts'> = $props();
</script>

{#key ms.current}
  {#if ms.current}
    <!-- |global: переход должен срабатывать и когда блок пересоздаётся из-за смены картинки ({#key}). -->
    <div class="backdrop" transition:fade|global={{ duration: 400 }}>
      {#if ms.entry}
        <div class="entry" transition:scale|global={{ start: 0.94, duration: 400 }}><EntryCard entry={ms.entry} players /></div>
      {:else if isSketchPath(ms.current)}
        {#if ms.sketch}
          <div class="note" transition:scale|global={{ start: 0.94, duration: 400 }}><SketchView sketch={ms.sketch} shadow /></div>
        {/if}
      {:else if isNotePath(ms.current)}
        {#if ms.note}
          <div class="note" transition:scale|global={{ start: 0.94, duration: 400 }}><NotePaper note={ms.note} shadow /></div>
        {/if}
      {:else}
        <img src={vaultUrl(ms.current)} alt="" transition:scale|global={{ start: 0.94, duration: 400 }} />
      {/if}
    </div>
  {/if}
{/key}

<style>
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.78);
  }
  /* Картинка вписывается в экран с полями; тень — по самой картинке, а не по её рамке. */
  img {
    position: absolute;
    inset: 4cqmin;
    width: calc(100% - 8cqmin);
    height: calc(100% - 8cqmin);
    object-fit: contain;
    filter: drop-shadow(0 1.5cqmin 4cqmin rgba(0, 0, 0, 0.8));
  }
  .note {
    position: absolute;
    inset: 4cqmin;
  }
  .entry {
    position: absolute;
    inset: 4cqmin;
    display: grid;
    place-items: center;
  }
</style>
