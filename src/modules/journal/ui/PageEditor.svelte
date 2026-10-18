<!-- Правка заметки журнала: Markdown-текст, сохраняется сам (через полсекунды после последней правки и при выходе).
     As in Obsidian: Enter carries «>», list and task markers and numbers on; ⌘B / ⌘I / ⌘⇧X — bold, italic,
     strikethrough. Edits go through insertText, so ⌘Z undoes them. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { onDestroy, untrack } from 'svelte';
  import { continueMarkup, toggleWrap, type TextEdit } from '../../../shared/journal';
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

  // Apply an edit like typing (insertText keeps the undo history; it fires input, so bind:value and saving follow).
  function apply(edit: TextEdit) {
    if (!area) return;
    area.setSelectionRange(edit.from, edit.to);
    if (!document.execCommand('insertText', false, edit.insert)) {
      text = text.slice(0, edit.from) + edit.insert + text.slice(edit.to);
      oninput();
    }
    area.setSelectionRange(edit.a, edit.b);
  }
  const MARKS: Record<string, string> = { KeyB: '**', KeyI: '*', KeyX: '~~' };

  function onkeydown(e: KeyboardEvent) {
    if (!area) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.altKey && MARKS[e.code] && e.shiftKey === (e.code === 'KeyX')) {
      e.preventDefault();
      e.stopPropagation();
      apply(toggleWrap(text, area.selectionStart, area.selectionEnd, MARKS[e.code]!));
      return;
    }
    if (e.key === 'Enter' && !mod && !e.shiftKey && !e.altKey && !e.isComposing && area.selectionStart === area.selectionEnd) {
      const edit = continueMarkup(text, area.selectionStart);
      if (edit) {
        e.preventDefault();
        apply(edit);
      }
      return;
    }
    // Tab в тексте — отступ (вложенный список), а не переход к следующему полю.
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b } = area;
    const start = text.lastIndexOf('\n', a - 1) + 1;
    if (e.shiftKey) {
      const cut = text.slice(start).match(/^( {1,2}|\t)/)?.[0].length ?? 0;
      text = text.slice(0, start) + text.slice(start + cut);
      queueMicrotask(() => area?.setSelectionRange(Math.max(start, a - cut), Math.max(start, b - cut)));
    } else {
      text = text.slice(0, start) + '  ' + text.slice(start);
      queueMicrotask(() => area?.setSelectionRange(a + 2, b + 2));
    }
    oninput();
  }

  // У новой заметки фокус — в названии (View), у остальных — сразу в тексте.
  const focusText = !ui.fresh;
  $effect(() => {
    if (focusText) area?.focus();
  });
  onDestroy(() => void save());
</script>

<div class="editor">
  <textarea
    class="journal-text"
    bind:this={area}
    bind:value={text}
    {oninput}
    {onkeydown}
    onblur={save}
    spellcheck="true"
    placeholder={t('journal.editorPlaceholder')}
  ></textarea>
  <p class="faint hint">
    {t('journal.editorHint')}
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
