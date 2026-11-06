// System packs: a role-playing system described by a file, not by code — the sections and fields of its cards, the
// rolls on them, what the initiative tracker shows. The app draws the card, the editor, the rolls and the tracker
// from it. Packs come in a package (shared/content.ts, <library>/content/<id>/system/), or from the Community and the
// builder into <library>/systems/; samples/systems/ — samples published in the official repository. Only pure
// functions here: the core, the windows and the tests use them.
//
// A pack may come from a stranger (the Community): `validatePack` takes only what it knows, with sizes capped, and
// formulas are a tiny language of their own (numbers, fields, + − × ÷, a few functions) — never code.
import { threatOfRaw, type ThreatSpec } from './threat';
import type { SheetResources } from './players';
import type { CardKind, CombatStats } from './cards';
import { oldEntryTypes, oldOverflow, oldUses } from './features';
import { kitOf, type PackKit } from './generators';

// Text in several languages ({ en, ru }) or one string for all.
export type Loc = string | Record<string, string>;
export const loc = (l: Loc | undefined, lang: string): string =>
  l === undefined ? '' : typeof l === 'string' ? l : (l[lang] ?? l['en'] ?? Object.values(l)[0] ?? '');

export type FieldType = 'number' | 'text' | 'textarea' | 'select' | 'dots' | 'track' | 'tags' | 'list' | 'formula' | 'slots';
export const FIELD_TYPES: FieldType[] = ['number', 'text', 'textarea', 'select', 'dots', 'track', 'tags', 'list', 'formula', 'slots'];
// long — text with markup: a row with one reads as a paragraph in a section of lines.
export type ColumnType = 'text' | 'number' | 'dots' | 'dice' | 'long';
export const COLUMN_TYPES: ColumnType[] = ['text', 'number', 'dots', 'dice', 'long'];

// Names of a total: the highest one whose `min` it reaches (the Fate ladder: +3 — «Good»).
export type RollLabels = { min: number; title: Loc }[];

// How a roll goes. Numbers are formulas over the card's fields (and `row.<key>` in a list row).
export type RollSpec =
  // d20 + bonus (advantage and disadvantage with Shift / Alt); degrees — against a DC typed in the roll log: success or
  // failure ('two'), or four degrees by 10 with a natural 20 / 1 one better / worse ('four', Pathfinder).
  // steps: the next attacks of a turn, added to the bonus — a button each (+17 / +12 / +7).
  | { type: 'd20'; bonus: string; labels?: RollLabels; degrees?: Degrees; steps?: string[] }
  // A die (d100, d20) under the target; levels — harder successes at a fraction of it («hard» — half). Advantage —
  // the lower of two dice, disadvantage — the higher (a Mausritter save).
  | { type: 'under'; sides: number; target: string; levels?: { title: Loc; divide: number }[]; onSuccess?: RollChange; onFail?: RollChange }
  // Dice + bonus against bands of outcome (PbtA: 10+, 7–9, 6−), the highest band that fits.
  | { type: 'bands'; dice: string; bonus: string; bands: { min: number; title: Loc; change?: RollChange }[] }
  // A pool of dice: successes are faces ≥ `success` (Year Zero: sixes) or the best die (Forged in the Dark: the top
  // face — full success, two below it — partial, less — bad, two tops — critical; no dice — two, the lower counts);
  // push — the roll can be pushed once (the dice that aren't successes are rolled again); resist — the best die is a
  // resistance roll: stress taken = sides − the best, a critical clears one.
  // Year Zero: the dice are of kinds (kind — of these, groups — more of other kinds): a 1 on an attribute, gear or
  // stress die is a bane (damage to it, a broken item, panic — a stress 1 on any roll), artifact dice (d8–d12) give
  // more successes on high faces; a push keeps successes and banes, pushStress — it adds a stress die (Alien); ask —
  // dice added or taken at the moment of the roll (help, darkness), askRange — how many at most (3 if not set).
  // max — no more dice than this, whatever is added. A plain pool counting successes: need — the log asks how many
  // successes are needed and says the outcome and the extra ones; tweak — the log changes the roll after it: a success
  // added or taken, a die rolled again by a click, all failed dice or all 1s again, fives counting as successes.
  // marked — that many dice of the pool are special: they count as the others, a push leaves them, and they can say
  // something (top — a pair of top faces with one of them, one — a failure with a 1 on one of them); pairs — extra
  // successes for each pair of top faces; pushMax — a push rolls no more dice than this.
  | {
      type: 'pool'; sides: number; count: string; success?: number; best?: boolean; push?: boolean; resist?: boolean;
      kind?: PoolKind; groups?: PoolGroup[]; pushStress?: boolean; ask?: boolean; askRange?: number; max?: number;
      need?: boolean; tweak?: boolean; marked?: PoolMarked; pairs?: number; pushMax?: number;
    }
  // 4dF + bonus.
  | { type: 'fate'; bonus: string; labels?: RollLabels }
  // A plain sum: dice + bonus (damage, a table); dice — «2d6» or a column of the list row: «row.damage» (its text,
  // «d6/d8» — the first one).
  | { type: 'sum'; dice: string; bonus?: string; labels?: RollLabels }
  // One die of `sides` that explodes on its maximum (Savage Worlds), plus a wild die if set; the better counts.
  | { type: 'explode'; sides: string; bonus?: string; wild?: number };
export const ROLL_TYPES = ['d20', 'under', 'bands', 'pool', 'fate', 'sum', 'explode'] as const;
export type Degrees = 'two' | 'four';
// What an outcome does to the sheet: a field marked at the table goes up or down by this (a number or dice, «-1d6»).
export interface RollChange {
  field: string;
  by: string;
}
export interface PoolMarked {
  count: string;
  top?: Loc;
  one?: Loc;
}
export type PoolKind = 'base' | 'skill' | 'gear' | 'stress' | 'artifact';
export const POOL_KINDS: PoolKind[] = ['base', 'skill', 'gear', 'stress', 'artifact'];
// A group of dice of a kind in a pool (the main dice are the first group); sides — of artifact dice (8, 10, 12).
export interface PoolGroup {
  kind: PoolKind;
  count: string;
  sides?: number;
  title?: Loc;
}
// Kinds whose 1 is a bane (stays on a push).
const BANED: PoolKind[] = ['base', 'gear', 'stress'];

