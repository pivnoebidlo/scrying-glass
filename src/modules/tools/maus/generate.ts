// Tools → Mausritter tables: rolls on the GM tables of the Mausritter SRD — a mouse settlement, a hex, an adventure
// site with its rooms, a treasure horde, a non-player mouse, an adventure seed, the weather of a season, a reaction.
// Pure functions: a result keeps the table rows it picked, the words come from SRD_TABLES in the interface language.
import { die } from '../../../shared/dice';
import { NAMES } from '../mouse/content';
import { SRD_TABLES, type SrdTable } from './srd';

export const KINDS = ['settlement', 'hex', 'site', 'treasure', 'npc', 'seed', 'weather', 'reaction'] as const;
export type Kind = (typeof KINDS)[number];
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export type Season = (typeof SEASONS)[number];

// A cell of a table: which table, which row, which column (none — the last one).
export interface Cell {
  table: string;
  row: number;
  col?: number;
}

// A line of a result: a label (a message key of the tool), the cells it shows and, where it helps, what was rolled
// and an extra (a number of pips, «cursed»).
export interface Line {
  label: string;
  cells: Cell[];
  // How the cells are joined: a name is glued («Oak» + «thorpe»), the rest — with « — ».
  join?: 'name' | 'dash' | 'comma';
  roll?: string;
  extra?: { key: string; params?: Record<string, number | string> };
  // A room, a horde item: a nested group.
  sub?: Line[];
}

export interface Result {
  kind: Kind;
  lines: Line[];
}

export interface Options {
  rooms: number;
  // Treasure: the four questions that add a d20 each.
  former: boolean;
  magical: boolean;
  guarded: boolean;
  adversity: boolean;
  season: Season;
}
export const DEFAULT_OPTIONS: Options = { rooms: 6, former: false, magical: false, guarded: false, adversity: false, season: 'Spring' };

type Roll = (sides: number) => number;
const T = (id: string): SrdTable => SRD_TABLES.en[id]!;

// «3-5», «3–5», «5+», «11» → [from, to].
export function rangeOf(cell: string): [number, number] | null {
  const m = /^(\d+)\s*(?:([-–])\s*(\d+)|(\+))?$/.exec(cell.trim());
  if (!m) return null;
  const from = Number(m[1]);
  return [from, m[3] ? Number(m[3]) : m[4] ? Infinity : from];
}

// The row of a table whose first column holds the number.
export function rowFor(id: string, n: number): number {
  const i = T(id).rows.findIndex((r) => {
    const range = rangeOf(r[0]!);
    return !!range && n >= range[0] && n <= range[1];
  });
  if (i < 0) throw new Error(`${id}: no row for ${n}`);
  return i;
}

const sum = (rolls: number[]) => rolls.reduce((a, b) => a + b, 0);
const dice = (n: number, sides: number, roll: Roll) => Array.from({ length: n }, () => roll(sides));
const line = (label: string, table: string, row: number, extra: Partial<Line> = {}): Line => ({ label, cells: [{ table, row }], ...extra });
const d = (sides: number, roll: Roll, table: string, label: string) => {
  const n = roll(sides);
  return line(label, table, rowFor(table, n), { roll: `d${sides}: ${n}` });
};

// ---------- Mouse settlement ----------

export function settlement(roll: Roll = die): Result {
  const two = [roll(6), roll(6)];
  const size = Math.min(...two);
  const gov = roll(6);
  const lines: Line[] = [
    line('size', 'size', size - 1, { roll: `2d6↓: ${two.join(', ')} → ${size}` }),
    line('governance', 'governance', rowFor('governance', gov + size), { roll: `d6 + ${size}: ${gov + size}` }),
    d(20, roll, 'inhabitants', 'inhabitants'),
    ...Array.from({ length: size >= 6 ? 2 : 1 }, () => d(20, roll, 'feature', 'feature')),
    ...Array.from({ length: size >= 5 ? 2 : 1 }, () => d(20, roll, 'industry', 'industry')),
    d(20, roll, 'event', 'event'),
    // A name: a start (column A or B) and an end (column A or B), each by d12.
    { label: 'name', join: 'name', cells: [{ table: 'names', row: roll(12) - 1, col: roll(2) }, { table: 'names', row: roll(12) - 1, col: 2 + roll(2) }] },
  ];
  // Hamlets and larger have a tavern.
  if (size >= 3) {
    lines.push({
      label: 'tavern',
      join: 'comma',
      cells: [
        { table: 'tavern', row: roll(12) - 1, col: 1 },
        { table: 'tavern', row: roll(12) - 1, col: 2 },
        { table: 'tavern', row: roll(12) - 1, col: 3 },
      ],
    });
  }
  return { kind: 'settlement', lines };
}

