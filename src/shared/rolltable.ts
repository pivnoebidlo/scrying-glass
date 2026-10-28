// Roll tables: a compendium entry of the type `table` (so they live in supplements, get published with them, are found
// by search and [[links]]). The table itself is the entry's text — readable as is, here and in Obsidian:
//
//   ---
//   type: table
//   roll: d10 × d6
//   crit: true
//   ---
//   | d10 \ d6 | 1–2      | 3–4         | 5–6          |
//   |----------|----------|-------------|--------------|
//   | 1–5      | [[Cuts]] | [[Bruises]] | [[Fractures]] |
//   | 6–10     | …        |             |              |
//
// - A Markdown table whose first column is ranges («1», «01–05», «00» = 100, «11+»). Its other columns are the result
//   (joined), or — when the header cells after the first are ranges too — a grid: one roll picks the row, another the
//   column. Without a Markdown table: numbered lines («1–3 text», «4. text»), else every line or list item is one
//   number.
// - `roll` (optional): the dice. «2d6», «d10 + d6» — summed; «d10 × d6» (or «,») — a grid: the first picks the row,
//   the second the column. Without it — a die as big as the last range (a d<lines> for plain lines).
// - A result may hold rolls «{2d6}» (rolled with the table) and [[links]]: a link to another table is rolled too
//   (a chain: crit → body part → effect), other links stay links (an entry, a creature).
// - `crit` / `fumble`: the roll log offers the table on a natural 20 / 1.
// Pure functions: the windows roll, tests check.
import { diceText, parseDice, type DiceExpr } from './dice';

export const TABLE_TYPE = 'table';
// A result shown to the players: the handout's «path» (no file behind it).
export const ROLL_RESULT = 'roll:';

export interface Range {
  from: number;
  to: number;
}
export interface TableRow {
  range: Range;
  // The result; a grid — one per column.
  cells: string[];
}
export interface RollTable {
  rows: TableRow[];
  // A grid: the ranges of its columns.
  cols?: Range[];
  // The dice for the row and (a grid) for the column.
  rowDice: DiceExpr;
  colDice?: DiceExpr;
}

const RANGE = /^(\d{1,3})\s*(?:([-–—])\s*(\d{1,3})|(\+))?$/;
// «00» on a d100 is 100.
const num = (s: string) => (/^0+$/.test(s) ? 10 ** s.length : Number(s));
export function parseRange(text: string): Range | null {
  const m = RANGE.exec(text.replace(/\*\*/g, '').trim());
  if (!m) return null;
  const from = num(m[1]!);
  const to = m[3] ? num(m[3]) : m[4] ? 1000 : from;
  return to >= from ? { from, to } : null;
}

const cellsOf = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());
const isSeparator = (line: string) => /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes('-');

// «1–3 text», «4. text», «5: text», «6) text».
const NUMBERED = /^(\d{1,3}(?:\s*[-–—]\s*\d{1,3}|\+)?)\s*[.:)]?\s+(\S.*)$/;

const uniform = (texts: string[]): TableRow[] => texts.map((text, i) => ({ range: { from: i + 1, to: i + 1 }, cells: [text] }));
const last = (ranges: Range[]) => ranges.reduce((n, r) => Math.max(n, r.to === 1000 ? r.from : r.to), 0);
const dieOf = (sides: number): DiceExpr => ({ dice: [{ count: 1, sides: Math.max(1, sides) }], bonus: 0 });

// The dice of the `roll` field: one expression, or two for a grid («d10 × d6», «d10, d6»).
function parseRoll(roll: string): DiceExpr[] {
  return roll
    .split(/[×,;]|\s[xх*]\s/)
    .map((s) => parseDice(s))
    .filter((x): x is DiceExpr => x !== null);
}

// The table of an entry's text; null — there is none.
export const parseRollTable = (body: string, roll = ''): RollTable | null => splitTable(body, roll).table;

