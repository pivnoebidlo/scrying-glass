// Сборка встроенного бестиария из SRD 5.1 (редакция 2014) и SRD 5.2.1 (редакция 2024).
//
//   npm run import-srd
//
// Числа и структура — из 5e-bits/5e-database (английский), русский текст — из перевода OmnisGM.
// Монстры сопоставляются по английскому названию, которое в переводе стоит в скобках после русского.
// Результат: resources/srd/dnd5e-2014.json и dnd5e-2024.json (английские карточки и их переводы).
// Источники закреплены коммитами: обновить — поменять SHA ниже и запустить скрипт заново.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Card, CardSource } from '../src/shared/cards';
import type { Ability, Block, Dnd5eStats, SenseKind, Size, SpeedKind } from '../src/systems/dnd5e/stats';

const DB = { repo: '5e-bits/5e-database', sha: 'a6212beb4b278917c2cff41c2b04c4ef4f3e0d6f' };
const RU = { repo: 'OmnisGM-App/OmnisGM-Rules', sha: '20fd77db5a417d7c49a74fcea8bd7d1e905a96c0' };

const EDITIONS = [
  {
    system: 'dnd5e-2014',
    prefix: 'srd51',
    db: 'src/2014/en/5e-SRD-Monsters.json',
    ru: ['src/dnd/srd-5.1/ru/15_MonstersA-Z.md'],
    source: { title: 'SRD 5.1', license: 'CC-BY-4.0', attribution: 'Wizards of the Coast', url: 'https://www.dndbeyond.com/srd' },
  },
  {
    system: 'dnd5e-2024',
    prefix: 'srd52',
    db: 'src/2024/en/5e-SRD-Monsters.json',
    ru: ['src/dnd/srd-5.2/ru/12_MonstersA-Z.md', 'src/dnd/srd-5.2/ru/13_Animals.md'],
    source: { title: 'SRD 5.2.1', license: 'CC-BY-4.0', attribution: 'Wizards of the Coast', url: 'https://www.dndbeyond.com/srd' },
  },
];

const RU_SOURCE = (en: CardSource): CardSource => ({
  title: en.title,
  license: 'CC-BY-4.0',
  attribution: 'Wizards of the Coast; перевод — OmnisGM',
  url: 'https://rules.omnisgm.com',
});

const OUT = path.resolve(import.meta.dirname, '../resources/srd');
const CACHE = path.join(os.tmpdir(), 'scrying-glass-srd');

