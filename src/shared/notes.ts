// Записки — раздатка, сделанная прямо в приложении: текст на «бумаге» выбранным шрифтом. Файл
// «<название>.note.json» лежит в папке раздатки, как картинки, и показывается игрокам так же.
// Только типы, подписи и чистые функции: используются ядром и окнами.

export const NOTE_SUFFIX = '.note.json';
export const isNotePath = (path: string) => path.toLowerCase().endsWith(NOTE_SUFFIX);
// «Глава 1/handouts/Письмо старосты.note.json» -> «Письмо старосты».
export const noteTitle = (path: string) => {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return name.slice(0, name.length - NOTE_SUFFIX.length);
};

import { t } from './i18n';
import { SEAL_EMBLEMS, type SealEmblem } from './emblems';

// Шрифты лежат внутри приложения (renderer/lib/note/fonts, лицензия OFL), все с кириллицей.
export const NOTE_FONTS = {
  marck: { get title() {
    return t('notes.font.marck');
  }, family: 'Marck Script', get group() {
    return t('notes.fontGroup.hand');
  } },
  badscript: { get title() {
    return t('notes.font.badscript');
  }, family: 'Bad Script', get group() {
    return t('notes.fontGroup.hand');
  } },
  caveat: { get title() {
    return t('notes.font.caveat');
  }, family: 'Caveat', get group() {
    return t('notes.fontGroup.hand');
  } },
  greatvibes: { get title() {
    return t('notes.font.greatvibes');
  }, family: 'Great Vibes', get group() {
    return t('notes.fontGroup.hand');
  } },
  amatic: { get title() {
    return t('notes.font.amatic');
  }, family: 'Amatic SC', get group() {
    return t('notes.fontGroup.hand');
  } },
  neucha: { get title() {
    return t('notes.font.neucha');
  }, family: 'Neucha', get group() {
    return t('notes.fontGroup.hand');
  } },
  brush: { get title() {
    return t('notes.font.brush');
  }, family: 'Comforter Brush', get group() {
    return t('notes.fontGroup.hand');
  } },
  cormorant: { get title() {
    return t('notes.font.cormorant');
  }, family: 'Cormorant Garamond', get group() {
    return t('notes.fontGroup.book');
  } },
  oldstandard: { get title() {
    return t('notes.font.oldstandard');
  }, family: 'Old Standard TT', get group() {
    return t('notes.fontGroup.book');
  } },
  kurale: { get title() {
    return t('notes.font.kurale');
  }, family: 'Kurale', get group() {
    return t('notes.fontGroup.book');
  } },
  forum: { get title() {
    return t('notes.font.forum');
  }, family: 'Forum', get group() {
    return t('notes.fontGroup.book');
  } },
  yeseva: { get title() {
    return t('notes.font.yeseva');
  }, family: 'Yeseva One', get group() {
    return t('notes.fontGroup.book');
  } },
  ruslan: { get title() {
    return t('notes.font.ruslan');
  }, family: 'Ruslan Display', get group() {
    return t('notes.fontGroup.special');
  } },
  ponomar: { get title() {
    return t('notes.font.ponomar');
  }, family: 'Ponomar', get group() {
    return t('notes.fontGroup.special');
  } },
  monomakh: { get title() {
    return t('notes.font.monomakh');
  }, family: 'Monomakh', get group() {
    return t('notes.fontGroup.special');
  } },
  underdog: { get title() {
    return t('notes.font.underdog');
  }, family: 'Underdog', get group() {
    return t('notes.fontGroup.special');
  } },
  wetpaint: { get title() {
    return t('notes.font.wetpaint');
  }, family: 'Rubik Wet Paint', get group() {
    return t('notes.fontGroup.creepy');
  } },
  distressed: { get title() {
    return t('notes.font.distressed');
  }, family: 'Rubik Distressed', get group() {
    return t('notes.fontGroup.creepy');
  } },
  beastly: { get title() {
    return t('notes.font.beastly');
  }, family: 'Rubik Beastly', get group() {
    return t('notes.fontGroup.creepy');
  } },
} as const;
export type NoteFont = keyof typeof NOTE_FONTS;

export const NOTE_PAPERS = {
  get parchment() {
    return t('notes.paper.parchment');
  },
  get paper() {
    return t('notes.paper.paper');
  },
  get vellum() {
    return t('notes.paper.vellum');
  },
  get dark() {
    return t('notes.paper.dark');
  },
} as const;
export type NotePaper = keyof typeof NOTE_PAPERS;