// The table and the rest of the text (the description around it: the lines that aren't the table).
export function splitTable(body: string, roll = ''): { table: RollTable | null; intro: string } {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const dice = parseRoll(roll);
  const rest = (from: number, to: number) => [...lines.slice(0, from), ...lines.slice(to)].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  // The first Markdown table with ranges in its first column.
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]!.trim().startsWith('|') || !isSeparator(lines[i + 1] ?? '')) continue;
    const head = cellsOf(lines[i]!);
    const body: string[][] = [];
    let j = i + 2;
    for (; j < lines.length && lines[j]!.trim().startsWith('|'); j++) body.push(cellsOf(lines[j]!));
    const ranged = body.filter((r) => parseRange(r[0] ?? ''));
    const colRanges = head.slice(1).map(parseRange);
    if (ranged.length && colRanges.length >= 2 && colRanges.every((r) => r)) {
      const cols = colRanges as Range[];
      const rows = ranged.map((r) => ({ range: parseRange(r[0]!)!, cells: cols.map((_, k) => r[k + 1] ?? '') }));
      return { table: { rows, cols, rowDice: dice[0] ?? dieOf(last(rows.map((r) => r.range))), colDice: dice[1] ?? dieOf(last(cols)) }, intro: rest(i, j) };
    }
    if (ranged.length) {
      const rows = ranged.map((r) => ({ range: parseRange(r[0]!)!, cells: [r.slice(1).filter(Boolean).join(' — ')] }));
      return { table: { rows, rowDice: dice[0] ?? dieOf(last(rows.map((r) => r.range))) }, intro: rest(i, j) };
    }
    // A table without numbers: each row is one.
    const rows = uniform(body.map((r) => r.filter(Boolean).join(' — ')).filter(Boolean));
    if (rows.length) return { table: { rows, rowDice: dice[0] ?? dieOf(rows.length) }, intro: rest(i, j) };
    i = j;
  }
  // Numbered lines, else list items. Headings, quotes and other lines are the description.
  const used = new Set<number>();
  const numbered = lines.flatMap((l, k) => {
    const m = NUMBERED.exec(l.trim().replace(/^[-*]\s+/, ''));
    const range = m ? parseRange(m[1]!) : null;
    if (!range) return [];
    used.add(k);
    return [{ range, cells: [m![2]!.trim()] }];
  });
  const others = () => lines.filter((_, k) => !used.has(k)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (numbered.length) return { table: { rows: numbered, rowDice: dice[0] ?? dieOf(last(numbered.map((r) => r.range))) }, intro: others() };
  const items = lines.flatMap((l, k) => (/^\s*[-*]\s+/.test(l) ? (used.add(k), [l.trim().replace(/^[-*]\s+/, '')]) : []));
  const rows = uniform(items);
  return rows.length ? { table: { rows, rowDice: dice[0] ?? dieOf(rows.length) }, intro: others() } : { table: null, intro: body.trim() };
}

const inRange = (r: Range, n: number) => n >= r.from && n <= r.to;

export interface DiceThrow {
  expr: string;
  faces: number[];
  total: number;
}
function throwDice(e: DiceExpr, die: (sides: number) => number): DiceThrow {
  const faces = e.dice.flatMap((d) => Array.from({ length: d.count }, () => die(d.sides)));
  return { expr: diceText(e), faces, total: faces.reduce((a, b) => a + b, 0) + e.bonus };
}

// «{2d6}», «{1d4+1}» in a result: rolled, the total in bold with the dice after it.
const INLINE = /\{([^{}]+)\}/g;
export function rollInline(text: string, die: (sides: number) => number): string {
  return text.replace(INLINE, (all, expr: string) => {
    const e = parseDice(expr);
    if (!e) return all;
    const r = throwDice(e, die);
    return `**${r.total}** (${r.expr}${r.faces.length > 1 || e.bonus ? `: ${r.faces.join(' + ')}` : ''})`;
  });
}

