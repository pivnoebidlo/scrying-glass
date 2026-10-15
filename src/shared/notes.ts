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

// Шрифты лежат внутри приложения (renderer/lib/note/fonts, лицензия OFL), все с кириллицей.
export const NOTE_FONTS = {
  marck: { title: 'Письмо от руки', family: 'Marck Script', group: 'Рукописные' },
  badscript: { title: 'Небрежный почерк', family: 'Bad Script', group: 'Рукописные' },
  caveat: { title: 'Быстрая записка', family: 'Caveat', group: 'Рукописные' },
  greatvibes: { title: 'Каллиграфия', family: 'Great Vibes', group: 'Рукописные' },
  amatic: { title: 'Узкий от руки', family: 'Amatic SC', group: 'Рукописные' },
  cormorant: { title: 'Книжный', family: 'Cormorant Garamond', group: 'Книжные' },
  oldstandard: { title: 'Старая книга', family: 'Old Standard TT', group: 'Книжные' },
  ruslan: { title: 'Старорусский', family: 'Ruslan Display', group: 'Особые' },
  ponomar: { title: 'Древняя рукопись', family: 'Ponomar', group: 'Особые' },
  underdog: { title: 'Грубый', family: 'Underdog', group: 'Особые' },
} as const;
export type NoteFont = keyof typeof NOTE_FONTS;

export const NOTE_PAPERS = {
  parchment: 'Пергамент',
  paper: 'Старая бумага',
  vellum: 'Светлая бумага',
  dark: 'Тёмная кожа',
} as const;
export type NotePaper = keyof typeof NOTE_PAPERS;

export const NOTE_EDGES = { straight: 'Ровный', torn: 'Рваный', burnt: 'Обгоревший' } as const;
export type NoteEdge = keyof typeof NOTE_EDGES;

// Пропорции листа (ширина / высота).
export const NOTE_SHAPES = {
  portrait: { title: 'Лист', aspect: 3 / 4 },
  landscape: { title: 'Записка', aspect: 4 / 3 },
  scroll: { title: 'Свиток', aspect: 9 / 16 },
} as const;
export type NoteShape = keyof typeof NOTE_SHAPES;

export const NOTE_INKS = {
  auto: { title: 'Как у бумаги', color: '' },
  brown: { title: 'Коричневые', color: '#3b2412' },
  black: { title: 'Чёрные', color: '#17120e' },
  red: { title: 'Красные', color: '#7a1a12' },
  blue: { title: 'Синие', color: '#1d2b55' },
  gold: { title: 'Золотые', color: '#c9a24a' },
  blood: { title: 'Кровь', color: '#6a0505' },
  green: { title: 'Зелёные', color: '#1f4a2a' },
  violet: { title: 'Фиолетовые', color: '#3e1f5c' },
  faded: { title: 'Выцветшие', color: '#7a6850' },
  white: { title: 'Белые', color: '#efe6d2' },
} as const;
export type NoteInk = keyof typeof NOTE_INKS;

export const NOTE_SEALS = { none: '', red: '#9b1c1c', black: '#2a2522', green: '#2f5d3a', blue: '#26407a', gold: '#b08a2e' } as const;
export type NoteSeal = keyof typeof NOTE_SEALS;

// Состояние бумаги: складки и помятость поверх всего листа.
export const NOTE_CREASES = { none: 'Гладкая', folded: 'Сложена вчетверо', crumpled: 'Помята', crushed: 'Скомкана' } as const;
export type NoteCrease = keyof typeof NOTE_CREASES;

// Цвета следов. Не у каждого вида следа все цвета: какие можно — `tints` в NOTE_MARKS.
export const NOTE_TINTS = {
  blood: { title: 'Свежая кровь', color: '#7a0b0b' },
  driedBlood: { title: 'Засохшая кровь', color: '#4a1a0c' },
  ink: { title: 'Чернила', color: '#15100c' },
  soot: { title: 'Сажа', color: '#2b2622' },
  mud: { title: 'Грязь', color: '#4a3a22' },
  wine: { title: 'Вино', color: '#5a0f2e' },
  coffee: { title: 'Чай или кофе', color: '#6b4220' },
  slime: { title: 'Слизь', color: '#3f5a12' },
  candle: { title: 'Свечной воск', color: '#cdb98e' },
  redWax: { title: 'Красный воск', color: '#8e1a16' },
  blackWax: { title: 'Чёрный воск', color: '#26211e' },
} as const;
export type NoteTint = keyof typeof NOTE_TINTS;

