// Built-in Mausritter content from scripts/mausritter-srd.en.md (Mausritter SRD 2.3.1, CC BY 4.0):
// resources/srd/mausritter.json — creature cards, resources/compendium/mausritter.en.json — rules, spells, tables.
// Run: npm run build-mausritter. Do not edit the JSON by hand.
//
// Chapters («# …») become categories, sections («## …») — entries (their «###» are headings inside); a chapter's
// own text becomes an entry named after the chapter with links to its sections. Spells of «List of spells» are
// entries of their own (type mspell); creatures of «List of creatures» are cards. «Terms of use» is not copied:
// the attribution lives in About and the READMEs.
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Card, CardSource } from '../src/shared/cards';
import type { MausAttack, MausStats } from '../src/systems/mausritter/stats';

const SRC = path.resolve(import.meta.dirname, 'mausritter-srd.en.md');
const RES = path.resolve(import.meta.dirname, '../resources');

const SOURCE: CardSource = {
  title: 'Mausritter SRD 2.3.1',
  license: 'CC-BY-4.0',
  attribution: 'Losing Games and Isaac Williams',
  url: 'https://mausritter.com',
};
// Chapters that are not copied: the title page and the licence.
const SKIP = new Set(['Mausritter', 'Terms of use']);

type Value = string | string[];
interface Entry {
  title: string;
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

function parseAttacks(text: string): MausAttack[] {
  return text
    .split(/,\s*(?![^(]*\))|\s+or\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(d\d+(?:\/d\d+)?)\s*(.*)$/i);
      return m ? { dice: m[1]!.toLowerCase(), name: m[2]!.trim() } : { dice: '', name: part };
    });
}

function creature(name: string, body: string): Card<MausStats> {
  const block = /:::statblock\n([\s\S]*?)\n:::/.exec(body);
  if (!block) throw new Error(`«${name}»: no stat block`);
  const s: MausStats = { hp: null, str: null, dex: null, wil: null, armour: 0, attacks: [], critical: '', abilities: [], wants: '' };
  for (const raw of block[1]!.split('\n')) {
    const line = raw.replace(/\*\*/g, '').trim();
    if (!line) continue;
    if (/^warband scale$/i.test(line)) s.warband = true;
    else if (/^attacks?:/i.test(line)) s.attacks = parseAttacks(line.replace(/^attacks?:\s*/i, ''));
    else if (/^critical damage:/i.test(line)) s.critical = line.replace(/^critical damage:\s*/i, '');
    else if (/^\d+hp\b/i.test(line)) {
      s.hp = Number(/^(\d+)hp/i.exec(line)![1]);
      for (const a of ['str', 'dex', 'wil'] as const) {
        const m = new RegExp(`\\b${a}\\s+(\\d+)`, 'i').exec(line);
        if (m) s[a] = Number(m[1]);
      }
      s.armour = Number(/armou?r\s+(\d+)/i.exec(line)?.[1] ?? 0);
    } else s.abilities.push(line);
  }
  if (s.hp === null || s.str === null) throw new Error(`«${name}»: no HP / STR line`);
  const rest = body.slice(block.index + block[0].length);
  const wants = /^\*\*Wants\*\*\s*(.+)$/m.exec(rest);
  if (wants) s.wants = wants[1]!.trim();
  // Variants and tables («#### Cat lords») — the card's description.
  const variants = rest.indexOf('\n#### ');
  // Card text has no headings: «#### Cat lords» becomes a bold line.
  const description = variants >= 0 ? clean(rest.slice(variants)).replace(/^#+ (.+)$/gm, '**$1**') : '';
  const id = `maus-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return {
    format: 1,
    id,
    kind: 'monster',
    system: 'mausritter',
    lang: 'en',
    name,
    source: SOURCE,
    portraits: [],
    tags: [],
    ...(description ? { description } : {}),
    side: 'enemy',
    notes: '',
    stats: s,
  };
}

// ---------- Spells ----------

function spells(body: string): { table: string; list: Entry[] } {
  const list: Entry[] = [];
  const table = body.replace(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm, (_, roll: string, name: string, effect: string, recharge: string) => {
    list.push({ title: name, type: 'mspell', fields: { recharge }, body: `${effect}\n\nHow spells are cast, recharged and miscast — [[Spells]].` });
    return `| ${roll} | [[${name}]] | ${effect} | ${recharge} |`;
  });
  return { table, list };
}

// ---------- The book ----------

const text = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const entries: Entry[] = [];
const cards: Card<MausStats>[] = [];
const titles = new Set<string>();
// The same section title in two chapters («Overland travel») — the later one gets its chapter in brackets.
const unique = (title: string, chapter: string) => (titles.has(title.toLowerCase()) ? `${title} (${chapter})` : title);

for (const chapter of split(text, 1)) {
  if (!chapter.title || SKIP.has(chapter.title)) continue;
  const category = chapter.title;
  const sections = split(chapter.body, 2);
  const own: string[] = [];
  let intro = '';
  for (const sec of sections) {
    if (!sec.title) {
      intro = sec.body;
      continue;
    }
    if (sec.title === 'List of creatures') {
      const parts = split(sec.body, 3);
      const names: string[] = [];
      let lead = '';
      for (const p of parts) {
        if (!p.title) lead = p.body;
        else {
          cards.push(creature(p.title, p.body));
          names.push(p.title);
        }
      }
      const title = unique('List of creatures', category);
      titles.add(title.toLowerCase());
      own.push(title);
      entries.push({ title, type: 'rule', fields: { category }, body: clean(`${lead}\n\n${names.map((n) => `- [[${n}]]`).join('\n')}`) });
      continue;
    }
    let body = sec.body;
    if (sec.title === 'List of spells') {
      const s = spells(body);
      body = s.table;
      for (const e of s.list) {
        titles.add(e.title.toLowerCase());
        entries.push({ ...e, fields: { ...e.fields }, body: clean(e.body) });
      }
    }
    const title = unique(plain(sec.title), category);
    titles.add(title.toLowerCase());
    own.push(title);
    entries.push({ title, type: 'rule', fields: { category }, body: clean(body) });
  }
  // The chapter's own text and its contents.
  const title = unique(category, category);
  titles.add(title.toLowerCase());
  const contents = own.map((x) => `- [[${x}]]`).join('\n');
  entries.push({ title, type: 'rule', fields: { category }, body: clean(`${intro}\n\n${contents}`) });
}

// [[Links]] must lead to an entry of the book or a creature card.
const known = new Set([...titles, ...cards.map((c) => c.name.toLowerCase())]);
for (const e of entries) {
  for (const m of e.body.matchAll(/\[\[([^\]|#]+)/g)) {
    if (!known.has(m[1]!.trim().toLowerCase())) throw new Error(`«${e.title}»: a link to an unknown entry [[${m[1]}]]`);
  }
}

const book = path.join(RES, 'compendium', 'mausritter.en.json');
fs.writeFileSync(book, JSON.stringify({ system: 'mausritter', lang: 'en', source: SOURCE, entries }) + '\n');
console.log(`${book}: ${entries.length} entries`);
const bestiary = path.join(RES, 'srd', 'mausritter.json');
fs.writeFileSync(bestiary, JSON.stringify(cards) + '\n');
console.log(`${bestiary}: ${cards.length} creatures`);
