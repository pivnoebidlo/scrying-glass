<!-- A PDF of the vault (pdf.js): pages one under another, selectable text, search, the page number and zoom. Opens
     where it was left (pdf.svelte.ts) or on `page`. In the journal tab, the side drawer and the right panel (compact). -->
<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { ChevronDown, ChevronUp, Minus, MoveHorizontal, Plus, Search } from '@lucide/svelte';
  import * as pdfjs from 'pdfjs-dist';
  import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
  import { EventBus, PDFFindController, PDFLinkService, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
  // Not a global import: pdf.js styles have general class names (.sidebar, .toolbar, .dialog) that would restyle the
  // window. They are applied only inside the viewer (@scope; their :root variables go to the scope root).
  import viewerCss from 'pdfjs-dist/web/pdf_viewer.css?inline';
  import { assetUrl } from '../../../shared/vault';
  import { t } from '../i18n.svelte';
  import { placeOf, savePlace } from './pdf.svelte';

  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  if (!document.getElementById('sg-pdfjs-css')) {
    const style = document.createElement('style');
    style.id = 'sg-pdfjs-css';
    style.textContent = `@scope (.sg-pdf) {\n${viewerCss.replace(/:root\b/g, ':scope')}\n}`;
    document.head.append(style);
  }

  let { path, page = null, rev = 0, compact = false }: { path: string; page?: number | null; rev?: number; compact?: boolean } = $props();

  let container = $state<HTMLDivElement>();
  let viewer: PDFViewer | null = null;
  let eventBus: EventBus | null = null;
  let task: ReturnType<typeof pdfjs.getDocument> | null = null;
  let doc: pdfjs.PDFDocumentProxy | null = null;
  let current = $state(1);
  let total = $state(0);
  let failed = $state(false);
  let query = $state('');
  let matches = $state({ current: 0, total: 0 });
  let searchInput = $state<HTMLInputElement>();

  // The compact view (the right panel) always fits the width: it keeps the zoom chosen in the tab or the drawer.
  const remember = () =>
    viewer && total && savePlace(path, { page: viewer.currentPageNumber, scale: compact ? (placeOf(path)?.scale ?? 'page-width') : viewer.currentScaleValue || String(viewer.currentScale) });

  onMount(() => {
    const bus = new EventBus();
    eventBus = bus;
    const linkService = new PDFLinkService({ eventBus: bus });
    const findController = new PDFFindController({ eventBus: bus, linkService });
    const v = new PDFViewer({ container: container!, eventBus: bus, linkService, findController, removePageBorders: compact });
    linkService.setViewer(v);
    viewer = v;
    bus.on('pagesinit', () => {
      const at = placeOf(path);
      v.currentScaleValue = compact ? 'page-width' : (at?.scale ?? 'page-width');
      const n = page ?? at?.page ?? 1;
      if (n > 1) v.currentPageNumber = Math.min(n, v.pagesCount);
    });
    bus.on('pagechanging', (e: { pageNumber: number }) => {
      current = e.pageNumber;
      remember();
    });
    bus.on('scalechanging', remember);
    bus.on('updatefindmatchescount', (e: { matchesCount: { current: number; total: number } }) => (matches = e.matchesCount));
    bus.on('updatefindcontrolstate', (e: { matchesCount?: { current: number; total: number } }) => e.matchesCount && (matches = e.matchesCount));

    task = pdfjs.getDocument({
      url: assetUrl(path),
      // Served by the core (main/pdfjs.ts).
      cMapUrl: 'sg-asset://p/cmaps/',
      standardFontDataUrl: 'sg-asset://p/standard_fonts/',
      iccUrl: 'sg-asset://p/iccs/',
      wasmUrl: 'sg-asset://p/wasm/',
    });
    task.promise.then(
      (d) => {
        doc = d;
        total = d.numPages;
        v.setDocument(d);
        linkService.setDocument(d);
      },
      () => (failed = true)
    );
  });

  onDestroy(() => {
    remember();
    viewer?.setDocument(null as never);
    void task?.destroy();
    viewer = null;
    doc = null;
  });

  // Asked for a page again (a link to another page of the same file).
  let seen = untrack(() => rev);
  $effect(() => {
    if (rev !== seen && page && viewer && total) {
      seen = rev;
      viewer.currentPageNumber = Math.min(page, total);
    }
  });

  function goTo(n: number) {
    if (viewer && total) viewer.currentPageNumber = Math.max(1, Math.min(total, Math.round(n) || 1));
    current = viewer?.currentPageNumber ?? current;
  }
  const zoom = (k: number) => viewer && (viewer.currentScale = Math.max(0.25, Math.min(5, viewer.currentScale * k)));
  const fitWidth = () => viewer && (viewer.currentScaleValue = 'page-width');

  function find(again: boolean, previous = false) {
    eventBus?.dispatch('find', { source: null, type: again ? 'again' : '', query, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: previous, matchDiacritics: false });
  }

  function onkeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyF') {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="pdf sg-pdf" class:compact {onkeydown}>
  <div class="bar">
    <label class="page" title={t('pdf.page')}>
      <input type="number" min="1" max={total || 1} value={current} onchange={(e) => goTo(Number(e.currentTarget.value))} />
      <span class="faint">/ {total || '…'}</span>
    </label>
    {#if !compact}
      <button class="icon-btn" title={t('pdf.zoomOut')} onclick={() => zoom(1 / 1.15)}><Minus size={14} /></button>
      <button class="icon-btn" title={t('pdf.zoomIn')} onclick={() => zoom(1.15)}><Plus size={14} /></button>
      <button class="icon-btn" title={t('pdf.fitWidth')} onclick={fitWidth}><MoveHorizontal size={14} /></button>
    {/if}
    <div class="spacer"></div>
    <label class="search" title={t('pdf.searchHint')}>
      <Search size={13} />
      <input
        type="text"
        bind:this={searchInput}
        bind:value={query}
        placeholder={t('pdf.search')}
        oninput={() => find(false)}
        onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), find(true, e.shiftKey))}
      />
      {#if query && matches.total}<span class="faint count">{matches.current}/{matches.total}</span>{:else if query}<span class="faint count">0</span>{/if}
    </label>
    {#if !compact}
      <button class="icon-btn" title={t('pdf.prev')} disabled={!matches.total} onclick={() => find(true, true)}><ChevronUp size={14} /></button>
      <button class="icon-btn" title={t('pdf.next')} disabled={!matches.total} onclick={() => find(true)}><ChevronDown size={14} /></button>
    {/if}
  </div>
  <div class="area">
    <div class="scroll" bind:this={container}>
      <div class="pdfViewer"></div>
    </div>
    {#if failed}<p class="failed faint">{t('pdf.failed')}</p>{/if}
  </div>
</div>

<style>
  .pdf {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
  }
  .compact .bar {
    padding: 2px 0 4px;
  }
  .spacer {
    flex: 1;
  }
  .page {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
  .page input {
    width: 52px;
    padding: 2px 4px;
    text-align: right;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .search input {
    width: 140px;
    min-width: 40px;
    padding: 2px 0;
    border: none;
    background: none;
  }
  .compact .search input {
    width: 90px;
  }
  .count {
    font-size: 11px;
  }
  .area {
    position: relative;
    flex: 1;
    min-height: 0;
    background: var(--bg-secondary);
  }
  .scroll {
    position: absolute;
    inset: 0;
    overflow: auto;
  }
  .failed {
    position: absolute;
    inset: 40% 0 auto;
    text-align: center;
  }
  /* pdf.js draws pages with its own colours: the pages stay white on the window's background. */
  .scroll :global(.pdfViewer .page) {
    margin: 8px auto;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  }
  .compact .scroll :global(.pdfViewer .page) {
    margin: 4px auto;
  }
</style>
