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
  };
}