// ---------- Hex ----------

// Landmark details: d6 picks a group, d8 — a row inside it (a group starts with its d6 in the first column; 1 has one row).
export function landmarkDetailRow(d6: number, d8: number): number {
  const rows = T('landmarkDetail').rows;
  const start = rows.findIndex((r) => r[0] === String(d6));
  const group = rows.slice(start + 1).findIndex((r) => r[0] !== '');
  const size = group < 0 ? rows.length - start : group + 1;
  return start + Math.min(size, d8) - 1;
}

export function hex(roll: Roll = die): Result {
  const typeRoll = roll(6);
  const type = rowFor('hexType', typeRoll);
  const landmark = roll(20);
  const [d6, d8] = [roll(6), roll(8)];
  return {
    kind: 'hex',
    lines: [
      line('hexType', 'hexType', type, { roll: `d6: ${typeRoll}` }),
      { label: 'landmark', cells: [{ table: 'landmark', row: landmark - 1, col: type + 1 }], roll: `d20: ${landmark}` },
      line('detail', 'landmarkDetail', landmarkDetailRow(d6, d8), { roll: d6 === 1 ? `d6: 1` : `d6: ${d6}, d8: ${d8}` }),
    ],
  };
}

// ---------- Adventure site ----------

// Room types in the order of the columns of the creature and treasure tables.
const ROOM_DETAIL: Record<number, [string, number]> = { 0: ['empty', 20], 1: ['obstacle', 8], 2: ['trap', 8], 3: ['puzzle', 6], 4: ['lair', 6] };

export function room(n: number, roll: Roll = die): Line {
  const typeRoll = roll(6);
  const type = rowFor('roomType', typeRoll);
  const [c, tr] = [roll(6), roll(6)];
  const creature = T('roomCreature').rows[c - 1]![type + 1] === 'X';
  const treasure = T('roomTreasure').rows[tr - 1]![type + 1] === 'X';
  const [table, sides] = ROOM_DETAIL[type]!;
  const detail = roll(sides);
  const flags = [creature ? 'creature' : '', treasure ? 'treasure' : ''].filter(Boolean).join('+');
  return {
    label: 'room',
    join: 'dash',
    cells: [{ table: 'roomType', row: type }, { table, row: rowFor(table, detail) }],
    roll: `d6: ${typeRoll}, d${sides}: ${detail}`,
    extra: { key: flags ? `room.${flags}` : 'room.none', params: { n } },
  };
}

export function site(opts: Pick<Options, 'rooms'>, roll: Roll = die): Result {
  const rooms = Math.max(1, Math.min(20, Math.round(opts.rooms)));
  return {
    kind: 'site',
    lines: [
      d(20, roll, 'construction', 'construction'),
      d(12, roll, 'ruination', 'ruination'),
      d(10, roll, 'denizens', 'denizens'),
      d(8, roll, 'seeking', 'seeking'),
      d(6, roll, 'secret', 'secret'),
      ...Array.from({ length: rooms }, (_, i) => room(i + 1, roll)),
    ],
  };
}

// ---------- Treasure ----------

// The rows of the main treasure table, by meaning (in the SRD order).
const SUBTABLE: Record<number, string> = { 2: 'trinket', 3: 'valuable', 4: 'unusual', 5: 'large', 6: 'useful' };
const PIPS: Record<number, number> = { 7: 100, 8: 50, 9: 10, 10: 5 };

export function treasureItem(roll: Roll = die): Line {
  const n = roll(20);
  const row = rowFor('treasure', n);
  const head = { table: 'treasure', row };
  const at = `d20: ${n}`;
  if (row === 0) {
    // A magic sword: its class, the sword and 1-in-6 — cursed.
    const cls = roll(6);
    const sword = roll(10);
    const cursed = roll(6) === 1;
    const curse = roll(6);
    const sub: Line[] = [
      line('swordClass', 'swordClass', rowFor('swordClass', cls), { roll: `d6: ${cls}` }),
      { label: 'sword', join: 'dash', cells: [{ table: 'sword', row: sword - 1, col: 1 }, { table: 'sword', row: sword - 1, col: 2 }], roll: `d10: ${sword}` },
    ];
    if (cursed) sub.push({ label: 'curse', join: 'dash', cells: [{ table: 'curse', row: curse - 1, col: 1 }, { table: 'curse', row: curse - 1, col: 2 }], roll: `d6: ${curse}` });
    return { label: 'treasure', cells: [head], roll: at, sub, ...(cursed ? { extra: { key: 'cursed' } } : {}) };
  }
  if (row === 1) {
    const s = dice(2, 8, roll);
    return { label: 'treasure', cells: [head], roll: at, sub: [{ label: 'spell', cells: [{ table: 'spells', row: rowFor('spells', sum(s)), col: 1 }], roll: `2d8: ${sum(s)}` }] };
  }
  if (SUBTABLE[row]) return { label: 'treasure', cells: [head], roll: at, sub: [d(6, roll, SUBTABLE[row]!, SUBTABLE[row]!)] };
  const k = roll(6);
  return { label: 'treasure', cells: [head], roll: at, extra: { key: 'pips', params: { count: k * PIPS[row]! } } };
}

