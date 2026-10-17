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
import { t, type Key } from './i18n';

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

// Field titles and hints come from the dictionary (cmp.field.<type>.<key>, cmp.hint.<type>.<key>): getters, so they
// follow the interface language. Option values of select fields are data written into entry files — not translated.
const field = (type: string, key: string, kind: FieldDef['kind'], extra: { options?: string[]; hint?: boolean } = {}): FieldDef => ({
  key,
  kind,
  ...(extra.options ? { options: extra.options } : {}),
  get title() {
    return t(`cmp.field.${type}.${key}` as Key);
  },
  get hint() {
    return extra.hint ? t(`cmp.hint.${type}.${key}` as Key) : undefined;
  },
});

// A built-in type: title and plural from the dictionary (cmp.type.<id>, cmp.plural.<id>).
const type = (id: string, fields: FieldDef[], family?: string): TypeDef => ({
  get title() {
    return t(`cmp.type.${id}` as Key);
  },
  get plural() {
    return t(`cmp.plural.${id}` as Key);
  },
  fields,
  ...(family ? { family } : {}),
});

// Поля, которые есть у любой записи.
export const COMMON_FIELDS: FieldDef[] = [
  // Как в Obsidian: запись находится и по ним — поиском, [[ссылкой]], в статблоке и листе («Чудотворство» = «Тауматургия»).
  field('common', 'aliases', 'list', { hint: true }),
  field('common', 'tags', 'list', { hint: true }),
  field('common', 'source', 'text', { hint: true }),
];

// Типы записей: D&D 5e и общие («Заметка»). Тип, которого здесь нет (из другой системы или придуманный в
// Obsidian), всё равно показывается — поля как «поле — значение».
export const TYPES: Record<string, TypeDef> = {
  spell: type(
    'spell',
    [
      field('spell', 'level', 'number', { hint: true }),
      field('spell', 'school', 'select', { options: SCHOOLS }),
      field('spell', 'casting_time', 'text'),
      field('spell', 'range', 'text'),
      field('spell', 'components', 'text'),
      field('spell', 'duration', 'text'),
      field('spell', 'concentration', 'bool'),
      field('spell', 'ritual', 'bool'),
      field('spell', 'classes', 'list', { hint: true }),
    ],
    'dnd5e'
  ),
  item: type(
    'item',
    [
      field('item', 'category', 'select', { options: ['Оружие', 'Доспех', 'Чудесный предмет', 'Зелье', 'Кольцо', 'Жезл', 'Посох', 'Волшебная палочка', 'Свиток', 'Снаряжение', 'Прочее'] }),
      field('item', 'rarity', 'select', { options: RARITIES }),
      field('item', 'attunement', 'text', { hint: true }),
      field('item', 'cost', 'text'),
      field('item', 'weight', 'text'),
    ],
    'dnd5e'
  ),
  feat: type(
    'feat',
    [
      field('feat', 'category', 'select', { options: ['Происхождение', 'Общая', 'Боевой стиль', 'Эпический дар'] }),
      field('feat', 'prerequisite', 'text'),
      field('feat', 'repeatable', 'bool'),
    ],
    'dnd5e'
  ),
  condition: type('condition', [], 'dnd5e'),
  skill: type('skill', [], 'fate'),
  rule: type('rule', [field('rule', 'category', 'text', { hint: true })]),
  note: type('note', []),
};

// Поле шапки с системой записи.
export const SYSTEM_FIELD = 'system';

// Семейство систем записи (null — подходит любой): поле system, иначе — по типу.
export function entryFamily(e: Entry, def: TypeDef | undefined = TYPES[e.type]): string | null {
  const s = e.fields[SYSTEM_FIELD];
  if (typeof s === 'string' && s.trim()) return familyOf(s.trim());
  return def?.family ?? null;
}