export const NOTE_EDGES = {
  get straight() {
    return t('notes.edge.straight');
  },
  get torn() {
    return t('notes.edge.torn');
  },
  get burnt() {
    return t('notes.edge.burnt');
  },
} as const;
export type NoteEdge = keyof typeof NOTE_EDGES;

// Пропорции листа (ширина / высота).
export const NOTE_SHAPES = {
  portrait: { get title() {
    return t('notes.shape.portrait');
  }, aspect: 3 / 4 },
  landscape: { get title() {
    return t('notes.shape.landscape');
  }, aspect: 4 / 3 },
  scroll: { get title() {
    return t('notes.shape.scroll');
  }, aspect: 9 / 16 },
} as const;
export type NoteShape = keyof typeof NOTE_SHAPES;

export const NOTE_INKS = {
  auto: { get title() {
    return t('notes.ink.auto');
  }, color: '' },
  brown: { get title() {
    return t('notes.ink.brown');
  }, color: '#3b2412' },
  black: { get title() {
    return t('notes.ink.black');
  }, color: '#17120e' },
  red: { get title() {
    return t('notes.ink.red');
  }, color: '#7a1a12' },
  blue: { get title() {
    return t('notes.ink.blue');
  }, color: '#1d2b55' },
  gold: { get title() {
    return t('notes.ink.gold');
  }, color: '#c9a24a' },
  blood: { get title() {
    return t('notes.ink.blood');
  }, color: '#6a0505' },
  green: { get title() {
    return t('notes.ink.green');
  }, color: '#1f4a2a' },
  violet: { get title() {
    return t('notes.ink.violet');
  }, color: '#3e1f5c' },
  faded: { get title() {
    return t('notes.ink.faded');
  }, color: '#7a6850' },
  white: { get title() {
    return t('notes.ink.white');
  }, color: '#efe6d2' },
} as const;
export type NoteInk = keyof typeof NOTE_INKS;

// Состояние бумаги: складки и помятость поверх всего листа.
export const NOTE_CREASES = {
  get none() {
    return t('notes.crease.none');
  },
  get folded() {
    return t('notes.crease.folded');
  },
  get crumpled() {
    return t('notes.crease.crumpled');
  },
  get crushed() {
    return t('notes.crease.crushed');
  },
} as const;
export type NoteCrease = keyof typeof NOTE_CREASES;

// Цвета следов. Не у каждого вида следа все цвета: какие можно — `tints` в NOTE_MARKS.
export const NOTE_TINTS = {
  blood: { get title() {
    return t('notes.tint.blood');
  }, color: '#7a0b0b' },
  driedBlood: { get title() {
    return t('notes.tint.driedBlood');
  }, color: '#4a1a0c' },
  ink: { get title() {
    return t('notes.tint.ink');
  }, color: '#15100c' },
  soot: { get title() {
    return t('notes.tint.soot');
  }, color: '#2b2622' },
  mud: { get title() {
    return t('notes.tint.mud');
  }, color: '#4a3a22' },
  wine: { get title() {
    return t('notes.tint.wine');
  }, color: '#5a0f2e' },
  coffee: { get title() {
    return t('notes.tint.coffee');
  }, color: '#6b4220' },
  slime: { get title() {
    return t('notes.tint.slime');
  }, color: '#3f5a12' },
  candle: { get title() {
    return t('notes.tint.candle');
  }, color: '#cdb98e' },
  redWax: { get title() {
    return t('notes.tint.redWax');
  }, color: '#8e1a16' },
  blackWax: { get title() {
    return t('notes.tint.blackWax');
  }, color: '#2a2522' },
  greenWax: { get title() {
    return t('notes.tint.greenWax');
  }, color: '#2f5d3a' },
  blueWax: { get title() {
    return t('notes.tint.blueWax');
  }, color: '#26407a' },
  goldWax: { get title() {
    return t('notes.tint.goldWax');
  }, color: '#b08a2e' },
  redInk: { get title() {
    return t('notes.tint.redInk');
  }, color: '#9a1d1d' },
  blueInk: { get title() {
    return t('notes.tint.blueInk');
  }, color: '#22357a' },
} as const;
export type NoteTint = keyof typeof NOTE_TINTS;

