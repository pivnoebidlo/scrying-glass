// Generators as data: a package brings tables and recipes (generators/<name>.json, shared/content.ts); this engine rolls
// a recipe, the page (modules/tools/generators) knows no game. A file may come from a stranger: `validateGenerators`
// takes only what it knows, and a recipe is steps, never code: numbers are the tiny language of formulas (with d(n) and
// comparisons), and every run is capped. Pure: the core, the windows and the tests use it.
//
//   { "let": "size", "dice": "2d6", "keep": "low", "count": 1 }      a number, shown with the next line
//   { "let": "gov", "dice": "d6", "quiet": true }                    the same, not shown
//   { "let": "two", "formula": "size * 2" }
//   { "let": "kind", "table": "roomType", "lookup": "r" }            the row whose first column holds r
//   { "let": "beast", "table": "roomCreature", "row": "c - 1", "col": "kind + 1", "is": "X" }   1 if the cell has it
//   { "line": { "en": "Size" }, "table": "size", "dice": "d20" }     a line: the row by the die
//   { "line": …, "parts": [{ "table": "names", "row": "d(12) - 1", "col": "d(2)" }, …], "join": "name" }
//   { "repeat": "rooms", "as": "n", "steps": […] }, { "if": "ge(size, 3)", "then": […], "else": […] }
//
// A line may have `text` («{0} {1} · {2}», cells by number, {low0} — in small letters, numbers by name), `notes` (shown beside it, each with its
// `if`), `sub` (nested lines), `sep` (a rule above) and `card` (a button that makes a card of it).
import { format, type Lang, type Msg } from './i18n/core';
import { calc, parseFormula } from './syspack';
import type { CardKind } from './cards';

export const GENERATORS_FILE = 'generators';

export interface GenTable {
  head: string[];
  rows: string[][];
}

// A text in several languages, plural forms allowed (`count`).
export type GenText = string | Record<string, Msg>;

export interface GenCellRef {
  table: string;
  // A row: its number from 0, the row whose first column holds the number, or inside a group of rows.
  row?: string;
  lookup?: string;
  group?: [string, string];
  // Any row, all alike.
  any?: boolean;
  // The column; none — the last.
  col?: string;
}

export type GenStep =
  | { let: string; dice?: string; keep?: 'low' | 'high'; count?: number; formula?: string; of?: GenCellRef; table?: string; lookup?: string; row?: string; col?: string; is?: string; quiet?: boolean }
  | GenLineStep
  | { repeat: string; as?: string; steps: GenStep[] }
  | { if: string; then: GenStep[]; else?: GenStep[] };

export interface GenNote {
  if?: string;
  text: GenText;
  warn?: boolean;
}

export interface GenCardSpec {
  kind: CardKind;
  name: GenCellRef;
  // Stats: a field → a formula.
  stats: Record<string, string>;
  // Values as they are.
  fixed?: Record<string, unknown>;
}

export interface GenLineStep extends Partial<GenCellRef> {
  line: GenText;
  dice?: string;
  parts?: GenCellRef[];
  join?: 'name';
  text?: GenText;
  notes?: GenNote[];
  sep?: boolean;
  sub?: GenStep[];
  card?: GenCardSpec;
}

export interface GenOption {
  key: string;
  title: GenText;
  type: 'number' | 'check' | 'select';
  default?: number | string | boolean;
  min?: number;
  max?: number;
  hint?: GenText;
  // Only when the option is off / on.
  when?: string;
  choices?: { value: string; title: GenText }[];
  // A select of the rows of a table: the value is the row's number.
  rows?: { table: string; cols: number[] };
}

export interface Generator {
  id: string;
  title: GenText;
  options?: GenOption[];
  steps: GenStep[];
  // A line under the result: { if, text } over the numbers left at the end.
  footer?: GenNote;
}

export interface GeneratorFile {
  scryingGlass: 'generators';
  version: 1;
  system: string;
  title?: GenText;
  about?: GenText;
  tables: Record<string, Record<string, GenTable>>;
  generators: Generator[];
}

export type GenOptions = Record<string, number | string | boolean>;

