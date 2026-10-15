<!-- Заметка журнала в оформленном виде: во вкладке и закреплённая в правой панели. [[Ссылка]] — другая заметка
     (открывается во вкладке), иначе запись справочника или карточка в выдвижной панели; {1d20} — бросок в журнал
     бросков; флажок задачи сразу пишется в файл. -->
<script lang="ts">
  import '../../../renderer/lib/note/fonts.css';
  import { entryHtml } from '../../../renderer/lib/entry/markup';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import { splitProps, toggleTask } from '../../../shared/journal';
  import { journal, resolvePage, type PageItem } from './store.svelte';
  import { openPage } from './ui.svelte';

  let { page, compact = false }: { page: PageItem; compact?: boolean } = $props();

  // Разметка экранирует текст (entry/markup.ts).
  const html = $derived(entryHtml(splitProps(page.text).body, { tasks: true, dice: true }));

  async function setText(text: string) {
    const path = page.path;
    journal.pages = journal.pages.map((p) => (p.path === path ? { ...p, text } : p));
    await window.api.writePage(path, text);
  }

  function onclick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    const link = t.closest('a.wikilink') as HTMLElement | null;
    if (link) {
      e.preventDefault();
      const name = link.dataset['link'] ?? '';
      const p = resolvePage(name);
      if (p) openPage(p.path);
      else peekEntry(name);
      return;
    }
    const dice = t.closest('button.dice') as HTMLElement | null;
    if (dice) {
      rolls.damage(page.title, dice.dataset['dice'] ?? '', dice.dataset['dice'] ?? '');
      return;
    }
    if (t instanceof HTMLInputElement && t.dataset['task'] !== undefined) void setText(toggleTask(page.text, Number(t.dataset['task'])));
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="page-body" class:compact {onclick}>
  {#if html}{@html html}{:else}<p class="faint empty">Пусто. «Править» — написать заметку.</p>{/if}
</div>

<style>
  .page-body {
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  .page-body.compact {
    font-size: 13px;
    line-height: 1.5;
  }
  .page-body :global(p) {
    margin: 0 0 0.7em;
  }
  .page-body :global(h2),
  .page-body :global(h3),
  .page-body :global(h4) {
    margin: 1em 0 0.4em;
    line-height: 1.3;
  }
  .page-body :global(h2) {
    font-size: 1.35em;
  }
  .page-body :global(h3) {
    font-size: 1.15em;
  }
  .page-body :global(h4) {
    font-size: 1em;
  }
  .page-body :global(:first-child) {
    margin-top: 0;
  }
  .page-body :global(ul),
  .page-body :global(ol) {
    margin: 0 0 0.7em;
    padding-left: 1.4em;
  }
  .page-body :global(li.task) {
    display: flex;
    gap: 6px;
    align-items: baseline;
    margin-left: -1.4em;
    list-style: none;
  }
  .page-body :global(li.task input) {
    flex: none;
    cursor: pointer;
  }
  .page-body :global(li.task:has(input:checked) span) {
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .page-body :global(hr) {
    margin: 1.2em 0;
    border: 0;
    border-top: 1px solid var(--border);
  }
  .page-body :global(table) {
    margin: 0.4em 0 0.8em;
    border-collapse: collapse;
  }
  .page-body :global(th),
  .page-body :global(td) {
    padding: 2px 12px 2px 0;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }
  /* Цитата — текст для зачитывания игрокам: выделенная плашка, как в изданных приключениях. */
  .page-body :global(blockquote) {
    margin: 0 0 0.9em;
    padding: 0.7em 1em;
    border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-m) var(--radius-m) 0;
    background: color-mix(in srgb, var(--accent) 9%, transparent);
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.12em;
    line-height: 1.5;
  }
  .page-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }
  .page-body :global(a.wikilink) {
    color: var(--accent);
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .page-body :global(button.dice) {
    padding: 0 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-normal);
    font: inherit;
    font-size: 0.9em;
    cursor: pointer;
  }
  .page-body :global(button.dice:hover) {
    border-color: var(--accent);
  }
  .empty {
    font-style: italic;
  }
</style>
