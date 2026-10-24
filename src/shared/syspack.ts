// System packs: a role-playing system described by a file, not by code — the sections and fields of its cards, the
// rolls on them, what the initiative tracker shows. The app draws the card, the editor, the rolls and the tracker
// from it. Packs come from the Community or the builder into <library>/systems/ (resources/systems/ — built-in ones,
// none yet; samples/systems/ — the samples published in the official repository). Only pure functions here:
// the core, the windows and the tests use them.
//
// A pack may come from a stranger (the Community): `validatePack` takes only what it knows, with sizes capped, and
// formulas are a tiny language of their own (numbers, fields, + − × ÷, a few functions) — never code.
import type { CardKind, CombatStats } from './cards';

// Text in several languages ({ en, ru }) or one string for all.
export type Loc = string | Record<string, string>;
export const loc = (l: Loc | undefined, lang: string): string =>
  l === undefined ? '' : typeof l === 'string' ? l : (l[lang] ?? l['en'] ?? Object.values(l)[0] ?? '');

export type FieldType = 'number' | 'text' | 'textarea' | 'select' | 'dots' | 'track' | 'tags' | 'list' | 'formula' | 'slots';
export const FIELD_TYPES: FieldType[] = ['number', 'text', 'textarea', 'select', 'dots', 'track', 'tags', 'list', 'formula', 'slots'];
export type ColumnType = 'text' | 'number' | 'dots' | 'dice';
export const COLUMN_TYPES: ColumnType[] = ['text', 'number', 'dots', 'dice'];

// Names of a total: the highest one whose `min` it reaches (the Fate ladder: +3 — «Good»).
export type RollLabels = { min: number; title: Loc }[];

// How a roll goes. Numbers are formulas over the card's fields (and `row.<key>` in a list row).
export type RollSpec =
  // d20 + bonus (advantage and disadvantage with Shift / Alt).
  | { type: 'd20'; bonus: string; labels?: RollLabels }
  // A die (d100, d20) under the target; levels — harder successes at a fraction of it («hard» — half). Advantage —
  // the lower of two dice, disadvantage — the higher (a Mausritter save).
  | { type: 'under'; sides: number; target: string; levels?: { title: Loc; divide: number }[] }
  // Dice + bonus against bands of outcome (PbtA: 10+, 7–9, 6−), the highest band that fits.
  | { type: 'bands'; dice: string; bonus: string; bands: { min: number; title: Loc }[] }
  // A pool of dice: successes are faces ≥ `success` (Year Zero: sixes) or the best die (Forged in the Dark);
  // push — the roll can be pushed once (the dice that aren't successes are rolled again).
  | { type: 'pool'; sides: number; count: string; success?: number; best?: boolean; push?: boolean }
  // 4dF + bonus.
  | { type: 'fate'; bonus: string; labels?: RollLabels }
  // A plain sum: dice + bonus (damage, a table); dice — «2d6» or a column of the list row: «row.damage» (its text,
  // «d6/d8» — the first one).
  | { type: 'sum'; dice: string; bonus?: string; labels?: RollLabels }
  // One die of `sides` that explodes on its maximum (Savage Worlds), plus a wild die if set; the better counts.
  | { type: 'explode'; sides: string; bonus?: string; wild?: number };
export const ROLL_TYPES = ['d20', 'under', 'bands', 'pool', 'fate', 'sum', 'explode'] as const;

export interface ColumnDef {
  key: string;
  type: ColumnType;
  title: Loc;
  max?: number;
}

export interface FieldDef {
  key: string;
  type: FieldType;
  title: Loc;
  hint?: Loc;
  // number, dots: limits; dots — how many dots (max); track — how many boxes (a number or the key of a field).
  min?: number;
  max?: number;
  boxes?: number | string;
  default?: number | string;
  // select: the options.
  options?: Loc[];
  // list: the columns of a row.
  columns?: ColumnDef[];
  // formula: the value (read only).
  formula?: string;
  // slots: groups of cells (paws 2, body 2, pack 6); a cell holds an item (usage dots 0–3) or a condition.
  slots?: { title: Loc; count: number }[];
  // number, dots: not shown on the card while 0 (eighteen skills of Fate, most of them none).
  hideZero?: boolean;
  // A roll by a click on the field (on a row of a list).
  roll?: RollSpec;
}

export interface SectionDef {
  id: string;
  title: Loc;
  // Only for these kinds of cards (none — for all).
  kinds?: CardKind[];
  fields: FieldDef[];
}

