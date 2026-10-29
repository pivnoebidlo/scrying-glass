// Built-in compendium: spells, magic items, feats, conditions and rules from SRD 5.1 and SRD 5.2.1 — the English
// originals and the Russian translation by OmnisGM (both CC BY 4.0, Markdown of OmnisGM-Rules).
// Run: npm run import-compendium (needs the internet). Output — content/dnd5e-srd/compendium/<system>.<lang>.json (downloadable content). Do not edit.
//
// Источник — Markdown OmnisGM: запись = заголовок «Русское (English)», строка курсивом с типом
// («Воплощение 3-го уровня (Чародей, Волшебник)», «Чудесный предмет, необычный (требуется настройка)»,
// «Общая черта (Требование: …)»), дальше поля «**Время накладывания:** …» и текст.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const RU = { repo: 'OmnisGM-App/OmnisGM-Rules', sha: '20fd77db5a417d7c49a74fcea8bd7d1e905a96c0' };
const OUT = path.resolve(import.meta.dirname, '../content/dnd5e-srd/compendium');
const CACHE = path.join(os.tmpdir(), 'scrying-glass-compendium');

type Value = string | number | boolean | string[];
interface Entry {
  title: string;
  en?: string;
  // English book: the Russian title (to find the entry by a name from a Russian card).
  ru?: string;
  type: string;
  fields: Record<string, Value>;
  body: string;
}