async function download(repo: string, sha: string, file: string): Promise<string> {
  const local = path.join(CACHE, sha, file);
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  const url = `https://raw.githubusercontent.com/${repo}/${sha}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, text);
  return text;
}

// ---------- Английская база ----------

interface DbBlock {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage?: { damage_dice?: string }[];
  usage?: { type: string; times?: number; min_value?: number; rest_types?: string[] };
  // В базе 2024 у колдовства — список заклинаний отдельно, а в desc только вступление («…casts one of the
  // following spells…:»).
  spellcasting?: { spells?: { name: string; notes?: string; usage?: { type?: string; times?: number } }[] };
}

interface DbMonster {
  index: string;
  desc?: string;
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment: string;
  armor_class: { type?: string; value: number; armor?: { name: string }[]; desc?: string }[];
  hit_points: number;
  hit_points_roll?: string;
  hit_dice?: string;
  speed: Record<string, string | boolean>;
  strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number;
  proficiencies: { value: number; proficiency: { index: string } }[];
  damage_vulnerabilities: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: { index: string }[];
  senses: Record<string, string | number>;
  languages: string;
  gear?: string;
  challenge_rating: number;
  xp: number;
  proficiency_bonus: number;
  special_abilities?: DbBlock[];
  actions?: DbBlock[];
  bonus_actions?: DbBlock[];
  reactions?: DbBlock[];
  legendary_actions?: DbBlock[];
}

const feet = (v: string | number | boolean | undefined) => (typeof v === 'number' ? v : parseInt(String(v ?? ''), 10));
const DAMAGE = new Set(['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder']);

function usageText(u: DbBlock['usage']): string | undefined {
  if (!u) return undefined;
  if (u.type === 'recharge on roll') return u.min_value === 6 ? 'Recharge 6' : `Recharge ${u.min_value}–6`;
  if (u.type === 'per day') return `${u.times}/Day`;
  if (u.type === 'recharge after rest') {
    const rest = (u.rest_types ?? []).map((r) => r[0]!.toUpperCase() + r.slice(1)).join(' or ');
    return `Recharges after a ${rest} Rest`;
  }
  return undefined;
}

// Списки колдовства 2024, как в книге: «- **At Will:** *Detect Magic*, *Light*», «- **1/Day Each:** *Fly*».
// Только там, где desc обрывается на двоеточии — в остальных блоках заклинания названы прямо в тексте.
function spellLines(b: DbBlock): string {
  const spells = b.spellcasting?.spells ?? [];
  if (!spells.length || !b.desc.trim().endsWith(':')) return '';
  const groups = new Map<string, string[]>();
  const sorted = [...spells].sort((x, y) => (y.usage?.type === 'per day' ? y.usage.times ?? 1 : 99) - (x.usage?.type === 'per day' ? x.usage.times ?? 1 : 99));
  for (const s of sorted) {
    const key = s.usage?.type === 'per day' ? `${s.usage.times ?? 1}/Day` : 'At Will';
    groups.set(key, [...(groups.get(key) ?? []), `*${s.name}*${s.notes ? ` (${s.notes[0]!.toLowerCase()}${s.notes.slice(1)})` : ''}`]);
  }
  return [...groups].map(([k, list]) => `- **${k}${k !== 'At Will' && list.length > 1 ? ' Each' : ''}:** ${list.join(', ')}`).join('\n');
}

function enBlock(b: DbBlock): Block {
  const lines = spellLines(b);
  const out: Block = { name: b.name, text: b.desc.trim() + (lines ? '\n\n' + lines : '') };
  const uses = usageText(b.usage);
  if (uses) {
    out.uses = uses;
    out.name = b.name.replace(/\s*\((recharge|\d+\/day)[^)]*\)\s*$/i, '');
  }
  if (typeof b.attack_bonus === 'number') {
    out.attack = { bonus: b.attack_bonus, damage: (b.damage ?? []).map((d) => d.damage_dice).filter((d): d is string => !!d) };
  }
  return out;
}

const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

function enStats(m: DbMonster, system: string): Dnd5eStats {
  const ac = m.armor_class[0]!;
  const acNote =
    system === 'dnd5e-2014'
      ? ac.armor?.length
        ? ac.armor.map((a) => a.name.toLowerCase()).join(', ')
        : ac.type === 'natural'
          ? 'natural armor'
          : ac.desc
      : undefined;
  const speed: Dnd5eStats['speed'] = {};
  for (const [k, v] of Object.entries(m.speed)) {
    if (k === 'hover') speed.hover = v === true;
    else if (!isNaN(feet(v))) speed[k as SpeedKind] = feet(v);
  }
  const senses: Dnd5eStats['senses'] = { passivePerception: Number(m.senses['passive_perception'] ?? 10) };
  for (const k of ['darkvision', 'blindsight', 'tremorsense', 'truesight'] as SenseKind[]) {
    if (m.senses[k] !== undefined) senses[k] = feet(m.senses[k]);
  }
  const saves: Dnd5eStats['saves'] = {};
  const skills: Dnd5eStats['skills'] = [];
  for (const p of m.proficiencies) {
    const i = p.proficiency.index;
    if (i.startsWith('saving-throw-')) saves[i.slice('saving-throw-'.length) as Ability] = p.value;
    else if (i.startsWith('skill-')) skills.push({ skill: i.slice('skill-'.length), bonus: p.value });
  }
  const damageList = (xs: string[]) => xs.map((x) => (DAMAGE.has(x.toLowerCase()) ? x.toLowerCase() : x));
  const legendary = m.legendary_actions?.length ? { intro: '', actions: m.legendary_actions.map(enBlock) } : undefined;

  return {
    size: m.size.toLowerCase().split(' or ').map((x) => x.trim() as Size),
    type: cap(m.type) + (m.subtype ? ` (${m.subtype})` : ''),
    alignment: m.alignment,
    ac: ac.value,
    ...(acNote ? { acNote } : {}),
    hp: m.hit_points,
    hpFormula: (m.hit_points_roll ?? m.hit_dice ?? '').replace(/\s+/g, '') || undefined,
    speed,
    abilities: {
      str: m.strength, dex: m.dexterity, con: m.constitution, int: m.intelligence, wis: m.wisdom, cha: m.charisma,
    },
    saves,
    skills,
    vulnerabilities: damageList(m.damage_vulnerabilities),
    resistances: damageList(m.damage_resistances),
    immunities: damageList(m.damage_immunities),
    conditionImmunities: m.condition_immunities.map((c) => c.index),
    senses,
    languages: m.languages,
    ...(m.gear ? { gear: m.gear } : {}),
    cr: m.challenge_rating,
    xp: m.xp,
    pb: m.proficiency_bonus,
    traits: (m.special_abilities ?? []).map(enBlock),
    actions: (m.actions ?? []).map(enBlock),
    bonusActions: (m.bonus_actions ?? []).map(enBlock),
    reactions: (m.reactions ?? []).map(enBlock),
    ...(legendary ? { legendary } : {}),
  };
}

// ---------- Русский перевод ----------

interface RuMonster {
  name: string;
  meta: string;
  fields: Record<string, string>;
  sections: Record<string, { intro: string; blocks: Block[] }>;
}

// Скобки верхнего уровня в строке, с учётом вложенных: «Гаст (Упырь) (Ghast (Ghoul))» -> «Упырь», «Ghast (Ghoul)».
function parens(s: string): { inner: string; start: number }[] {
  const out: { inner: string; start: number }[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(' && depth++ === 0) start = i;
    else if (s[i] === ')' && depth > 0 && --depth === 0) out.push({ inner: s.slice(start + 1, i), start });
  }
  return out;
}

const lastParens = (s: string) => parens(s.trimEnd()).at(-1) ?? null;

// В переводе некоторые монстры названы иначе, чем в английской базе.
const ALIASES: Record<string, string> = { Drow: 'Elf, Drow' };

const SECTION: Record<string, string> = {
  'Особенности': 'traits',
  'Свойства': 'traits',
  'Действия': 'actions',
  'Бонусные действия': 'bonusActions',
  'Реакции': 'reactions',
  'Легендарные действия': 'legendary',
};

// Разбирает файл перевода: английское название -> монстр.
function parseRu(md: string, report: string[]): Map<string, RuMonster> {
  const out = new Map<string, RuMonster>();
  const parts = md.split(/^(?=#{2,3} )/m);
  for (const part of parts) {
    if (!part.startsWith('### ')) continue;
    const lines = part.split('\n');
    const head = lines[0]!.slice(4).trim();
    // Английское название — первые скобки с латиницей: «Имп (Imp) (Дьявол)», «Гаст (Упырь) (Ghast (Ghoul))».
    // Русское — всё до первых скобок.
    const groups = parens(head);
    const en = groups.find((g) => /[A-Za-z]/.test(g.inner));
    if (!en) continue;
    const name = head.slice(0, groups[0]!.start).trim();

    const m: RuMonster = { name, meta: '', fields: {}, sections: {} };
    let section: { intro: string; blocks: Block[] } | null = null;
    let para: string[] = [];

    const flush = () => {
      const text = para.join('\n').trim();
      para = [];
      if (!text || !section) return;
      const b = /^\*\*_(.+?)_\*\*\s*|^\*\*\*(.+?)\*\*\*\s*/.exec(text);
      if (b) {
        let bname = (b[1] ?? b[2]!).trim().replace(/\.$/, '').trim();
        const block: Block = { name: bname, text: text.slice(b[0].length).trim() };
        const u = lastParens(bname);
        if (u) {
          block.name = bname.slice(0, u.start).trim();
          block.uses = u.inner;
        }
        section.blocks.push(block);
      } else if (section.blocks.length) {
        section.blocks[section.blocks.length - 1]!.text += '\n\n' + text;
      } else {
        section.intro = (section.intro ? section.intro + '\n\n' : '') + text;
      }
    };

    for (const line of lines.slice(1)) {
      const sec = /^#### (.+)$/.exec(line);
      if (sec) {
        flush();
        const key = SECTION[sec[1]!.trim()];
        if (!key) report.push(`  ${head}: неизвестный раздел «${sec[1]}»`);
        section = { intro: '', blocks: [] };
        m.sections[key ?? sec[1]!] = section;
        continue;
      }
      if (!section) {
        const meta = /^\*([^*].*)\*\s*$/.exec(line);
        if (meta && !m.meta) m.meta = meta[1]!.trim();
        const f = /^- \*\*(.+?)\*\*:?\s*(.*)$/.exec(line);
        if (f) m.fields[f[1]!.replace(/:$/, '').trim()] = f[2]!.trim();
        continue;
      }
      // Список внутри действия (заклинания) остаётся частью абзаца.
      if (line.trim() === '' && !para.at(-1)?.startsWith('- ')) flush();
      else if (line.trim() !== '') para.push(line);
      else flush();
    }
    flush();

    const key = en.inner.replace(/’/g, "'");
    out.set(key, m);
    // «Ghast (Ghoul)» найдётся и как «Ghast».
    const group = lastParens(key);
    if (group) out.set(key.slice(0, group.start).trim(), m);
  }
  return out;
}

const SIZE_WORD = /^(?:(?:крошечн|маленьк|средн|больш|огромн|громадн)\S*\s+(?:или\s+)?)+/i;

// В переводе описание NPC стоит абзацем после последнего действия и при разборе прилипает к нему.
// Если у оригинала есть описание, столько же последних абзацев переносим в описание. Если нет — узнаём
// описание по оформлению: абзац начинается с жирного слова («**Гигантские совы** часто…»).
function takeDescription(r: RuMonster, enDesc: string | undefined): string | undefined {
  const sections = ['legendary', 'reactions', 'bonusActions', 'actions', 'traits'];
  const last = sections.map((k) => r.sections[k]?.blocks.at(-1)).find((b) => b);
  if (!last) return undefined;
  const paras = last.text.split('\n\n');
  const count = enDesc ? enDesc.trim().split(/\n\s*\n/).length : /^\*\*[^_*]/.test(paras.at(-1) ?? '') ? 1 : 0;
  if (!count || paras.length <= count) return undefined;
  const desc = paras.splice(paras.length - count).join('\n\n');
  last.text = paras.join('\n\n');
  return desc;
}

function ruStats(enS: Dnd5eStats, r: RuMonster, report: string[], label: string): Dnd5eStats {
  const s: Dnd5eStats = structuredClone(enS);
  const f = r.fields;

  // «Маленькая Фея (гоблиноид), хаотично-нейтральный»
  const comma = r.meta.lastIndexOf(',');
  if (comma > 0) {
    s.type = cap(r.meta.slice(0, comma).replace(SIZE_WORD, '').trim());
    s.alignment = r.meta.slice(comma + 1).trim().toLowerCase();
  } else report.push(`  ${label}: не разобрана строка типа «${r.meta}»`);

  const acField = f['Класс доспеха'] ?? f['Класс Доспеха'];
  const acNote = acField && /\((.+)\)/.exec(acField)?.[1];
  if (s.acNote && acNote) s.acNote = acNote;

  // В 2024 инициатива указана явно: «+2 (12)».
  const init = f['Инициатива'] && /^([+−-]?\d+)/.exec(f['Инициатива'].replace('−', '-'));
  if (init) {
    s.initiative = parseInt(init[1]!, 10);
    enS.initiative = s.initiative;
  }

  if (f['Языки'] !== undefined) s.languages = f['Языки'];
  if (f['Снаряжение'] !== undefined) s.gear = f['Снаряжение'];

  // Типы урона и состояния — ключи, их перевод не нужен. Свободный текст («дробящий от немагических
  // атак») берётся из перевода.
  const textual = (xs: string[]) => xs.some((x) => !DAMAGE.has(x));
  const immunitiesRu = (f['Иммунитет к урону'] ?? f['Иммунитеты'])?.split(';')[0];
  const pick = (xs: string[], ru: string | undefined) => (textual(xs) && ru ? ru.split(';').map((x) => x.trim()) : xs);
  s.vulnerabilities = pick(s.vulnerabilities, f['Уязвимость к урону'] ?? f['Уязвимости']);
  s.resistances = pick(s.resistances, f['Сопротивление к урону'] ?? f['Сопротивления']);
  s.immunities = pick(s.immunities, immunitiesRu);

  // Особенности и действия: русский текст, а данные атак — из английской карточки по порядку.
  const blocks = (key: 'traits' | 'actions' | 'bonusActions' | 'reactions', en: Block[]) => {
    const ru = r.sections[key]?.blocks ?? [];
    if (ru.length !== en.length) report.push(`  ${label}: ${key} — в переводе ${ru.length}, в оригинале ${en.length}`);
    // Раздел целиком пропущен в переводе: лучше английский текст, чем ничего.
    if (!ru.length) return en;
    return ru.map((b, i) => {
      const e = en[i];
      return e?.attack && ru.length === en.length ? { ...b, attack: e.attack } : b;
    });
  };
  s.traits = blocks('traits', enS.traits);
  s.actions = blocks('actions', enS.actions);
  s.bonusActions = blocks('bonusActions', enS.bonusActions);
  s.reactions = blocks('reactions', enS.reactions);
  const leg = r.sections['legendary'];
  if (leg) s.legendary = { intro: leg.intro, actions: leg.blocks };
  else delete s.legendary;
  return s;
}

// ---------- Сборка ----------

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const report: string[] = [];

  for (const ed of EDITIONS) {
    const monsters = JSON.parse(await download(DB.repo, DB.sha, ed.db)) as DbMonster[];
    const ru = new Map<string, RuMonster>();
    for (const file of ed.ru) {
      for (const [k, v] of parseRu(await download(RU.repo, RU.sha, file), report)) ru.set(k, v);
    }

    const cards: Card<Dnd5eStats>[] = [];
    const untranslated: string[] = [];
    for (const m of monsters) {
      const stats = enStats(m, ed.system);
      const id = `${ed.prefix}-${m.index}`;
      const r = ru.get(ALIASES[m.name] ?? m.name.replace(/’/g, "'"));
      const ruDesc = r ? takeDescription(r, m.desc) : undefined;
      if (r && m.desc && !ruDesc) report.push(`  ${ed.system} ${m.name}: описание в переводе не найдено`);
      const ruCard: Card<Dnd5eStats> | null = r
        ? {
            format: 1, id: `${id}.ru`, kind: 'monster', system: ed.system, lang: 'ru', name: r.name,
            origin: { id, relation: 'translation' }, source: RU_SOURCE(ed.source),
            portraits: [], tags: [], ...(ruDesc ? { description: ruDesc } : {}), notes: '',
            stats: ruStats(stats, r, report, `${ed.system} ${m.name}`),
          }
        : null;
      if (!r) untranslated.push(m.name);
      cards.push({
        format: 1, id, kind: 'monster', system: ed.system, lang: 'en', name: m.name, source: ed.source,
        portraits: [], tags: [], ...(m.desc ? { description: m.desc.trim() } : {}), notes: '', stats,
      });
      if (ruCard) cards.push(ruCard);
    }

    const file = path.join(OUT, `${ed.system}.json`);
    fs.writeFileSync(file, JSON.stringify(cards));
    const ruCount = cards.filter((c) => c.lang === 'ru').length;
    console.log(`${ed.system}: ${monsters.length} монстров, переведено ${ruCount}, файл ${(fs.statSync(file).size / 1e6).toFixed(1)} МБ`);
    if (untranslated.length) console.log(`  без перевода (${untranslated.length}): ${untranslated.join(', ')}`);
  }
  if (report.length) console.log('Замечания:\n' + report.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
