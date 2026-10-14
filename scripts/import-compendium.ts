// Встроенный справочник: заклинания, магические предметы, черты, состояния и правила из SRD 5.1 и SRD 5.2.1
// в русском переводе OmnisGM (CC BY 4.0). Запуск: npm run import-compendium (нужен интернет).
// Результат — resources/compendium/dnd5e-2014.json и dnd5e-2024.json. Руками не править.
//
// Источник — Markdown OmnisGM: запись = заголовок «Русское (English)», строка курсивом с типом
// («Воплощение 3-го уровня (Чародей, Волшебник)», «Чудесный предмет, необычный (требуется настройка)»,
// «Общая черта (Требование: …)»), дальше поля «**Время накладывания:** …» и текст.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const RU = { repo: 'OmnisGM-App/OmnisGM-Rules', sha: '20fd77db5a417d7c49a74fcea8bd7d1e905a96c0' };
const OUT = path.resolve(import.meta.dirname, '../resources/compendium');
const CACHE = path.join(os.tmpdir(), 'scrying-glass-compendium');

type Value = string | number | boolean | string[];
interface Entry {
  title: string;
  en?: string;
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
  const m = /^(.*?)\s*\(([A-Za-z][^)]*)\)\s*$/.exec(head);
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

function spells(text: string, report: string[]): Entry[] {
  const out: Entry[] = [];
  for (const s of sections(text, 3)) {
    const [title, en] = names(s.head);
    const [lead, rest] = italicLead(s.lines);
    if (!lead || !en) continue;
    const m = /^(?:([А-ЯЁ][а-яё]+) (\d)-го уровня|Заговор ([а-яёА-ЯЁ]+))\s*(?:\((.*)\))?$/.exec(lead);
    if (!m) {
      report.push(`заклинание без строки школы: ${s.head} — «${lead}»`);
      continue;
    }
    const fields: Record<string, Value> = {
      level: m[2] ? Number(m[2]) : 0,
      school: m[1] ?? SCHOOL_GEN[m[3]!.toLowerCase()] ?? m[3]!,
    };
    if (m[4]) fields['classes'] = m[4].split(',').map((x) => x.trim()).filter((x) => x && !/ритуал/i.test(x));
    const body: string[] = [];
    const KEYS: Record<string, string> = { 'Время накладывания': 'casting_time', Дистанция: 'range', Компоненты: 'components', Длительность: 'duration' };
    for (const line of rest) {
      const f = /^\*\*([^*]+?):\*\*\s*(.*)$/.exec(line.trim());
      const key = f ? KEYS[f[1]!] : undefined;
      if (f && key && !(key in fields)) {
        let v = f[2]!.trim();
        if (key === 'casting_time' && /\s*или Ритуал$|\(ритуал\)/i.test(v)) {
          fields['ritual'] = true;
          v = v.replace(/\s*или Ритуал$|\s*\(ритуал\)/i, '').trim();
        }
        if (key === 'duration' && /^Концентрация/i.test(v)) fields['concentration'] = true;
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

function items(text: string, report: string[]): Entry[] {
  const out: Entry[] = [];
  // Артефакты в источнике — заголовки 3-го уровня, остальные предметы — 4-го.
  let prevLevel = 0;
  const orphans: Section[] = [];
  for (const s of sections(text, 4, 3)) {
    const [title, en] = names(s.head);
    const [lead, rest] = italicLead(s.lines);
    // Статблок существа внутри предмета (фигурки, колода) — остаётся в тексте своего предмета.
    if (lead && /^(Крошечн|Маленьк|Средн|Больш|Огромн|Громадн)/.test(lead)) {
      // Обычно оно сразу после предмета; иначе — к предмету, в тексте которого оно упомянуто.
      const prev = out.at(-1);
      if (prev && prevLevel === s.level) prev.body = clean([prev.body, '', `#### ${s.head}`, ...s.lines]);
      else orphans.push(s);
      continue;
    }
    if (!lead || !en) continue;
    prevLevel = s.level;
    // «Чудесный предмет, необычный (требуется настройка)», «Оружие (любой меч), редкий (требуется настройка жрецом)»
    const att = /\(требуется настройка\s*([^)]*)\)/i.exec(lead);
    const main = lead.replace(/\s*\(требуется настройка[^)]*\)/i, '').trim();
    const comma = main.search(/,(?![^(]*\))/);
    const category = (comma < 0 ? main : main.slice(0, comma)).trim().replace(/^Палочка$/, 'Волшебная палочка');
    const rarity = comma < 0 ? '' : main.slice(comma + 1).trim();
    if (!CATEGORIES.some((c) => category.toLowerCase().startsWith(c.toLowerCase()))) report.push(`предмет: непривычная категория «${lead}» (${title})`);
    const fields: Record<string, Value> = { category: cap(category) };
    if (rarity) fields['rarity'] = cap(rarity);
    if (att) fields['attunement'] = att[1]!.trim() || 'да';
    out.push({ title, en, type: 'item', fields, body: clean(rest) });
  }
  for (const s of orphans) {
    const name = names(s.head)[0].toLowerCase();
    const owner = out.find((e) => e.body.toLowerCase().includes(name));
    if (owner) owner.body = clean([owner.body, '', `#### ${s.head}`, ...s.lines]);
    else report.push(`существо вне предмета пропущено: ${s.head}`);
  }
  return out;
}

// ---------- Черты ----------
function feats(text: string): Entry[] {
  const out: Entry[] = [];
  for (const s of sections(text, 4)) {
    const [title, en] = names(s.head);
    const [lead, rest] = italicLead(s.lines);
    if (!lead || !en) continue;
    const fields: Record<string, Value> = {};
    const cat = /^(Черта происхождения|Общая черта|Черта боевого стиля|Черта эпического дара)/.exec(lead);
    if (cat) fields['category'] = { 'Черта происхождения': 'Происхождение', 'Общая черта': 'Общая', 'Черта боевого стиля': 'Боевой стиль', 'Черта эпического дара': 'Эпический дар' }[cat[1]!]!;
    const req = /Требование:\s*([^)]*)\)?$/.exec(lead);
    if (req) fields['prerequisite'] = req[1]!.trim();
    const body = clean(rest);
    if (/\*\*\*?Повторяемость/.test(body)) fields['repeatable'] = true;
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
function glossary(text: string): Entry[] {
  const out: Entry[] = [];
  for (const s of sections(text, 4)) {
    const m = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(s.head);
    const title = (m ? m[1]! : s.head).trim();
    const tag = m?.[2]?.trim();
    const body = clean(s.lines);
    if (!body) continue;
    if (tag === 'Состояние') out.push({ title, en: CONDITIONS_EN[title], type: 'condition', fields: {}, body });
    else out.push({ title, type: 'rule', fields: { category: tag ?? 'Глоссарий' }, body });
  }
  return out;
}

function conditions51(text: string): Entry[] {
  return sections(text, 4)
    .map((s) => ({ title: s.head.trim(), en: CONDITIONS_EN[s.head.trim()], type: 'condition', fields: {}, body: clean(s.lines) }))
    .filter((e) => e.body);
}

// ---------- Сборка ----------
const EDITIONS: { system: string; source: Record<string, string>; files: Record<string, string> }[] = [
  {
    system: 'dnd5e-2014',
    source: { title: 'SRD 5.1', license: 'CC-BY-4.0', attribution: 'Wizards of the Coast; перевод — OmnisGM', url: 'https://rules.omnisgm.com' },
    files: { spells: 'src/dnd/srd-5.1/ru/10_Spells.md', items: 'src/dnd/srd-5.1/ru/13_MagicItems.md', feats: 'src/dnd/srd-5.1/ru/08_Feats.md', conditions: 'src/dnd/srd-5.1/ru/11_Conditions.md' },
  },
  {
    system: 'dnd5e-2024',
    source: { title: 'SRD 5.2.1', license: 'CC-BY-4.0', attribution: 'Wizards of the Coast; перевод — OmnisGM', url: 'https://rules.omnisgm.com' },
    files: { spells: 'src/dnd/srd-5.2/ru/07_Spells.md', items: 'src/dnd/srd-5.2/ru/10_MagicItems.md', feats: 'src/dnd/srd-5.2/ru/05_Feats.md', glossary: 'src/dnd/srd-5.2/ru/08_RulesGlossary.md' },
  },
];

fs.mkdirSync(OUT, { recursive: true });
for (const ed of EDITIONS) {
  const report: string[] = [];
  const f = ed.files;
  const list: Entry[] = [
    ...spells(await download(f['spells']!), report),
    ...items(await download(f['items']!), report),
    ...feats(await download(f['feats']!)),
    ...(f['conditions'] ? conditions51(await download(f['conditions'])) : []),
    ...(f['glossary'] ? glossary(await download(f['glossary'])) : []),
  ];
  // Повтор названия одного типа — оставляем первое (в источнике бывают дубли разделов).
  const seen = new Set<string>();
  const entries = list.filter((e) => {
    const k = `${e.type}:${e.title.toLowerCase()}`;
    if (seen.has(k)) {
      report.push(`повтор: ${e.type} «${e.title}»`);
      return false;
    }
    seen.add(k);
    return true;
  });
  const count = (t: string) => entries.filter((e) => e.type === t).length;
  fs.writeFileSync(path.join(OUT, `${ed.system}.json`), JSON.stringify({ system: ed.system, source: ed.source, entries }) + '\n');
  console.log(`${ed.system}: заклинаний ${count('spell')}, предметов ${count('item')}, черт ${count('feat')}, состояний ${count('condition')}, правил ${count('rule')}`);
  for (const r of report) console.log('  ' + r);
}
