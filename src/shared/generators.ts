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
//   { "put": "inventory", "cell": {…}, "size": 10, "at": [[2, 3], [1, 2]], "pack": [4, 5, 6] }   an item: into the first
//     free place of `at`, else the first free of `pack`, else past the end
//   { "push": "attacks", "item": { "name": {…}, "dice": {…} } }      a row of a list for the card
//
// `as` names a line, so a card can take its words; `into` puts what it got into a slots field too.
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
  | GenPutStep
  | GenPushStep
  | { repeat: string; as?: string; steps: GenStep[] }
  | { if: string; then: GenStep[]; else?: GenStep[] };

export interface GenPutStep {
  put: string;
  cell?: GenCellRef;
  text?: GenText;
  size: number;
  at?: number[][];
  pack?: number[];
  usage?: number;
}

export interface GenPushStep {
  push: string;
  item: Record<string, GenCellRef>;
  // Keys written in small letters.
  lower?: string[];
}

export interface GenNote {
  if?: string;
  text: GenText;
  warn?: boolean;
}

// A text of a card: cells, joined by `text` if there is one.
export type GenCardText = { parts: GenCellRef[]; text?: GenText } | { line: string };

export interface GenCardSpec {
  kind: CardKind;
  name: GenCellRef | { line: string };
  // Stats: a field → a formula.
  stats: Record<string, string>;
  // Values as they are.
  fixed?: Record<string, unknown>;
  text?: Record<string, GenCardText>;
  // Fields filled by `put` and `push`.
  slots?: string[];
  lists?: string[];
  // A list whose rows, by their `name`, are the card's notes.
  notes?: string;
}

// A row picked among those that fit: a column holds a list of tags or nothing (`has`, an option's value; empty fits all),
// a number no higher than an option (`max`). `weights` — first a kind of row by its weight (a table: the kind, then a
// column of weights chosen by a number), `prefer` — then, with this chance, rows of that value. `unique` — a row once
// in a result. `fight` — rows of this first column are a fight: [[names]] make an encounter.
export interface GenPick {
  where?: { col: number; has?: string; max?: string }[];
  weights?: { col: number; table: string; by: string };
  prefer?: { col: number; is: string; when: string; chance: number };
  unique?: boolean;
  fight?: string;
  // Columns: the line's label, its note.
  label?: number;
  note?: number;
}

export interface GenLineStep extends Partial<GenCellRef> {
  line: GenText;
  pick?: GenPick;
  dice?: string;
  parts?: GenCellRef[];
  // Everything put and pushed there, joined by commas.
  items?: string[];
  join?: 'name';
  text?: GenText;
  notes?: GenNote[];
  sep?: boolean;
  sub?: GenStep[];
  card?: GenCardSpec;
  as?: string;
  into?: { field: string; size: number; pack: number[] };
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
  // The whole result is a card: made at the end, when all is rolled.
  card?: GenCardSpec;
  // The titles of the numbers of its steps, for the builder: a key → a title.
  names?: Record<string, GenText>;
}

// A price list: sections of tables whose rows are [name, price as text, price as a number or empty]. A click puts a row
// into a basket. Options may hide a section (`when`) or multiply some of them (`factor`).
export interface GenList {
  id: string;
  title: GenText;
  about?: GenText;
  unit: GenText;
  options?: { key: string; title: GenText; hint?: GenText; default?: boolean }[];
  factor?: { option: string; times: number; sections: string[] };
  sections: { id: string; table: string; title: GenText; note?: GenText; when?: string }[];
}

// A calculator: rows of a kind (its `value`) and a count, with a checkbox `flag`; the `row` formulas are summed under
// their names, then the `totals` go in order, each may read the ones before it and the `inputs`.
export interface GenCalculator {
  id: string;
  title: GenText;
  about?: GenText;
  rules?: GenText;
  unit: GenText;
  labels: Record<'name' | 'kind' | 'count' | 'flag' | 'flagHint' | 'value' | 'add' | 'remove', GenText>;
  kinds: { id: string; title: GenText; value: number }[];
  start?: { kind: string; count: number }[];
  row: Record<string, string>;
  inputs?: { key: string; title: GenText; default?: number; min?: number }[];
  totals: { key: string; title: GenText; formula: string; text?: GenText; strong?: boolean }[];
}

// A form: inputs, numbers counted from them and text that follows. No dice. A select's option carries numbers and words:
// `pace_hour`, `{terrain_encounter}`, `{by_title}`. `only` — for these systems of the family; hidden by it, an input
// counts as 0. `when` — a formula.
export interface FormOption {
  id: string;
  title: GenText;
  values?: Record<string, number>;
  texts?: Record<string, GenText>;
}
export interface FormInput {
  key: string;
  title: GenText;
  type: 'number' | 'select' | 'check';
  default?: number;
  min?: number;
  max?: number;
  options?: FormOption[];
  when?: string;
  only?: string[];
}
export interface FormResult {
  kind?: 'big' | 'warn' | 'card';
  title?: GenText;
  text: GenText;
  // Repeated `each` times with `i` from 0, the parts counted by `vars`, joined by «; ».
  each?: string;
  vars?: Record<string, string>;
  note?: GenText;
  when?: string;
  only?: string[];
}
export interface GenForm {
  id: string;
  title: GenText;
  about?: GenText;
  inputs: FormInput[];
  lets?: { key: string; formula: string }[];
  // An option's title by a number counted: the pace kept, not the one chosen.
  picks?: { key: string; from: string; at: string }[];
  // Numbers said in words, by the language: { en: { one: '{count} day', other: '{count} days' } }; 0 — nothing.
  words?: Record<string, Record<string, Record<string, string>>>;
  results: FormResult[];
}