async function download(file: string): Promise<string> {
  const local = path.join(CACHE, RU.sha, file);
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  const url = `https://raw.githubusercontent.com/${RU.repo}/${RU.sha}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, text);
  return text;
}

// Разбить файл на разделы по заголовкам: уровень, текст заголовка, строки до следующего заголовка того же или
// более высокого уровня (вложенные заголовки остаются внутри — например, подзаголовки в описании предмета).
interface Section {
  level: number;
  head: string;
  lines: string[];
}
function sections(text: string, level: number, from = level): Section[] {
  const out: Section[] = [];
  let cur: Section | null = null;
  for (const line of text.split(/\r?\n/)) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h && h[1]!.length <= level) {
      if (cur) out.push(cur);
      cur = h[1]!.length >= from ? { level: h[1]!.length, head: h[2]!.trim(), lines: [] } : null;
      continue;
    }
    cur?.lines.push(line);
  }
  if (cur) out.push(cur);
  return out;
}

// «Огненный шар (Fireball)» -> ['Огненный шар', 'Fireball'].
function names(head: string): [string, string | undefined] {
  // The English part may have its own brackets: «Камень удачи (Камень везения) (Stone of Good Luck (Luckstone))».
  const m = /^(.*?)\s*\(([A-Za-z].*)\)\s*$/.exec(head);
  return m ? [m[1]!.trim(), m[2]!.trim()] : [head.trim(), undefined];
}

// Первая непустая строка — курсивом? Возвращает её и остальные строки.
function italicLead(lines: string[]): [string | null, string[]] {
  const i = lines.findIndex((l) => l.trim());
  if (i < 0) return [null, lines];
  const m = /^\*([^*].*?)\*\s*$/.exec(lines[i]!.trim());
  return m ? [m[1]!, lines.slice(i + 1)] : [null, lines];
}

// Текст записи: без пустых строк по краям; «**_Заголовок._**» -> «***Заголовок.***» (понимает разметка приложения).
const clean = (lines: string[]) =>
  lines
    .join('\n')
    .replace(/\*\*_(.+?)_\*\*/g, '***$1***')
    .replace(/_\*\*(.+?)\*\*_/g, '***$1***')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// ---------- Заклинания ----------
const SCHOOL_GEN: Record<string, string> = {
  ограждения: 'Ограждение', вызова: 'Вызов', прорицания: 'Прорицание', очарования: 'Очарование',
  воплощения: 'Воплощение', иллюзии: 'Иллюзия', некромантии: 'Некромантия', преобразования: 'Преобразование',
};

// The spell line: «Воплощение 3-го уровня (…)», «Заговор воплощения (…)» / «Level 3 Evocation (…)», «Evocation Cantrip (…)».
function spellLead(lead: string, lang: Lang): { level: number; school: string; classes?: string } | null {
  if (lang === 'ru') {
    const m = /^(?:([А-ЯЁ][а-яё]+) (\d)-го уровня|Заговор ([а-яёА-ЯЁ]+))\s*(?:\((.*)\))?$/.exec(lead);
    return m ? { level: m[2] ? Number(m[2]) : 0, school: m[1] ?? SCHOOL_GEN[m[3]!.toLowerCase()] ?? m[3]!, classes: m[4] } : null;
  }
  const m = /^(?:Level (\d) ([A-Z][a-z]+)|([A-Z][a-z]+) Cantrip)\s*(?:\((.*)\))?$/.exec(lead);
  return m ? { level: m[1] ? Number(m[1]) : 0, school: m[2] ?? m[3]!, classes: m[4] } : null;
}

const SPELL_KEYS: Record<string, string> = {
  'Время накладывания': 'casting_time', Дистанция: 'range', Компоненты: 'components', Компонент: 'components', Длительность: 'duration',
  'Casting Time': 'casting_time', Range: 'range', Components: 'components', Component: 'components', Duration: 'duration',
};

function spells(text: string, lang: Lang, report: string[]): Entry[] {
  const out: Entry[] = [];
  for (const s of sections(text, 3)) {
    const [title, en] = lang === 'ru' ? names(s.head) : [s.head.trim(), undefined];
    const [lead, rest] = italicLead(s.lines);
    if (!lead || (lang === 'ru' && !en)) continue;
    const m = spellLead(lead, lang);
    if (!m) {
      if (lang === 'ru' || /Level \d|Cantrip/.test(lead)) report.push(`spell without a school line: ${s.head} — «${lead}»`);
      continue;
    }
    const fields: Record<string, Value> = { level: m.level, school: m.school };
    if (m.classes) fields['classes'] = m.classes.split(',').map((x) => x.trim()).filter((x) => x && !/ритуал|ritual/i.test(x));
    const body: string[] = [];
    for (const line of rest) {
      const f = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(line.trim());
      const key = f ? SPELL_KEYS[f[1]!] : undefined;
      if (f && key && !(key in fields)) {
        let v = f[2]!.trim();
        if (key === 'casting_time' && /\s*(или|or) Ритуал$|\s*or Ritual$|\((ритуал|ritual)\)/i.test(v)) {
          fields['ritual'] = true;
          v = v.replace(/\s*(или|or) (Ритуал|Ritual)$|\s*\((ритуал|ritual)\)/i, '').trim();
        }
        if (key === 'duration' && /^(Концентрация|Concentration)/i.test(v)) fields['concentration'] = true;
        fields[key] = v;
      } else body.push(line);
    }
    out.push({ title, en, type: 'spell', fields, body: clean(body) });
  }
  return out;
}

// ---------- Магические предметы ----------
const CATEGORIES = ['Чудесный предмет', 'Волшебная палочка', 'Оружие', 'Доспех', 'Зелье', 'Кольцо', 'Жезл', 'Посох', 'Свиток'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CATEGORIES_EN = ['Wondrous Item', 'Wand', 'Weapon', 'Armor', 'Potion', 'Ring', 'Rod', 'Staff', 'Scroll'];
const SIZE_LEAD = /^(Крошечн|Маленьк|Средн|Больш|Огромн|Громадн|Tiny|Small|Medium|Large|Huge|Gargantuan)/;

function items(text: string, lang: Lang, report: string[]): Entry[] {
  const out: Entry[] = [];
  // Артефакты в источнике — заголовки 3-го уровня, остальные предметы — 4-го.
  let prevLevel = 0;
  const orphans: Section[] = [];
  for (const s of sections(text, 4, 3)) {
    const [title, en] = lang === 'ru' ? names(s.head) : [s.head.trim(), undefined];
    const [lead, rest] = italicLead(s.lines);
    // Статблок существа внутри предмета (фигурки, колода) — остаётся в тексте своего предмета.
    if (lead && SIZE_LEAD.test(lead)) {
      // Обычно оно сразу после предмета; иначе — к предмету, в тексте которого оно упомянуто.
      const prev = out.at(-1);
      if (prev && prevLevel === s.level) prev.body = clean([prev.body, '', `#### ${s.head}`, ...s.lines]);
      else orphans.push(s);
      continue;
    }
    if (!lead || (lang === 'ru' && !en)) continue;
    // «Чудесный предмет, необычный (требуется настройка)», «Оружие (любой меч), редкий (требуется настройка жрецом)»,
    // «Wondrous Item, Uncommon (Requires Attunement)», «Weapon (Any Sword), Rare (Requires Attunement by a Cleric)»
    const att = /\((?:требуется настройка|requires attunement)\s*([^)]*)\)/i.exec(lead);
    const main = lead.replace(/\s*\((?:требуется настройка|requires attunement)[^)]*\)/i, '').trim();
    const comma = main.search(/,(?![^(]*\))/);
    const category = (comma < 0 ? main : main.slice(0, comma)).trim().replace(/^Палочка$/, 'Волшебная палочка');
    const rarity = comma < 0 ? '' : main.slice(comma + 1).trim();
    const known = lang === 'ru' ? CATEGORIES : CATEGORIES_EN;
    if (!known.some((c) => category.toLowerCase().startsWith(c.toLowerCase()))) {
      // English headings carry no second name, so a section that is not an item is recognized by its line.
      if (lang === 'ru') report.push(`item: unusual category «${lead}» (${title})`);
      else continue;
    }
    prevLevel = s.level;
    const fields: Record<string, Value> = { category: cap(category) };
    if (rarity) fields['rarity'] = cap(rarity);
    if (att) fields['attunement'] = att[1]!.trim() || (lang === 'ru' ? 'да' : 'yes');
    out.push({ title, en, type: 'item', fields, body: clean(rest) });
  }
  for (const s of orphans) {
    const name = names(s.head)[0].toLowerCase();
    const owner = out.find((e) => e.body.toLowerCase().includes(name));
    if (owner) owner.body = clean([owner.body, '', `#### ${s.head}`, ...s.lines]);
    else report.push(`creature outside an item skipped: ${s.head}`);
  }
  return out;
}

