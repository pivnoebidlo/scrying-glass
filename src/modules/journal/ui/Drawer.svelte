<!-- The side drawer of the journal (peekJournal): a note or a PDF over any tab, next to the right panel — to look
     something up during the game without leaving the fight or the map. Opened from the pinned list of the right panel
     and by [[Book#12]] links. A card or an entry opens over it; Esc closes the top one. -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { BookOpen, X } from '@lucide/svelte';
  import { hint } from '../../../shared/hotkeys';
  import { isPdf, pageTitle } from '../../../shared/journal';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import PdfView from '../../../renderer/lib/pdf/PdfView.svelte';
  import PageBody from './PageBody.svelte';
  import { loadPages, pageAt } from './store.svelte';
  import { closePeek, openPage, peek } from './ui.svelte';

  let { app }: ModuleProps<'journal'> = $props();

  const path = $derived(peek.path);
  const pdf = $derived(!!path && isPdf(path));
  // Notes are loaded even if the journal was never opened (the drawer opened from the right panel).
  const tree = $derived(app.vault.tree);
  $effect(() => {
    if (!path || pdf) return;
    void tree;
    void notes.rev;
    void loadPages();
  });
  const page = $derived(pdf ? undefined : pageAt(path));

  function onkeydown(e: KeyboardEvent) {
    // Only when nothing is open over it (a card, an entry, a dialog).
    if (e.key === 'Escape' && path && document.querySelectorAll('aside.drawer').length === 1 && !document.querySelector('.modal')) closePeek();
  }
</script>

<svelte:window {onkeydown} />

{#if path}
  <aside class="drawer journal-drawer" class:pdf transition:fly={{ x: 40, duration: 180 }} aria-label={pageTitle(path)}>
    <header>
      <span class="t" title={path}>{pageTitle(path)}</span>
      <button class="btn" title={t('pdf.inTab')} onclick={() => (openPage(path), closePeek())}><BookOpen size={14} /> {t('pdf.inTab')}</button>
      <button class="icon-btn" title={hint(t('app.close'), 'close')} onclick={closePeek}><X size={16} /></button>
    </header>
    <div class="body">
      {#if pdf}
        {#key path}<PdfView {path} page={peek.page} rev={peek.rev} />{/key}
      {:else if page}
        <div class="note"><PageBody {page} /></div>
      {/if}
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
    width: min(620px, calc(100vw - 281px - 60px));
    border-left: 1px solid var(--border);
    background: var(--bg-primary);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
  }
  .drawer.pdf {
    width: min(860px, calc(100vw - 281px - 60px));
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
    overflow: auto;
  }
  .note {
    padding: 16px 20px;
  }
</style>