export interface GeneratorFile {
  scryingGlass: 'generators';
  version: 1;
  system: string;
  title?: GenText;
  about?: GenText;
  tables: Record<string, Record<string, GenTable>>;
  generators: Generator[];
  lists?: GenList[];
  calculators?: GenCalculator[];
  forms?: GenForm[];
  // Ready factions for the Factions tool, by language.
  factions?: Record<string, { name: string; resources: string[]; goals: { text: string; marks: number }[] }[]>;
  // The card of a warband: stats as they are, { "$text": … } in the card's language, { "$roll": "d(6)" } rolled.
  // `about` and `hint` are the game's rules in words; `upkeep` — what a week of it costs, `money` shows {n}.
  warband?: { description: GenText; stats: Record<string, unknown>; about?: GenText; hint?: GenText; upkeep?: { amount: number; money: GenText } };
  // The rules of the exploration clock; none — the clock only counts.
  exploration?: ExplorationRules;
  // The between-sessions roll of factions; none — goals are marked by hand.
  goalRoll?: GoalRoll;
}

export interface ExplorationRules {
  // `every` — each such turn rolls an encounter; `usage` — each such turn the text is shown.
  turn?: { hint?: GenText; every?: number; note?: GenText; usage?: { every: number; text: GenText } };
  // `names` — the watches of a day, `rolls` — the numbers of those that start with an encounter roll.
  watch?: { hint?: GenText; names?: GenText[]; rolls?: number[]; note?: GenText };
  // `results` — the faces that mean something, `none` — the others ({n} — the face); `hour` comes with a watch's roll up to `upTo`.
  encounter?: {
    die: number;
    hint?: GenText;
    results: { roll: number; text: GenText; tone?: 'hit' | 'omen' }[];
    none: GenText;
    hour?: { die: number; upTo: number; text: GenText };
  };
}

// A die + the resources − the rival's; `steps` — the first with `from` not above the total gives the marks.
export interface GoalRoll {
  about?: GenText;
  die: number;
  steps: { from: number; gained: number }[];
}

// What a system of one file brings itself (SystemPack.kit): the same as a package's file.
export type PackKit = Omit<GeneratorFile, 'scryingGlass' | 'version' | 'system'>;

export const packFile = (system: string, kit: PackKit): GeneratorFile => ({ scryingGlass: 'generators', version: 1, system, ...kit });

export function kitOf(x: unknown, system: string): PackKit | string {
  const f = validateGenerators(isObj(x) ? { ...x, scryingGlass: 'generators', version: 1, system } : null);
  if (typeof f === 'string') return f;
  const { scryingGlass: _a, version: _b, system: _c, ...kit } = f;
  return kit;
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
  items?: GenSlot[];
  card?: GenCard;
  // A picked line: rolled again on its own; its label and note follow its row; it can become a fight.
  picked?: { table: string; pick: GenPick };
  labelCell?: GenCell;
  noteCell?: GenCell;
  fight?: boolean;
}
export interface GenSlot {
  cell?: GenCell;
  text?: GenText;
  usage?: number;
}
// A card as data: its words are found in the language it is made in.
export interface GenCard {
  kind: CardKind;
  name?: GenCell;
  stats: Record<string, unknown>;
  text?: Record<string, { cells: GenCell[]; text?: GenText }>;
  slots?: Record<string, (GenSlot | null)[]>;
  lists?: Record<string, { cells: Record<string, GenCell>; lower?: string[] }[]>;
  notes?: GenCell[];
}
export interface GenResult {
  generator: string;
  lines: GenLine[];
  card?: GenCard;
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
    if (s['pick'] !== undefined) {
      if (!isObj(s['pick']) || !str(s['table'])) return false;
    } else if (s['table'] !== undefined && !refOk(s)) return false;
    if (s['notes'] !== undefined && !notesOk(s['notes'])) return false;
    if (s['sub'] !== undefined && !list(s['sub'])) return false;
    return true;
  }
  if (typeof s['put'] === 'string') return ID_RE.test(s['put']) && typeof s['size'] === 'number' && s['size'] > 0 && s['size'] <= 100 && (s['cell'] === undefined || refOk(s['cell'])) && (s['text'] === undefined || text(s['text']));
  if (typeof s['push'] === 'string') return ID_RE.test(s['push']) && isObj(s['item']) && Object.values(s['item']).every(refOk);
  if (typeof s['repeat'] === 'string') return form(s['repeat']) && list(s['steps']);
  if (typeof s['if'] === 'string') return form(s['if']) && list(s['then']) && (s['else'] === undefined || list(s['else']));
  return false;
}

const count = (v: unknown) => Number.isInteger(v) && (v as number) > 0;
const opt = (v: unknown) => v === undefined || count(v);
function validExploration(x: unknown) {
  if (!isObj(x)) return false;
  const { turn, watch, encounter: e } = x as Record<string, unknown>;
  if (turn !== undefined && !(isObj(turn) && opt(turn['every']) && (turn['usage'] === undefined || (isObj(turn['usage']) && count(turn['usage']['every']))))) return false;
  if (watch !== undefined && !(isObj(watch) && (watch['names'] === undefined || (Array.isArray(watch['names']) && watch['names'].length > 0)) && (watch['rolls'] === undefined || (Array.isArray(watch['rolls']) && watch['rolls'].every(count))))) return false;
  if (e === undefined) return true;
  if (!isObj(e) || !count(e['die']) || !Array.isArray(e['results']) || !e['results'].every((r) => isObj(r) && count(r['roll']))) return false;
  return e['hour'] === undefined || (isObj(e['hour']) && count(e['hour']['die']) && count(e['hour']['upTo']));
}
const validGoalRoll = (x: unknown) =>
  isObj(x) && count(x['die']) && Array.isArray(x['steps']) && x['steps'].every((s) => isObj(s) && Number.isFinite(s['from']) && count(s['gained']));

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
  if (x['lists'] !== undefined && !(Array.isArray(x['lists']) && x['lists'].length <= CAP.generators && x['lists'].every((l) => isObj(l) && str(l['id']) && text(l['title']) && text(l['unit']) && Array.isArray(l['sections']) && l['sections'].every((s) => isObj(s) && str(s['id']) && str(s['table']) && text(s['title']))))) return 'lists';
  if (x['calculators'] !== undefined && !(Array.isArray(x['calculators']) && x['calculators'].length <= CAP.generators && x['calculators'].every((c) => isObj(c) && str(c['id']) && text(c['title']) && text(c['unit']) && isObj(c['labels']) && Array.isArray(c['kinds']) && c['kinds'].every((k) => isObj(k) && str(k['id']) && typeof k['value'] === 'number') && isObj(c['row']) && Object.values(c['row']).every(form) && Array.isArray(c['totals']) && c['totals'].every((t) => isObj(t) && str(t['key']) && form(t['formula']))))) return 'calculators';
  if (x['forms'] !== undefined && !(Array.isArray(x['forms']) && x['forms'].length <= CAP.generators && x['forms'].every(formOk))) return 'forms';
  if (x['exploration'] !== undefined && !validExploration(x['exploration'])) return 'exploration';
  if (x['goalRoll'] !== undefined && !validGoalRoll(x['goalRoll'])) return 'goalRoll';
  return x as unknown as GeneratorFile;
}