// ---------- Черты ----------
const FEAT_CATEGORIES: Record<string, string> = {
  'Черта происхождения': 'Происхождение', 'Общая черта': 'Общая', 'Черта боевого стиля': 'Боевой стиль', 'Черта эпического дара': 'Эпический дар',
  'Origin Feat': 'Origin', 'General Feat': 'General', 'Fighting Style Feat': 'Fighting Style', 'Epic Boon Feat': 'Epic Boon',
};

function feats(text: string, lang: Lang): Entry[] {
  const out: Entry[] = [];
  for (const s of sections(text, 4)) {
    const [title, en] = lang === 'ru' ? names(s.head) : [s.head.trim(), undefined];
    const [lead, rest] = italicLead(s.lines);
    if (!lead || (lang === 'ru' ? !en : !/Feat|Prerequisite/.test(lead))) continue;
    const fields: Record<string, Value> = {};
    const cat = Object.keys(FEAT_CATEGORIES).find((c) => lead.startsWith(c));
    if (cat) fields['category'] = FEAT_CATEGORIES[cat]!;
    const req = /(?:Требование|Prerequisite):\s*([^)]*)\)?$/.exec(lead);
    if (req) fields['prerequisite'] = req[1]!.trim();
    const body = clean(rest);
    if (/\*\*\*?(Повторяемость|Repeatable)/.test(body)) fields['repeatable'] = true;
    out.push({ title, en, type: 'feat', fields, body });
  }
  return out;
}

// ---------- Состояния и правила ----------
const CONDITIONS_EN: Record<string, string> = {
  Ослеплённый: 'Blinded', Очарованный: 'Charmed', Оглохший: 'Deafened', Истощение: 'Exhaustion', Испуганный: 'Frightened',
  Схваченный: 'Grappled', Недееспособный: 'Incapacitated', Невидимый: 'Invisible', Парализованный: 'Paralyzed',
  Окаменевший: 'Petrified', Отравленный: 'Poisoned', Лежащий: 'Prone', Опутанный: 'Restrained', Ошеломлённый: 'Stunned',
  'Без сознания': 'Unconscious',
};

// Глоссарий правил 5.2: «#### Название [Метка]» — состояние, действие, опасность… Без метки — правило.
function glossary(text: string, lang: Lang): Entry[] {
  const out: Entry[] = [];
  for (const s of sections(text, 4)) {
    const m = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(s.head);
    const title = (m ? m[1]! : s.head).trim();
    const tag = m?.[2]?.trim();
    const body = clean(s.lines);
    if (!body) continue;
    if (tag === 'Состояние' || tag === 'Condition') out.push({ title, en: CONDITIONS_EN[title], type: 'condition', fields: {}, body });
    else out.push({ title, type: 'rule', fields: { category: tag ?? (lang === 'ru' ? 'Глоссарий' : 'Glossary') }, body });
  }
  return out;
}

