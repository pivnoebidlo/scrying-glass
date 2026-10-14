// Справочник: заклинания, предметы, черты, состояния, правила, заметки — записи с типом, полями и текстом.
// Запись — Markdown-файл (удобно править и в Obsidian): поля — в шапке (YAML-«свойства» между «---»), дальше текст.
// Название записи — имя файла. Ключи полей — английские (одинаковы на любом языке), подписи — в TYPES.
//
//   ---
//   type: spell
//   level: 3
//   school: Воплощение
//   ---
//   Яркая вспышка… [[Ослеплённый]]
//
// Записи привязаны к ролевой системе: поле `system` в шапке (id системы или семейства: dnd5e-2024, dnd5e, fate),
// без него — по типу (заклинание, предмет, черта, состояние — D&D), правила и заметки — для любой системы.
//
// Только типы, подписи и чистые функции: используются ядром и окнами.
import { familyOf } from '../systems';

export type FieldValue = string | number | boolean | string[];

export interface FieldDef {
  key: string;
  title: string;
  kind: 'text' | 'number' | 'bool' | 'select' | 'list';
  options?: string[];
  // Подсказка в редакторе.
  hint?: string;
  // Своё поле: значение — в строке под названием («Божество, хаотично-доброе»), а не строкой «поле — значение».
  subtitle?: boolean;
}

export interface TypeDef {
  title: string;
  // Во множественном числе — для фильтра: «Заклинания».
  plural: string;
  fields: FieldDef[];
  // Семейство систем, к которому относится тип (dnd5e — заклинания и т. п.); нет — тип для любой системы.
  family?: string;
}

const SCHOOLS = ['Ограждение', 'Вызов', 'Прорицание', 'Очарование', 'Воплощение', 'Иллюзия', 'Некромантия', 'Преобразование'];
const RARITIES = ['Обычный', 'Необычный', 'Редкий', 'Очень редкий', 'Легендарный', 'Артефакт'];

// Поля, которые есть у любой записи.
export const COMMON_FIELDS: FieldDef[] = [
  // Как в Obsidian: запись находится и по ним — поиском, [[ссылкой]], в статблоке и листе («Чудотворство» = «Тауматургия»).
  { key: 'aliases', title: 'Другие названия', kind: 'list', hint: 'через запятую: другой перевод, сокращение' },
  { key: 'tags', title: 'Метки', kind: 'list', hint: 'через запятую' },
  { key: 'source', title: 'Источник', kind: 'text', hint: 'SRD 5.2, «Книга игрока», свои правила…' },
];

// Типы записей: D&D 5e и общие («Заметка»). Тип, которого здесь нет (из другой системы или придуманный в
// Obsidian), всё равно показывается — поля как «поле — значение».
export const TYPES: Record<string, TypeDef> = {
  spell: {
    title: 'Заклинание',
    plural: 'Заклинания',
    fields: [
      { key: 'level', title: 'Уровень', kind: 'number', hint: '0 — заговор' },
      { key: 'school', title: 'Школа', kind: 'select', options: SCHOOLS },
      { key: 'casting_time', title: 'Время накладывания', kind: 'text' },
      { key: 'range', title: 'Дистанция', kind: 'text' },
      { key: 'components', title: 'Компоненты', kind: 'text' },
      { key: 'duration', title: 'Длительность', kind: 'text' },
      { key: 'concentration', title: 'Концентрация', kind: 'bool' },
      { key: 'ritual', title: 'Ритуал', kind: 'bool' },
      { key: 'classes', title: 'Классы', kind: 'list', hint: 'через запятую' },
    ],
    family: 'dnd5e',
  },
  item: {
    title: 'Предмет',
    plural: 'Предметы',
    fields: [
      { key: 'category', title: 'Вид', kind: 'select', options: ['Оружие', 'Доспех', 'Чудесный предмет', 'Зелье', 'Кольцо', 'Жезл', 'Посох', 'Волшебная палочка', 'Свиток', 'Снаряжение', 'Прочее'] },
      { key: 'rarity', title: 'Редкость', kind: 'select', options: RARITIES },
      { key: 'attunement', title: 'Настройка', kind: 'text', hint: 'пусто — не требуется; «да» или «жрецом»' },
      { key: 'cost', title: 'Цена', kind: 'text' },
      { key: 'weight', title: 'Вес', kind: 'text' },
    ],
    family: 'dnd5e',
  },
  feat: {
    title: 'Черта',
    plural: 'Черты',
    fields: [
      { key: 'category', title: 'Категория', kind: 'select', options: ['Происхождение', 'Общая', 'Боевой стиль', 'Эпический дар'] },
      { key: 'prerequisite', title: 'Требование', kind: 'text' },
      { key: 'repeatable', title: 'Можно брать повторно', kind: 'bool' },
    ],
    family: 'dnd5e',
  },
  condition: { title: 'Состояние', plural: 'Состояния', fields: [], family: 'dnd5e' },
  skill: { title: 'Навык', plural: 'Навыки', fields: [], family: 'fate' },
  rule: { title: 'Правило', plural: 'Правила', fields: [{ key: 'category', title: 'Раздел', kind: 'text', hint: 'бой, отдых, путешествие…' }] },
  note: { title: 'Заметка', plural: 'Заметки', fields: [] },
};

