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
// Только типы, подписи и чистые функции: используются ядром и окнами.

export type FieldValue = string | number | boolean | string[];

export interface FieldDef {
  key: string;
  title: string;
  kind: 'text' | 'number' | 'bool' | 'select' | 'list';
  options?: string[];
  // Подсказка в редакторе.
  hint?: string;
}

export interface TypeDef {
  title: string;
  // Во множественном числе — для фильтра: «Заклинания».
  plural: string;
  fields: FieldDef[];
}

const SCHOOLS = ['Ограждение', 'Вызов', 'Прорицание', 'Очарование', 'Воплощение', 'Иллюзия', 'Некромантия', 'Преобразование'];
const RARITIES = ['Обычный', 'Необычный', 'Редкий', 'Очень редкий', 'Легендарный', 'Артефакт'];

// Поля, которые есть у любой записи.
export const COMMON_FIELDS: FieldDef[] = [
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
  },
  feat: {
    title: 'Черта',
    plural: 'Черты',
    fields: [
      { key: 'category', title: 'Категория', kind: 'select', options: ['Происхождение', 'Общая', 'Боевой стиль', 'Эпический дар'] },
      { key: 'prerequisite', title: 'Требование', kind: 'text' },
      { key: 'repeatable', title: 'Можно брать повторно', kind: 'bool' },
    ],
  },
  condition: { title: 'Состояние', plural: 'Состояния', fields: [] },
  rule: { title: 'Правило', plural: 'Правила', fields: [{ key: 'category', title: 'Раздел', kind: 'text', hint: 'бой, отдых, путешествие…' }] },
  note: { title: 'Заметка', plural: 'Заметки', fields: [] },
};

export const typeOf = (t: string): TypeDef => TYPES[t] ?? { title: t || 'Запись', plural: t || 'Записи', fields: [] };

export interface Entry {
  title: string;
  type: string;
  fields: Record<string, FieldValue>;
  body: string;
}

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
export function serializeEntry(e: Entry): string {
  const def = typeOf(e.type);
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
export function entrySubtitle(e: Entry): string {
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
    default:
      return [typeOf(e.type).title, typeof f['category'] === 'string' ? low(f['category']) : ''].filter(Boolean).join(', ');
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
