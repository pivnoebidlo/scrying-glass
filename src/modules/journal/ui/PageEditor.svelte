<!-- Правка заметки журнала: Markdown-текст, сохраняется сам (через полсекунды после последней правки и при выходе).
     Enter, ⌘B / ⌘I / ⌘⇧X and Tab — as in Obsidian (renderer/lib/markdownKeys.ts). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { modKey } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onDestroy, untrack } from 'svelte';
  import { markdownKeys } from '../../../renderer/lib/markdownKeys';
  import MarkdownToolbar from '../../../renderer/lib/MarkdownToolbar.svelte';
  import { editorPrefs } from '../../../renderer/lib/editorPrefs.svelte';
  import { journal, type PageItem } from './store.svelte';
  import { ui } from './ui.svelte';

  let { page }: { page: PageItem } = $props();

  let text = $state(untrack(() => page.text));
  let saved = untrack(() => page.text);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let area = $state<HTMLTextAreaElement>();

  // Сохранить сейчас (перед переименованием заметки).
  export function flush() {
    return save();
  }

  async function save() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (text === saved) return;
    const path = page.path;
    saved = text;
    journal.pages = journal.pages.map((p) => (p.path === path ? { ...p, text: saved } : p));
    await window.api.writePage(path, saved);
  }

  function oninput() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 500);
  }

  // У новой заметки фокус — в названии (View), у остальных — сразу в тексте.
  const focusText = !ui.fresh;
  $effect(() => {
    if (focusText) area?.focus();
  });
  onDestroy(() => void save());
</script>

<div class="editor">
  {#if editorPrefs.toolbar}<MarkdownToolbar {area} journal />{/if}
  <textarea
    class="journal-text"
    bind:this={area}
    bind:value={text}
    {oninput}
    use:markdownKeys
    onblur={save}
    spellcheck="true"
    placeholder={t('journal.editorPlaceholder')}
  ></textarea>
  <p class="faint hint">
    <Lead text={t('journal.editorHint', { mod: modKey() })} />
  </p>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
  }
  textarea {
    flex: 1;
    min-height: 0;
    width: 100%;
    padding: 12px 14px;
    resize: none;
    font: inherit;
    font-size: 14px;
    line-height: 1.6;
  }
  .hint {
    margin: 0;
    font-size: 12px;
  }
</style>