// Виды следов: подпись, группа в палитре, размер по умолчанию (доля ширины листа), цвета (первый — по умолчанию).
export const NOTE_MARKS = {
  splatter: { title: 'Брызги', group: 'Пятна', size: 0.28, tints: ['blood', 'driedBlood', 'ink', 'mud', 'wine', 'slime'] },
  drops: { title: 'Капли', group: 'Пятна', size: 0.2, tints: ['blood', 'driedBlood', 'ink', 'wine', 'slime'] },
  smear: { title: 'Мазок', group: 'Пятна', size: 0.4, tints: ['blood', 'driedBlood', 'soot', 'mud', 'ink'] },
  blot: { title: 'Клякса', group: 'Пятна', size: 0.14, tints: ['ink', 'blood', 'driedBlood'] },
  fingerprint: { title: 'Отпечаток пальца', group: 'Отпечатки', size: 0.1, tints: ['blood', 'driedBlood', 'soot', 'mud', 'ink'] },
  ring: { title: 'След от кружки', group: 'Отпечатки', size: 0.3, tints: ['coffee', 'wine'] },
  water: { title: 'Разводы воды', group: 'Отпечатки', size: 0.45, tints: [] },
  wax: { title: 'Капли воска', group: 'Отпечатки', size: 0.14, tints: ['candle', 'redWax', 'blackWax'] },
  scorch: { title: 'Подпалина', group: 'Повреждения', size: 0.3, tints: [] },
  hole: { title: 'Прожжённая дыра', group: 'Повреждения', size: 0.16, tints: [] },
  claws: { title: 'Следы когтей', group: 'Повреждения', size: 0.35, tints: [] },
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
}

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
  };
}

// Цвет следа: свой (если вид такой допускает) или первый из цветов вида; у бесцветных — null.
export function markTint(m: NoteMark): NoteTint | null {
  const tints: readonly NoteTint[] = NOTE_MARKS[m.kind].tints;
  return m.tint && tints.includes(m.tint) ? m.tint : (tints[0] ?? null);
}

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
  // Подпись внизу справа (своим шрифтом), пусто — без подписи.
  signature: string;
  signatureFont: NoteFont;
  // Сургучная печать внизу и буква на ней.
  seal: NoteSeal;
  sealLetter: string;
  // Случайное зерно бумаги: у каждой записки свои пятна и края.
  seed: number;
  crease: NoteCrease;
  // Следы поверх листа (кровь, отпечатки, подпалины…), по порядку: последний — сверху.
  marks: NoteMark[];
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
    signature: '',
    signatureFont: 'greatvibes',
    seal: 'none',
    sealLetter: '',
    seed: Math.floor(Math.random() * 10000),
    crease: 'none',
    marks: [],
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
  return {
    scryingGlass: 'note',
    version: 1,
    text: str(r['text'], ''),
    font: pick(r['font'], NOTE_FONTS, d.font),
    size: num(r['size'], d.size, 1.5, 15),
    align: pick(r['align'], { left: 1, center: 1, justify: 1 }, d.align),
    paper: pick(r['paper'], NOTE_PAPERS, d.paper),
    edge: pick(r['edge'], NOTE_EDGES, d.edge),
    shape: pick(r['shape'], NOTE_SHAPES, d.shape),
    ink: pick(r['ink'], NOTE_INKS, d.ink),
    signature: str(r['signature'], ''),
    signatureFont: pick(r['signatureFont'], NOTE_FONTS, d.signatureFont),
    seal: pick(r['seal'], NOTE_SEALS, d.seal),
    sealLetter: str(r['sealLetter'], '').slice(0, 2),
    seed: num(r['seed'], d.seed, 0, 1e9),
    crease: pick(r['crease'], NOTE_CREASES, d.crease),
    marks: (Array.isArray(r['marks']) ? r['marks'] : []).flatMap((m) => parseMark(m, num)).slice(0, MAX_MARKS),
  };
}

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
  }];
}
