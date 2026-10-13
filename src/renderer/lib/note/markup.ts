// Разметка текста записки: как у карточек (*курсив*, **жирный**, списки «- …», пустая строка — абзац) плюс
// «# Заголовок», «## Подзаголовок» и «---» — украшение-разделитель. Весь текст экранируется.
import { inline, markdown } from '../markdown';

export function noteHtml(text: string): string {
  const out: string[] = [];
  let chunk: string[] = [];
  const flush = () => {
    if (chunk.join('').trim()) out.push(markdown(chunk.join('\n')));
    chunk = [];
  };
  for (const line of text.split('\n')) {
    const h = /^\s*(#{1,2})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      out.push(h[1] === '#' ? `<h1>${inline(h[2]!)}</h1>` : `<h2>${inline(h[2]!)}</h2>`);
    } else if (/^\s*-{3,}\s*$/.test(line)) {
      flush();
      out.push('<div class="orn">❧ ✦ ☙</div>');
    } else chunk.push(line);
  }
  flush();
  return out.join('');
}