export interface TrackerSpec {
  // The order of turns: a roll (dice + bonus), a field's value, or no initiative at all (the list's order).
  init: { type: 'roll'; dice: string; bonus?: string } | { type: 'value'; value: string } | { type: 'none' };
  // The field that is health (numbers: current of the max — the field's value).
  hp?: string;
  // Fields shown in a combatant's row: tracks (boxes to mark) and numbers (current / max).
  cells?: string[];
  // Conditions: a list to choose from and/or free text.
  conditions?: { list?: Loc[]; free?: boolean };
}

export interface SystemPack {
  scryingGlass: 'system';
  version: 1;
  id: string;
  title: Loc;
  // Editions of one game share a family (none — the pack's own).
  family?: string;
  author?: string;
  // The license or attribution text the source asks for.
  license?: string;
  url?: string;
  // The pack's own version (1, 2, …): a newer one replaces the old.
  release?: number;
  // The kinds of cards the system has (none — all three).
  kinds?: CardKind[];
  // The line under a card's name: «{role} · {tier}» (fields by key).
  subtitle?: string;
  // A number to sort cards by (a formula).
  rank?: string;
  sections: SectionDef[];
  tracker: TrackerSpec;
  // Its own compendium: rules, conditions, gear… (Markdown), shown in adventures of this system as built-in entries.
  compendium?: PackEntry[];
  // Set by the core, never read from a file: the GM's own pack (in the library), not a built-in one.
  own?: boolean;
}

export interface PackEntry {
  title: Loc;
  // A heading to group entries by («Conditions», «Gear»).
  category?: Loc;
  text: Loc;
}

// A card's block of stats in a pack system: values by field key (a list — rows of values by column key).
export type PackStats = Record<string, unknown>;
// A cell of a «slots» field: an item (usage dots marked) or a condition.
export interface PackSlot {
  name: string;
  condition?: boolean;
  usage?: number;
}
// The cells of a slots field by group: [title, cells with their place in the value].
export function slotGroups(f: FieldDef, value: unknown): { title: Loc; cells: { i: number; slot: PackSlot }[] }[] {
  const list = Array.isArray(value) ? (value as PackSlot[]) : [];
  let i = 0;
  return (f.slots ?? []).map((g) => ({ title: g.title, cells: Array.from({ length: g.count }, () => ({ i, slot: list[i++] ?? { name: '' } })) }));
}

// ---- Building a pack (the builder in the app) ----
// Formulas that don't parse or name what the pack hasn't: where (a field's key or 'rank', 'tracker'), the text and
// the unknown names. The builder shows them; a pack with them still works (unknown names count as 0).
export function formulaProblems(pack: SystemPack): { where: string; text: string; unknown: string[]; broken: boolean }[] {
  const keys = fieldMap(pack);
  const out: { where: string; text: string; unknown: string[]; broken: boolean }[] = [];
  const check = (where: string, text: string, row?: string[]) => {
    if (!text.trim()) return;
    const broken = !parseFormula(text);
    const names = (text.match(/row\.[a-z_][a-z0-9_]*|[a-z_][a-z0-9_]*/gi) ?? []).filter((w) => !(w in FNS));
    const unknown = names.filter((n) => (n.startsWith('row.') ? !row?.includes(n.slice(4)) : !keys.has(n)));
    if (broken || unknown.length) out.push({ where, text, unknown: [...new Set(unknown)], broken });
  };
  if (pack.rank) check('rank', pack.rank);
  for (const f of keys.values()) {
    if (f.formula !== undefined) check(f.key, f.formula);
    if (typeof f.boxes === 'string') check(f.key, f.boxes);
    const r = f.roll as Record<string, unknown> | undefined;
    for (const k of ['bonus', 'target', 'count', 'sides']) if (typeof r?.[k] === 'string') check(f.key, r[k] as string, f.columns?.map((c) => c.key));
  }
  if (pack.tracker.init.type === 'roll' && pack.tracker.init.bonus) check('tracker', pack.tracker.init.bonus);
  if (pack.tracker.init.type === 'value') check('tracker', pack.tracker.init.value);
  return out;
}

// A new field of a type, with what that type needs.
export function newField(type: FieldType, key: string, title: Loc): FieldDef {
  const f: FieldDef = { key, type, title };
  if (type === 'dots') f.max = 5;
  if (type === 'track') f.boxes = 5;
  if (type === 'select') f.options = ['A', 'B'];
  if (type === 'list') f.columns = [{ key: 'name', type: 'text', title: 'Name' }, { key: 'value', type: 'number', title: 'Value' }];
  if (type === 'formula') f.formula = '0';
  if (type === 'slots') f.slots = [{ title: 'Slots', count: 6 }];
  return f;
}