export interface ColumnDef {
  key: string;
  type: ColumnType;
  title: Loc;
  max?: number;
  // In a section of lines: a number with its sign (+3); how the cell looks.
  signed?: boolean;
  show?: ColumnShow;
  // dice: the cell rolls ({1d8+11} piercing, or just dice) and has a ×2 button: doubling the dice or the total.
  crit?: CritBy;
}
export type ColumnShow = 'strong' | 'note' | 'label' | 'hidden';
export const COLUMN_SHOWS: ColumnShow[] = ['strong', 'note', 'label', 'hidden'];
export type CritBy = 'dice' | 'total';
export const CRIT_BYS: CritBy[] = ['dice', 'total'];

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
  // In a section of lines: goes on the previous field's line after this mark; a number with its sign; no title;
  // tags as chips; a list — each row on its own line.
  rowLines?: boolean;
  join?: FieldJoin;
  signed?: boolean;
  bare?: boolean;
  chips?: boolean;
  // number: left empty, it counts by this formula (a typed value wins).
  auto?: string;
  // A roll by a click on the field (on a row of a list).
  roll?: RollSpec;
  // A track, dots, a number (with `max`) or a formula (its value is the most there can be: hit points) marked at the
  // table, apart from the card: 'both' — by the player too, 'gm' —
  // by the GM only (shared/players.ts).
  live?: LiveBy;
}

export type FieldJoin = ',' | ';';
export const FIELD_JOINS: FieldJoin[] = [',', ';'];
export type LiveBy = 'both' | 'gm';
export const LIVE_TYPES: FieldType[] = ['track', 'dots', 'number', 'formula'];

// A named event of the game that returns fields marked at the table to the card's values (a rest, a new day).
export interface PackReset {
  id: string;
  title: Loc;
  fields: string[];
}

export interface SectionDef {
  id: string;
  title: Loc;
  // Only for these kinds of cards (none — for all).
  kinds?: CardKind[];
  // 'lines' — a stat block: fields as lines of text, in the order of a book; 'grid' — a table the fields fill row by
  // row (`grid`); none — tiles.
  view?: 'lines' | 'grid';
  noTitle?: boolean;
  grid?: { columns: Loc[]; rows: Loc[] };
  fields: FieldDef[];
}

export interface TrackerSpec {
  // The order of turns: a roll (dice + bonus), a field's value, or no initiative at all (the list's order).
  init: { type: 'roll'; dice: string; bonus?: string } | { type: 'value'; value: string } | { type: 'none' };
  // The field that is health (numbers: current of the max — the field's value).
  hp?: string;
  // Fields shown in a combatant's row: tracks (boxes to mark) and numbers (current / max).
  cells?: string[];
  // A number cell that takes the damage past health, and at 0 the combatant is down.
  overflow?: string;
  // The field that is defence (Armour Class): a column of the tracker.
  defence?: string;
  // Conditions: a list to choose from and/or free text; valued — the ones with a number («Frightened 2»).
  // entries — a condition opens the compendium entry of its name, wherever the entry comes from.
  conditions?: { list?: Loc[]; free?: boolean; valued?: Loc[]; entries?: boolean };
}

// The format this app writes. A pack remembers the format it was saved in (none — 1), so an app knows what it can
// offer an older pack and can refuse to rewrite a newer one: it would lose what it doesn't know. `version` stays 1:
// older apps refuse any other, and they read a newer pack well enough.
export const PACK_FORMAT = 7;

export interface SystemPack {
  scryingGlass: 'system';
  version: 1;
  format?: number;
  // What of the core the system uses (shared/features.ts). Unknown ids stay: a newer app may know them.
  uses?: string[];
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
  // The line under a card's name: «{role} · {tier}» (fields by key; one for every language or per language).
  subtitle?: Loc;
  // What the system gives, a line under its title in Settings → Game systems.
  about?: Loc;
  // A number to sort cards by (a formula).
  rank?: string;
  // The threat of a fight by an XP budget (needs `rank`).
  threat?: ThreatSpec;
  sections: SectionDef[];
  tracker: TrackerSpec;
  // None — a game with nothing to return: fields stay as marked.
  resets?: PackReset[];
  // Types of compendium entries of its family: skills, spells… Entries of a package's books use them.
  entryTypes?: PackEntryType[];
  // Its own tables and generators (shared/generators.ts): a system of one file brings them as a package does.
  kit?: PackKit;
  // Its own compendium: rules, conditions, gear… (Markdown), shown in adventures of this system as built-in entries.
  compendium?: PackEntry[];
  // Set by the core, never read from a file: the GM's own pack (in the library), not a built-in one.
  own?: boolean;
}

export interface PackEntryType {
  id: string;
  title: Loc;
  plural: Loc;
  fields?: { key: string; title: Loc; kind: 'text' | 'number' | 'bool' | 'list' }[];
  // The line under an entry's title: «Spell {rank} · {actions}»; {key} — its fields, empty parts drop out.
  subtitle?: Loc;
  // Fields to filter the list by, and a field that heads its groups («Rank {n}», `zero` for 0).
  filters?: EntryFilter[];
  groupBy?: { key: string; title: Loc; zero?: Loc };
}
// chips — the values the entries have, any of those picked; tri — yes / no.
export interface EntryFilter {
  key: string;
  kind: 'chips' | 'tri';
}
export type FilterPick = string[] | 'yes' | 'no';

export interface PackEntry {
  title: Loc;
  // A kind of `entryTypes`; none — a rule.
  type?: string;
  // Its values, by the field's key.
  fields?: Record<string, Loc>;
  // A heading to group entries by («Conditions», «Gear»).
  category?: Loc;
  text: Loc;
}