function conditions51(text: string): Entry[] {
  return sections(text, 4)
    .map((s) => ({ title: s.head.trim(), en: CONDITIONS_EN[s.head.trim()], type: 'condition', fields: {}, body: clean(s.lines) }))
    .filter((e) => e.body);
}

// ---------- Build ----------
type Lang = 'ru' | 'en';
const EDITIONS: { system: string; title: string; dir: string; files: Record<string, string> }[] = [
  { system: 'dnd5e-2014', title: 'SRD 5.1', dir: 'src/dnd/srd-5.1', files: { spells: '10_Spells.md', items: '13_MagicItems.md', feats: '08_Feats.md', conditions: '11_Conditions.md' } },
  { system: 'dnd5e-2024', title: 'SRD 5.2.1', dir: 'src/dnd/srd-5.2', files: { spells: '07_Spells.md', items: '10_MagicItems.md', feats: '05_Feats.md', glossary: '08_RulesGlossary.md' } },
];
const SOURCE: Record<Lang, (title: string) => Record<string, string>> = {
  ru: (title) => ({ title, license: 'CC-BY-4.0', attribution: 'Wizards of the Coast; перевод — OmnisGM', url: 'https://rules.omnisgm.com', translator: 'OmnisGM' }),
  en: (title) => ({ title, license: 'CC-BY-4.0', attribution: 'Wizards of the Coast', url: 'https://www.dndbeyond.com/srd' }),
};

async function build(ed: (typeof EDITIONS)[number], lang: Lang, report: string[]): Promise<Entry[]> {
  const f = (k: string) => download(`${ed.dir}/${lang}/${ed.files[k]}`);
  const list: Entry[] = [
    ...spells(await f('spells'), lang, report),
    ...items(await f('items'), lang, report),
    ...feats(await f('feats'), lang),
    ...(ed.files['conditions'] ? conditions51(await f('conditions')) : []),
    ...(ed.files['glossary'] ? glossary(await f('glossary'), lang) : []),
  ];
  // Повтор названия одного типа — оставляем первое (в источнике бывают дубли разделов).
  const seen = new Set<string>();
  return list.filter((e) => {
    const k = `${e.type}:${e.title.toLowerCase()}`;
    if (seen.has(k)) {
      report.push(`repeat: ${e.type} «${e.title}»`);
      return false;
    }
    seen.add(k);
    return true;
  });
}

fs.mkdirSync(OUT, { recursive: true });
for (const ed of EDITIONS) {
  const books: Record<Lang, Entry[]> = { ru: [], en: [] };
  for (const lang of ['ru', 'en'] as const) {
    const report: string[] = [];
    books[lang] = await build(ed, lang, report);
    const entries = books[lang];
    const count = (t: string) => entries.filter((e) => e.type === t).length;
    console.log(`${ed.system}.${lang}: spells ${count('spell')}, items ${count('item')}, feats ${count('feat')}, conditions ${count('condition')}, rules ${count('rule')}`);
    for (const r of report) console.log('  ' + r);
  }
  // English entries get the Russian title: a Russian card's spell name still finds the entry.
  const ruByEn = new Map(books.ru.filter((e) => e.en).map((e) => [`${e.type}:${e.en!.toLowerCase()}`, e.title]));
  for (const e of books.en) {
    const ru = ruByEn.get(`${e.type}:${e.title.toLowerCase()}`);
    if (ru) e.ru = ru;
  }
  const unmatched = books.ru.filter((e) => e.en && !books.en.some((x) => x.type === e.type && x.title.toLowerCase() === e.en!.toLowerCase()));
  if (unmatched.length) console.log(`  ru without an English pair: ${unmatched.map((e) => e.en).join(', ')}`);
  for (const lang of ['ru', 'en'] as const) {
    const book = { system: ed.system, lang, source: SOURCE[lang](ed.title), entries: books[lang] };
    fs.writeFileSync(path.join(OUT, `${ed.system}.${lang}.json`), JSON.stringify(book) + '\n');
  }
}
