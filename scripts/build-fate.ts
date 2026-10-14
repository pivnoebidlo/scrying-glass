// Встроенный справочник Fate Core: собирает resources/compendium/fate-core.json из scripts/fate-core.md.
// Запуск: npm run build-fate. Тексты правятся в fate-core.md, JSON руками не править.
//
// Формат источника: запись начинается строкой «@@ Русское название (English)», дальше поля «ключ: значение» до
// пустой строки (aliases — через запятую), потом текст записи. Комментарий <!-- … --> в начале пропускается.
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.resolve(import.meta.dirname, 'fate-core.md');
const OUT = path.resolve(import.meta.dirname, '../resources/compendium/fate-core.json');

type Value = string | string[];
interface Entry {
  title: string;
  en?: string;
  type: string;
  fields: Record<string, Value>;
  body: string;
}

const text = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n').replace(/^<!--[\s\S]*?-->\s*/, '');
const entries: Entry[] = [];
for (const chunk of text.split(/^@@ /m).slice(1)) {
  const lines = chunk.split('\n');
  const head = /^(.+?)(?:\s+\(([^)]+)\))?\s*$/.exec(lines[0]!)!;
  const fields: Record<string, Value> = {};
  let i = 1;
  for (; i < lines.length && lines[i]!.trim(); i++) {
    const m = /^(\w+):\s*(.*)$/.exec(lines[i]!);
    if (!m) throw new Error(`«${head[1]}»: строка поля без «ключ: значение»: ${lines[i]}`);
    fields[m[1]!] = m[1] === 'aliases' ? m[2]!.split(',').map((x) => x.trim()).filter(Boolean) : m[2]!.trim();
  }
  const { type, ...rest } = fields;
  if (typeof type !== 'string') throw new Error(`«${head[1]}»: нет type`);
  entries.push({ title: head[1]!.trim(), ...(head[2] ? { en: head[2].trim() } : {}), type, fields: rest, body: lines.slice(i).join('\n').trim() });
}

// Ссылки [[…]] должны вести на записи этого же справочника.
const titles = new Set(entries.flatMap((e) => [e.title.toLowerCase(), ...((e.fields['aliases'] as string[] | undefined) ?? []).map((a) => a.toLowerCase())]));
for (const e of entries) {
  for (const m of e.body.matchAll(/\[\[([^\]|#]+)/g)) {
    if (!titles.has(m[1]!.trim().toLowerCase())) throw new Error(`«${e.title}»: ссылка на неизвестную запись [[${m[1]}]]`);
  }
}

const book = {
  system: 'fate-core',
  source: {
    title: 'Fate Core SRD',
    license: 'CC-BY-3.0',
    attribution: 'Evil Hat Productions; перевод — Scrying Glass',
    translator: 'Scrying Glass',
    url: 'https://fate-srd.com/fate-core',
  },
  entries,
};
fs.writeFileSync(OUT, JSON.stringify(book) + '\n');
console.log(`${OUT}: записей ${entries.length}`);
