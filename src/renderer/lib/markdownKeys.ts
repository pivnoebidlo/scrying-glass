// Markdown text areas (journal notes, compendium entries) behave like Obsidian: Enter carries «>», list, task and
// number markers on (continueMarkup), Cmd/Ctrl+B / I / Shift+X — bold, italic, strikethrough (toggleWrap), Tab /
// Shift+Tab — indent or outdent the line. Edits go through insertText: Cmd+Z undoes them and the input event keeps
// bind:value and autosave in step.
import { continueMarkup, toggleWrap, type TextEdit } from '../../shared/journal';

const MARKS: Record<string, string> = { KeyB: '**', KeyI: '*', KeyX: '~~' };

function apply(area: HTMLTextAreaElement, edit: TextEdit) {
  area.setSelectionRange(edit.from, edit.to);
  if (!document.execCommand('insertText', false, edit.insert)) {
    area.setRangeText(edit.insert, edit.from, edit.to);
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }
  area.setSelectionRange(edit.a, edit.b);
}

// Tab: two spaces at the start of the line (a nested list); Shift+Tab: take them back.
function indent(text: string, a: number, b: number, out: boolean): TextEdit {
  const start = text.lastIndexOf('\n', a - 1) + 1;
  if (!out) return { from: start, to: start, insert: '  ', a: a + 2, b: b + 2 };
  const cut = text.slice(start).match(/^( {1,2}|\t)/)?.[0].length ?? 0;
  return { from: start, to: start + cut, insert: '', a: Math.max(start, a - cut), b: Math.max(start, b - cut) };
}

// enter: false — Enter is someone else's (a chat box where Enter sends); the marks and Tab still work.
export function markdownKeys(area: HTMLTextAreaElement, opts: { enter?: boolean } = {}) {
  let enter = opts.enter ?? true;
  const onkeydown = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    const { selectionStart: a, selectionEnd: b, value: text } = area;
    if (mod && !e.altKey && MARKS[e.code] && e.shiftKey === (e.code === 'KeyX')) {
      e.preventDefault();
      e.stopPropagation();
      apply(area, toggleWrap(text, a, b, MARKS[e.code]!));
    } else if (enter && e.key === 'Enter' && !mod && !e.shiftKey && !e.altKey && !e.isComposing && a === b) {
      const edit = continueMarkup(text, a);
      if (edit) {
        e.preventDefault();
        apply(area, edit);
      }
    } else if (e.key === 'Tab' && !mod && !e.altKey) {
      e.preventDefault();
      apply(area, indent(text, a, b, e.shiftKey));
    }
  };
  area.addEventListener('keydown', onkeydown);
  return {
    update: (next: { enter?: boolean } = {}) => (enter = next.enter ?? true),
    destroy: () => area.removeEventListener('keydown', onkeydown),
  };
}
