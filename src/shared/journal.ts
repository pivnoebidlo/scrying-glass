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