export interface TableHit {
  row: DiceThrow;
  col?: DiceThrow;
  // The result as written; null — no row (or cell) for that number.
  text: string | null;
}
export function rollOnTable(table: RollTable, die: (sides: number) => number): TableHit {
  const row = throwDice(table.rowDice, die);
  const r = table.rows.find((x) => inRange(x.range, row.total));
  if (!table.cols) return { row, text: r?.cells[0] || null };
  const col = throwDice(table.colDice ?? dieOf(last(table.cols)), die);
  const k = table.cols.findIndex((c) => inRange(c, col.total));
  return { row, col, text: (r && k >= 0 ? r.cells[k] : '') || null };
}

// [[Name]] and [[Name|text]] in a result.
const LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
export const linksIn = (text: string) => [...text.matchAll(LINK)].map((m) => m[1]!.trim());

export interface TableSource {
  title: string;
  // Where the entry is (opens it from the log).
  path?: string;
  table: RollTable;
}
export interface TableStep {
  title: string;
  path?: string;
  // How deep in the chain: 0 — the table rolled.
  depth: number;
  dice: string;
  // The result, inline rolls done; null — no row for the number.
  text: string | null;
}

// Roll a table and every table its result links to, depth first: the steps in reading order. A table already in the
// chain is not rolled again (no loops), and a chain stops at MAX_DEPTH.
export const MAX_DEPTH = 6;
export function runTable(start: TableSource, resolve: (name: string) => TableSource | null, die: (sides: number) => number): TableStep[] {
  const steps: TableStep[] = [];
  const walk = (src: TableSource, depth: number, seen: Set<string>) => {
    const hit = rollOnTable(src.table, die);
    const dice = [hit.row, hit.col].filter((x): x is DiceThrow => !!x).map((d) => `${d.expr}: ${d.faces.length > 1 ? `${d.faces.join(' + ')} = ` : ''}${d.total}`).join(' · ');
    steps.push({ title: src.title, ...(src.path ? { path: src.path } : {}), depth, dice, text: hit.text === null ? null : rollInline(hit.text, die) });
    if (hit.text === null || depth >= MAX_DEPTH) return;
    for (const name of linksIn(hit.text)) {
      const next = resolve(name);
      const key = next?.path ?? next?.title;
      if (!next || !key || seen.has(key)) continue;
      walk(next, depth + 1, new Set([...seen, key]));
    }
  };
  walk(start, 0, new Set([start.path ?? start.title]));
  return steps;
}

// The steps as Markdown: for the players' screen and Telegram.
export function stepsMarkdown(steps: TableStep[], none: string): string {
  return steps.map((s) => `${'  '.repeat(s.depth)}- **${s.title}** (${s.dice}): ${s.text ?? none}`).join('\n');
}

// ---------- The editor's model: rows to fill in, written back as a Markdown table ----------
// The entry stays a plain Markdown file (published, searched, editable by hand); the editor reads it into rows and
// writes them back. A table in another form (numbered lines, a list) becomes a Markdown table on the first save.

export interface EditRow {
  from: number;
  to: number;
  // One cell; a grid — one per column.
  cells: string[];
}
export interface TableModel {
  // The die for the rows and (a grid) for the columns, as the GM writes them: «к6», «2d6».
  dice: string;
  colDice: string | null;
  rows: EditRow[];
  // A grid: the ranges of the columns.
  cols: Range[];
  // The text around the table (a description).
  intro: string;
}

// «к6», «2к6», «d10 + 2» in the letter of the language.
export const diceLabel = (e: DiceExpr, letter: string) =>
  e.dice.map((d) => `${d.count > 1 ? d.count : ''}${letter}${d.sides}`).join(' + ') + (e.bonus ? (e.bonus > 0 ? ` + ${e.bonus}` : ` − ${-e.bonus}`) : '');