// Поле шапки с системой записи.
export const SYSTEM_FIELD = 'system';

// Семейство систем записи (null — подходит любой): поле system, иначе — по типу.
export function entryFamily(e: Entry, def: TypeDef | undefined = TYPES[e.type]): string | null {
  const s = e.fields[SYSTEM_FIELD];
  if (typeof s === 'string' && s.trim()) return familyOf(s.trim());
  return def?.family ?? null;
}

export const typeOf = (t: string): TypeDef => TYPES[t] ?? { title: t || 'Запись', plural: t || 'Записи', fields: [] };

// ---------- Свои типы ----------
// Описывает пользователь (окно «Типы записей»), хранятся в библиотеке — compendium-types.json, общие для всех кампаний.
// id — то, что пишется в шапке файла (type: deity); встроенные id заняты.
export interface CustomType extends TypeDef {
  id: string;
}
export const CUSTOM_TYPES_FILE = 'compendium-types.json';

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};
// Ключ из подписи: «Сфера влияния» → «sfera_vliyaniya» (ключи в шапке — латиницей, как у встроенных полей).
export function keyFrom(title: string): string {
  const k = [...title.toLowerCase()]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return /^[a-z]/.test(k) ? k : k ? `f_${k}` : '';
}
export const validKey = (k: string) => /^[A-Za-z_][\w-]*$/.test(k);

const KINDS = ['text', 'number', 'bool', 'select', 'list'] as const;
// Прочитать файл своих типов: битые и повторные пропускаются, встроенные id не перекрываются.
export function parseCustomTypes(data: unknown): CustomType[] {
  const list = Array.isArray((data as { types?: unknown })?.types) ? ((data as { types: unknown[] }).types) : [];
  const seen = new Set(Object.keys(TYPES));
  const out: CustomType[] = [];
  for (const raw of list) {
    const t = raw as Partial<CustomType>;
    if (!t || typeof t.id !== 'string' || !validKey(t.id) || seen.has(t.id) || typeof t.title !== 'string') continue;
    seen.add(t.id);
    const keys = new Set<string>(['tags', 'source', 'aliases', 'type']);
    const fields: FieldDef[] = [];
    for (const f of Array.isArray(t.fields) ? t.fields : []) {
      if (!f || typeof f.key !== 'string' || !validKey(f.key) || keys.has(f.key) || typeof f.title !== 'string') continue;
      keys.add(f.key);
      fields.push({
        key: f.key,
        title: f.title,
        kind: KINDS.includes(f.kind as (typeof KINDS)[number]) ? f.kind : 'text',
        ...(f.kind === 'select' && Array.isArray(f.options) ? { options: f.options.filter((o): o is string => typeof o === 'string' && !!o.trim()) } : {}),
        ...(typeof f.hint === 'string' && f.hint ? { hint: f.hint } : {}),
        ...(f.subtitle ? { subtitle: true } : {}),
      });
    }
    out.push({ id: t.id, title: t.title, plural: typeof t.plural === 'string' && t.plural ? t.plural : t.title, fields });
  }
  return out;
}

export interface Entry {
  title: string;
  type: string;
  fields: Record<string, FieldValue>;
  body: string;
  // Описание своего типа — только когда запись уходит на экран игроков (окно игроков не читает библиотеку).
  def?: TypeDef;
}

// Встроенный справочник одной редакции (resources/compendium/<система>.json): записи с английским названием `en`.
export interface BuiltinBook {
  system: string;
  // translator — кто перевёл (нет — OmnisGM, как у SRD D&D).
  source: { title: string; attribution: string; url: string; license: string; translator?: string };
  entries: (Entry & { en?: string })[];
}
// Путь встроенной записи: «srd:<система>/<тип>/<название>».
export const BUILTIN = 'srd:';
// Правка встроенной записи — своя запись в библиотеке с полем overrides: «<система>/<тип>/<название>» (путь без
// «srd:»). Она заменяет встроенную везде: в списке, поиске, ссылках. Удалить правку — вернуть как в SRD.
export const OVERRIDES = 'overrides';

export const ENTRY_EXT = '.md';
export const entryTitle = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.(md|txt)$/i, '');

// ---------- Шапка (YAML-свойства) ----------
// Поддерживается то, что пишут в свойствах Obsidian: «ключ: значение», строки в кавычках, числа, true/false,
// списки «[a, b]» и списки строками «- a». Остальное YAML (вложенные объекты) читается как строка.

