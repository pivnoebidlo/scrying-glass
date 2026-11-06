// The GM's own tables of the old Wild magic tool, pasted text: read once into compendium tables (migrate.ts). Our surge
// table and the Wand of Wonder are compendium entries now (scripts/dnd5e-tables.json).

export interface SurgeRow {
  from: number;
  to: number;
  text: string;
}
export interface SurgeTable {
  id: string;
  title: string;
  // The die: the largest number of the table (100 for a d100).
  die: number;
  rows: SurgeRow[];
}

// «01–02», «7», «98-00» (00 — 100 on a d100).
const num = (s: string) => (s === '00' ? 100 : Number(s));
// A row starts a line (or a cell): «01–02 text», «| 01-05 | text |», «7. text», «7) text».
const HEAD = /^(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?(?:\s*[.):|]\s*|\s+)(.*)$/;
// A row inside the text of another one, as in tables whose rows were merged: «You cast slow. 06-10 You cast…».
// Only a range after the end of a sentence — numbers in the text («on a 01-25, a rhinoceros») stay.
const INNER = /(?<=[.!?…»"”)*]\s)(\d{2,3})\s*[-–—]\s*(\d{2,3})\s+(?=\S)/g;

// A table from text: a Markdown table, numbered lines or plain lines (then each line is one number: a d<lines>).
// Header and separator rows of a Markdown table, empty lines and «# …» are skipped.
export function parseTable(text: string): SurgeRow[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^\|?[\s:|-]+\|?$/.test(l))
    .map((l) => (l.startsWith('|') ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).filter(Boolean).join(' ') : l));
  const numbered = lines.filter((l) => HEAD.test(l));
  if (!numbered.length) return lines.map((text, i) => ({ from: i + 1, to: i + 1, text }));
  const rows: SurgeRow[] = [];
  for (const line of lines) {
    const m = HEAD.exec(line);
    if (!m) {
      // A line without a number goes on the row before it (a long effect on several lines).
      const last = rows.at(-1);
      if (last) last.text = `${last.text} ${line}`;
      continue;
    }
    let from = num(m[1]!);
    let to = m[2] ? num(m[2]) : from;
    let rest = m[3]!;
    for (const inner of [...rest.matchAll(INNER)]) {
      const at = rest.indexOf(inner[0]);
      rows.push({ from, to, text: rest.slice(0, at).trim() });
      from = num(inner[1]!);
      to = num(inner[2]!);
      rest = rest.slice(at + inner[0].length);
    }
    rows.push({ from, to, text: rest.trim() });
  }
  return rows.filter((r) => r.text && r.to >= r.from);
}

export const dieOf = (rows: SurgeRow[]) => rows.reduce((n, r) => Math.max(n, r.to), 0);

// «01–02» on a d100, «7» on a d8.
export function rangeText(r: SurgeRow, die: number): string {
  const pad = (n: number) => (die >= 100 && n < 100 ? String(n).padStart(2, '0') : String(n));
  return r.from === r.to ? pad(r.from) : `${pad(r.from)}–${pad(r.to)}`;
}

// The GM's tables in the library file: { tables: [{ id, title, text }] } — the text as pasted (parsed on load).
export interface OwnTable {
  id: string;
  title: string;
  text: string;
}
export function parseOwnTables(data: unknown): OwnTable[] {
  const list = (data as { tables?: unknown } | null)?.tables;
  if (!Array.isArray(list)) return [];
  return list.flatMap((x) => {
    const t = x as Partial<OwnTable>;
    return typeof t.id === 'string' && typeof t.title === 'string' && typeof t.text === 'string' ? [{ id: t.id, title: t.title, text: t.text }] : [];
  });
}

// As a table of the compendium.
export function tableBody(o: OwnTable): { die: number; body: string } | null {
  const rows = parseTable(o.text);
  if (!rows.length) return null;
  const die = dieOf(rows);
  const cell = (s: string) => s.replace(/\|/g, '/');
  return { die, body: [`| d${die} | ${o.title} |`, '|---|---|', ...rows.map((r) => `| ${rangeText(r, die).replace('–', '-')} | ${cell(r.text)} |`)].join('\n') };
}
