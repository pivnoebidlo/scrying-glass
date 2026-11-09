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
  import { statsView } from '../../../systems/ui';
  import { CARD_HANDOUT } from '../types';
  import { showOnly } from '../../../renderer/lib/sheetusage.svelte';

  let { ms }: ModuleProps<'handouts'> = $props();
  // A sheet here only shows, in the GM's preview as well.
  showOnly();

  // A sheet is laid out in one to four columns of a fixed width and scaled to the screen as a whole (the sheets of
  // the systems count in pixels): the layout that comes out biggest wins. Measured at once, no frames to wait for.
  const COLUMN = 640;
  function fit(node: HTMLElement, _card: unknown) {
    const box = node.parentElement!;
    const run = () => {
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      if (!bw || !bh) return;
      let best = { cols: 1, k: 0, w: 0, h: 0 };
      for (let cols = 1; cols <= 4; cols++) {
        node.style.columnCount = String(cols);
        node.style.width = `${cols * COLUMN}px`;
        const w = node.offsetWidth;
        const h = node.offsetHeight;
        // Not bigger than twice: a short sheet need not fill the wall.
        const k = Math.min(bw / w, bh / h, 2);
        if (k > best.k + 0.01) best = { cols, k, w, h };
      }
      node.style.columnCount = String(best.cols);
      node.style.width = `${best.cols * COLUMN}px`;
      node.style.transform = `translate(${(bw - best.w * best.k) / 2}px, ${(bh - best.h * best.k) / 2}px) scale(${best.k})`;
    };
    const seen = new ResizeObserver(run);
    seen.observe(box);
    seen.observe(node);
    void document.fonts?.ready.then(run);
    return {
      update: run,
      destroy: () => seen.disconnect(),
    };
  }
</script>

{#key ms.current}
  {#if ms.current && (ms.card || !ms.current.startsWith(CARD_HANDOUT))}
    <!-- |global: переход должен срабатывать и когда блок пересоздаётся из-за смены картинки ({#key}). -->
    <div class="backdrop" transition:fade|global={{ duration: 400 }}>
      {#if ms.card}
        {@const Stats = statsView(ms.card.system, ms.card.stats)}
        <div class="sheet-box" transition:scale|global={{ start: 0.94, duration: 400 }}>
          <div class="sheet" use:fit={ms.card}>
            <h1>{ms.card.name}</h1>
            <Stats card={ms.card} />
          </div>
        </div>
      {:else if ms.entry}
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
  /* A sheet as it is in the GM's window, on paper; fit() sets its width, columns and scale. */
  .sheet-box {
    position: absolute;
    inset: 4cqmin;
    overflow: hidden;
  }
  .sheet {
    /* The players' window has no theme: the sheet brings parchment colours of its own. */
    --bg-primary: #f3e9d2;
    --bg-secondary: #e8dabb;
    --bg-hover: #dfcea8;
    --border: #cbb489;
    --text-normal: #2e2215;
    --text-muted: #5e4a33;
    --text-faint: #8d785a;
    --accent: #8b2e1f;
    --accent-hover: #a33b29;
    --on-accent: #fff;
    --danger: #b0281d;
    --radius-s: 4px;
    --radius-m: 8px;
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    padding: 24px 28px;
    border-radius: 10px;
    background: var(--bg-primary);
    color: var(--text-normal);
    font-size: 16px;
    column-gap: 32px;
    transform-origin: 0 0;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
  }
  .sheet h1 {
    margin: 0 0 0.5em;
    font-size: 1.8em;
    column-span: all;
  }
  /* A title stays with what follows it; a short section is not split between columns. */
  .sheet :global(:is(h2, h3, h4)) {
    break-after: avoid;
  }
  .sheet :global(section) {
    break-inside: avoid-column;
  }
  /* Nobody presses the players' screen: a roll button reads as its value. */
  .sheet :global(button) {
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    pointer-events: none;
  }
  .entry {
    position: absolute;
    inset: 4cqmin;
    display: grid;
    place-items: center;
  }
</style>