export interface GenCell {
  table: string;
  row: number;
  col?: number;
}
export interface GenLine {
  label: GenText;
  params?: Record<string, number | string>;
  cells: GenCell[];
  join?: 'name';
  text?: GenText;
  roll?: string;
  notes?: { text: GenText; warn?: boolean }[];
  sep?: boolean;
  sub?: GenLine[];
  card?: { kind: CardKind; name: GenCell; stats: Record<string, unknown> };
}
export interface GenResult {
  generator: string;
  lines: GenLine[];
  footer?: GenText;
  params?: Record<string, number | string>;
}

type Roll = (sides: number) => number;

// ---- Reading a file ----
const ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,40}$/;
const CAP = { tables: 200, rows: 400, cols: 12, cell: 2000, generators: 40, steps: 400, depth: 8, options: 12, choices: 40 };
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= CAP.cell;
const form = (x: unknown): x is string => typeof x === 'string' && x.length <= 200 && !!parseFormula(x);
const text = (x: unknown): x is GenText =>
  str(x) || (isObj(x) && Object.values(x).every((v) => str(v) || (isObj(v) && Object.values(v).every(str))));
const refOk = (r: unknown): boolean =>
  isObj(r) &&
  str(r['table']) &&
  (r['row'] === undefined || form(r['row'])) &&
  (r['lookup'] === undefined || form(r['lookup'])) &&
  (r['col'] === undefined || form(r['col'])) &&
  (r['group'] === undefined || (Array.isArray(r['group']) && r['group'].length === 2 && r['group'].every(form)));
const notesOk = (n: unknown) => Array.isArray(n) && n.every((x) => isObj(x) && text(x['text']) && (x['if'] === undefined || form(x['if'])));

function stepOk(s: unknown, depth: number): boolean {
  if (!isObj(s) || depth > CAP.depth) return false;
  const list = (x: unknown) => Array.isArray(x) && x.length <= CAP.steps && x.every((y) => stepOk(y, depth + 1));
  if (typeof s['let'] === 'string') return ID_RE.test(s['let']) && (s['formula'] === undefined || form(s['formula'])) && (s['of'] === undefined || refOk(s['of'])) && (s['table'] === undefined || refOk(s));
  if (s['line'] !== undefined) {
    if (!text(s['line'])) return false;
    if (s['parts'] !== undefined && !(Array.isArray(s['parts']) && s['parts'].length <= CAP.cols && s['parts'].every(refOk))) return false;
    if (s['table'] !== undefined && !refOk(s)) return false;
    if (s['notes'] !== undefined && !notesOk(s['notes'])) return false;
    if (s['sub'] !== undefined && !list(s['sub'])) return false;
    return true;
  }
  if (typeof s['repeat'] === 'string') return form(s['repeat']) && list(s['steps']);
  if (typeof s['if'] === 'string') return form(s['if']) && list(s['then']) && (s['else'] === undefined || list(s['else']));
  return false;
}

export function validateGenerators(x: unknown): GeneratorFile | string {
  if (!isObj(x) || x['scryingGlass'] !== 'generators') return 'not-generators';
  if (x['version'] !== 1) return 'version';
  if (!str(x['system'])) return 'system';
  if (!isObj(x['tables']) || !Array.isArray(x['generators'])) return 'parts';
  for (const list of Object.values(x['tables'])) {
    if (!isObj(list) || Object.keys(list).length > CAP.tables) return 'tables';
    for (const t of Object.values(list)) {
      if (!isObj(t) || !Array.isArray(t['rows']) || t['rows'].length > CAP.rows) return 'tables';
      if (!t['rows'].every((r) => Array.isArray(r) && r.length <= CAP.cols && r.every((c) => typeof c === 'string' && c.length <= CAP.cell))) return 'tables';
    }
  }
  for (const g of x['generators'].slice(0, CAP.generators)) {
    if (!isObj(g) || !str(g['id']) || !ID_RE.test(g['id']) || !text(g['title']) || !Array.isArray(g['steps']) || g['steps'].length > CAP.steps) return 'generator';
    if (!g['steps'].every((s) => stepOk(s, 0))) return `steps:${g['id']}`;
    if (g['options'] !== undefined && !(Array.isArray(g['options']) && g['options'].length <= CAP.options && g['options'].every((o) => isObj(o) && str(o['key']) && ID_RE.test(o['key']) && text(o['title'])))) return `options:${g['id']}`;
  }
  return x as unknown as GeneratorFile;
}