// A roll of a type for a field, its numbers taken from that field (a list row — its value column).
export function newRoll(type: RollSpec['type'], f: FieldDef): RollSpec {
  const v = f.type === 'list' ? `row.${f.columns?.find((c) => c.type === 'number' || c.type === 'dots')?.key ?? 'value'}` : f.key;
  switch (type) {
    case 'd20':
      return { type, bonus: v };
    case 'under':
      return { type, sides: 100, target: v };
    case 'bands':
      return { type, dice: '2d6', bonus: v, bands: [{ min: 10, title: '10+' }, { min: 7, title: '7–9' }, { min: -99, title: '6−' }] };
    case 'pool':
      return { type, sides: 6, count: v, success: 6 };
    case 'fate':
      return { type, bonus: v };
    case 'sum':
      return { type, dice: '1d6', bonus: v };
    case 'explode':
      return { type, sides: v, wild: 6 };
  }
}

export const blankPack = (id: string, title: Loc): SystemPack => ({
  scryingGlass: 'system',
  version: 1,
  id,
  title,
  release: 1,
  sections: [{ id: 'main', title: { en: 'Main', ru: 'Основное' }, fields: [] }],
  tracker: { init: { type: 'roll', dice: '1d20' } },
});

// ---- Checking a pack ----
const KEY_RE = /^[a-z][a-z0-9_]{0,31}$/;
const ID_RE = /^[a-z][a-z0-9-]{1,31}$/;
const KINDS: CardKind[] = ['monster', 'npc', 'character'];
const LIMIT = { sections: 40, fields: 80, options: 60, columns: 8, text: 200, long: 4000, formula: 200, entries: 500, entry: 30000 };

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
function locOf(x: unknown, max = LIMIT.text): Loc | null {
  if (typeof x === 'string') return x.slice(0, max);
  if (!isObj(x)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(x)) if (/^[a-z]{2,3}$/.test(k) && typeof v === 'string') out[k] = v.slice(0, max);
  return Object.keys(out).length ? out : null;
}
const formulaOf = (x: unknown) => (typeof x === 'string' && x.length <= LIMIT.formula && parseFormula(x) ? x : null);
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);

function labelsOf(x: unknown): RollLabels | undefined {
  if (!Array.isArray(x)) return undefined;
  const out = x.flatMap((b) => (isObj(b) && num(b['min']) !== undefined && locOf(b['title']) ? [{ min: b['min'] as number, title: locOf(b['title'])! }] : [])).slice(0, 24);
  return out.length ? out.sort((a, b) => b.min - a.min) : undefined;
}
const ROW_DICE = /^row\.[a-z][a-z0-9_]*$/;

function rollOf(x: unknown): RollSpec | null {
  if (!isObj(x)) return null;
  const labels = labelsOf(x['labels']);
  const withLabels = labels ? { labels } : {};
  const f = (k: string, need = true) => (x[k] === undefined && !need ? '' : formulaOf(x[k]));
  switch (x['type']) {
    case 'd20':
      return f('bonus') !== null ? { type: 'd20', bonus: x['bonus'] as string, ...withLabels } : null;
    case 'under': {
      const sides = num(x['sides']);
      if (!sides || sides < 2 || sides > 1000 || f('target') === null) return null;
      const levels = Array.isArray(x['levels'])
        ? x['levels'].flatMap((l) => (isObj(l) && locOf(l['title']) && num(l['divide']) && (l['divide'] as number) >= 1 ? [{ title: locOf(l['title'])!, divide: l['divide'] as number }] : [])).slice(0, 4)
        : [];
      return { type: 'under', sides, target: x['target'] as string, ...(levels.length ? { levels } : {}) };
    }
    case 'bands': {
      const bands = Array.isArray(x['bands'])
        ? x['bands'].flatMap((b) => (isObj(b) && num(b['min']) !== undefined && locOf(b['title']) ? [{ min: b['min'] as number, title: locOf(b['title'])! }] : [])).slice(0, 8)
        : [];
      if (typeof x['dice'] !== 'string' || !diceOf(x['dice']) || f('bonus') === null || !bands.length) return null;
      return { type: 'bands', dice: x['dice'], bonus: x['bonus'] as string, bands: bands.sort((a, b) => b.min - a.min) };
    }
    case 'pool': {
      const sides = num(x['sides']);
      if (!sides || sides < 2 || sides > 100 || f('count') === null) return null;
      const success = num(x['success']);
      return { type: 'pool', sides, count: x['count'] as string, ...(success ? { success } : {}), ...(x['best'] === true ? { best: true } : {}), ...(x['push'] === true ? { push: true } : {}) };
    }
    case 'fate':
      return f('bonus') !== null ? { type: 'fate', bonus: x['bonus'] as string, ...withLabels } : null;
    case 'sum':
      if (typeof x['dice'] !== 'string' || !(diceOf(x['dice']) || ROW_DICE.test(x['dice'])) || f('bonus', false) === null) return null;
      return { type: 'sum', dice: x['dice'], ...(x['bonus'] ? { bonus: x['bonus'] as string } : {}), ...withLabels };
    case 'explode': {
      const wild = num(x['wild']);
      if (f('sides') === null || f('bonus', false) === null) return null;
      return { type: 'explode', sides: x['sides'] as string, ...(x['bonus'] ? { bonus: x['bonus'] as string } : {}), ...(wild ? { wild } : {}) };
    }
  }
  return null;
}

