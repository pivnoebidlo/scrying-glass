// Built-in Mausritter content from scripts/mausritter-srd.<lang>.md (Mausritter SRD 2.3.1, CC BY 4.0; the Russian
// file is a translation made for Scrying Glass): resources/srd/mausritter.json — creature cards (English and their
// Russian translations), resources/compendium/mausritter.<lang>.json — rules, spells, tables.
// Run: npm run build-mausritter. Do not edit the JSON by hand.
//
// Chapters («# …») become categories, sections («## …») — entries (their «###» are headings inside); a chapter's
// own text becomes an entry named after the chapter with links to its sections. Spells of the spell list are
// entries of their own (type mspell); creatures of the creature list are cards. «Terms of use» is not copied:
// the attribution lives in About and the READMEs.
// The translation keeps the headings of the original one for one: entries, spells and creatures are paired by
// order (the counts are checked), the numbers of a creature come from the English stat block.
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Card, CardSource } from '../src/shared/cards';
import type { MausAttack, MausStats } from '../src/systems/mausritter/stats';

const RES = path.resolve(import.meta.dirname, '../resources');
const source = (lang: string) => path.resolve(import.meta.dirname, `mausritter-srd.${lang}.md`);

const SOURCES: Record<string, CardSource & { translator?: string }> = {
  en: { title: 'Mausritter SRD 2.3.1', license: 'CC-BY-4.0', attribution: 'Losing Games and Isaac Williams', url: 'https://mausritter.com' },
  ru: {
    title: 'Mausritter SRD 2.3.1',
    license: 'CC-BY-4.0',
    attribution: 'Losing Games and Isaac Williams; перевод — Scrying Glass',
    translator: 'Scrying Glass',
    url: 'https://mausritter.com',
  },
};

// The words the build looks for in each language.
interface Words {
  creatures: string;
  spells: string;
  // The spell entry's line about casting (with a link to the section on spells).
  spellNote: string;
  warband: RegExp;
  stats: RegExp;
  attacks: RegExp;
  critical: RegExp;
  wants: RegExp;
}
const WORDS: Record<string, Words> = {
  en: {
    creatures: 'List of creatures',
    spells: 'List of spells',
    spellNote: 'How spells are cast, recharged and miscast — [[Spells]].',
    warband: /^warband scale$/i,
    stats: /^\d+\s*hp\b/i,
    attacks: /^attacks?:\s*/i,
    critical: /^critical damage:\s*/i,
    wants: /^\*\*Wants\*\*\s*(.+)$/m,
  },
  ru: {
    creatures: 'Список существ',
    spells: 'Список заклинаний',
    spellNote: 'Как читают и перезаряжают заклинания и что такое осечка — [[Заклинания]].',
    warband: /^масштаб отряда$/i,
    stats: /^\d+\s*ЗЩ/,
    attacks: /^атаки?:\s*/i,
    critical: /^критический урон:\s*/i,
    // «**Хочет**, чтобы ей служили» — the comma stays with the text.
    wants: /^\*\*Хочет\*\*\s*(.+)$/m,
  },
};
// Chapters of the original that are not copied: the title page and the licence.
const SKIP = new Set(['Mausritter', 'Terms of use']);

type Value = string | string[];
interface Entry {
  title: string;
  en?: string;
  ru?: string;
  type: string;
  fields: Record<string, Value>;
  body: string;
}

// [text](url) → text (the app has no outside links in entries), «### » one level up (the entry title is the top).
const clean = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^(#{3,6}) /gm, (_, h: string) => `${h.slice(1)} `)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Splits text by a heading level: [{ title, body }]; the text before the first heading — title ''.
function split(text: string, level: number): { title: string; body: string }[] {
  const re = new RegExp(`^${'#'.repeat(level)} (.+)$`, 'gm');
  const out: { title: string; body: string }[] = [];
  let last = 0;
  let title = '';
  for (const m of text.matchAll(re)) {
    out.push({ title, body: text.slice(last, m.index) });
    title = m[1]!.trim();
    last = m.index! + m[0].length;
  }
  out.push({ title, body: text.slice(last) });
  return out.filter((x) => x.title || x.body.trim());
}

// «1. Attributes» → «Attributes».
const plain = (title: string) => title.replace(/^\d+\.\s*/, '').trim();

// ---------- Creatures ----------

// «d6 swipe, d8 bite», «d10 spear or d6 tongue» (and «к6 удар лапой… или…»); an attack without a die keeps an empty one.
function parseAttacks(text: string): MausAttack[] {
  return text
    .split(/,\s*(?![^(]*\))|\s+(?:or|или)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^([dк]\d+(?:\/[dк]\d+)?)\s*(.*)$/i);
      return m ? { dice: m[1]!.toLowerCase().replace(/к/g, 'd'), name: m[2]!.trim() } : { dice: '', name: part };
    });
}