// The lowest and highest total of the dice (null — not dice).
export function diceSpan(text: string): Range | null {
  const e = parseDice(text);
  if (!e) return null;
  return { from: e.dice.reduce((n, d) => n + d.count, 0) + e.bonus, to: e.dice.reduce((n, d) => n + d.count * d.sides, 0) + e.bonus };
}

// Rows for a span of numbers: one per number up to 20, else ten equal parts (a d100 — 1–10, 11–20…).
export function rowsFor(span: Range, cells = 1): EditRow[] {
  const n = span.to - span.from + 1;
  const parts = n <= 20 ? n : 10;
  return Array.from({ length: parts }, (_, i) => ({
    from: span.from + Math.floor((i * n) / parts),
    to: span.from + Math.floor(((i + 1) * n) / parts) - 1,
    cells: Array.from({ length: cells }, () => ''),
  }));
}
export const colsFor = (span: Range): Range[] => rowsFor(span, 0).map(({ from, to }) => ({ from, to }));

const ROLL_SPLIT = /[×,;]|\s[xх*]\s/;
export function tableModel(body: string, roll: string, letter: string): TableModel {
  const { table, intro } = splitTable(body, roll);
  const parts = roll.split(ROLL_SPLIT).map((s) => s.trim()).filter((s) => parseDice(s));
  if (!table) return { dice: `${letter}6`, colDice: null, rows: rowsFor({ from: 1, to: 6 }), cols: [], intro };
  return {
    dice: parts[0] ?? diceLabel(table.rowDice, letter),
    colDice: table.cols ? (parts[1] ?? diceLabel(table.colDice!, letter)) : null,
    rows: table.rows.map((r) => ({ from: r.range.from, to: r.range.to === 1000 ? r.range.from : r.range.to, cells: [...r.cells] })),
    cols: table.cols ? table.cols.map((c) => ({ ...c })) : [],
    intro,
  };
}

export const rangeText = (r: Range) => (r.from === r.to ? String(r.from) : `${r.from}–${r.to}`);
// A cell on one line, without the column bar.
const cellText = (s: string) => s.replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();

// The model as the entry's text and its `roll` field. `result` — the title of the result column.
export function modelMarkdown(m: TableModel, result: string): { body: string; roll: string } {
  const grid = !!m.colDice && m.cols.length > 0;
  const head = grid ? [`${m.dice} \\ ${m.colDice}`, ...m.cols.map(rangeText)] : [m.dice, result];
  const line = (cells: string[]) => `| ${cells.map((c) => cellText(c) || ' ').join(' | ')} |`;
  const table = [
    line(head),
    `|${head.map(() => '---').join('|')}|`,
    ...m.rows.map((r) => line([rangeText(r), ...(grid ? m.cols.map((_, k) => r.cells[k] ?? '') : [r.cells[0] ?? ''])])),
  ].join('\n');
  return { body: `${m.intro.trim() ? `${m.intro.trim()}\n\n` : ''}${table}\n`, roll: grid ? `${m.dice} × ${m.colDice}` : m.dice };
}

// Numbers of the span no row covers, and those two rows cover.
export function coverage(ranges: Range[], span: Range): { gaps: number[]; overlaps: number[] } {
  const gaps: number[] = [];
  const overlaps: number[] = [];
  for (let n = span.from; n <= span.to && n - span.from < 1000; n++) {
    const k = ranges.filter((r) => inRange(r, n)).length;
    if (!k) gaps.push(n);
    else if (k > 1) overlaps.push(n);
  }
  return { gaps, overlaps };
}

// «3, 5–7, 9» — numbers as short ranges.
export function numbersText(list: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < list.length; ) {
    let j = i;
    while (j + 1 < list.length && list[j + 1] === list[j]! + 1) j++;
    out.push(rangeText({ from: list[i]!, to: list[j]! }));
    i = j + 1;
  }
  return out.join(', ');
}
