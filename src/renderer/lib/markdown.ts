// Простая разметка для текстов карточек: *курсив*, _курсив_, **жирный**, строки «- …» — список,
// пустая строка — новый абзац. Возвращает безопасный HTML (весь текст экранируется).
export const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s: string): string {
  return escape(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[\s(])_(.+?)_(?=$|[\s.,;:)])/g, '$1<em>$2</em>');
}

export function markdown(text: string): string {
  const out: string[] = [];
  for (const para of text.trim().split(/\n\s*\n/)) {
    const lines = para.split('\n');
    let list: string[] = [];
    let plain: string[] = [];
    const flushList = () => {
      if (list.length) out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
      list = [];
    };
    const flushPlain = () => {
      if (plain.length) out.push(`<p>${plain.map(inline).join('<br>')}</p>`);
      plain = [];
    };
    for (const line of lines) {
      const li = /^\s*[-•]\s+(.*)$/.exec(line);
      if (li) {
        flushPlain();
        list.push(li[1]!);
      } else {
        flushList();
        plain.push(line);
      }
    }
    flushPlain();
    flushList();
  }
  return out.join('');
}