function creature(name: string, body: string, w: Words): { name: string; stats: MausStats; description: string } {
  const block = /:::statblock\n([\s\S]*?)\n:::/.exec(body);
  if (!block) throw new Error(`«${name}»: no stat block`);
  const s: MausStats = { hp: null, str: null, dex: null, wil: null, armour: 0, attacks: [], critical: '', abilities: [], wants: '' };
  for (const raw of block[1]!.split('\n')) {
    const line = raw.replace(/\*\*/g, '').trim();
    if (!line) continue;
    if (w.warband.test(line)) s.warband = true;
    else if (w.attacks.test(line)) s.attacks = parseAttacks(line.replace(w.attacks, ''));
    else if (w.critical.test(line)) s.critical = line.replace(w.critical, '');
    else if (w.stats.test(line)) {
      s.hp = Number(/^(\d+)/.exec(line)![1]);
      for (const [a, label] of [['str', 'STR|СИЛ'], ['dex', 'DEX|ЛОВ'], ['wil', 'WIL|ВОЛ']] as const) {
        const m = new RegExp(`(?:${label})\\s+(\\d+)`).exec(line);
        if (m) s[a] = Number(m[1]);
      }
      s.armour = Number(/(?:armou?r|броня)\s+(\d+)/i.exec(line)?.[1] ?? 0);
    } else s.abilities.push(line);
  }
  if (s.hp === null || s.str === null) throw new Error(`«${name}»: no HP / STR line`);
  const rest = body.slice(block.index + block[0].length);
  s.wants = w.wants.exec(rest)?.[1]?.trim() ?? '';
  // Variants and tables («#### Cat lords») — the card's description; card text has no headings: a bold line.
  const variants = rest.indexOf('\n#### ');
  const description = variants >= 0 ? clean(rest.slice(variants)).replace(/^#+ (.+)$/gm, '**$1**') : '';
  return { name, stats: s, description };
}

// ---------- Spells ----------

function spells(body: string, w: Words): { table: string; list: Entry[] } {
  const list: Entry[] = [];
  const table = body.replace(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm, (_, roll: string, name: string, effect: string, recharge: string) => {
    list.push({ title: name, type: 'mspell', fields: { recharge }, body: `${effect}\n\n${w.spellNote}` });
    return `| ${roll} | [[${name}]] | ${effect} | ${recharge} |`;
  });
  return { table, list };
}

// ---------- A book in one language ----------

function build(lang: string) {
  const w = WORDS[lang]!;
  const text = fs.readFileSync(source(lang), 'utf8').replace(/\r\n/g, '\n').replace(/^<!--[\s\S]*?-->\s*/, '');
  const entries: Entry[] = [];
  const creatures: ReturnType<typeof creature>[] = [];
  const titles = new Set<string>();
  // The same section title in two chapters — the later one gets its chapter in brackets.
  const unique = (title: string, chapter: string) => {
    const t = titles.has(title.toLowerCase()) ? `${title} (${chapter})` : title;
    titles.add(t.toLowerCase());
    return t;
  };

  for (const chapter of split(text, 1)) {
    if (!chapter.title || SKIP.has(chapter.title)) continue;
    const category = chapter.title;
    const own: string[] = [];
    let intro = '';
    for (const sec of split(chapter.body, 2)) {
      if (!sec.title) {
        intro = sec.body;
        continue;
      }
      if (sec.title === w.creatures) {
        const names: string[] = [];
        let lead = '';
        for (const p of split(sec.body, 3)) {
          if (!p.title) lead = p.body;
          else {
            creatures.push(creature(p.title, p.body, w));
            names.push(p.title);
          }
        }
        const title = unique(sec.title, category);
        own.push(title);
        entries.push({ title, type: 'rule', fields: { category }, body: clean(`${lead}\n\n${names.map((n) => `- [[${n}]]`).join('\n')}`) });
        continue;
      }
      let body = sec.body;
      if (sec.title === w.spells) {
        const s = spells(body, w);
        body = s.table;
        for (const e of s.list) {
          titles.add(e.title.toLowerCase());
          entries.push({ ...e, body: clean(e.body) });
        }
      }
      const title = unique(plain(sec.title), category);
      own.push(title);
      entries.push({ title, type: 'rule', fields: { category }, body: clean(body) });
    }
    // The chapter's own text and its contents.
    const title = unique(category, category);
    entries.push({ title, type: 'rule', fields: { category }, body: clean(`${intro}\n\n${own.map((x) => `- [[${x}]]`).join('\n')}`) });
  }

  // [[Links]] must lead to an entry of the book or a creature card.
  const known = new Set([...titles, ...creatures.map((c) => c.name.toLowerCase())]);
  for (const e of entries) {
    for (const m of e.body.matchAll(/\[\[([^\]|#]+)/g)) {
      if (!known.has(m[1]!.trim().toLowerCase())) throw new Error(`${lang} «${e.title}»: a link to an unknown entry [[${m[1]}]]`);
    }
  }
  return { entries, creatures };
}

// ---------- Both languages ----------

const en = build('en');
const ru = build('ru');
if (en.entries.length !== ru.entries.length) throw new Error(`entries: en ${en.entries.length}, ru ${ru.entries.length}`);
if (en.creatures.length !== ru.creatures.length) throw new Error(`creatures: en ${en.creatures.length}, ru ${ru.creatures.length}`);
en.entries.forEach((e, i) => {
  const r = ru.entries[i]!;
  if (e.type !== r.type) throw new Error(`entry ${i}: «${e.title}» is ${e.type}, «${r.title}» is ${r.type}`);
  // Each entry knows its title in the other language: found by a name from a card or note of that language.
  e.ru = r.title;
  r.en = e.title;
});

const id = (name: string) => `maus-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
const card = (lang: string, c: ReturnType<typeof creature>, cid: string, stats: MausStats, origin?: string): Card<MausStats> => ({
  format: 1,
  id: cid,
  kind: 'monster',
  system: 'mausritter',
  lang,
  name: c.name,
  ...(origin ? { origin: { id: origin, relation: 'translation' as const } } : {}),
  source: SOURCES[lang]!,
  portraits: [],
  tags: [],
  ...(c.description ? { description: c.description } : {}),
  side: 'enemy',
  notes: '',
  stats,
});
const cards: Card<MausStats>[] = [];
en.creatures.forEach((c, i) => {
  const r = ru.creatures[i]!;
  const base = id(c.name);
  cards.push(card('en', c, base, c.stats));
  // The translation: numbers and dice of the original, words of the translation.
  if (r.stats.attacks.length !== c.stats.attacks.length) throw new Error(`«${r.name}»: ${r.stats.attacks.length} attacks, the original has ${c.stats.attacks.length}`);
  const stats: MausStats = {
    ...c.stats,
    attacks: c.stats.attacks.map((a, j) => ({ dice: a.dice, name: r.stats.attacks[j]!.name })),
    critical: r.stats.critical,
    abilities: r.stats.abilities,
    wants: r.stats.wants,
  };
  cards.push(card('ru', r, `${base}.ru`, stats, base));
});

for (const [lang, book] of [['en', en], ['ru', ru]] as const) {
  const out = path.join(RES, 'compendium', `mausritter.${lang}.json`);
  fs.writeFileSync(out, JSON.stringify({ system: 'mausritter', lang, source: SOURCES[lang], entries: book.entries }) + '\n');
  console.log(`${out}: ${book.entries.length} entries`);
}
const bestiary = path.join(RES, 'srd', 'mausritter.json');
fs.writeFileSync(bestiary, JSON.stringify(cards) + '\n');
console.log(`${bestiary}: ${cards.length} cards`);