const parses = (f: unknown) => f === undefined || (typeof f === 'string' && !!parseFormula(f));
function formOk(f: unknown): boolean {
  if (!isObj(f) || !str(f['id']) || !ID_RE.test(f['id']) || !text(f['title']) || !Array.isArray(f['inputs']) || !Array.isArray(f['results'])) return false;
  const inputs = f['inputs'].every((i) => isObj(i) && str(i['key']) && ID_RE.test(i['key']) && text(i['title']) && ['number', 'select', 'check'].includes(i['type'] as string) && parses(i['when']) && (i['type'] !== 'select' || (Array.isArray(i['options']) && i['options'].length > 0 && i['options'].length <= CAP.rows && i['options'].every((o) => isObj(o) && str(o['id']) && text(o['title'])))));
  const lets = f['lets'] === undefined || (Array.isArray(f['lets']) && f['lets'].length <= CAP.steps && f['lets'].every((l) => isObj(l) && str(l['key']) && ID_RE.test(l['key']) && parses(l['formula'])));
  const results = f['results'].length <= CAP.steps && f['results'].every((r) => isObj(r) && text(r['text']) && parses(r['when']) && parses(r['each']));
  return f['inputs'].length <= CAP.options && inputs && lets && results;
}

const formNumber = (n: number, lang: Lang) => (Math.round(n * 10) / 10).toLocaleString(lang);