function fieldOf(x: unknown): FieldDef | null {
  if (!isObj(x) || typeof x['key'] !== 'string' || !KEY_RE.test(x['key']) || !FIELD_TYPES.includes(x['type'] as FieldType)) return null;
  const title = locOf(x['title']);
  if (!title) return null;
  const type = x['type'] as FieldType;
  const f: FieldDef = { key: x['key'], type, title };
  const hint = locOf(x['hint'], LIMIT.long);
  if (hint) f.hint = hint;
  for (const k of ['min', 'max'] as const) if (num(x[k]) !== undefined) f[k] = num(x[k]);
  if (typeof x['default'] === 'number' || typeof x['default'] === 'string') f.default = typeof x['default'] === 'string' ? x['default'].slice(0, LIMIT.long) : x['default'];
  if (type === 'track') {
    const b = x['boxes'];
    if (typeof b === 'number' && b >= 1 && b <= 40) f.boxes = Math.round(b);
    else if (typeof b === 'string' && KEY_RE.test(b)) f.boxes = b;
    else return null;
  }
  if (type === 'dots' && !(f.max && f.max >= 1 && f.max <= 12)) return null;
  if (type === 'select') {
    const options = Array.isArray(x['options']) ? x['options'].map((o) => locOf(o)).filter((o): o is Loc => o !== null).slice(0, LIMIT.options) : [];
    if (!options.length) return null;
    f.options = options;
  }
  if (type === 'list') {
    const columns = Array.isArray(x['columns'])
      ? x['columns'].flatMap((c) => {
          if (!isObj(c) || typeof c['key'] !== 'string' || !KEY_RE.test(c['key']) || !COLUMN_TYPES.includes(c['type'] as ColumnType)) return [];
          const t = locOf(c['title']);
          return t ? [{ key: c['key'], type: c['type'] as ColumnType, title: t, ...(num(c['max']) ? { max: num(c['max']) } : {}) }] : [];
        })
      : [];
    if (!columns.length) return null;
    f.columns = columns.slice(0, LIMIT.columns);
  }
  if (type === 'formula') {
    const formula = formulaOf(x['formula']);
    if (!formula) return null;
    f.formula = formula;
  }
  if (type === 'slots') {
    const groups = Array.isArray(x['slots'])
      ? x['slots'].flatMap((g) => (isObj(g) && locOf(g['title']) && num(g['count']) && (g['count'] as number) >= 1 ? [{ title: locOf(g['title'])!, count: Math.min(20, Math.round(g['count'] as number)) }] : [])).slice(0, 6)
      : [];
    if (!groups.length) return null;
    f.slots = groups;
  }
  if (x['hideZero'] === true && (type === 'number' || type === 'dots')) f.hideZero = true;
  if (x['roll'] !== undefined) {
    const roll = rollOf(x['roll']);
    if (roll) f.roll = roll;
  }
  return f;
}

