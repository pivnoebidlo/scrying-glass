<!-- The side drawer of a PDF (peekPdf): a book or an adventure open over any tab, next to the right panel — to look
     something up during the game without leaving the fight or the map. A card or an entry opens over it; Esc closes
     the top one. -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { BookOpen, X } from '@lucide/svelte';
  import { hint } from '../../../shared/hotkeys';
  import { pageTitle } from '../../../shared/journal';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { closePdf, pdfPeek } from '../../../renderer/lib/pdf/pdf.svelte';
  import PdfView from '../../../renderer/lib/pdf/PdfView.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openPage } from './ui.svelte';

  let {}: ModuleProps<'journal'> = $props();

  const path = $derived(pdfPeek.path);

  function onkeydown(e: KeyboardEvent) {
    // Only when nothing is open over it (a card, an entry, a dialog).
    if (e.key === 'Escape' && path && document.querySelectorAll('aside.drawer').length === 1 && !document.querySelector('.modal')) closePdf();
  }
</script>

<svelte:window {onkeydown} />

{#if path}
  <aside class="drawer pdf-drawer" transition:fly={{ x: 40, duration: 180 }} aria-label={pageTitle(path)}>
    <header>
      <span class="t" title={path}>{pageTitle(path)}</span>
      <button class="btn" title={t('pdf.inTab')} onclick={() => (openPage(path), closePdf())}><BookOpen size={14} /> {t('pdf.inTab')}</button>
      <button class="icon-btn" title={hint(t('app.close'), 'close')} onclick={closePdf}><X size={16} /></button>
    </header>
    <div class="body">
      {#key path}<PdfView {path} page={pdfPeek.page} rev={pdfPeek.rev} />{/key}
    </div>
  </aside>
{/if}

<style>
  .drawer {
    position: fixed;
    -webkit-app-region: no-drag;
    top: 0;
    bottom: 0;
    /* Next to the right panel, like the card drawer; under a card or an entry opened over it. */
    right: 281px;
    z-index: 48;
    display: flex;
    flex-direction: column;
    width: min(860px, calc(100vw - 281px - 60px));
    border-left: 1px solid var(--border);
    background: var(--bg-primary);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
  }
  .t {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    flex: 1;
    min-height: 0;
  }
</style>
