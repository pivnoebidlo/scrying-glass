// Разметка текста записи справочника и заметки журнала (Markdown, как в Obsidian, в разумном объёме): заголовки
// «#»…«###», абзацы, списки «-»/«*» и «1.», таблицы «| a | b |», цитаты «>» (подряд идущие строки — одна цитата,
// пустая «>» — новый абзац в ней), черта «---», **жирный**, *курсив*, ~~зачёркнутый~~, [[ссылки]] и [[ссылка|подпись]].
// Весь текст экранируется; ссылки — <a class="wikilink"
// data-link="…"> (щелчок обрабатывает тот, кто показывает).
// Для журнала (opts): задачи «- [ ]» / «- [x]» — флажки <input data-task="номер задачи по порядку"> (переключает
// toggleTask из shared/journal.ts), {2d6+3} — кнопка броска <button class="dice" data-dice="…">.
import { t } from '../../../shared/i18n';
import { parseDice } from '../../../shared/dice';
import { TASK } from '../../../shared/journal';
import { escape } from '../markdown';

export interface MarkupOpts {
  tasks?: boolean;
  dice?: boolean;
}

function inline(s: string, opts: MarkupOpts = {}): string {
  let out = escape(s);
  if (opts.dice)
    out = out.replace(/\{([^{}]+)\}/g, (all, body: string) =>
      /^\s*\d*\s*[dдкk]\s*\d+/iu.test(body) && parseDice(body) ? `<button type="button" class="dice" data-dice="${body.trim()}" title="${t('lib.roll')}">${body.trim()}</button>` : all
    );
  return out
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_all, name: string, label?: string) => `<a class="wikilink" data-link="${name.trim()}">${(label ?? name).trim()}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_(.+?)_(?=$|[\s.,;:)])/g, '$1<em>$2</em>');
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function entryHtml(text: string, opts: MarkupOpts = {}): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let task = 0;
  const inl = (s: string) => inline(s, opts);
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inl).join('<br>')}</p>`);
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flush();
      out.push('<hr>');
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      out.push(`<h${h[1]!.length + 1}>${inl(h[2]!)}</h${h[1]!.length + 1}>`);
      continue;
    }
    // Таблица: строка «| … |», следом «|---|…».
    if (/^\s*\|/.test(line) && /^\s*\|?[\s:-]+\|/.test(lines[i + 1] ?? '')) {
      flush();
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i]!)) rows.push(cells(lines[i++]!));
      i--;
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    const li = /^\s*([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      flush();
      const ordered = /\d/.test(li[1]!);
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^\s*([-*•]|\d+[.)])\s+(.*)$/.exec(lines[i]!);
        if (!m) break;
        const t = opts.tasks ? TASK.exec(lines[i]!) : null;
        if (t) items.push(`<li class="task"><input type="checkbox" data-task="${task++}"${t[1] === ' ' ? '' : ' checked'}><span>${inl(t[2]!)}</span></li>`);
        else items.push(`<li>${inl(m[2]!)}</li>`);
        i++;
      }
      i--;
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^>/.test(line)) {
      flush();
      const paras: string[][] = [[]];
      for (; i < lines.length && /^>/.test(lines[i]!); i++) {
        const q = lines[i]!.replace(/^>\s?/, '');
        if (q.trim()) paras.at(-1)!.push(q);
        else if (paras.at(-1)!.length) paras.push([]);
      }
      i--;
      out.push(`<blockquote>${paras.filter((p) => p.length).map((p) => `<p>${p.map(inl).join('<br>')}</p>`).join('')}</blockquote>`);
      continue;
    }
    para.push(line);
  }
  flush();
  return out.join('');
}
