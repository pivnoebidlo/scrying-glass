// Журнал мастера: заметки к приключению — обычные Markdown-файлы в папках журнала (роль journal), название = имя
// файла. Разметка — общая со справочником (renderer/lib/entry/markup.ts): цитата «>» — текст для зачитывания,
// «- [ ]» — задача с флажком, {1d20} — бросок. Здесь — чистые функции над текстом заметки.

// Задача списка: «- [ ] текст» / «- [x] текст». [1] — отметка, [2] — текст.
export const TASK = /^\s*[-*•]\s+\[([ xXхХ])\]\s+(.*?)\r?$/;

// Свойства Obsidian (YAML между «---» в самом начале файла): при показе прячутся, при записи остаются как были.
const PROPS = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/;
export function splitProps(text: string): { props: string; body: string } {
  const m = PROPS.exec(text);
  return m ? { props: m[0], body: text.slice(m[0].length) } : { props: '', body: text };
}

// Переключить n-ю по порядку задачу (счёт — как у разметки: по строкам текста без свойств).
export function toggleTask(text: string, n: number): string {
  const { props, body } = splitProps(text);
  let k = 0;
  const lines = body.split('\n').map((line) => {
    const m = TASK.exec(line);
    if (!m || k++ !== n) return line;
    return line.replace(/\[([ xXхХ])\]/, m[1] === ' ' ? '[x]' : '[ ]');
  });
  return props + lines.join('\n');
}

// Название заметки — имя файла без .md / .txt.
export const pageTitle = (path: string) => (path.split('/').pop() ?? path).replace(/\.(md|txt)$/i, '');

// Первые строки текста без разметки — подпись в списке и поиск.
export function pagePreview(text: string, max = 140): string {
  const plain = splitProps(text)
    .body.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^\s*(#+|>|[-*•]\s+\[[ xXхХ]\]|[-*•]|\d+[.)])\s*/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain;
}

// Editing helpers for the Markdown text area (journal, compendium). An edit replaces text[from, to) with `insert`
// and puts the selection at [a, b) afterwards (positions in the new text).
export interface TextEdit {
  from: number;
  to: number;
  insert: string;
  a: number;
  b: number;
}

// Enter inside a quote or a list carries the marker to the new line, as in Obsidian: «> », «- », «- [ ] », «2. »
// (the next number). Enter on an empty item ends the list — the marker is removed. null — an ordinary Enter.
export function continueMarkup(text: string, pos: number): TextEdit | null {
  const start = text.lastIndexOf('\n', pos - 1) + 1;
  const line = text.slice(start, pos);
  const m =
    /^(\s*)((?:>\s?)+)/.exec(line) ??
    /^(\s*)([-*+]\s+\[[ xXхХ]\]\s+)/.exec(line) ??
    /^(\s*)([-*+]\s+)/.exec(line) ??
    /^(\s*)(\d+)([.)]\s+)/.exec(line);
  if (!m) return null;
  const marker = m[0];
  // An empty item: the marker goes, the list ends.
  if (line.length === marker.length && !text.slice(pos, text.indexOf('\n', pos) < 0 ? undefined : text.indexOf('\n', pos)).trim()) {
    return { from: start, to: pos, insert: '', a: start, b: start };
  }
  let next = marker;
  if (/\[[ xXхХ]\]/.test(marker)) next = marker.replace(/\[[ xXхХ]\]/, '[ ]');
  else if (m[3] !== undefined) next = `${m[1]}${Number(m[2]) + 1}${m[3]}`;
  const insert = '\n' + next;
  return { from: pos, to: pos, insert, a: pos + insert.length, b: pos + insert.length };
}

// ⌘B / ⌘I / ⌘⇧X: wrap the selection in a mark (**, *, ~~), or unwrap it if it is already wrapped; with nothing
// selected — a pair of marks with the caret between them.
export function toggleWrap(text: string, a: number, b: number, mark: string): TextEdit {
  const n = mark.length;
  const inside = text.slice(a, b);
  if (inside.length >= 2 * n && inside.startsWith(mark) && inside.endsWith(mark)) {
    const plain = inside.slice(n, inside.length - n);
    return { from: a, to: b, insert: plain, a, b: a + plain.length };
  }
  // Single * must not take ** of bold for itself.
  const before = text.slice(a - n, a);
  const after = text.slice(b, b + n);
  const outerBold = mark === '*' && text.slice(a - 2, a) === '**' && text.slice(b, b + 2) === '**' && text.slice(a - 3, a) !== '***';
  if (before === mark && after === mark && !outerBold) {
    return { from: a - n, to: b + n, insert: inside, a: a - n, b: b - n };
  }
  return { from: a, to: b, insert: mark + inside + mark, a: a + n, b: b + n };
}