export function treasure(opts: Pick<Options, 'former' | 'magical' | 'guarded' | 'adversity'>, roll: Roll = die): Result {
  const count = 2 + [opts.former, opts.magical, opts.guarded, opts.adversity].filter(Boolean).length;
  return { kind: 'treasure', lines: Array.from({ length: count }, () => treasureItem(roll)) };
}

// The pips of a horde in total.
export const hordePips = (r: Result) => r.lines.reduce((a, l) => a + (l.extra?.key === 'pips' ? Number(l.extra.params?.['count'] ?? 0) : 0), 0);

// ---------- Non-player mouse, seed, weather, reaction ----------

export function npc(roll: Roll = die): Result {
  const col = (c: number, label: string): Line => {
    const n = roll(20);
    return { label, cells: [{ table: 'npcDetails', row: n - 1, col: c }], roll: `d20: ${n}` };
  };
  const social = roll(6);
  const sign = roll(6);
  return {
    kind: 'npc',
    lines: [
      { label: 'name', cells: [], extra: { key: 'mouseName', params: { i: roll(NAMES.en.length) - 1 } } },
      { label: 'social', join: 'dash', cells: [{ table: 'social', row: social - 1, col: 1 }, { table: 'social', row: social - 1, col: 2 }], roll: `d6: ${social}` },
      { label: 'sign', join: 'dash', cells: [{ table: 'npcSign', row: sign - 1, col: 1 }, { table: 'npcSign', row: sign - 1, col: 2 }], roll: `d6: ${sign}` },
      col(1, 'appearance'),
      col(2, 'quirk'),
      col(3, 'wants'),
      col(4, 'relationship'),
    ],
  };
}

// d66: two d6 — tens and ones; the rows go 11…16, 21…26 … 61…66. Each column is rolled on its own.
export function seed(roll: Roll = die): Result {
  const col = (c: number, label: string): Line => {
    const [a, b] = [roll(6), roll(6)];
    return { label, cells: [{ table: 'seed', row: (a - 1) * 6 + (b - 1), col: c }], roll: `d66: ${a}${b}` };
  };
  return { kind: 'seed', lines: [col(1, 'creature'), col(2, 'problem'), col(3, 'complication')] };
}

export function weather(opts: Pick<Options, 'season'>, roll: Roll = die): Result {
  const w = dice(2, 6, roll);
  const row = rowFor(`weather${opts.season}`, sum(w));
  // The SRD marks weather poor for travel in bold.
  const poor = T(`weather${opts.season}`).rows[row]![1]!.includes('**');
  return {
    kind: 'weather',
    lines: [
      { label: 'weather', cells: [{ table: `weather${opts.season}`, row }], roll: `2d6: ${sum(w)}`, ...(poor ? { extra: { key: 'poor' } } : {}) },
      d(6, roll, `events${opts.season}`, 'seasonEvent'),
    ],
  };
}

export function reaction(roll: Roll = die): Result {
  const r = dice(2, 6, roll);
  return { kind: 'reaction', lines: [{ label: 'reaction', cells: [{ table: 'reaction', row: rowFor('reaction', sum(r)) }], roll: `2d6: ${sum(r)}` }] };
}

export function generate(kind: Kind, opts: Options, roll: Roll = die): Result {
  switch (kind) {
    case 'settlement':
      return settlement(roll);
    case 'hex':
      return hex(roll);
    case 'site':
      return site(opts, roll);
    case 'treasure':
      return treasure(opts, roll);
    case 'npc':
      return npc(roll);
    case 'seed':
      return seed(roll);
    case 'weather':
      return weather(opts, roll);
    case 'reaction':
      return reaction(roll);
  }
}
