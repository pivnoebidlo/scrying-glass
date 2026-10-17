// Built-in Fate Core compendium: resources/compendium/fate-core.<lang>.json from scripts/fate-core.<lang>.md.
// Run: npm run build-fate. Texts are edited in the .md files; do not edit the JSON by hand.
//
// Source format: an entry starts with «@@ Title (English)» (an English file — just «@@ Title»), then «key: value»
// fields up to an empty line (aliases — comma-separated), then the entry text. A leading <!-- … --> comment is skipped.
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../resources/compendium');

type Value = string | string[];
interface Entry {
  title: string;
  en?: string;
  ru?: string;
  type: string;
  fields: Record<string, Value>;
  body: string;
}

function parse(file: string, lang: string): Entry[] {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/^<!--[\s\S]*?-->\s*/, '');
  const entries: Entry[] = [];
  for (const chunk of text.split(/^@@ /m).slice(1)) {
    const lines = chunk.split('\n');
    const head = (lang === 'en' ? /^(.+?)\s*$/ : /^(.+?)(?:\s+\(([^)]+)\))?\s*$/).exec(lines[0]!)!;
    const fields: Record<string, Value> = {};
    let i = 1;
    for (; i < lines.length && lines[i]!.trim(); i++) {
      const m = /^(\w+):\s*(.*)$/.exec(lines[i]!);
      if (!m) throw new Error(`«${head[1]}»: a field line without «key: value»: ${lines[i]}`);
      fields[m[1]!] = m[1] === 'aliases' ? m[2]!.split(',').map((x) => x.trim()).filter(Boolean) : m[2]!.trim();
    }
    const { type, ...rest } = fields;
    if (typeof type !== 'string') throw new Error(`«${head[1]}»: no type`);
    entries.push({ title: head[1]!.trim(), ...(head[2] ? { en: head[2].trim() } : {}), type, fields: rest, body: lines.slice(i).join('\n').trim() });
  }
  // [[Links]] must lead to entries of the same book.
  const titles = new Set(entries.flatMap((e) => [e.title.toLowerCase(), ...((e.fields['aliases'] as string[] | undefined) ?? []).map((a) => a.toLowerCase())]));
  for (const e of entries) {
    for (const m of e.body.matchAll(/\[\[([^\]|#]+)/g)) {
      if (!titles.has(m[1]!.trim().toLowerCase())) throw new Error(`${lang} «${e.title}»: a link to an unknown entry [[${m[1]}]]`);
    }
  }
  return entries;
}

const SOURCE: Record<string, Record<string, string>> = {
  ru: { title: 'Fate Core SRD', license: 'CC-BY-3.0', attribution: 'Evil Hat Productions; перевод — Scrying Glass', translator: 'Scrying Glass', url: 'https://fate-srd.com/fate-core' },
  en: { title: 'Fate Core SRD', license: 'CC-BY-3.0', attribution: 'Evil Hat Productions; retold for Scrying Glass', url: 'https://fate-srd.com/fate-core' },
};

const books: Record<string, Entry[]> = {};
for (const lang of Object.keys(SOURCE)) {
  const file = path.resolve(import.meta.dirname, `fate-core.${lang}.md`);
  if (fs.existsSync(file)) books[lang] = parse(file, lang);
}
// English entries get the Russian title (found by a name from a Russian card or note).
const ruByEn = new Map((books['ru'] ?? []).filter((e) => e.en).map((e) => [e.en!.toLowerCase(), e.title]));
for (const e of books['en'] ?? []) {
  const ru = ruByEn.get(e.title.toLowerCase());
  if (ru) e.ru = ru;
  else console.log(`  en «${e.title}» has no Russian pair`);
}
for (const [lang, entries] of Object.entries(books)) {
  const out = path.join(OUT, `fate-core.${lang}.json`);
  fs.writeFileSync(out, JSON.stringify({ system: 'fate-core', lang, source: SOURCE[lang], entries }) + '\n');
  console.log(`${out}: ${entries.length} entries`);
}