export const typeOf = (id: string): TypeDef => TYPES[id] ?? { title: id || t('cmp.entry'), plural: id || t('cmp.entries'), fields: [] };

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
      const head = lvl === 0 ? t('cmp.sub.cantrip') : lvl !== null ? t('cmp.sub.level', { n: lvl }) : t('cmp.type.spell');
      return [head, low(f['school']), f['ritual'] ? t('cmp.sub.ritual') : '', f['concentration'] ? t('cmp.sub.concentration') : ''].filter(Boolean).join(', ');
    }
    case 'item':
      return [f['category'] || t('cmp.type.item'), low(f['rarity']), f['attunement'] ? t('cmp.sub.attunement') + (f['attunement'] === 'да' || f['attunement'] === 'yes' || f['attunement'] === true ? '' : ` (${f['attunement']})`) : ''].filter(Boolean).join(', ');
    case 'feat':
      return [f['category'] ? t('cmp.sub.featOf', { category: low(f['category']) }) : t('cmp.type.feat'), f['prerequisite'] ? t('cmp.sub.requires', { what: String(f['prerequisite']) }) : ''].filter(Boolean).join(', ');
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
  if (typeof v === 'boolean') return v ? t('cmp.yes') : t('cmp.no');
  return String(v);
}

export const blankEntry = (type: string, title = ''): Entry => ({ title, type, fields: {}, body: '' });

// Для поиска: название, метки и текст без разметки, без учёта регистра и «ё».
export const searchKey = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

// ---------- Фильтр заклинаний (как на dnd.su): уровень, класс, школа, время накладывания, концентрация, ритуал ----------

export type CastingKind = 'action' | 'bonus' | 'reaction' | 'long';
export const castingTitle = (k: CastingKind) => t(`cmp.casting.${k}`);
export const CASTING_KINDS: CastingKind[] = ['action', 'bonus', 'reaction', 'long'];

// «Бонусное действие» -> bonus, «1 минута» -> long. Пусто — неизвестно.
export function castingKind(v: FieldValue | undefined): CastingKind | null {
  const t = typeof v === 'string' ? searchKey(v) : '';
  if (!t) return null;
  if (/бонусн|bonus/.test(t)) return 'bonus';
  if (/реакци|reaction/.test(t)) return 'reaction';
  if (/^(1 )?(действие|action)\b/.test(t)) return 'action';
  return 'long';
}

export interface SpellFilter {
  levels: number[];
  classes: string[];
  schools: string[];
  times: CastingKind[];
  concentration: 'any' | 'yes' | 'no';
  ritual: 'any' | 'yes' | 'no';
}

export const NO_SPELL_FILTER: SpellFilter = { levels: [], classes: [], schools: [], times: [], concentration: 'any', ritual: 'any' };

export const spellFilterOn = (f: SpellFilter) =>
  !!(f.levels.length || f.classes.length || f.schools.length || f.times.length || f.concentration !== 'any' || f.ritual !== 'any');

const listOf = (v: FieldValue | undefined) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',') : []).map((x) => searchKey(String(x).trim()));

// Подходит ли заклинание: внутри одного признака — любое из выбранного, между признаками — все сразу.
export function spellMatches(fields: Record<string, FieldValue>, f: SpellFilter): boolean {
  if (f.levels.length && !f.levels.includes(Number(fields['level'] ?? -1))) return false;
  if (f.classes.length) {
    const own = listOf(fields['classes']);
    if (!f.classes.some((c) => own.includes(searchKey(c)))) return false;
  }
  if (f.schools.length && !f.schools.some((s) => searchKey(s) === searchKey(String(fields['school'] ?? '')))) return false;
  if (f.times.length) {
    const k = castingKind(fields['casting_time']);
    if (!k || !f.times.includes(k)) return false;
  }
  if (f.concentration !== 'any' && !!fields['concentration'] !== (f.concentration === 'yes')) return false;
  if (f.ritual !== 'any' && !!fields['ritual'] !== (f.ritual === 'yes')) return false;
  return true;
}

// Подпись уровня: «Заговоры», «1 уровень».
export const levelTitle = (level: number) => (level === 0 ? t('cmp.sub.cantrips') : t('cmp.sub.level', { n: level }));