// ---- Rolling ----
// «3-5», «3–5», «5+», «11» → [from, to].
export function rangeOf(cell: string): [number, number] | null {
  const m = /^(\d+)\s*(?:([-–])\s*(\d+)|(\+))?$/.exec(cell.trim());
  if (!m) return null;
  const from = Number(m[1]);
  return [from, m[3] ? Number(m[3]) : m[4] ? Infinity : from];
}

// The language the numbers of the tables are read in: any has them, the first is enough.
const baseOf = (f: GeneratorFile) => f.tables['en'] ?? Object.values(f.tables)[0] ?? {};

export function runGenerator(file: GeneratorFile, id: string, options: GenOptions, roll: Roll): GenResult {
  const gen = file.generators.find((g) => g.id === id);
  if (!gen) return { generator: id, lines: [] };
  const base = baseOf(file);
  const vars = new Map<string, number | string>();
  for (const o of gen.options ?? []) {
    const v = options[o.key] ?? o.default ?? (o.type === 'select' ? 0 : 0);
    vars.set(o.key, typeof v === 'boolean' ? Number(v) : v);
  }
  let budget = 20000;
  const name = (n: string) => n.replace(/\{(\w+)\}/g, (_, k: string) => String(vars.get(k) ?? ''));
  const num = (n: string) => {
    const v = vars.get(n);
    return typeof v === 'number' ? v : 0;
  };
  const n = (text: string) => calc(text, num, roll);
  const sheet = (t: string) => base[name(t)] ?? { head: [], rows: [] };

  const rowOf = (r: GenCellRef): number => {
    const rows = sheet(r.table).rows;
    if (r.any) return roll(rows.length) - 1;
    if (r.group) {
      const [g, at] = [n(r.group[0]), n(r.group[1])];
      const start = rows.findIndex((x) => x[0] === String(g));
      if (start < 0) return 0;
      const next = rows.slice(start + 1).findIndex((x) => x[0] !== '');
      const size = next < 0 ? rows.length - start : next + 1;
      return start + Math.min(size, at) - 1;
    }
    if (r.lookup !== undefined) {
      const v = n(r.lookup);
      const at = rows.findIndex((x) => {
        const range = rangeOf(x[0] ?? '');
        return !!range && v >= range[0] && v <= range[1];
      });
      return Math.max(0, at);
    }
    return Math.max(0, Math.min(rows.length - 1, Math.round(n(r.row ?? '0'))));
  };
  const cellOf = (r: GenCellRef): GenCell => ({ table: name(r.table), row: rowOf(r), ...(r.col !== undefined ? { col: Math.round(n(r.col)) } : {}) });
  const cellText = (c: GenCell) => {
    const row = sheet(c.table).rows[c.row] ?? [];
    return row[c.col ?? row.length - 1] ?? '';
  };

  function throwDice(dice: string): { total: number; all: number[]; label: string } {
    const m = /^(\d*)d(\d+)$/.exec(dice.trim());
    if (!m) return { total: 0, all: [], label: dice };
    const all = Array.from({ length: Math.min(100, Number(m[1] || 1)) }, () => roll(Number(m[2])));
    return { total: all.reduce((a, b) => a + b, 0), all, label: dice };
  }

  let pending: string[] = [];
  const params = () => Object.fromEntries(vars);
  function walk(steps: GenStep[], out: GenLine[]) {
    for (const s of steps) {
      if (--budget < 0) return;
      if ('let' in s) {
        let value = 0;
        if (s.dice) {
          const r = throwDice(s.dice);
          if (s.keep) {
            const kept = [...r.all].sort((a, b) => (s.keep === 'low' ? a - b : b - a)).slice(0, s.count ?? 1);
            value = kept.reduce((a, b) => a + b, 0);
            if (!s.quiet) pending.push(`${r.label}${s.keep === 'low' ? '↓' : '↑'}: ${r.all.join(', ')} → ${value}`);
          } else {
            value = r.total;
            if (!s.quiet) pending.push(`${r.label}: ${value}`);
          }
        } else if (s.of) {
          const r = throwDice(cellText(cellOf(s.of)).match(/\d*d\d+/)?.[0] ?? '');
          value = r.total;
          if (!s.quiet) pending.push(`${r.label}: ${value}`);
        } else if (s.table) {
          const c = cellOf(s as GenCellRef);
          value = s.is !== undefined ? Number(cellText({ ...c, col: c.col ?? 1 }).includes(s.is)) : c.row;
        } else if (s.formula !== undefined) value = n(s.formula);
        vars.set(s.let, value);
      } else if ('line' in s) {
        if (s.dice) {
          const r = throwDice(s.dice);
          vars.set('rolled_', r.total);
          pending.push(`${r.label}: ${r.total}`);
        }
        const refs = s.parts ?? (s.table ? [{ ...(s as GenCellRef), ...(s.dice ? { lookup: 'rolled_' } : {}) }] : []);
        const cells = refs.map(cellOf);
        const line: GenLine = { label: s.line, cells, params: params() };
        if (s.join) line.join = s.join;
        if (s.text) line.text = s.text;
        if (s.sep) line.sep = true;
        if (pending.length) line.roll = pending.join(', ');
        pending = [];
        if (s.card) {
          const stats: Record<string, unknown> = { ...s.card.fixed };
          for (const [k, f] of Object.entries(s.card.stats)) stats[k] = n(f);
          line.card = { kind: s.card.kind, name: cellOf(s.card.name), stats };
        }
        out.push(line);
        if (s.sub) {
          const inner: GenLine[] = [];
          walk(s.sub, inner);
          if (inner.length) line.sub = inner;
          line.params = params();
        }
        // After the nested steps: a note may speak of them.
        const notes = (s.notes ?? []).filter((x) => !x.if || n(x.if)).map((x) => ({ text: x.text, ...(x.warn ? { warn: true } : {}) }));
        if (notes.length) line.notes = notes;
      } else if ('repeat' in s) {
        const times = Math.max(0, Math.min(40, Math.round(n(s.repeat))));
        for (let i = 1; i <= times; i++) {
          if (s.as) vars.set(s.as, i);
          walk(s.steps, out);
        }
      } else walk(n(s.if) ? s.then : (s.else ?? []), out);
    }
  }
  const lines: GenLine[] = [];
  walk(gen.steps, lines);
  const footer = gen.footer && (!gen.footer.if || n(gen.footer.if)) ? gen.footer.text : undefined;
  return { generator: id, lines, ...(footer ? { footer, params: params() } : {}) };
}