// Виды следов: подпись, группа в палитре, размер по умолчанию (доля ширины листа), цвета (первый — по умолчанию).
export const NOTE_MARKS = {
  splatter: { get title() {
    return t('notes.mark.splatter');
  }, get group() {
    return t('notes.group.stains');
  }, size: 0.28, tints: ['blood', 'driedBlood', 'ink', 'mud', 'wine', 'slime'] },
  drops: { get title() {
    return t('notes.mark.drops');
  }, get group() {
    return t('notes.group.stains');
  }, size: 0.2, tints: ['blood', 'driedBlood', 'ink', 'wine', 'slime'] },
  smear: { get title() {
    return t('notes.mark.smear');
  }, get group() {
    return t('notes.group.stains');
  }, size: 0.4, tints: ['blood', 'driedBlood', 'soot', 'mud', 'ink'] },
  blot: { get title() {
    return t('notes.mark.blot');
  }, get group() {
    return t('notes.group.stains');
  }, size: 0.14, tints: ['ink', 'blood', 'driedBlood'] },
  fingerprint: { get title() {
    return t('notes.mark.fingerprint');
  }, get group() {
    return t('notes.group.prints');
  }, size: 0.1, tints: ['blood', 'driedBlood', 'soot', 'mud', 'ink'] },
  ring: { get title() {
    return t('notes.mark.ring');
  }, get group() {
    return t('notes.group.prints');
  }, size: 0.3, tints: ['coffee', 'wine'] },
  water: { get title() {
    return t('notes.mark.water');
  }, get group() {
    return t('notes.group.prints');
  }, size: 0.45, tints: [] },
  wax: { get title() {
    return t('notes.mark.wax');
  }, get group() {
    return t('notes.group.prints');
  }, size: 0.14, tints: ['candle', 'redWax', 'blackWax'] },
  scorch: { get title() {
    return t('notes.mark.scorch');
  }, get group() {
    return t('notes.group.damage');
  }, size: 0.3, tints: [] },
  hole: { get title() {
    return t('notes.mark.hole');
  }, get group() {
    return t('notes.group.damage');
  }, size: 0.16, tints: [] },
  claws: { get title() {
    return t('notes.mark.claws');
  }, get group() {
    return t('notes.group.damage');
  }, size: 0.35, tints: [] },
  seal: { get title() {
    return t('notes.mark.seal');
  }, get group() {
    return t('notes.group.seals');
  }, size: 0.17, tints: ['redWax', 'blackWax', 'greenWax', 'blueWax', 'goldWax'] },
  stamp: { get title() {
    return t('notes.mark.stamp');
  }, get group() {
    return t('notes.group.seals');
  }, size: 0.26, tints: ['redInk', 'blueInk', 'ink'] },
} as const satisfies Record<string, { title: string; group: string; size: number; tints: readonly NoteTint[] }>;
export type NoteMarkKind = keyof typeof NOTE_MARKS;

// След на листе. x, y — середина в долях листа, size — поперечник в долях ширины, angle — градусы.
export interface NoteMark {
  id: string;
  kind: NoteMarkKind;
  x: number;
  y: number;
  size: number;
  angle: number;
  opacity: number;
  // Нет — первый из цветов вида (или без цвета).
  tint?: NoteTint;
  // Свой рисунок у каждого следа.
  seed: number;
  // Печать и штамп: буква (у печати, если нет знака) или надпись по кругу (у штампа); знак в середине.
  text?: string;
  emblem?: SealEmblem;
  // Сломанная печать (письмо вскрыто).
  broken?: boolean;
}

export const SEAL_TEXT_MAX = { seal: 2, stamp: 40 } as const;

export const MARK_SIZE = { min: 0.03, max: 1 } as const;
export const MAX_MARKS = 200;

export function newMark(kind: NoteMarkKind, x: number, y: number): NoteMark {
  return {
    id: Math.random().toString(36).slice(2, 10),
    kind,
    x,
    y,
    size: NOTE_MARKS[kind].size,
    angle: Math.round(Math.random() * 360),
    opacity: 1,
    seed: Math.floor(Math.random() * 1e6),
    ...(kind === 'seal' ? { emblem: 'crown' as const } : kind === 'stamp' ? { emblem: 'crown' as const, text: t('notes.defaultStamp') } : {}),
  };
}