// Entries of a pack's compendium from a Markdown file (the rules of a book): with «##» headings in it, «#» is a group
// and «##» an entry; without them, «#» is an entry. The text under a heading is the entry's; deeper headings stay in
// it. A group's own text (before its first entry) becomes an entry named as the group.
export function entriesFromMarkdown(md: string): PackEntry[] {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const nested = lines.some((l) => /^##\s+\S/.test(l));
  const out: PackEntry[] = [];
  let group = '';
  let cur: { title: string; lines: string[] } | null = null;
  const flush = () => {
    if (!cur) return;
    const text = cur.lines.join('\n').trim();
    // A group heading without text of its own is only a group.
    if (cur.title && (text || cur.title !== group))
      out.push({ title: cur.title.slice(0, LIMIT.text), ...(group ? { category: group.slice(0, LIMIT.text) } : {}), text: text.slice(0, LIMIT.entry) });
    cur = null;
  };
  for (const line of lines) {
    const h1 = /^#\s+(.+?)\s*#*\s*$/.exec(line);
    const h2 = nested ? /^##\s+(.+?)\s*#*\s*$/.exec(line) : null;
    if (h1 && nested) {
      flush();
      group = h1[1]!;
      cur = { title: group, lines: [] };
    } else if (h1 || h2) {
      flush();
      cur = { title: (h2 ?? h1)![1]!, lines: [] };
    } else if (cur) cur.lines.push(line);
  }
  flush();
  return out.slice(0, LIMIT.entries);
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
    if (f.auto) check(f.key, f.auto);
    if (Array.isArray(r?.['steps'])) for (const x of r['steps'] as string[]) check(f.key, x, f.columns?.map((c) => c.key));
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
const CHANGE_RE = /^[+-]?(\d+|\d*d\d+)$/;
const USE_RE = /^[a-z][A-Za-z0-9-]{0,40}$/;
const LIMIT = { uses: 40, resets: 8, sections: 40, fields: 80, options: 60, columns: 8, text: 200, long: 4000, formula: 200, entries: 500, entry: 30000 };

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
      return f('bonus') !== null
        ? { type: 'd20', bonus: x['bonus'] as string, ...withLabels, ...(x['degrees'] === 'two' || x['degrees'] === 'four' ? { degrees: x['degrees'] } : {}), ...(stepsOf(x['steps']).length ? { steps: stepsOf(x['steps']) } : {}) }
        : null;
    case 'under': {
      const sides = num(x['sides']);
      if (!sides || sides < 2 || sides > 1000 || f('target') === null) return null;
      const levels = Array.isArray(x['levels'])
        ? x['levels'].flatMap((l) => (isObj(l) && locOf(l['title']) && num(l['divide']) && (l['divide'] as number) >= 1 ? [{ title: locOf(l['title'])!, divide: l['divide'] as number }] : [])).slice(0, 4)
        : [];
      const [good, bad] = [changeOf(x['onSuccess']), changeOf(x['onFail'])];
      return { type: 'under', sides, target: x['target'] as string, ...(levels.length ? { levels } : {}), ...(good ? { onSuccess: good } : {}), ...(bad ? { onFail: bad } : {}) };
    }
    case 'bands': {
      const bands = Array.isArray(x['bands'])
        ? x['bands'].flatMap((b) => {
            if (!isObj(b) || num(b['min']) === undefined || !locOf(b['title'])) return [];
            const change = changeOf(b['change']);
            return [{ min: b['min'] as number, title: locOf(b['title'])!, ...(change ? { change } : {}) }];
          }).slice(0, 8)
        : [];
      if (typeof x['dice'] !== 'string' || !diceOf(x['dice']) || f('bonus') === null || !bands.length) return null;
      return { type: 'bands', dice: x['dice'], bonus: x['bonus'] as string, bands: bands.sort((a, b) => b.min - a.min) };
    }
    case 'pool': {
      const sides = num(x['sides']);
      if (!sides || sides < 2 || sides > 100 || f('count') === null) return null;
      const success = num(x['success']);
      const best = x['best'] === true;
      const kindOf = (k: unknown) => (POOL_KINDS.includes(k as PoolKind) ? (k as PoolKind) : null);
      const groups = Array.isArray(x['groups'])
        ? x['groups'].flatMap((g): PoolGroup[] => {
            if (!isObj(g) || !kindOf(g['kind']) || formulaOf(g['count']) === null) return [];
            const s = num(g['sides']);
            const title = locOf(g['title']);
            return [{ kind: kindOf(g['kind'])!, count: g['count'] as string, ...(s && s >= 2 && s <= 100 ? { sides: Math.round(s) } : {}), ...(title ? { title } : {}) }];
          }).slice(0, 6)
        : [];
      // Kinds, groups and the rest of Year Zero — only for a pool counting successes.
      const yz = !best && !!success;
      // Needed successes and changes after the roll — a pool without kinds.
      const plain = yz && !kindOf(x['kind']) && !groups.length;
      const mk = isObj(x['marked']) && formulaOf(x['marked']['count']) !== null ? x['marked'] : null;
      const marked: PoolMarked | null = mk ? { count: mk['count'] as string, ...(locOf(mk['top']) ? { top: locOf(mk['top'])! } : {}), ...(locOf(mk['one']) ? { one: locOf(mk['one'])! } : {}) } : null;
      return {
        type: 'pool', sides, count: x['count'] as string, ...(success ? { success } : {}), ...(best ? { best: true } : {}), ...(x['push'] === true ? { push: true } : {}),
        ...(best && x['resist'] === true ? { resist: true } : {}),
        ...(yz && kindOf(x['kind']) ? { kind: kindOf(x['kind'])! } : {}),
        ...(yz && groups.length ? { groups } : {}),
        ...(yz && x['pushStress'] === true ? { pushStress: true } : {}),
        ...(x['ask'] === true ? { ask: true } : {}),
        ...(x['ask'] === true && num(x['askRange']) && (x['askRange'] as number) >= 1 ? { askRange: Math.min(10, Math.round(x['askRange'] as number)) } : {}),
        ...(num(x['max']) && (x['max'] as number) >= 1 ? { max: Math.min(30, Math.round(x['max'] as number)) } : {}),
        ...(plain && x['need'] === true ? { need: true } : {}),
        ...(plain && x['tweak'] === true ? { tweak: true } : {}),
        ...(plain && marked ? { marked } : {}),
        ...(plain && num(x['pairs']) && (x['pairs'] as number) >= 1 ? { pairs: Math.min(10, Math.round(x['pairs'] as number)) } : {}),
        ...(plain && num(x['pushMax']) && (x['pushMax'] as number) >= 1 ? { pushMax: Math.min(30, Math.round(x['pushMax'] as number)) } : {}),
      };
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
  if (x['live'] === 'both' || x['live'] === 'gm') {
    if (LIVE_TYPES.includes(type) && (type !== 'number' || f.max !== undefined)) f.live = x['live'];
  }
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
          return t ? [{ key: c['key'], type: c['type'] as ColumnType, title: t, ...(num(c['max']) ? { max: num(c['max']) } : {}), ...(c['signed'] === true ? { signed: true } : {}), ...(COLUMN_SHOWS.includes(c['show'] as ColumnShow) ? { show: c['show'] as ColumnShow } : {}), ...(CRIT_BYS.includes(c['crit'] as CritBy) ? { crit: c['crit'] as CritBy } : {}) }] : [];
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
  if (FIELD_JOINS.includes(x['join'] as FieldJoin)) f.join = x['join'] as FieldJoin;
  if (x['signed'] === true) f.signed = true;
  if (x['bare'] === true) f.bare = true;
  if (x['chips'] === true && type === 'tags') f.chips = true;
  if (x['rowLines'] === true && type === 'list') f.rowLines = true;
  if (type === 'number' && formulaOf(x['auto'])) f.auto = x['auto'] as string;
  if (x['roll'] !== undefined) {
    const roll = rollOf(x['roll']);
    if (roll) f.roll = roll;
  }
  return f;
}

function viewOf(s: Record<string, unknown>): Pick<SectionDef, 'view' | 'grid'> {
  if (s['view'] === 'lines') return { view: 'lines' };
  const g = isObj(s['grid']) ? s['grid'] : {};
  const locs = (v: unknown) => (Array.isArray(v) ? v.map((x) => locOf(x)).filter((x): x is Loc => x !== null).slice(0, 12) : []);
  const [columns, rows] = [locs(g['columns']), locs(g['rows'])];
  return s['view'] === 'grid' && columns.length && rows.length ? { view: 'grid', grid: { columns, rows } } : {};
}

const stepsOf = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string' && !!formulaOf(v)).slice(0, 4) : []);

function changeOf(x: unknown): RollChange | null {
  if (!isObj(x) || typeof x['field'] !== 'string' || !KEY_RE.test(x['field']) || typeof x['by'] !== 'string' || !CHANGE_RE.test(x['by'])) return null;
  return { field: x['field'], by: x['by'] };
}

const ENTRY_KINDS = ['text', 'number', 'bool', 'list'];
function entryTypesOf(x: unknown): PackEntryType[] | null {
  if (!Array.isArray(x)) return null;
  return x.slice(0, LIMIT.sections).flatMap((t) => {
    if (!isObj(t) || typeof t['id'] !== 'string' || !USE_RE.test(t['id'])) return [];
    const [title, plural] = [locOf(t['title']), locOf(t['plural'])];
    if (!title || !plural) return [];
    const fields = (Array.isArray(t['fields']) ? t['fields'] : []).flatMap((f) => {
      const ft = isObj(f) ? locOf(f['title']) : null;
      return isObj(f) && typeof f['key'] === 'string' && KEY_RE.test(f['key']) && ft && ENTRY_KINDS.includes(f['kind'] as string)
        ? [{ key: f['key'], title: ft, kind: f['kind'] as 'text' }]
        : [];
    });
    const subtitle = locOf(t['subtitle']);
    const known = new Set(fields.map((f) => f.key));
    const filters = (Array.isArray(t['filters']) ? t['filters'] : []).flatMap((f): EntryFilter[] => (isObj(f) && known.has(f['key'] as string) ? [{ key: f['key'] as string, kind: f['kind'] === 'tri' ? 'tri' : 'chips' }] : [])).slice(0, 8);
    const g = isObj(t['groupBy']) ? t['groupBy'] : null;
    const gt = g ? locOf(g['title']) : null;
    const gz = g ? locOf(g['zero']) : null;
    const groupBy = g && gt && known.has(g['key'] as string) ? { key: g['key'] as string, title: gt, ...(gz ? { zero: gz } : {}) } : null;
    return [{ id: t['id'], title, plural, ...(fields.length ? { fields } : {}), ...(subtitle ? { subtitle } : {}), ...(filters.length ? { filters } : {}), ...(groupBy ? { groupBy } : {}) }];
  });
}

// A pack ready to be written: stamped with the format of this app, or 'newer' when it was made by a newer one.
export function forSaving(p: SystemPack): SystemPack | 'newer' {
  return (p.format ?? 1) > PACK_FORMAT ? 'newer' : { ...p, format: PACK_FORMAT };
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
    sections.push({ id: s['id'], title: st, fields, ...(kinds.length ? { kinds } : {}), ...viewOf(s), ...(s['noTitle'] === true ? { noTitle: true } : {}) });
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
  const familyOfRaw = typeof x['family'] === 'string' ? x['family'] : x['id'];
  const kit = x['kit'] === undefined ? undefined : kitOf(x['kit'], x['id']);
  if (typeof kit === 'string') return `kit:${kit}`;
  const tracker: TrackerSpec = {
    init,
    ...(known(t['hp']) ? { hp: t['hp'] } : {}),
    ...(known(t['defence']) ? { defence: t['defence'] } : {}),
    ...(Array.isArray(t['cells']) ? { cells: t['cells'].filter(known).slice(0, 6) } : {}),
    ...(known(t['overflow']) ? { overflow: t['overflow'] } : x['format'] === undefined && oldOverflow(familyOfRaw) ? { overflow: oldOverflow(familyOfRaw) } : {}),
    ...(cond
      ? {
          conditions: {
            list: Array.isArray(cond['list']) ? cond['list'].map((c) => locOf(c)).filter((c): c is Loc => c !== null).slice(0, LIMIT.options) : [],
            free: cond['free'] === true,
            ...(cond['entries'] === true ? { entries: true } : {}),
            ...(Array.isArray(cond['valued']) && cond['valued'].length
              ? { valued: cond['valued'].map((c) => locOf(c)).filter((c): c is Loc => c !== null).slice(0, LIMIT.options) }
              : {}),
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
        const type = typeof e['type'] === 'string' && USE_RE.test(e['type']) ? e['type'] : undefined;
        const fields = isObj(e['fields'])
          ? Object.fromEntries(Object.entries(e['fields']).flatMap(([k, v]) => {
              const value = KEY_RE.test(k) ? locOf(v) : null;
              return value === null ? [] : [[k, value] as const];
            }))
          : {};
        return title ? [{ title, text, ...(type ? { type } : {}), ...(Object.keys(fields).length ? { fields } : {}), ...(category ? { category } : {}) }] : [];
      })
    : [];
  const live = new Set(sections.flatMap((s) => s.fields).filter((f) => f.live).map((f) => f.key));
  const resets = Array.isArray(x['resets'])
    ? x['resets'].slice(0, LIMIT.resets).flatMap((r) => {
        const title = isObj(r) ? locOf(r['title']) : null;
        if (!isObj(r) || !title || typeof r['id'] !== 'string' || !KEY_RE.test(r['id']) || !Array.isArray(r['fields'])) return [];
        const fields = r['fields'].filter((k): k is string => typeof k === 'string' && live.has(k));
        return fields.length ? [{ id: r['id'], title, fields }] : [];
      })
    : [];
  const str = (k: string, max = LIMIT.text) => (typeof x[k] === 'string' ? { [k]: (x[k] as string).slice(0, max) } : {});
  return {
    scryingGlass: 'system',
    version: 1,
    ...(Number.isInteger(x['format']) && (x['format'] as number) > 0 ? { format: x['format'] as number } : {}),
    ...(kit ? { kit } : {}),
    entryTypes: entryTypesOf(x['entryTypes']) ?? oldEntryTypes(familyOfRaw).flatMap((t) => entryTypesOf([t]) ?? []),
    uses: Array.isArray(x['uses']) ? [...new Set(x['uses'].filter((u): u is string => typeof u === 'string' && USE_RE.test(u)))].slice(0, LIMIT.uses) : oldUses(familyOfRaw),
    id: x['id'],
    title,
    ...(typeof x['family'] === 'string' && ID_RE.test(x['family']) ? { family: x['family'] } : {}),
    ...str('author'),
    ...str('license', LIMIT.long),
    ...str('url'),
    ...(num(x['release']) ? { release: Math.floor(num(x['release'])!) } : {}),
    ...(kinds.length ? { kinds } : {}),
    ...(locOf(x['subtitle']) ? { subtitle: locOf(x['subtitle'])! } : {}),
    ...(locOf(x['about']) ? { about: locOf(x['about'])! } : {}),
    ...(formulaOf(x['rank']) ? { rank: x['rank'] as string } : {}),
    ...(threatOfRaw(x['threat'], locOf) ? { threat: threatOfRaw(x['threat'], locOf)! } : {}),
    sections,
    tracker,
    ...(resets.length ? { resets } : {}),
    ...(compendium.length ? { compendium } : {}),
  };
}

// How far a field marked at the table goes.
export const liveLimit = (pack: SystemPack, stats: PackStats, f: FieldDef) =>
  f.type === 'track' ? boxesOf(pack, stats, f) : f.type === 'formula' ? Math.max(0, Math.round(evalFormula(pack, stats, f.key))) : (f.max ?? (f.type === 'dots' ? 5 : 0));

// What a card of the system tracks at the table.
export function packResources(pack: SystemPack, stats: PackStats, kind: CardKind): SheetResources {
  // One card, many creatures: a stat block has no table.
  if (kind !== 'character') return { limits: {}, resets: {} };
  const live = sectionsFor(pack, kind).flatMap((s) => s.fields).filter((f) => f.live && liveLimit(pack, stats, f) > 0);
  const limits = Object.fromEntries(live.map((f) => [f.key, liveLimit(pack, stats, f)]));
  const resets = (pack.resets ?? []).flatMap((r) => {
    const keys = r.fields.filter((k) => Object.hasOwn(limits, k));
    return keys.length ? [[r.id, keys] as const] : [];
  });
  return { limits, resets: Object.fromEntries(resets), gmOnly: live.filter((f) => f.live === 'gm').map((f) => f.key) };
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
  if: (c = 0, a = 0, b = 0) => (c ? a : b),
  // Comparisons give 1 or 0 (generators: shared/generators.ts).
  eq: (a = 0, b = 0) => (a === b ? 1 : 0),
  lt: (a = 0, b = 0) => (a < b ? 1 : 0),
  le: (a = 0, b = 0) => (a <= b ? 1 : 0),
  gt: (a = 0, b = 0) => (a > b ? 1 : 0),
  ge: (a = 0, b = 0) => (a >= b ? 1 : 0),
  not: (a = 0) => (a ? 0 : 1),
  // A die: only a generator rolls (`calc`), a field of a sheet stays the same every time it is read.
  d: () => 0,
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

// A formula as the builder shows it: the fields by their titles in brackets («[Body] + [Strength] − 1»), − × ÷ for
// the signs; and back. Labels must be unique: a title two fields share (or an empty one) gets its key in brackets
// after it — unless only one of them is of `first` (the fields with a number: a formula reads those), which keeps the
// title. A label the pack hasn't stays «[…]» — the formula then doesn't read.
export function formulaLabels(titles: Record<string, string>, first: string[] = []): Record<string, string> {
  const firsts = new Set(first);
  const count = (keys: string[]) => {
    const m = new Map<string, number>();
    for (const k of keys) m.set(titles[k]!, (m.get(titles[k]!) ?? 0) + 1);
    return m;
  };
  const inFirst = count(Object.keys(titles).filter((k) => firsts.has(k)));
  const inAll = count(Object.keys(titles));
  const plain = (k: string, v: string) => !!v.trim() && !/[[\]]/.test(v) && (firsts.has(k) ? inFirst.get(v) === 1 : inAll.get(v) === 1 && !inFirst.has(v));
  return Object.fromEntries(Object.entries(titles).map(([k, v]) => [k, plain(k, v) ? v : `${v.trim() || k} (${k})`]));
}
const FORMULA_FNS = new Set(['floor', 'ceil', 'round', 'abs', 'min', 'max']);
export function formulaToText(formula: string, labels: Record<string, string>): string {
  return formula.replace(/row\.[a-z_][a-z0-9_]*|[a-z_][a-z0-9_]*|[-*/]/gi, (w) =>
    w === '-' ? '−' : w === '*' ? '×' : w === '/' ? '÷' : FORMULA_FNS.has(w) || !labels[w] ? w : `[${labels[w]}]`,
  );
}
export function formulaFromText(text: string, labels: Record<string, string>): string {
  const keyOf = new Map(Object.entries(labels).map(([k, v]) => [v, k]));
  return text
    .split(/(\[[^\]]*\])/)
    .map((part) => (part.startsWith('[') ? (keyOf.get(part.slice(1, -1).trim()) ?? part) : part.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/')))
    .join('');
}

// A formula in the words of the sheet: the names of the fields instead of their keys, − × ÷, and the functions said
// the way a rule says them — min(15, x) is «x, no more than 15», max(0, x) — «x, not below 0», floor(x) — «x, rounded
// down». Null — it doesn't read.
export interface FormulaWords {
  atMost: (x: string, n: string) => string;
  atLeast: (x: string, n: string) => string;
  least: (xs: string[]) => string;
  most: (xs: string[]) => string;
  floor: (x: string) => string;
  ceil: (x: string) => string;
  round: (x: string) => string;
  abs: (x: string) => string;
}
export function readFormula(text: string, name: (key: string) => string, words: FormulaWords): string | null {
  const node = parseFormula(text);
  if (!node) return null;
  const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const SIGN: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  const say = (n: Node, outer = 0): string => {
    if ('n' in n) return String(n.n);
    if ('v' in n) return name(n.v);
    if ('neg' in n) return `−${say(n.neg, 3)}`;
    if ('fn' in n) {
      const args = n.args.map((x) => say(x));
      const fixed = n.args.findIndex((x) => 'n' in x);
      const said =
        (n.fn === 'min' || n.fn === 'max') && n.args.length === 2 && fixed >= 0
          ? (n.fn === 'min' ? words.atMost : words.atLeast)(args[1 - fixed]!, args[fixed]!)
          : n.fn === 'min'
            ? words.least(args)
            : n.fn === 'max'
              ? words.most(args)
              : words[n.fn as 'floor' | 'ceil' | 'round' | 'abs'](args[0] ?? '');
      // Inside a sum the words of a function keep to their part: a − (b ÷ 2, rounded down).
      return outer > 0 ? `(${said})` : said;
    }
    const p = PREC[n.op]!;
    // The right side of − and ÷ keeps its brackets at the same level: a − (b + c).
    const text = `${say(n.a, p)} ${SIGN[n.op]} ${say(n.b, n.op === '-' || n.op === '/' ? p + 0.5 : p)}`;
    return p < outer ? `(${text})` : text;
  };
  return say(node);
}

function evalNode(n: Node, vars: (name: string) => number, die?: (sides: number) => number): number {
  if ('n' in n) return n.n;
  if ('v' in n) return vars(n.v);
  if ('neg' in n) return -evalNode(n.neg, vars, die);
  if ('fn' in n) {
    const args = n.args.map((a) => evalNode(a, vars, die));
    return n.fn === 'd' && die ? die(Math.max(1, Math.round(args[0] ?? 1))) : FNS[n.fn]!(...args);
  }
  const a = evalNode(n.a, vars, die);
  const b = evalNode(n.b, vars, die);
  return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : b === 0 ? 0 : a / b;
}

// A formula over named numbers, with `d(n)` rolled by `die`.
export function calc(text: string, vars: (name: string) => number, die: (sides: number) => number): number {
  const node = parseFormula(text);
  const value = node ? evalNode(node, vars, die) : 0;
  return Number.isFinite(value) ? value : 0;
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
    // A value marked at the table comes in the stats (pack/Sheet.svelte); a card keeps no value of a formula.
    if (f.type === 'formula') return typeof stats[f.key] === 'number' ? (stats[f.key] as number) : evalFormula(pack, stats, f.formula!, row, depth + 1);
    const v = stats[f.key];
    if (f.auto && (v === undefined || v === null || v === '')) return evalFormula(pack, stats, f.auto, undefined, depth + 1);
    return fieldNumber(f, v);
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

// The line under an entry's title from a template: «Spell {rank} · {actions}», an empty part goes with its dots.
export function entryLine(template: string, get: (key: string) => unknown): string {
  const text = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v === undefined || v === null ? '' : String(v));
  return template.split('·').map((part) => {
    const keys = [...part.matchAll(/\{([a-z_][a-z0-9_]*)\}/gi)].map((m) => m[1]!);
    if (keys.length && keys.every((k) => !text(get(k)).trim())) return '';
    return part.replace(/\{([a-z_][a-z0-9_]*)\}/gi, (_, k: string) => text(get(k))).trim();
  }).filter(Boolean).join(' · ');
}

// The values of a field among entries, numbers in order.
const valuesOf = (v: unknown) => (Array.isArray(v) ? v.map(String) : v === undefined || v === null || v === '' ? [] : typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : [String(v)]);
export function filterValues(entries: Record<string, unknown>[], key: string): string[] {
  const all = [...new Set(entries.flatMap((e) => valuesOf(e[key])))];
  return all.every((x) => x.trim() !== '' && !Number.isNaN(Number(x))) ? all.sort((a, b) => Number(a) - Number(b)) : all.sort((a, b) => a.localeCompare(b));
}
// Within a field — any of those picked, between fields — all at once.
export function filterMatches(entry: Record<string, unknown>, filters: EntryFilter[], picks: Record<string, FilterPick>): boolean {
  return filters.every((f) => {
    const p = picks[f.key];
    if (p === undefined) return true;
    if (typeof p === 'string') return !!entry[f.key] === (p === 'yes');
    if (!p.length) return true;
    const own = valuesOf(entry[f.key]);
    return p.some((x) => own.includes(x));
  });
}
export function groupOfEntry(entry: Record<string, unknown>, g: NonNullable<PackEntryType['groupBy']>, lang: string) {
  const n = Number(entry[g.key] ?? NaN);
  if (Number.isNaN(n)) return { order: 9999, title: '—' };
  return { order: n, title: n === 0 && g.zero ? loc(g.zero, lang) : loc(g.title, lang).replace('{n}', String(n)) };
}

// A section of lines: the fields on one line (a field that joins goes on the previous one's). A long field — alone.
export function lineGroups(fields: FieldDef[]): FieldDef[][] {
  const out: FieldDef[][] = [];
  for (const f of fields) {
    if (f.join && out.length && !aloneOnLine(f) && !aloneOnLine(out.at(-1)![0]!)) out.at(-1)!.push(f);
    else out.push([f]);
  }
  return out;
}
export const longColumn = (f: FieldDef) => f.columns?.find((c) => c.type === 'long');
export const aloneOnLine = (f: FieldDef) => f.type === 'textarea' || f.type === 'slots' || !!f.chips || (f.type === 'list' && (!!f.rowLines || !!longColumn(f)));
// The dice of a cell: {1d10+1} piercing plus {1d6} fire — their sum; a cell of plain dice as it is.
export const cellDice = (text: string) => [...text.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]!).join('+') || (diceOf(text.trim()) ? text.trim() : '');
export const cellText = (text: string) => text.replace(/\{([^}]+)\}/g, '$1');
export const signedNum = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

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
      if (f.auto) continue;
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
  return loc(pack.subtitle, lang)
    .replace(/\{([a-z][a-z0-9_]*)\}/g, (_, k: string) => {
      const f = fields.get(k);
      if (!f) return '';
      const v = stats[k];
      if (f.type === 'select') return typeof v === 'number' ? loc(f.options?.[v], lang) : '';
      if (f.type === 'formula') return String(evalFormula(pack, stats, f.formula!));
      return v === undefined || v === null ? '' : Array.isArray(v) ? v.join(' ') : String(v);
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
    ac: t.defence && fields.has(t.defence) ? evalFormula(pack, stats, t.defence) : null,
    ...(pack.threat?.xpField && fields.has(pack.threat.xpField) ? { xp: evalFormula(pack, stats, pack.threat.xpField) } : {}),
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
  // A pool that can still be pushed: what to roll again (groups — the dice by kind, Year Zero).
  push?: { sides: number; success?: number; best?: boolean; dice: number[]; groups?: { kind: PoolKind; sides: number; dice: number[] }[]; pushStress?: boolean; special?: SpecialPool };
  // What the outcome does to the sheet, rolled.
  change?: { field: string; by: number };
  // Said when the roll fails: against the successes typed in the log, or with none at all.
  onFail?: string;
  // A d20 roll judged against a DC typed in the log (the natural die, two or four degrees).
  dc?: { natural: number; degrees: Degrees };
  // A pool whose needed successes are typed in the log.
  need?: boolean;
  // A pool the log can change after the roll (tweakPool).
  tally?: Tally;
}

// The dice of a pool changed after the roll: added successes, fives counting, how many dice were rolled again.
export interface Tally {
  sides: number;
  success: number;
  dice: number[];
  plus: number;
  fives: boolean;
  rerolled: number;
}
export type TallyOp = { plus: 1 | -1 } | { die: number } | { failed: true } | { ones: true } | { fives: boolean };

export interface RollWords {
  success: string;
  failure: string;
  successes: (n: number) => string;
  critical: string;
  // The best die of a pool: a full success, a partial one, a bad outcome; a resistance roll — stress taken (n < 0 —
  // cleared).
  full?: string;
  partial?: string;
  bad?: string;
  stress?: (n: number) => string;
  // Year Zero: banes on dice of a kind (damage to the attribute, the gear), a stress 1 — panic.
  bane?: (kind: PoolKind, n: number) => string;
  panic?: string;
  // Changes after the roll: successes added (n < 0 — taken), dice rolled again, fives counting.
  plus?: (n: number) => string;
  rerolled?: (n: number) => string;
  fives?: string;
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
  const done = label ? { ...r, outcome: loc(label.title, lang) } : r;
  const c = changeFor(spec, done);
  return c ? { ...done, change: { field: c.field, by: changeBy(c.by, die) } } : done;
}

function changeFor(spec: RollSpec, r: PackRollResult): RollChange | undefined {
  if (spec.type === 'bands') return spec.bands.find((b) => r.total >= b.min)?.change;
  if (spec.type === 'under') return r.tone === 'bad' ? spec.onFail : spec.onSuccess;
  return undefined;
}

// «-1d6» rolled, «2» as it is.
function changeBy(by: string, die: Die): number {
  const m = /^([+-]?)(\d*)d(\d+)$/.exec(by);
  if (!m) return Number(by) || 0;
  const sum = Array.from({ length: Number(m[2] || 1) }, () => die(Number(m[3]))).reduce((a, b) => a + b, 0);
  return m[1] === '-' ? -sum : sum;
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
      return {
        dice: [rolls], total: nat + bonus, outcome: nat === 20 ? words.critical : '', tone: nat === 20 ? 'good' : nat === 1 ? 'bad' : 'none', note: `d20 ${signed(bonus)}`,
        ...(spec.degrees ? { dc: { natural: nat, degrees: spec.degrees } } : {}),
      };
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
      if (spec.kind || spec.groups?.length) {
        const groups = [{ kind: spec.kind ?? 'base', count: spec.count, sides: spec.sides }, ...(spec.groups ?? [])].map((g) => {
          const n = Math.max(0, Math.min(spec.max ?? 30, Math.round(value(g.count))));
          const sides = g.sides ?? spec.sides;
          return { kind: g.kind, sides, dice: Array.from({ length: n }, () => die(sides)) };
        });
        const total = groups.reduce((a, g) => a + g.dice.length, 0);
        return {
          ...kindsResult(groups, spec.success!, words),
          note: groups.filter((g) => g.dice.length).map((g) => `${g.dice.length}d${g.sides}`).join(' + ') || '0d6',
          ...(spec.push && total ? { push: { sides: spec.sides, success: spec.success!, dice: groups.flatMap((g) => g.dice), groups, ...(spec.pushStress ? { pushStress: true } : {}) } } : {}),
        };
      }
      const n = Math.max(0, Math.min(spec.max ?? 30, Math.round(value(spec.count))));
      if (spec.success && (spec.marked || spec.pairs || spec.pushMax)) {
        const m = spec.marked ? Math.max(0, Math.min(n, Math.round(value(spec.marked.count)))) : 0;
        const rolled = { plain: Array.from({ length: n - m }, () => die(spec.sides)), marked: Array.from({ length: m }, () => die(spec.sides)) };
        const special: SpecialPool = { sides: spec.sides, success: spec.success, ...rolled, ...(spec.pairs ? { pairs: spec.pairs } : {}), ...(spec.pushMax ? { pushMax: spec.pushMax } : {}), ...(spec.marked?.top ? { top: loc(spec.marked.top, lang) } : {}), ...(spec.marked?.one ? { one: loc(spec.marked.one, lang) } : {}) };
        return { ...specialResult(special, words), note: `${n}d${spec.sides}`, ...(spec.need ? { need: true } : {}), ...(spec.push && n ? { push: { sides: spec.sides, success: spec.success, dice: rolled.plain, special } } : {}) };
      }
      if (spec.tweak && spec.success) {
        const tally: Tally = { sides: spec.sides, success: spec.success, dice: Array.from({ length: n }, () => die(spec.sides)), plus: 0, fives: false, rerolled: 0 };
        return { ...tallyResult(tally, words), ...(spec.need ? { need: true } : {}), ...(spec.push && n ? { push: { sides: spec.sides, success: spec.success, dice: tally.dice } } : {}) };
      }
      // Forged in the Dark: no dice — two, the lower counts.
      const zero = n === 0 && !!spec.best;
      const rolls = Array.from({ length: zero ? 2 : n }, () => die(spec.sides));
      return { ...poolResult(spec, [rolls], zero, words), note: `${n}d${spec.sides}`, ...(spec.need ? { need: true } : {}), ...(spec.push && rolls.length ? { push: { sides: spec.sides, ...(spec.success ? { success: spec.success } : {}), dice: rolls } } : {}) };
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

function poolResult(spec: { sides: number; success?: number; best?: boolean; resist?: boolean }, groups: number[][], zero: boolean, words: RollWords) {
  const all = groups.flat();
  if (spec.best || !spec.success) {
    const top = all.length ? (zero ? Math.min(...all) : Math.max(...all)) : 0;
    const crit = !zero && all.filter((d) => d === spec.sides).length > 1;
    if (spec.resist) {
      const stress = crit ? -1 : spec.sides - top;
      return { dice: groups, total: top, outcome: words.stress?.(stress) ?? '', tone: stress <= 0 ? ('good' as const) : stress <= 2 ? ('partial' as const) : ('bad' as const) };
    }
    const tone: PackRollResult['tone'] = crit || top === spec.sides ? 'good' : top >= spec.sides - 2 ? 'partial' : 'bad';
    const outcome = crit ? words.critical : spec.best ? ((tone === 'good' ? words.full : tone === 'partial' ? words.partial : words.bad) ?? '') : '';
    return { dice: groups, total: top, outcome, tone };
  }
  const n = all.filter((d) => d >= spec.success!).length;
  return { dice: groups, total: n, outcome: n ? words.successes(n) : words.failure, tone: n ? ('good' as const) : ('bad' as const) };
}

// Successes of a die: a face ≥ success; an artifact die (d8–d12) — more on high faces (6–7: 1, 8–9: 2, 10–11: 3, 12: 4).
const successesOf = (kind: PoolKind, face: number, success: number) => (face < success ? 0 : kind === 'artifact' ? 1 + Math.floor((face - success) / 2) : 1);

// A pool of dice by kind (Year Zero): successes, banes by kind, panic on a stress 1.
function kindsResult(groups: { kind: PoolKind; sides: number; dice: number[] }[], success: number, words: RollWords) {
  const n = groups.reduce((a, g) => a + g.dice.reduce((b, d) => b + successesOf(g.kind, d, success), 0), 0);
  const banes = new Map<PoolKind, number>();
  for (const g of groups) if (BANED.includes(g.kind)) banes.set(g.kind, (banes.get(g.kind) ?? 0) + g.dice.filter((d) => d === 1).length);
  const panic = (banes.get('stress') ?? 0) > 0;
  const said = [
    n ? words.successes(n) : words.failure,
    ...(['base', 'gear'] as const).flatMap((k) => (banes.get(k) ? [words.bane?.(k, banes.get(k)!) ?? ''] : [])),
    ...(panic ? [words.panic ?? ''] : []),
  ].filter(Boolean);
  return { dice: groups.map((g) => g.dice), total: n, outcome: said.join(' · '), tone: panic ? ('bad' as const) : n ? ('good' as const) : ('bad' as const) };
}

// A pool with special dice or a bonus for pairs of top faces.
export interface SpecialPool {
  sides: number;
  success: number;
  plain: number[];
  marked: number[];
  pairs?: number;
  pushMax?: number;
  top?: string;
  one?: string;
}

export function specialResult(p: SpecialPool, words: RollWords): Pick<PackRollResult, 'dice' | 'total' | 'outcome' | 'tone' | 'onFail'> {
  const all = [...p.plain, ...p.marked];
  const tops = all.filter((d) => d === p.sides).length;
  const pairs = p.pairs ? Math.floor(tops / 2) : 0;
  const total = all.filter((d) => d >= p.success).length + pairs * (p.pairs ?? 0);
  const topSaid = pairs && p.top && p.marked.includes(p.sides) ? p.top : '';
  const said = [total ? words.successes(total) : words.failure, ...(pairs ? [words.critical] : []), ...(topSaid ? [topSaid] : [])];
  return {
    dice: [p.plain, p.marked],
    total,
    outcome: said.join(' · '),
    tone: total ? 'good' : 'bad',
    ...(p.one && p.marked.includes(1) ? { onFail: p.one } : {}),
  };
}

// A pool changed after the roll: its successes (fives too, if they count), the added ones, the words.
export function tallyResult(tally: Tally, words: RollWords): PackRollResult {
  const at = tally.fives ? Math.min(5, tally.success) : tally.success;
  const n = Math.max(0, tally.dice.filter((d) => d >= at).length + tally.plus);
  const said = [
    n ? words.successes(n) : words.failure,
    ...(tally.plus ? [words.plus?.(tally.plus) ?? ''] : []),
    ...(tally.rerolled ? [words.rerolled?.(tally.rerolled) ?? ''] : []),
    ...(tally.fives ? [words.fives ?? ''] : []),
  ].filter(Boolean);
  return { dice: [tally.dice], total: n, outcome: said.join(' · '), tone: n ? 'good' : 'bad', note: `${tally.dice.length}d${tally.sides}`, tally };
}

// Change a pool after the roll: a success added or taken, one die (its place) rolled again, all failed dice, all 1s,
// fives counting or not.
export function tweakPool(tally: Tally, op: TallyOp, words: RollWords, die: Die): PackRollResult {
  const at = tally.fives ? Math.min(5, tally.success) : tally.success;
  const again = (pick: (d: number, i: number) => boolean) => {
    let count = 0;
    const dice = tally.dice.map((d, i) => (pick(d, i) ? (count++, die(tally.sides)) : d));
    return { ...tally, dice, rerolled: tally.rerolled + count };
  };
  const next: Tally =
    'plus' in op
      ? { ...tally, plus: tally.plus + op.plus }
      : 'die' in op
        ? again((_d, i) => i === op.die)
        : 'failed' in op
          ? again((d) => d < at)
          : 'ones' in op
            ? again((d) => d === 1)
            : { ...tally, fives: op.fives };
  return tallyResult(next, words);
}

// Push a pool roll (Year Zero): the dice that aren't successes are rolled again, once; banes (a 1 on an attribute, gear
// or stress die) stay; pushStress — one stress die more.
export function pushPool(push: NonNullable<PackRollResult['push']>, words: RollWords, die: Die): PackRollResult {
  if (push.special) {
    const p = push.special;
    let left = p.pushMax ?? p.plain.length;
    const plain = p.plain.map((d) => (d < p.success && left > 0 ? (left--, die(p.sides)) : d));
    return { ...specialResult({ ...p, plain }, words), note: `${p.plain.length + p.marked.length}d${p.sides}` };
  }
  if (push.groups) {
    const groups = push.groups.map((g) => ({
      ...g,
      dice: g.dice.map((d) => (successesOf(g.kind, d, push.success!) || (d === 1 && BANED.includes(g.kind)) ? d : die(g.sides))),
    }));
    if (push.pushStress) {
      const stress = groups.find((g) => g.kind === 'stress');
      if (stress) stress.dice.push(die(stress.sides));
      else groups.push({ kind: 'stress', sides: push.sides, dice: [die(push.sides)] });
    }
    return { ...kindsResult(groups, push.success!, words), note: groups.filter((g) => g.dice.length).map((g) => `${g.dice.length}d${g.sides}`).join(' + ') };
  }
  const keep = push.dice.filter((d) => push.success !== undefined && d >= push.success);
  const again = push.dice.filter((d) => !(push.success !== undefined && d >= push.success)).map(() => die(push.sides));
  return { ...poolResult(push, [keep, again], false, words), note: `${push.dice.length}d${push.sides}` };
}