function scalar(raw: string): FieldValue {
  const v = raw.trim();
  if (/^".*"$/.test(v)) {
    try {
      return JSON.parse(v);
    } catch {
      return v.slice(1, -1);
    }
  }
  if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  if (v === 'true' || v === 'false') return v === 'true';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map((x) => String(scalar(x))).filter(Boolean);
  return v;
}

export function parseEntry(text: string, title: string): Entry {
  const fields: Record<string, FieldValue> = {};
  let body = text;
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (m) {
    body = text.slice(m[0].length);
    let listKey: string | null = null;
    for (const line of m[1]!.split(/\r?\n/)) {
      const item = /^\s*-\s+(.*)$/.exec(line);
      if (item && listKey) {
        (fields[listKey] as string[]).push(String(scalar(item[1]!)));
        continue;
      }
      const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
      if (!kv) continue;
      if (kv[2]!.trim() === '') {
        listKey = kv[1]!;
        fields[listKey] = [];
      } else {
        listKey = null;
        fields[kv[1]!] = scalar(kv[2]!);
      }
    }
  }
  const type = typeof fields['type'] === 'string' ? (fields['type'] as string) : 'note';
  delete fields['type'];
  // Пустой список из шапки (ключ без значений) — как отсутствующее поле.
  for (const [k, v] of Object.entries(fields)) if (Array.isArray(v) && !v.length) delete fields[k];
  return { title, type, fields, body: body.replace(/^\s*\n/, '') };
}

const quote = (s: string) => (s === '' || /^[\s\-?:,[\]{}#&*!|>'"%@`]|: |\s#|^(true|false|null|~)$|^-?\d+(\.\d+)?$|\s$/.test(s) ? JSON.stringify(s) : s);

// Запись — в текст файла. Пустые поля не пишутся; порядок — как в описании типа, потом остальные.
export function serializeEntry(e: Entry, def: TypeDef = typeOf(e.type)): string {
  const order = [...def.fields, ...COMMON_FIELDS].map((f) => f.key);
  const keys = [...order.filter((k) => k in e.fields), ...Object.keys(e.fields).filter((k) => !order.includes(k))];
  const lines = [`type: ${quote(e.type)}`];
  for (const k of keys) {
    const v = e.fields[k];
    if (v === undefined || v === '' || v === false || (Array.isArray(v) && !v.length)) continue;
    if (Array.isArray(v)) lines.push(`${k}:`, ...v.map((x) => `  - ${quote(x)}`));
    else lines.push(`${k}: ${typeof v === 'string' ? quote(v) : String(v)}`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${e.body.trim()}\n`;
}

// Строка под названием: «3 уровень, воплощение», «Чудесный предмет, редкий, требует настройки».
export function entrySubtitle(e: Entry, def: TypeDef = e.def ?? typeOf(e.type)): string {
  const f = e.fields;
  const low = (v: FieldValue | undefined) => (typeof v === 'string' ? v.toLowerCase() : '');
  switch (e.type) {
    case 'spell': {
      const lvl = typeof f['level'] === 'number' ? f['level'] : null;
      const head = lvl === 0 ? 'Заговор' : lvl !== null ? `${lvl} уровень` : 'Заклинание';
      return [head, low(f['school']), f['ritual'] ? 'ритуал' : '', f['concentration'] ? 'концентрация' : ''].filter(Boolean).join(', ');
    }
    case 'item':
      return [f['category'] || 'Предмет', low(f['rarity']), f['attunement'] ? `требует настройки${f['attunement'] === 'да' || f['attunement'] === true ? '' : ` (${f['attunement']})`}` : ''].filter(Boolean).join(', ');
    case 'feat':
      return [f['category'] ? `Черта: ${low(f['category'])}` : 'Черта', f['prerequisite'] ? `требует: ${f['prerequisite']}` : ''].filter(Boolean).join(', ');
    default: {
      // Свой тип: название типа и поля, отмеченные «в строке под названием».
      const marked = def.fields.filter((d) => d.subtitle && f[d.key] !== undefined && f[d.key] !== '' && f[d.key] !== false);
      if (marked.length) return [def.title, ...marked.map((d) => (d.kind === 'bool' ? d.title.toLowerCase() : fieldText(f[d.key]!)))].join(', ');
      return [def.title, typeof f['category'] === 'string' ? low(f['category']) : ''].filter(Boolean).join(', ');
    }
  }
}

// Значение поля для показа.
export function fieldText(v: FieldValue): string {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'да' : 'нет';
  return String(v);
}

export const blankEntry = (type: string, title = ''): Entry => ({ title, type, fields: {}, body: '' });

// Для поиска: название, метки и текст без разметки, без учёта регистра и «ё».
export const searchKey = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