// What a form says for these values: the inputs to show and the results, on this system of the family.
export function runForm(f: GenForm, values: Record<string, number>, system: string, lang: Lang) {
  const nums: Record<string, number> = {};
  const words: Record<string, string> = {};
  const on = (x: { only?: string[] }) => !x.only || x.only.includes(system);
  const get = (name: string) => nums[name] ?? 0;
  const count = (formula: string) => calc(formula, get, noDice);
  for (const i of f.inputs) {
    if (!on(i)) continue;
    const v = values[i.key] ?? i.default ?? 0;
    nums[i.key] = v;
    const o = i.options?.[v];
    if (!o) continue;
    words[`${i.key}_title`] = genText(o.title, lang);
    for (const [k, n] of Object.entries(o.values ?? {})) nums[`${i.key}_${k}`] = n;
    for (const [k, t] of Object.entries(o.texts ?? {})) words[`${i.key}_${k}`] = genText(t, lang);
  }
  for (const l of f.lets ?? []) nums[l.key] = count(l.formula);
  for (const p of f.picks ?? []) words[p.key] = genText(f.inputs.find((i) => i.key === p.from)?.options?.[get(p.at)]?.title, lang);
  const params = (extra: Record<string, number> = {}) => {
    const out: Record<string, string> = { ...words };
    for (const [k, n] of Object.entries({ ...nums, ...extra })) out[k] = formNumber(n, lang);
    for (const [k, w] of Object.entries(f.words ?? {})) {
      const n = get(k);
      const m = w[lang] ?? w['en'];
      out[k] = n > 0 && m ? format(lang, m as Parameters<typeof format>[1], { count: Math.round(n * 10) / 10, n: formNumber(n, lang) }) : '';
    }
    return out;
  };
  const say = (t: GenText | undefined, extra?: Record<string, number>) => genText(t, lang, params(extra)).replace(/\s+/g, ' ').trim();
  const results = f.results.filter((r) => on(r) && (!r.when || count(r.when))).flatMap((r) => {
    const parts = r.each
      ? Array.from({ length: Math.min(24, Math.max(0, Math.round(count(r.each)))) }, (_, i) => {
          nums['i'] = i;
          return say(r.text, Object.fromEntries(Object.entries(r.vars ?? {}).map(([k, x]) => [k, count(x)])));
        })
      : [say(r.text)];
    const text = parts.join('; ');
    return text ? [{ kind: r.kind ?? 'card', title: say(r.title), text, note: say(r.note) }] : [];
  });
  return { inputs: f.inputs.filter((i) => on(i) && (!i.when || count(i.when))), results };
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

// The row a pick lands on (-1 — none fits).
function pickRow(rows: string[][], p: GenPick, sheet: (t: string) => GenTable, value: (k: string) => string, n: (f: string) => number, roll: Roll, avoid: Set<number>): number {
  const fits = (r: string[]) => (p.where ?? []).every((w) => {
    const cell = r[w.col] ?? '';
    if (w.has !== undefined) return !cell || cell.split(',').map((x) => x.trim()).includes(value(w.has));
    return w.max === undefined || Number(cell || 0) <= n(w.max);
  });
  const all = rows.map((r, i) => ({ r, i })).filter(({ r }) => fits(r));
  const fresh = all.filter(({ i }) => !avoid.has(i));
  let pool = fresh.length ? fresh : all;
  if (!pool.length) return -1;
  if (p.weights) {
    const w = p.weights;
    const kinds = [...new Set(pool.map(({ r }) => r[w.col] ?? ''))];
    const table = sheet(w.table).rows;
    const weigh = (k: string) => Number(table.find((x) => x[0] === k)?.[1 + n(w.by)] ?? 1) || 0;
    let x = roll(Math.max(1, kinds.reduce((a, k) => a + weigh(k), 0)));
    const kind = kinds.find((k) => (x -= weigh(k)) <= 0) ?? kinds[0];
    pool = pool.filter(({ r }) => (r[w.col] ?? '') === kind);
  }
  if (p.prefer && n(p.prefer.when) && roll(100) <= p.prefer.chance) {
    const best = pool.filter(({ r }) => r[p.prefer!.col] === p.prefer!.is);
    if (best.length) pool = best;
  }
  return pool[roll(pool.length) - 1]!.i;
}
function pickedOf(rows: string[][], table: string, pick: GenPick, row: number): Pick<GenLine, 'picked' | 'labelCell' | 'noteCell' | 'fight'> {
  const r = rows[row] ?? [];
  return {
    picked: { table, pick },
    ...(pick.label !== undefined ? { labelCell: { table, row, col: pick.label } } : {}),
    ...(pick.note !== undefined && r[pick.note] ? { noteCell: { table, row, col: pick.note } } : {}),
    ...(pick.fight !== undefined && r[0] === pick.fight ? { fight: true } : {}),
  };
}
// One line of a result rolled again: another row, the same options; the rest of the result stays.
export function rerollLine(file: GeneratorFile, result: GenResult, at: number, options: GenOptions, roll: Roll): GenResult {
  const line = result.lines[at];
  if (!line?.picked) return result;
  const { table, pick } = line.picked;
  const base = baseOf(file);
  const sheet = (t: string) => base[t] ?? { head: [], rows: [] };
  const value = (k: string) => String(options[k] ?? '');
  const num = (name: string) => Number(options[name] ?? 0) || 0;
  const taken = new Set(result.lines.filter((l) => l.picked?.table === table).map((l) => l.cells[0]?.row ?? -1));
  const row = pickRow(sheet(table).rows, pick, sheet, value, (f) => calc(f, num, roll), roll, taken);
  const { labelCell: _a, noteCell: _b, fight: _c, ...rest } = line;
  const next = { ...rest, cells: line.cells.map((c) => ({ ...c, row })), ...pickedOf(sheet(table).rows, table, pick, row) };
  return { ...result, lines: result.lines.map((l, i) => (i === at ? next : l)) };
}
// The names a line's fight is made of: its [[links]].
export const lineNames = (text: string) => [...new Set([...text.matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1]!.trim()))];
export const lineLabel = (file: GeneratorFile, l: GenLine, lang: Lang) => (l.labelCell ? genCell(file, l.labelCell, lang) : genText(l.label, lang, l.params));
export const lineNote = (file: GeneratorFile, l: GenLine, lang: Lang) => (l.noteCell ? genCell(file, l.noteCell, lang) : '');

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
    return typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : 0;
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
  const usedRows = new Map<string, number[]>();
  const params = () => Object.fromEntries(vars);
  const slots = new Map<string, { size: number; places: (GenSlot | null)[]; past: GenSlot[] }>();
  const lists = new Map<string, { cells: Record<string, GenCell>; lower?: string[] }[]>();
  const named = new Map<string, GenCell[]>();
  const put = (s: GenPutStep) => place(s, { ...(s.cell ? { cell: cellOf(s.cell) } : {}), ...(s.text ? { text: s.text } : {}), ...(s.usage !== undefined ? { usage: s.usage } : {}) });
  function place(s: Pick<GenPutStep, 'put' | 'size' | 'at' | 'pack'>, item: GenSlot) {
    const box = slots.get(s.put) ?? { size: s.size, places: Array.from({ length: s.size }, () => null), past: [] };
    slots.set(s.put, box);
    const free = (i: number) => i >= 0 && i < box.size && !box.places[i];
    const at = (s.at ?? []).find((a) => a.length && a.every(free));
    if (at) at.forEach((i) => (box.places[i] = item));
    else {
      const one = (s.pack ?? []).find(free);
      if (one !== undefined) box.places[one] = item;
      else box.past.push(item);
    }
  }
  function cardOf(c: GenCardSpec): GenCard {
    const stats: Record<string, unknown> = { ...c.fixed };
    for (const [k, f] of Object.entries(c.stats)) stats[k] = n(f);
    const texts = Object.entries(c.text ?? {}).map(([k, t]) => [k, 'line' in t ? { cells: named.get(t.line) ?? [] } : { cells: t.parts.map(cellOf), ...(t.text ? { text: t.text } : {}) }] as const);
    const name = 'line' in c.name ? named.get(c.name.line)?.[0] : cellOf(c.name);
    const noted = c.notes ? (lists.get(c.notes) ?? []).flatMap((r) => (r.cells['name'] ? [r.cells['name']] : [])) : [];
    return {
      kind: c.kind,
      ...(name ? { name } : {}),
      stats,
      ...(texts.length ? { text: Object.fromEntries(texts) } : {}),
      ...(c.slots ? { slots: Object.fromEntries(c.slots.map((k) => [k, [...(slots.get(k)?.places ?? []), ...(slots.get(k)?.past ?? [])]])) } : {}),
      ...(c.lists ? { lists: Object.fromEntries(c.lists.map((k) => [k, lists.get(k) ?? []])) } : {}),
      ...(noted.length ? { notes: noted } : {}),
    };
  }
  // What was put and pushed, each once (an item may hold two places).
  const itemsOf = (names: string[]): GenSlot[] =>
    names.flatMap((k) => [
      ...[...new Set([...(slots.get(k)?.places ?? []), ...(slots.get(k)?.past ?? [])])].filter((x): x is GenSlot => !!x),
      ...(lists.get(k) ?? []).flatMap((r) => (r.cells['name'] ? [{ cell: r.cells['name'] }] : [])),
    ]);
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
        const taken = s.pick?.unique ? new Set(usedRows.get(s.table ?? '') ?? []) : new Set<number>();
        const row = s.pick && s.table ? pickRow(sheet(s.table).rows, s.pick, sheet, (k) => String(vars.get(k) ?? ''), n, roll, taken) : -1;
        const cells = s.pick && s.table ? [{ table: name(s.table), row, ...(s.col !== undefined ? { col: Math.round(n(s.col)) } : {}) }] : refs.map(cellOf);
        if (s.pick && s.table) usedRows.set(s.table, [...(usedRows.get(s.table) ?? []), row]);
        if (s.as) named.set(s.as, cells);
        if (s.into && cells[0]) place({ put: s.into.field, size: s.into.size, pack: s.into.pack }, { cell: cells[0] });
        const line: GenLine = { label: s.line, cells, params: params(), ...(s.pick && s.table ? pickedOf(sheet(s.table).rows, s.table, s.pick, row) : {}) };
        if (s.items) line.items = itemsOf(s.items);
        if (s.join) line.join = s.join;
        if (s.text) line.text = s.text;
        if (s.sep) line.sep = true;
        if (pending.length) line.roll = pending.join(', ');
        pending = [];
        if (s.card) line.card = cardOf(s.card);
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
      } else if ('put' in s) put(s);
      else if ('push' in s) {
        const list = lists.get(s.push) ?? [];
        lists.set(s.push, list);
        list.push({ cells: Object.fromEntries(Object.entries(s.item).map(([k, r]) => [k, cellOf(r)])), ...(s.lower ? { lower: s.lower } : {}) });
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
  return { generator: id, lines, ...(gen.card ? { card: cardOf(gen.card) } : {}), ...(footer ? { footer, params: params() } : {}) };
}