// Цвет следа: свой (если вид такой допускает) или первый из цветов вида; у бесцветных — null.
export function markTint(m: NoteMark): NoteTint | null {
  const tints: readonly NoteTint[] = NOTE_MARKS[m.kind].tints;
  return m.tint && tints.includes(m.tint) ? m.tint : (tints[0] ?? null);
}

// A stroke of the pen drawn on the sheet (a map to a treasure, a sketch, an arrow): the ink of the note's inks ('auto' —
// the paper's own), the width in fractions of the sheet's width, the points — x, y in fractions of the sheet, in a row.
export interface NoteStroke {
  ink: NoteInk;
  width: number;
  points: number[];
}
export const STROKE_WIDTHS = { thin: 0.003, medium: 0.007, thick: 0.016 } as const;
export type StrokeWidth = keyof typeof STROKE_WIDTHS;
export const MAX_STROKES = 500;
const MAX_POINTS = 4000;

export interface Note {
  scryingGlass: 'note';
  version: 1;
  // Текст: «# заголовок», *курсив*, **жирный**, пустая строка — новый абзац, «---» — украшение-разделитель.
  text: string;
  font: NoteFont;
  // Размер шрифта — в долях ширины листа (×100), чтобы записка выглядела одинаково на плитке и на экране.
  size: number;
  align: 'left' | 'center' | 'justify';
  paper: NotePaper;
  edge: NoteEdge;
  shape: NoteShape;
  ink: NoteInk;
  // Неровность почерка: 0 — ровно, 1 — буквы пляшут (дрожащая рука, безумие).
  shaky: number;
  // Подпись внизу справа (своим шрифтом), пусто — без подписи.
  signature: string;
  signatureFont: NoteFont;
  // Случайное зерно бумаги: у каждой записки свои пятна и края.
  seed: number;
  crease: NoteCrease;
  // Следы поверх листа (кровь, отпечатки, подпалины…), по порядку: последний — сверху.
  marks: NoteMark[];
  // Drawn with the pen: under the marks, over the text (the order — as drawn).
  strokes: NoteStroke[];
}

export function newNote(): Note {
  return {
    scryingGlass: 'note',
    version: 1,
    text: '',
    font: 'marck',
    size: 5,
    align: 'left',
    paper: 'parchment',
    edge: 'straight',
    shape: 'portrait',
    ink: 'auto',
    shaky: 0,
    signature: '',
    signatureFont: 'greatvibes',
    seed: Math.floor(Math.random() * 10000),
    crease: 'none',
    marks: [],
    strokes: [],
  };
}

const pick = <T extends string>(v: unknown, allowed: Record<T, unknown>, def: T): T =>
  typeof v === 'string' && v in allowed ? (v as T) : def;

// Записка из файла: неизвестные и пропущенные поля — по умолчанию (файл могли править руками).
export function parseNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object' || (raw as { scryingGlass?: unknown }).scryingGlass !== 'note') return null;
  const r = raw as Record<string, unknown>;
  const d = newNote();
  const num = (v: unknown, def: number, min: number, max: number) => (typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
  const str = (v: unknown, def: string) => (typeof v === 'string' ? v : def);
  const shape = pick(r['shape'], NOTE_SHAPES, d.shape);
  const marks = (Array.isArray(r['marks']) ? r['marks'] : []).flatMap((m) => parseMark(m, num)).slice(0, MAX_MARKS);
  // До 0.23 печать была одна, в углу (поля seal и sealLetter) — теперь это след «Сургучная печать» на том же месте.
  const legacy = LEGACY_SEALS[str(r['seal'], 'none')];
  if (legacy) {
    const signed = !!str(r['signature'], '').trim();
    marks.push({
      ...newMark('seal', signed ? 0.15 : 0.85, 1 - 0.14 * NOTE_SHAPES[shape].aspect),
      id: 'seal',
      size: 0.15,
      angle: 0,
      tint: legacy,
      emblem: undefined,
      text: str(r['sealLetter'], '').slice(0, 2),
      seed: num(r['seed'], 1, 0, 1e9),
    });
  }
  return {
    scryingGlass: 'note',
    version: 1,
    text: str(r['text'], ''),
    font: pick(r['font'], NOTE_FONTS, d.font),
    size: num(r['size'], d.size, 1.5, 15),
    align: pick(r['align'], { left: 1, center: 1, justify: 1 }, d.align),
    paper: pick(r['paper'], NOTE_PAPERS, d.paper),
    edge: pick(r['edge'], NOTE_EDGES, d.edge),
    shape,
    ink: pick(r['ink'], NOTE_INKS, d.ink),
    shaky: num(r['shaky'], 0, 0, 1),
    signature: str(r['signature'], ''),
    signatureFont: pick(r['signatureFont'], NOTE_FONTS, d.signatureFont),
    seed: num(r['seed'], d.seed, 0, 1e9),
    crease: pick(r['crease'], NOTE_CREASES, d.crease),
    marks,
    strokes: (Array.isArray(r['strokes']) ? r['strokes'] : []).flatMap((s) => parseStroke(s)).slice(0, MAX_STROKES),
  };
}