// The pack as the app will use it, or what is wrong with it.
export function validatePack(x: unknown): SystemPack | string {
  if (!isObj(x) || x['scryingGlass'] !== 'system') return 'not-a-pack';
  if (x['version'] !== 1) return 'version';
  if (typeof x['id'] !== 'string' || !ID_RE.test(x['id'])) return 'id';
  const title = locOf(x['title']);
  if (!title) return 'title';
  if (!Array.isArray(x['sections'])) return 'sections';
  const keys = new Set<string>();
  const sections: SectionDef[] = [];
  for (const s of x['sections'].slice(0, LIMIT.sections)) {
    if (!isObj(s) || typeof s['id'] !== 'string' || !KEY_RE.test(s['id']) || !Array.isArray(s['fields'])) return 'section';
    const st = locOf(s['title']);
    if (!st) return 'section';
    const fields: FieldDef[] = [];
    for (const raw of s['fields'].slice(0, LIMIT.fields)) {
      const f = fieldOf(raw);
      if (!f) return `field:${isObj(raw) ? String(raw['key']) : '?'}`;
      if (keys.has(f.key)) return `duplicate:${f.key}`;
      keys.add(f.key);
      fields.push(f);
    }
    const kinds = Array.isArray(s['kinds']) ? s['kinds'].filter((k): k is CardKind => KINDS.includes(k as CardKind)) : [];
    sections.push({ id: s['id'], title: st, fields, ...(kinds.length ? { kinds } : {}) });
  }
  if (!sections.length) return 'sections';
  const t = isObj(x['tracker']) ? x['tracker'] : {};
  const ti = isObj(t['init']) ? t['init'] : { type: 'none' };
  const init: TrackerSpec['init'] =
    ti['type'] === 'roll' && typeof ti['dice'] === 'string' && diceOf(ti['dice']) && (ti['bonus'] === undefined || formulaOf(ti['bonus']))
      ? { type: 'roll', dice: ti['dice'], ...(ti['bonus'] ? { bonus: ti['bonus'] as string } : {}) }
      : ti['type'] === 'value' && formulaOf(ti['value'])
        ? { type: 'value', value: ti['value'] as string }
        : { type: 'none' };
  const known = (k: unknown): k is string => typeof k === 'string' && keys.has(k);
  const cond = isObj(t['conditions']) ? t['conditions'] : null;
  const tracker: TrackerSpec = {
    init,
    ...(known(t['hp']) ? { hp: t['hp'] } : {}),
    ...(Array.isArray(t['cells']) ? { cells: t['cells'].filter(known).slice(0, 6) } : {}),
    ...(cond
      ? {
          conditions: {
            list: Array.isArray(cond['list']) ? cond['list'].map((c) => locOf(c)).filter((c): c is Loc => c !== null).slice(0, LIMIT.options) : [],
            free: cond['free'] === true,
          },
        }
      : {}),
  };
  const kinds = Array.isArray(x['kinds']) ? x['kinds'].filter((k): k is CardKind => KINDS.includes(k as CardKind)) : [];
  const compendium = Array.isArray(x['compendium'])
    ? x['compendium'].slice(0, LIMIT.entries).flatMap((e) => {
        if (!isObj(e)) return [];
        const title = locOf(e['title']);
        const text = locOf(e['text'], LIMIT.entry) ?? '';
        const category = locOf(e['category']);
        return title ? [{ title, text, ...(category ? { category } : {}) }] : [];
      })
    : [];
  const str = (k: string, max = LIMIT.text) => (typeof x[k] === 'string' ? { [k]: (x[k] as string).slice(0, max) } : {});
  return {
    scryingGlass: 'system',
    version: 1,
    id: x['id'],
    title,
    ...(typeof x['family'] === 'string' && ID_RE.test(x['family']) ? { family: x['family'] } : {}),
    ...str('author'),
    ...str('license', LIMIT.long),
    ...str('url'),
    ...(num(x['release']) ? { release: Math.floor(num(x['release'])!) } : {}),
    ...(kinds.length ? { kinds } : {}),
    ...str('subtitle'),
    ...(formulaOf(x['rank']) ? { rank: x['rank'] as string } : {}),
    sections,
    tracker,
    ...(compendium.length ? { compendium } : {}),
  };
}

// The languages a pack's texts are in (a text in one string — for any language: 'en', the window's fallback).
export function packLangs(pack: SystemPack): string[] {
  const langs = new Set<string>();
  const add = (l: Loc | undefined) => l && typeof l !== 'string' && Object.keys(l).forEach((k) => langs.add(k));
  add(pack.title);
  for (const e of pack.compendium ?? []) (add(e.title), add(e.text));
  return langs.size ? [...langs] : ['en'];
}

// ---- Formulas ----
// floor((str - 10) / 2), skill + attr, max(1, row.level). Fields by key; in a list row, its columns as row.<key>.
type Node = { n: number } | { v: string } | { op: string; a: Node; b: Node } | { neg: Node } | { fn: string; args: Node[] };
const FNS: Record<string, (...a: number[]) => number> = {
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  abs: Math.abs,
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
};
const cache = new Map<string, Node | null>();