// ---- A price list ----
export interface PriceItem {
  section: string;
  // The row in its section: the same item in every language.
  row: number;
  name: string;
  // None — not a price of its own («×10», «10%»): the text as it is.
  price: number | null;
  text: string;
}

export function priceItems(file: GeneratorFile, list: GenList, lang: Lang): PriceItem[] {
  const tables = file.tables[lang] ?? baseOf(file);
  return list.sections.flatMap((s) =>
    (tables[s.table]?.rows ?? []).map((r, row) => ({ section: s.id, row, name: r[0] ?? '', price: r[2] ? Number(r[2]) : null, text: r[1] ?? '' })),
  );
}

export function priceOfItem(list: GenList, item: PriceItem, options: Record<string, boolean>): number | null {
  if (item.price === null) return null;
  const f = list.factor;
  return item.price * (f && options[f.option] && f.sections.includes(item.section) ? f.times : 1);
}

// ---- A calculator ----
export interface CalcRow {
  kind: string;
  count: number;
  flag?: boolean;
  name?: string;
}

const whole = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
const noDice = () => 0;

export const calcValue = (c: GenCalculator, r: CalcRow) => whole(r.count) * (c.kinds.find((k) => k.id === r.kind)?.value ?? 0);

export function runCalculator(c: GenCalculator, rows: CalcRow[], inputs: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of Object.keys(c.row)) out[k] = 0;
  for (const r of rows) {
    const own: Record<string, number> = { count: whole(r.count), flag: r.flag ? 1 : 0, value: c.kinds.find((k) => k.id === r.kind)?.value ?? 0 };
    for (const [k, f] of Object.entries(c.row)) out[k]! += calc(f, (v) => own[v] ?? 0, noDice);
  }
  for (const i of c.inputs ?? []) out[i.key] = whole(inputs[i.key] ?? i.default ?? 0);
  for (const t of c.totals) out[t.key] = calc(t.formula, (v) => out[v] ?? 0, noDice);
  return out;
}

// ---- The builder ----
// A table as the author writes it: one row a line, «1-3 | text» with numbers, or just text (any row, all alike).
export function rowsOfText(text: string): string[][] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const cut = (l: string) => /^([^|]+?)\s*\|\s*(.*)$/.exec(l);
  const numbered = lines.length > 0 && lines.every((l) => {
    const m = cut(l);
    return !!m && !!rangeOf(m[1]!);
  });
  return lines.map((l) => {
    if (!numbered) return [l];
    const m = cut(l)!;
    return [m[1]!, m[2]!];
  });
}
export const textOfRows = (rows: string[][]) => rows.map((r) => r.join(' | ')).join('\n');

// The die a numbered table asks for: as big as its last number; none — any row, all alike.
export function diceOfRows(rows: string[][]): string {
  const tops = rows.map((r) => (r.length > 1 ? rangeOf(r[0] ?? '') : null));
  if (!tops.length || tops.some((t) => !t)) return '';
  return `d${Math.max(...tops.map((t) => (t![1] === Infinity ? t![0] : t![1])))}`;
}

// A price list as the author writes it: «a name | 40» a line; a price that is no number stays text (no basket).
export function priceRowsOfText(text: string, unit: string): string[][] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = /^(.*?)\s*\|\s*(.*)$/.exec(l);
    const [name, price] = m ? [m[1]!, m[2]!] : [l, ''];
    const n = /^\d[\d\s]*$/.test(price) ? price.replace(/\s/g, '') : '';
    return [name, n ? `${n}${unit ? ` ${unit}` : ''}` : price, n];
  });
}
export const textOfPriceRows = (rows: string[][]) => rows.map((r) => `${r[0] ?? ''} | ${r[2] || r[1] || ''}`).join('\n');