function parseStroke(raw: unknown): NoteStroke[] {
  if (!raw || typeof raw !== 'object') return [];
  const s = raw as Record<string, unknown>;
  const pts = Array.isArray(s['points']) ? s['points'].filter((v): v is number => typeof v === 'number' && isFinite(v)).slice(0, MAX_POINTS) : [];
  if (pts.length < 2) return [];
  const width = typeof s['width'] === 'number' && isFinite(s['width']) ? Math.min(0.05, Math.max(0.001, s['width'])) : STROKE_WIDTHS.medium;
  return [{ ink: pick(s['ink'], NOTE_INKS, 'auto'), width, points: pts.slice(0, pts.length - (pts.length % 2)) }];
}

// A smooth line through the points of a stroke (quadratic curves through the midpoints), in a w × h box.
export function strokePath(points: number[], w: number, h: number): string {
  const xy = (i: number) => [points[i * 2]! * w, points[i * 2 + 1]! * h] as const;
  const n = points.length / 2;
  const f = (v: number) => v.toFixed(1);
  if (n === 1) {
    const [x, y] = xy(0);
    return `M${f(x)} ${f(y)}l0.1 0`;
  }
  let d = '';
  const [x0, y0] = xy(0);
  d = `M${f(x0)} ${f(y0)}`;
  for (let i = 1; i < n - 1; i++) {
    const [ax, ay] = xy(i);
    const [bx, by] = xy(i + 1);
    d += `Q${f(ax)} ${f(ay)} ${f((ax + bx) / 2)} ${f((ay + by) / 2)}`;
  }
  const [lx, ly] = xy(n - 1);
  return d + `L${f(lx)} ${f(ly)}`;
}

const LEGACY_SEALS: Record<string, NoteTint> = { red: 'redWax', black: 'blackWax', green: 'greenWax', blue: 'blueWax', gold: 'goldWax' };

function parseMark(raw: unknown, num: (v: unknown, def: number, min: number, max: number) => number): NoteMark[] {
  if (!raw || typeof raw !== 'object') return [];
  const m = raw as Record<string, unknown>;
  if (typeof m['kind'] !== 'string' || !(m['kind'] in NOTE_MARKS)) return [];
  const kind = m['kind'] as NoteMarkKind;
  const tint = typeof m['tint'] === 'string' && m['tint'] in NOTE_TINTS ? (m['tint'] as NoteTint) : undefined;
  return [{
    id: typeof m['id'] === 'string' && m['id'] ? m['id'] : Math.random().toString(36).slice(2, 10),
    kind,
    x: num(m['x'], 0.5, -0.2, 1.2),
    y: num(m['y'], 0.5, -0.2, 1.2),
    size: num(m['size'], NOTE_MARKS[kind].size, MARK_SIZE.min, MARK_SIZE.max),
    angle: num(m['angle'], 0, -360, 720),
    opacity: num(m['opacity'], 1, 0.1, 1),
    ...(tint ? { tint } : {}),
    seed: num(m['seed'], 1, 0, 1e9),
    ...(kind === 'seal' || kind === 'stamp' ? sealFields(kind, m) : {}),
  }];
}

function sealFields(kind: 'seal' | 'stamp', m: Record<string, unknown>): Pick<NoteMark, 'text' | 'emblem' | 'broken'> {
  const out: Pick<NoteMark, 'text' | 'emblem' | 'broken'> = {};
  if (typeof m['text'] === 'string' && m['text']) out.text = m['text'].slice(0, SEAL_TEXT_MAX[kind]);
  if (typeof m['emblem'] === 'string' && m['emblem'] in SEAL_EMBLEMS) out.emblem = m['emblem'] as SealEmblem;
  if (kind === 'seal' && m['broken'] === true) out.broken = true;
  return out;
}