export function parseFormula(text: string): Node | null {
  if (cache.has(text)) return cache.get(text)!;
  const tokens = text.match(/\d+(?:\.\d+)?|row\.[a-z_][a-z0-9_]*|[a-z_][a-z0-9_]*|[-+*/(),]|\S/gi) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  const expr = (): Node | null => {
    let a = term();
    while (a && (peek() === '+' || peek() === '-')) {
      const op = tokens[i++]!;
      const b = term();
      if (!b) return null;
      a = { op, a, b };
    }
    return a;
  };
  const term = (): Node | null => {
    let a = unary();
    while (a && (peek() === '*' || peek() === '/')) {
      const op = tokens[i++]!;
      const b = unary();
      if (!b) return null;
      a = { op, a, b };
    }
    return a;
  };
  const unary = (): Node | null => {
    if (peek() === '-') {
      i++;
      const a = unary();
      return a && { neg: a };
    }
    return atom();
  };
  const atom = (): Node | null => {
    const t = tokens[i++];
    if (t === undefined) return null;
    if (/^\d/.test(t)) return { n: Number(t) };
    if (t === '(') {
      const a = expr();
      return tokens[i++] === ')' ? a : null;
    }
    if (/^[a-z_]/i.test(t)) {
      if (peek() !== '(') return { v: t };
      if (!FNS[t]) return null;
      i++;
      const args: Node[] = [];
      if (peek() !== ')') {
        for (;;) {
          const a = expr();
          if (!a) return null;
          args.push(a);
          if (peek() === ',') i++;
          else break;
        }
      }
      return tokens[i++] === ')' ? { fn: t, args } : null;
    }
    return null;
  };
  const node = tokens.length ? expr() : null;
  const ok = node && i === tokens.length ? node : null;
  if (cache.size > 2000) cache.clear();
  cache.set(text, ok);
  return ok;
}

function evalNode(n: Node, vars: (name: string) => number): number {
  if ('n' in n) return n.n;
  if ('v' in n) return vars(n.v);
  if ('neg' in n) return -evalNode(n.neg, vars);
  if ('fn' in n) return FNS[n.fn]!(...n.args.map((a) => evalNode(a, vars)));
  const a = evalNode(n.a, vars);
  const b = evalNode(n.b, vars);
  return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : b === 0 ? 0 : a / b;
}

// A field as a number: numbers and dots as they are, a track — the boxes marked, a select — the option's number
// (1, 2, …), a formula — its value; anything else — 0.
export function evalFormula(pack: SystemPack, stats: PackStats, text: string, row?: Record<string, unknown>, depth = 0): number {
  const node = parseFormula(text);
  if (!node || depth > 8) return 0;
  const fields = fieldMap(pack);
  const value = evalNode(node, (name) => {
    if (name.startsWith('row.')) return toNum(row?.[name.slice(4)]);
    const f = fields.get(name);
    if (!f) return 0;
    if (f.type === 'formula') return evalFormula(pack, stats, f.formula!, row, depth + 1);
    return fieldNumber(f, stats[f.key]);
  });
  return Number.isFinite(value) ? value : 0;
}

const toNum = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x)) ? Number(x) : 0);
function fieldNumber(f: FieldDef, v: unknown): number {
  if (f.type === 'select') return typeof v === 'number' ? v + 1 : 0;
  return toNum(v);
}

// The fields by key. Not cached: the builder edits a pack in place, and a pack has only dozens of fields.
export const fieldMap = (pack: SystemPack): Map<string, FieldDef> => new Map(pack.sections.flatMap((s) => s.fields.map((f) => [f.key, f] as const)));

// The sections a kind of card has.
export const sectionsFor = (pack: SystemPack, kind: CardKind) => pack.sections.filter((s) => !s.kinds || s.kinds.includes(kind));

// How many boxes a track has (a number or another field's value).
export const boxesOf = (pack: SystemPack, stats: PackStats, f: FieldDef) =>
  Math.max(0, Math.min(40, Math.round(typeof f.boxes === 'number' ? f.boxes : f.boxes ? evalFormula(pack, stats, f.boxes) : 0)));

// ---- Cards ----
export function blankStats(pack: SystemPack, kind: CardKind): PackStats {
  const out: PackStats = {};
  for (const s of sectionsFor(pack, kind)) {
    for (const f of s.fields) {
      if (f.type === 'formula') continue;
      if (f.default !== undefined) out[f.key] = f.default;
      else if (f.type === 'list' || f.type === 'tags' || f.type === 'slots') out[f.key] = [];
      else if (f.type === 'number' || f.type === 'dots' || f.type === 'track') out[f.key] = f.type === 'number' ? (f.min ?? 0) : 0;
    }
  }
  return out;
}

export function packSubtitle(pack: SystemPack, stats: PackStats, lang: string): string {
  if (!pack.subtitle) return '';
  const fields = fieldMap(pack);
  return pack.subtitle
    .replace(/\{([a-z][a-z0-9_]*)\}/g, (_, k: string) => {
      const f = fields.get(k);
      if (!f) return '';
      const v = stats[k];
      if (f.type === 'select') return typeof v === 'number' ? loc(f.options?.[v], lang) : '';
      if (f.type === 'formula') return String(evalFormula(pack, stats, f.formula!));
      return v === undefined || v === null ? '' : String(v);
    })
    .replace(/^[\s·,—-]+|[\s·,—-]+$/g, '')
    .replace(/(\s*·\s*)+/g, ' · ');
}