// A unit as the author writes it («p») and as a text with the number.
export const unitText = (u: string) => (u.trim() ? `{n} ${u.trim()}` : '{n}');
export const unitOf = (t: GenText, lang: Lang) => {
  const x = typeof t === 'string' ? t : (t[lang] ?? Object.values(t)[0] ?? '');
  return typeof x === 'string' ? x.replace('{n}', '').trim() : '';
};

// Kinds of a calculator's rows: «a name | 100» a line.
export function kindsOfText(text: string): GenCalculator['kinds'] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
    const m = /^(.*?)\s*\|\s*(.*)$/.exec(l);
    const value = Number((m?.[2] ?? '').replace(/\s/g, ''));
    return { id: `k${i + 1}`, title: m ? m[1]! : l, value: Number.isFinite(value) ? value : 0 };
  });
}
export const textOfKinds = (kinds: GenCalculator['kinds'], lang: Lang) => kinds.map((k) => `${genText(k.title, lang)} | ${k.value}`).join('\n');

// A form's choices as the author writes them: «A name | speed=3, note=fast». A number is a number of formulas, anything
// else a word of the text; the other language of a word stays.
const wordOf = (old: GenText | undefined, lang: Lang, word: string): GenText => (old !== undefined && typeof old !== 'string' ? { ...old, [lang]: word } : word);
export function optionsOfText(text: string, old: FormOption[], lang: Lang): FormOption[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => {
    const m = /^(.*?)\s*\|\s*(.*)$/.exec(line);
    const was = old[i];
    const values: Record<string, number> = {};
    const texts: Record<string, GenText> = {};
    for (const part of (m?.[2] ?? '').split(',')) {
      const p = /^\s*([a-z][a-z0-9_]*)\s*=\s*(.*?)\s*$/i.exec(part);
      if (!p) continue;
      if (p[2] !== '' && Number.isFinite(Number(p[2]))) values[p[1]!] = Number(p[2]);
      else texts[p[1]!] = wordOf(was?.texts?.[p[1]!], lang, p[2]!);
    }
    return { id: was?.id ?? `o${i + 1}`, title: wordOf(was?.title, lang, m ? m[1]! : line), ...(Object.keys(values).length ? { values } : {}), ...(Object.keys(texts).length ? { texts } : {}) };
  });
}
export function textOfOptions(list: FormOption[], lang: Lang): string {
  return list.map((o) => {
    const parts = [...Object.entries(o.values ?? {}).map(([k, v]) => `${k}=${v}`), ...Object.entries(o.texts ?? {}).map(([k, v]) => `${k}=${genText(v, lang)}`)];
    return parts.length ? `${genText(o.title, lang)} | ${parts.join(', ')}` : genText(o.title, lang);
  }).join('\n');
}
// A key of a form renamed where it stands and where it is read: `speed`, `speed_mph`, {speed_title}.
export function renameFormKey(f: GenForm, from: string, to: string): GenForm {
  const word = new RegExp(`(?<![A-Za-z0-9_])${from}(?![A-Za-z0-9])`, 'g');
  return JSON.parse(JSON.stringify(f).replace(word, to)) as GenForm;
}
// What a form's formulas may read, and its text besides.
export function formKeys(f: GenForm): string[] {
  const out: string[] = [];
  for (const i of f.inputs) {
    out.push(i.key);
    for (const o of i.options ?? []) out.push(...Object.keys(o.values ?? {}).map((k) => `${i.key}_${k}`));
  }
  return [...new Set([...out, ...(f.lets ?? []).map((l) => l.key)])];
}
export function formWords(f: GenForm): string[] {
  const texts = f.inputs.flatMap((i) => (i.options?.length ? [`${i.key}_title`, ...i.options.flatMap((o) => Object.keys(o.texts ?? {}).map((k) => `${i.key}_${k}`))] : []));
  return [...new Set([...formKeys(f), ...texts, ...(f.picks ?? []).map((p) => p.key), ...Object.keys(f.words ?? {})])];
}

// A step the builder shows as a row: a label, a table, the dice (none — any row) or a number that picks the row, how
// many times, the condition, where it goes.
export type WhenOp = 'ge' | 'le' | 'gt' | 'lt' | 'eq' | 'on' | 'off';
export interface StepWhen {
  what: string;
  op: WhenOp;
  value?: number;
}
export interface SimpleStep {
  label: GenText;
  table: string;
  dice: string;
  // A number instead of dice; `byRow` — the table has no numbers, it counts rows.
  by?: string;
  byRow?: boolean;
  times: number;
  timesBy?: string;
  when?: StepWhen;
  as?: string;
  into?: NonNullable<GenLineStep['into']>;
}

export const whenFormula = (w: StepWhen) => (w.op === 'on' ? w.what : w.op === 'off' ? `not(${w.what})` : `${w.op}(${w.what}, ${w.value ?? 0})`);
export function whenOf(f: string): StepWhen | null {
  const cmp = /^(ge|le|gt|lt|eq)\((\w+), (-?\d+(?:\.\d+)?)\)$/.exec(f);
  if (cmp) return { op: cmp[1] as WhenOp, what: cmp[2]!, value: Number(cmp[3]) };
  const not = /^not\((\w+)\)$/.exec(f);
  if (not) return { op: 'off', what: not[1]! };
  return /^\w+$/.test(f) ? { op: 'on', what: f } : null;
}

function simpleLine(s: GenStep): SimpleStep | null {
  if (!('line' in s) || !s.table || s.parts || s.sub || s.card || s.notes || s.text || s.join || s.items || s.col !== undefined || s.group) return null;
  const row = s.row === undefined ? null : /^(\w+) - 1$/.exec(s.row);
  if (s.row !== undefined && !row) return null;
  if (s.lookup !== undefined && !/^\w+$/.test(s.lookup)) return null;
  const by = row?.[1] ?? s.lookup;
  return { label: s.line, table: s.table, dice: s.dice ?? '', times: 1, ...(by ? { by } : {}), ...(row ? { byRow: true } : {}), ...(s.as ? { as: s.as } : {}), ...(s.into ? { into: s.into } : {}) };
}