// ---- In words ----
export function genText(t: GenText | undefined, lang: Lang, params?: Record<string, number | string>): string {
  if (t === undefined) return '';
  const m = typeof t === 'string' ? t : (t[lang] ?? t['en'] ?? Object.values(t)[0] ?? '');
  return format(lang, m, params);
}

// A cell as text; «**Hostile.** How…» keeps its Markdown.
export function genCell(file: GeneratorFile, c: GenCell, lang: Lang): string {
  const list = file.tables[lang] ?? baseOf(file);
  const row = list[c.table]?.rows[c.row] ?? [];
  return row[c.col ?? row.length - 1] ?? '';
}

export function lineWords(file: GeneratorFile, l: GenLine, lang: Lang): string {
  const parts = l.cells.map((c) => genCell(file, c, lang));
  // {0} — a cell, {low0} — the same in small letters.
  if (l.text) return genText(l.text, lang, { ...l.params, ...Object.fromEntries(parts.flatMap((p, i) => [[String(i), p], [`low${i}`, p.toLowerCase()]])) });
  if (l.join === 'name') return parts.map((p, i) => (i ? p.replace(/^-/, '').toLowerCase() : p)).join('');
  return parts.join(' — ');
}

export const plainText = (s: string) => s.replace(/\*\*/g, '');
// «d6: 4» → «к6: 4» in Russian.
export const rollWords = (s: string | undefined, lang: Lang) => (s && lang === 'ru' ? s.replace(/(^|[^a-z])(\d*)d(\d)/g, '$1$2к$3') : (s ?? ''));

export function resultMarkdown(file: GeneratorFile, r: GenResult, lang: Lang): string {
  const gen = file.generators.find((g) => g.id === r.generator);
  const out: string[] = [`## ${genText(gen?.title, lang)}`, ''];
  const add = (l: GenLine, indent: string) => {
    const x = (l.notes ?? []).map((n) => genText(n.text, lang, l.params)).join(', ');
    out.push(`${indent}- **${genText(l.label, lang, l.params)}:** ${lineWords(file, l, lang)}${x ? ` (${x})` : ''}`);
    for (const s of l.sub ?? []) add(s, indent + '  ');
  };
  for (const l of r.lines) add(l, '');
  if (r.footer) out.push('', genText(r.footer, lang, r.params));
  return out.join('\n');
}