// What the tracker takes from a card.
export function packCombat(pack: SystemPack, stats: PackStats): CombatStats {
  const t = pack.tracker;
  const fields = fieldMap(pack);
  const hpField = t.hp ? fields.get(t.hp) : undefined;
  const hp = hpField ? (hpField.type === 'track' ? boxesOf(pack, stats, hpField) : evalFormula(pack, stats, hpField.key)) : null;
  const initiative = t.init.type === 'roll' && t.init.bonus ? evalFormula(pack, stats, t.init.bonus) : t.init.type === 'value' ? evalFormula(pack, stats, t.init.value) : 0;
  const cells = (t.cells ?? []).map((k) => fields.get(k)).filter((f): f is FieldDef => !!f && f.key !== t.hp);
  return {
    hp: hp && hp > 0 ? Math.round(hp) : null,
    ac: null,
    initiative: Math.round(initiative),
    stress: cells.filter((f) => f.type === 'track').map((f) => ({ id: f.key, boxes: boxesOf(pack, stats, f) })),
    attrs: cells.filter((f) => f.type === 'number' || f.type === 'dots' || f.type === 'formula').map((f) => ({ id: f.key, value: Math.round(evalFormula(pack, stats, f.key)) })),
  };
}

// ---- Rolls ----
export interface PackRollResult {
  // The dice as they fell (groups: the pool and its push, the trait die and the wild die…).
  dice: number[][];
  // The total, or the successes of a pool.
  total: number;
  // In words: «Hard success», «7–9», «2 successes».
  outcome: string;
  // good / partial / bad — for the colour.
  tone: 'good' | 'partial' | 'bad' | 'none';
  // What the roll was against: the target, the bonus.
  note: string;
  // A pool that can still be pushed: what to roll again.
  push?: { sides: number; success?: number; best?: boolean; dice: number[] };
}

export interface RollWords {
  success: string;
  failure: string;
  successes: (n: number) => string;
  critical: string;
}

type Die = (sides: number) => number;