// Anything else stays as it is, the builder only says it is there.
export function simpleStep(s: GenStep): SimpleStep | null {
  if ('if' in s) {
    if (s.else?.length || s.then.length !== 1) return null;
    const when = whenOf(s.if);
    const inner = when && !('if' in s.then[0]!) ? simpleStep(s.then[0]!) : null;
    return inner && { ...inner, when: when! };
  }
  if ('repeat' in s) {
    if (s.steps.length !== 1 || s.as || !/^\w+$/.test(s.repeat)) return null;
    const one = simpleLine(s.steps[0]!);
    return one && (/^\d+$/.test(s.repeat) ? { ...one, times: Number(s.repeat) } : { ...one, timesBy: s.repeat });
  }
  return simpleLine(s);
}

export function stepOf(x: SimpleStep): GenStep {
  const how = x.by ? (x.byRow ? { row: `${x.by} - 1` } : { lookup: x.by }) : x.dice ? { dice: x.dice } : { any: true };
  const line: GenStep = { line: x.label, table: x.table, ...how, ...(x.as ? { as: x.as } : {}), ...(x.into ? { into: x.into } : {}) };
  const times = x.timesBy ?? (x.times > 1 ? String(Math.min(40, Math.round(x.times))) : '');
  const many: GenStep = times ? { repeat: times, steps: [line] } : line;
  return x.when ? { if: whenFormula(x.when), then: [many] } : many;
}

// A number of a generator, rolled or worked out first: «the lower of 2d6», «the best of the three».
export interface NumberStep {
  key: string;
  dice?: string;
  keep?: 'low' | 'high';
  count?: number;
  formula?: string;
}
export function numberOf(s: GenStep): NumberStep | null {
  if (!('let' in s) || s.table || s.of || s.is !== undefined) return null;
  if (s.dice) return { key: s.let, dice: s.dice, ...(s.keep ? { keep: s.keep, count: s.count ?? 1 } : {}) };
  return s.formula !== undefined ? { key: s.let, formula: s.formula } : null;
}
export const numberStep = (n: NumberStep): GenStep =>
  n.dice ? { let: n.key, dice: n.dice, ...(n.keep ? { keep: n.keep, count: n.count ?? 1 } : {}), quiet: true } : { let: n.key, formula: n.formula ?? '0' };

// Whether a step reads a number or an answer by its key.
export function stepNames(s: GenStep, key: string): boolean {
  const said = (f: string | undefined) => !!f && [...f.matchAll(/[A-Za-z_]\w*/g)].some((m) => m[0] === key);
  if ('let' in s) return s.let !== key && said(s.formula);
  if ('if' in s) return said(s.if) || [...s.then, ...(s.else ?? [])].some((x) => stepNames(x, key));
  if ('repeat' in s) return said(s.repeat) || s.steps.some((x) => stepNames(x, key));
  if ('line' in s) return said(s.lookup) || said(s.row) || (s.sub ?? []).some((x) => stepNames(x, key));
  return false;
}

// A card of the whole result, found by names: a number goes to the number field of the same title, a line to the text
// field of its label; a line with `into` fills its slots field. What found nothing is left out, the builder says so.
export interface CardField {
  key: string;
  title: string;
  type: string;
}
export interface CardLink {
  from: string;
  to: string | null;
}
export function linkCard(gen: Generator, fields: CardField[], kind: CardKind, lang: Lang, nameLine?: string): { steps: GenStep[]; card: GenCardSpec; links: CardLink[] } {
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const links: CardLink[] = [];
  const stats: Record<string, string> = {};
  const text: Record<string, GenCardText> = {};
  const slotted = new Set<string>();
  const steps = gen.steps.map((s, i) => {
    const n = numberOf(s);
    if (n) {
      const title = genText(gen.names?.[n.key], lang) || n.key;
      const f = fields.find((x) => (x.type === 'number' || x.type === 'dots') && same(x.title, title));
      if (f) stats[f.key] = n.key;
      links.push({ from: title, to: f?.title ?? null });
      return s;
    }
    const x = simpleStep(s);
    if (!x) return s;
    const as = x.as ?? `l${i + 1}`;
    if (x.into) slotted.add(x.into.field);
    const title = genText(x.label, lang);
    const f = fields.find((y) => (y.type === 'text' || y.type === 'textarea') && same(y.title, title));
    if (f && !x.when && x.times === 1 && !x.timesBy) text[f.key] = { line: as };
    if (!x.into) links.push({ from: title, to: f?.title ?? null });
    return stepOf({ ...x, as });
  });
  const named = steps.flatMap((s) => (simpleStep(s) ? [simpleStep(s)!] : []));
  const nameAs = nameLine || named.find((x) => same(genText(x.label, lang), 'имя') || same(genText(x.label, lang), 'name'))?.as || named[0]?.as || '';
  // The line that names the card has found its place.
  const nameTitle = genText(named.find((x) => x.as === nameAs)?.label, lang);
  return { steps, links: links.filter((l) => l.to || l.from !== nameTitle), card: { kind, name: { line: nameAs }, stats, ...(Object.keys(text).length ? { text } : {}), ...(slotted.size ? { slots: [...slotted] } : {}) } };
}

// ---- In words ----
export function genText(t: GenText | undefined, lang: Lang, params?: Record<string, number | string>): string {
  if (t === undefined) return '';
  const m = typeof t === 'string' ? t : (t[lang] ?? t['en'] ?? Object.values(t)[0] ?? '');
  return format(lang, m, params);
}

