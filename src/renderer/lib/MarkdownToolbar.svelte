<!-- Buttons over a Markdown text area (journal notes, compendium entries) for those who do not keep the keys in mind:
     bold, italic, strikethrough, a heading, a quote, a list; in the journal also a task and a dice roll; a [[link]].
     The text stays Markdown; the buttons do what the keys do (markdownKeys) and keep the selection and ⌘Z. -->
<script lang="ts">
  import { Bold, Dices, Heading2, Italic, Link, List, ListChecks, Strikethrough, TextQuote } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import { t } from './i18n.svelte';
  import { apply } from './markdownKeys';
  import { hint } from '../../shared/hotkeys';
  import { toggleLinePrefix, toggleWrap, wrapWith, type TextEdit } from '../../shared/journal';

  // journal — tasks and {dice} make sense there (the compendium does not show them).
  let { area, journal = false }: { area: HTMLTextAreaElement | undefined; journal?: boolean } = $props();

  type Tool = { id: string; icon: Component<{ size?: number }>; label: string; hotkey?: string; edit: (text: string, a: number, b: number) => TextEdit };
  const tools = $derived<(Tool | null)[]>([
    { id: 'bold', icon: Bold, label: t('mdbar.bold'), hotkey: 'bold', edit: (x, a, b) => toggleWrap(x, a, b, '**') },
    { id: 'italic', icon: Italic, label: t('mdbar.italic'), hotkey: 'italic', edit: (x, a, b) => toggleWrap(x, a, b, '*') },
    { id: 'strike', icon: Strikethrough, label: t('mdbar.strike'), hotkey: 'strike', edit: (x, a, b) => toggleWrap(x, a, b, '~~') },
    null,
    { id: 'heading', icon: Heading2, label: t('mdbar.heading'), edit: (x, a, b) => toggleLinePrefix(x, a, b, '## ') },
    { id: 'quote', icon: TextQuote, label: t(journal ? 'mdbar.quoteJournal' : 'mdbar.quote'), hotkey: 'quote', edit: (x, a, b) => toggleLinePrefix(x, a, b, '> ') },
    { id: 'list', icon: List, label: t('mdbar.list'), edit: (x, a, b) => toggleLinePrefix(x, a, b, '- ') },
    ...(journal ? [{ id: 'task', icon: ListChecks, label: t('mdbar.task'), edit: (x: string, a: number, b: number) => toggleLinePrefix(x, a, b, '- [ ] ') }] : []),
    null,
    { id: 'link', icon: Link, label: t('mdbar.link'), edit: (x, a, b) => wrapWith(x, a, b, '[[', ']]', t('mdbar.linkPh')) },
    ...(journal ? [{ id: 'dice', icon: Dices, label: t('mdbar.dice'), edit: (x: string, a: number, b: number) => wrapWith(x, a, b, '{', '}', '1d20') }] : []),
  ]);

  function run(tool: Tool) {
    if (!area) return;
    area.focus();
    apply(area, tool.edit(area.value, area.selectionStart, area.selectionEnd));
  }
</script>

<div class="bar" role="toolbar" aria-label={t('mdbar.title')}>
  {#each tools as tool, i (tool?.id ?? `sep${i}`)}
    {#if tool}
      <!-- mousedown would take the focus (and the selection) away from the text. -->
      <button type="button" class="icon-btn" title={tool.hotkey ? hint(tool.label, tool.hotkey) : tool.label} onmousedown={(e) => e.preventDefault()} onclick={() => run(tool)}>
        <tool.icon size={15} />
      </button>
    {:else}
      <span class="sep"></span>
    {/if}
  {/each}
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    padding: 2px 0 6px;
  }
  .icon-btn {
    width: 28px;
    height: 28px;
  }
  .sep {
    width: 1px;
    height: 16px;
    margin: 0 4px;
    background: var(--border);
  }
</style>