function diceOf(text: string): { count: number; sides: number; bonus: number } | null {
  const m = /^\s*(\d*)\s*[dк]\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i.exec(text);
  if (!m) return null;
  const count = Number(m[1] || 1);
  const sides = Number(m[2]);
  if (count < 1 || count > 50 || sides < 2 || sides > 1000) return null;
  return { count, sides, bonus: m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0 };
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function rollPack(
  spec: RollSpec,
  value: (formula: string) => number,
  lang: string,
  words: RollWords,
  die: Die,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  row?: Record<string, unknown>,
): PackRollResult {
  const r = rollRaw(spec, value, lang, words, die, mode, row);
  // A name of the total (the Fate ladder), unless the roll has one already.
  const labels = 'labels' in spec ? spec.labels : undefined;
  const label = !r.outcome && labels ? labels.find((l) => r.total >= l.min) : undefined;
  return label ? { ...r, outcome: loc(label.title, lang) } : r;
}

function rollRaw(
  spec: RollSpec,
  value: (formula: string) => number,
  lang: string,
  words: RollWords,
  die: Die,
  mode: 'normal' | 'advantage' | 'disadvantage',
  row?: Record<string, unknown>,
): PackRollResult {
  switch (spec.type) {
    case 'd20': {
      const bonus = Math.round(value(spec.bonus));
      const rolls = mode === 'normal' ? [die(20)] : [die(20), die(20)];
      const nat = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls[0]!;
      return { dice: [rolls], total: nat + bonus, outcome: nat === 20 ? words.critical : '', tone: nat === 20 ? 'good' : nat === 1 ? 'bad' : 'none', note: `d20 ${signed(bonus)}` };
    }
    case 'under': {
      const target = Math.round(value(spec.target));
      const two = mode === 'normal' ? [die(spec.sides)] : [die(spec.sides), die(spec.sides)];
      const r = mode === 'advantage' ? Math.min(...two) : mode === 'disadvantage' ? Math.max(...two) : two[0]!;
      const levels = [...(spec.levels ?? [])].sort((a, b) => b.divide - a.divide);
      const level = levels.find((l) => r <= Math.floor(target / l.divide));
      const ok = r <= target;
      return { dice: [two], total: r, outcome: level ? loc(level.title, lang) : ok ? words.success : words.failure, tone: ok ? 'good' : 'bad', note: `d${spec.sides} ≤ ${target}` };
    }
    case 'bands': {
      const d = diceOf(spec.dice)!;
      const rolls = Array.from({ length: d.count }, () => die(d.sides));
      const bonus = Math.round(value(spec.bonus)) + d.bonus;
      const total = rolls.reduce((a, b) => a + b, 0) + bonus;
      const i = spec.bands.findIndex((b) => total >= b.min);
      const band = spec.bands[i];
      const tone = i < 0 ? 'bad' : i === 0 ? 'good' : i === spec.bands.length - 1 ? 'bad' : 'partial';
      return { dice: [rolls], total, outcome: band ? loc(band.title, lang) : '', tone, note: `${d.count}d${d.sides} ${signed(bonus)}` };
    }
    case 'pool': {
      const n = Math.max(0, Math.min(30, Math.round(value(spec.count))));
      // Forged in the Dark: no dice — two, the lower counts.
      const zero = n === 0 && !!spec.best;
      const rolls = Array.from({ length: zero ? 2 : n }, () => die(spec.sides));
      return { ...poolResult(spec, [rolls], zero, words), note: `${n}d${spec.sides}`, ...(spec.push && rolls.length ? { push: { sides: spec.sides, ...(spec.success ? { success: spec.success } : {}), dice: rolls } } : {}) };
    }
    case 'fate': {
      const bonus = Math.round(value(spec.bonus));
      const faces = Array.from({ length: 4 }, () => die(3) - 2);
      const total = faces.reduce((a, b) => a + b, 0) + bonus;
      return { dice: [faces], total, outcome: '', tone: 'none', note: `4dF ${signed(bonus)}` };
    }
    case 'sum': {
      // Dice from the row: «d6/d8» — the first; nothing that reads — 1d6.
      const text = ROW_DICE.test(spec.dice) ? String(row?.[spec.dice.slice(4)] ?? '').split('/')[0]!.trim() : spec.dice;
      const d = diceOf(text) ?? diceOf(`d${text.replace(/^[dк]/i, '')}`) ?? { count: 1, sides: 6, bonus: 0 };
      const rolls = Array.from({ length: d.count }, () => die(d.sides));
      const bonus = (spec.bonus ? Math.round(value(spec.bonus)) : 0) + d.bonus;
      return { dice: [rolls], total: rolls.reduce((a, b) => a + b, 0) + bonus, outcome: '', tone: 'none', note: `${d.count}d${d.sides}${bonus ? ` ${signed(bonus)}` : ''}` };
    }
    case 'explode': {
      const sides = Math.max(2, Math.min(100, Math.round(value(spec.sides))));
      const bonus = spec.bonus ? Math.round(value(spec.bonus)) : 0;
      const ace = (s: number) => {
        const out = [die(s)];
        while (out.at(-1) === s && out.length < 20) out.push(die(s));
        return out;
      };
      const trait = ace(sides);
      const wild = spec.wild ? ace(spec.wild) : null;
      const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
      const best = Math.max(sum(trait), wild ? sum(wild) : 0);
      return { dice: wild ? [trait, wild] : [trait], total: best + bonus, outcome: '', tone: 'none', note: `d${sides}${wild ? ` · d${spec.wild}` : ''}${bonus ? ` ${signed(bonus)}` : ''}` };
    }
  }
}

function poolResult(spec: { sides: number; success?: number; best?: boolean }, groups: number[][], zero: boolean, words: RollWords) {
  const all = groups.flat();
  if (spec.best || !spec.success) {
    const top = all.length ? (zero ? Math.min(...all) : Math.max(...all)) : 0;
    const crit = !zero && all.filter((d) => d === spec.sides).length > 1;
    const tone: PackRollResult['tone'] = crit || top === spec.sides ? 'good' : top >= spec.sides - 2 ? 'partial' : 'bad';
    return { dice: groups, total: top, outcome: crit ? words.critical : '', tone };
  }
  const n = all.filter((d) => d >= spec.success!).length;
  return { dice: groups, total: n, outcome: n ? words.successes(n) : words.failure, tone: n ? ('good' as const) : ('bad' as const) };
}

// Push a pool roll (Year Zero): the dice that aren't successes are rolled again, once.
export function pushPool(push: NonNullable<PackRollResult['push']>, words: RollWords, die: Die): PackRollResult {
  const keep = push.dice.filter((d) => push.success !== undefined && d >= push.success);
  const again = push.dice.filter((d) => !(push.success !== undefined && d >= push.success)).map(() => die(push.sides));
  return { ...poolResult(push, [keep, again], false, words), note: `${push.dice.length}d${push.sides}` };
}