// The weekly upkeep of a package's warband: none — the game has no upkeep. The file can be someone else's.
export function warbandUpkeep(w: GeneratorFile['warband'], lang: Lang) {
  const u = w?.upkeep;
  if (!u || typeof u.amount !== 'number' || !(u.amount > 0)) return null;
  return { money: (weeks: number) => genText(u.money, lang, { n: (u.amount * weeks).toLocaleString(lang) }) };
}

// The builder shows a value of a warband's card as a line. null — one it cannot show so (a list): it stays as it is.
export function templateText(v: unknown, lang: Lang): string | null {
  if (typeof v === 'number' || typeof v === 'string') return String(v);
  if (!isObj(v)) return null;
  if (v['$text'] !== undefined) return genText(v['$text'] as GenText, lang);
  const die = typeof v['$roll'] === 'string' ? /^d\((\d+)\)$/.exec(v['$roll']) : null;
  return die ? `d${die[1]}` : null;
}

// A line back: a number, «d6» or «к6» — a die rolled for the card, else a text; a text of several languages keeps the others.
export function templateValue(text: string, old: unknown, lang: Lang): unknown {
  const line = text.trim();
  if (/^-?\d+$/.test(line)) return Number(line);
  const die = /^[dкД]\s*(\d+)$/i.exec(line);
  if (die) return { $roll: `d(${die[1]})` };
  const was = isObj(old) ? old['$text'] : undefined;
  return isObj(was) ? { $text: { ...was, [lang]: text } } : text;
}

// The names of the watches from a text, one a line; a name of several languages keeps the others.
export function namesOfText(text: string, old: GenText[], lang: Lang): GenText[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const was = old[i];
      return isObj(was) ? { ...(was as Record<string, Msg>), [lang]: l } : l;
    });
}

// A cell as text; «**Hostile.** How…» keeps its Markdown.
export function genCell(file: GeneratorFile, c: GenCell, lang: Lang): string {
  const list = file.tables[lang] ?? baseOf(file);
  const row = list[c.table]?.rows[c.row] ?? [];
  return row[c.col ?? row.length - 1] ?? '';
}

export function lineWords(file: GeneratorFile, l: GenLine, lang: Lang): string {
  if (l.items) return l.items.map((i) => slotWords(file, i, lang)).join(', ');
  const parts = l.cells.map((c) => genCell(file, c, lang));
  // {0} — a cell, {low0} — the same in small letters.
  if (l.text) return genText(l.text, lang, { ...l.params, ...Object.fromEntries(parts.flatMap((p, i) => [[String(i), p], [`low${i}`, p.toLowerCase()]])) });
  if (l.join === 'name') return parts.map((p, i) => (i ? p.replace(/^-/, '').toLowerCase() : p)).join('');
  return parts.join(' — ');
}

const slotWords = (file: GeneratorFile, s: GenSlot, lang: Lang) => (s.cell ? genCell(file, s.cell, lang) : genText(s.text, lang));

// The card as the app keeps it, in a language.
export function genCardOf(file: GeneratorFile, c: GenCard, lang: Lang): { name: string; kind: CardKind; stats: Record<string, unknown>; notes?: string } {
  const stats: Record<string, unknown> = { ...c.stats };
  for (const [k, t] of Object.entries(c.text ?? {})) {
    const parts = t.cells.map((x) => genCell(file, x, lang));
    stats[k] = t.text ? genText(t.text, lang, Object.fromEntries(parts.flatMap((p, i) => [[String(i), p], [`low${i}`, p.toLowerCase()]]))) : parts.join(' ');
  }
  for (const [k, list] of Object.entries(c.slots ?? {}))
    stats[k] = list.map((s) => (s ? { name: slotWords(file, s, lang), ...(s.usage !== undefined ? { usage: s.usage } : {}) } : { name: '' }));
  for (const [k, list] of Object.entries(c.lists ?? {}))
    stats[k] = list.map((r) => Object.fromEntries(Object.entries(r.cells).map(([f, x]) => {
      const w = genCell(file, x, lang);
      return [f, r.lower?.includes(f) ? w.toLowerCase() : w];
    })));
  const notes = c.notes?.map((x) => genCell(file, x, lang)).join('\n');
  return { name: c.name ? genCell(file, c.name, lang) : '', kind: c.kind, stats, ...(notes ? { notes } : {}) };
}

// A card's template filled in: its words in a language, its dice rolled.
export function fillTemplate(x: unknown, lang: Lang, roll: Roll): unknown {
  if (Array.isArray(x)) return x.map((v) => fillTemplate(v, lang, roll));
  if (!isObj(x)) return x;
  if (x['$text'] !== undefined) return genText(x['$text'] as GenText, lang);
  if (typeof x['$roll'] === 'string') return calc(x['$roll'], () => 0, roll);
  return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, fillTemplate(v, lang, roll)]));
}

export const plainText = (s: string) => s.replace(/\*\*/g, '').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
// «d6: 4» → «к6: 4» in Russian.
export const rollWords = (s: string | undefined, lang: Lang) => (s && lang === 'ru' ? s.replace(/(^|[^a-z])(\d*)d(\d)/g, '$1$2к$3') : (s ?? ''));

export function resultMarkdown(file: GeneratorFile, r: GenResult, lang: Lang): string {
  const gen = file.generators.find((g) => g.id === r.generator);
  const out: string[] = [`## ${genText(gen?.title, lang)}`, ''];
  const add = (l: GenLine, indent: string) => {
    const x = (l.notes ?? []).map((n) => genText(n.text, lang, l.params)).join(', ');
    const note = [lineNote(file, l, lang), x].filter(Boolean).join(', ');
    out.push(`${indent}- **${lineLabel(file, l, lang)}:** ${lineWords(file, l, lang)}${note ? ` (${note})` : ''}`);
    for (const s of l.sub ?? []) add(s, indent + '  ');
  };
  for (const l of r.lines) add(l, '');
  if (r.footer) out.push('', genText(r.footer, lang, r.params));
  return out.join('\n');
}

