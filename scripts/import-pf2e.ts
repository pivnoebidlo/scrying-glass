// Pathfinder 2e data of the system: content/pf2e-core/ from the data of the pf2e system for Foundry VTT
// (github.com/foundryvtt/pf2e; code Apache 2.0, each entry names its license — only ORC ones are taken).
// What: the creatures of Monster Core (stat blocks only — the lore of Golarion is not open), conditions, spells,
// actions, equipment, feats, ancestries, heritages, backgrounds and classes of Player Core, Player Core 2 and GM Core,
// the monster abilities glossary. More books later (see the README there).
// The Russian translation — of the Foundry module «Русский перевод Pathfinder 2e и Starfinder 2e» by Доктор#0353
// (gitlab.com/gnuraco/pf2r; OGL 1.0a and Paizo's Community Use Policy), used with the author's permission: its files
// by compendium (Babele), entries by the English name, creatures' abilities by item id; the same text conversion.
// Run: npm run import-pf2e (needs git and the internet; the data is cached in node_modules/.cache/pf2e and pf2r).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Feature, Pf2eStats, Spellcasting, Strike } from '../src/systems/pf2e/stats.ts';

const REPO = 'https://github.com/foundryvtt/pf2e.git';
const BRANCH = 'v14-dev';
const CACHE = path.resolve(import.meta.dirname, '../node_modules/.cache/pf2e');
const OUT = path.resolve(import.meta.dirname, '../content/pf2e-core');
const PACKS = ['pathfinder-monster-core', 'conditions', 'spells', 'actions', 'bestiary-ability-glossary-srd', 'equipment', 'feats', 'ancestries', 'heritages', 'backgrounds', 'classes'];
const BOOKS = new Set(['Pathfinder Player Core', 'Pathfinder Player Core 2', 'Pathfinder Monster Core', 'Pathfinder GM Core']);
const RU = 'https://gitlab.com/gnuraco/pf2r/-/raw/master/data/community/pf2e/packs';
const RU_CACHE = path.resolve(import.meta.dirname, '../node_modules/.cache/pf2r');
// Our pack → the file of the translation.
const RU_FILES: Record<string, string> = {
  'pathfinder-monster-core': 'pathfinder-monster-core', conditions: 'conditionitems', spells: 'spells-srd', actions: 'actionspf2e',
  'bestiary-ability-glossary-srd': 'bestiary-ability-glossary-srd', equipment: 'equipment-srd', feats: 'feats-srd', ancestries: 'ancestries',
  heritages: 'heritages', backgrounds: 'backgrounds', classes: 'classes',
};
const TRANSLATOR = 'Доктор#0353';
const TRANSLATION_URL = 'https://gitlab.com/gnuraco/pf2r';

// ---------- The data ----------
function fetchData() {
  if (!fs.existsSync(path.join(CACHE, '.git'))) {
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', '--branch', BRANCH, REPO, CACHE], { stdio: 'inherit' });
  } else {
    execFileSync('git', ['-C', CACHE, 'pull', '--depth', '1'], { stdio: 'inherit' });
  }
  execFileSync('git', ['-C', CACHE, 'sparse-checkout', 'set', ...PACKS.map((p) => `packs/pf2e/${p}`), 'static/lang'], { stdio: 'inherit' });
  return execFileSync('git', ['-C', CACHE, 'rev-parse', 'HEAD']).toString().trim();
}

// The translation of each pack (fresh from GitLab, else the cached copy).
type Ru = { name?: string; description?: string; items?: { id: string; name?: string; description?: string }[]; [k: string]: unknown };
function fetchRu(): Record<string, Record<string, Ru>> {
  fs.mkdirSync(RU_CACHE, { recursive: true });
  return Object.fromEntries(
    Object.entries(RU_FILES).map(([ours, file]) => {
      const to = path.join(RU_CACHE, `${file}.json`);
      try {
        execFileSync('curl', ['-sSfL', '-o', to, `${RU}/pf2e.${file}.json`]);
      } catch {
        if (!fs.existsSync(to)) throw new Error(`no translation of ${file}`);
      }
      return [ours, JSON.parse(fs.readFileSync(to, 'utf8')).entries as Record<string, Ru>];
    }),
  );
}

type Doc = { _id: string; name: string; type: string; system: any; items?: Doc[] };
function pack(name: string): Doc[] {
  const out: Doc[] = [];
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walk(path.join(dir, f.name));
      else if (f.name.endsWith('.json') && !f.name.startsWith('_')) {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f.name), 'utf8'));
        if (j && typeof j === 'object' && j.system) out.push(j);
      }
    }
  };
  walk(path.join(CACHE, 'packs/pf2e', name));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
const pub = (d: Doc) => d.system.publication ?? d.system.details?.publication ?? {};
const open = (d: Doc) => pub(d).license === 'ORC' && BOOKS.has(pub(d).title);

// ---------- Text: Foundry's HTML and enrichers → our Markdown ----------
let lang: any = {};
const names = new Map<string, string>(); // _id → name, for links without a label
// Names of the entries the book has: a link to them is a [[link]], to anything else — plain text.
const linked = new Set<string>();
// The same names by their lower case («off guard» → «Off-Guard»), for @Condition[off-guard].
const linkedLower = new Map<string, string>();

const localize = (key: string) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), lang) as string | undefined;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const GLYPHS: Record<string, string> = { 'action 1': '◆', 'action 2': '◆◆', 'action 3': '◆◆◆', '1': '◆', '2': '◆◆', '3': '◆◆◆', a: '◆', d: '◆◆', t: '◆◆◆', reaction: '⟲', r: '⟲', free: '◇', f: '◇' };
const SAVES: Record<string, string> = { fortitude: 'Fortitude', reflex: 'Reflex', will: 'Will', perception: 'Perception', flat: 'flat' };

// «6d12[electricity]», «(2d6+4)[fire],(1d6)[persistent,fire]» → «{6d12} electricity», «{2d6+4} fire plus {1d6} persistent fire».
function damage(spec: string): string {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of spec) {
    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  return parts
    .map((p) => {
      const m = /^\(?([^[\]]+?)\)?\[([^\]]*)\]$/.exec(p.trim());
      if (!m) return p.trim();
      const formula = m[1]!.replace(/\s+/g, '');
      const kinds = m[2]!.split(',').filter((k) => k && k !== 'precision').join(' ');
      const dice = /^\d*d\d+([+-]\d+)?$|^\d+$/.test(formula) ? `{${formula}}` : formula;
      return [dice, kinds].filter(Boolean).join(' ');
    })
    .join(' plus ');
}

function enrich(s: string): string {
  return (
    s
      .replace(/@Localize\[([^\]]+)\]/g, (_a, key: string) => html(localize(key) ?? ''))
      .replace(/@UUID\[([^\]]+)\](?:\{([^}]*)\})?/g, (_a, ref: string, label?: string) => {
        const id = ref.split('.').pop()!;
        const name = names.get(id) ?? (/^[A-Z][A-Za-z' -]+$/.test(id) ? id : '');
        const text = label ?? name;
        if (!text) return '';
        return name && linked.has(name) ? (text === name ? `[[${name}]]` : `[[${name}|${text}]]`) : text;
      })
      .replace(/@Damage\[((?:[^[\]]|\[[^\]]*\])+)\](?:\{([^}]*)\})?/g, (_a, spec: string, label?: string) => label ?? damage(spec.split('|')[0]!))
      .replace(/@Check\[([^\]]+)\](?:\{([^}]*)\})?/g, (_a, spec: string, label?: string) => {
        if (label) return label;
        const [kind, ...opts] = spec.split('|');
        const o = Object.fromEntries(opts.map((x) => x.split(':') as [string, string]));
        const what = SAVES[kind!] ?? cap(kind!.replace(/-/g, ' '));
        const dc = o['dc'] && /^\d+$/.test(o['dc']) ? `DC ${o['dc']} ` : '';
        return `${dc}${opts.includes('basic') ? 'basic ' : ''}${what}`;
      })
      .replace(/@Template\[([^\]]+)\](?:\{([^}]*)\})?/g, (_a, spec: string, label?: string) => {
        if (label) return label;
        const [kind, ...opts] = spec.split('|');
        const dist = opts.find((x) => x.startsWith('distance:'))?.slice(9);
        return dist ? `${dist}-foot ${kind}` : kind!;
      })
      .replace(/\[\[\/(?:r|gmr|br|pr)\s+([^\]#]+?)(?:\s*#[^\]]*)?\]\](?:\{([^}]*)\})?/g, (_a, formula: string, label?: string) =>
        label ? label.replace(/(\d+d\d+(?:[+-]\d+)?)/g, '{$1}') : `{${formula.trim()}}`,
      )
      .replace(/\[\[\/act\s+([\w-]+)[^\]]*\]\](?:\{([^}]*)\})?/g, (_a, act: string, label?: string) => label ?? act.split('-').map(cap).join(' '))
      // The translation's own enrichers: a condition — a link to it, a trait — its word.
      .replace(/@(Condition|Trait)\[([^\]]+)\](?:\{([^}]*)\})?/g, (_a, kind: string, ref: string, label?: string) => {
        const name = kind === 'Condition' ? linkedLower.get(ref.toLowerCase().replace(/-/g, ' ')) : undefined;
        const text = label ?? (name ?? ref);
        return name ? (text === name ? `[[${name}]]` : `[[${name}|${text}]]`) : text;
      })
      // Glyphs of actions — as in our stat block; a unit and a counteract check — their label (else the value).
      .replace(/@Glyph\[([^\]]+)\]/g, (_a, g: string) => GLYPHS[g.trim().toLowerCase()] ?? '')
      .replace(/@(Unit|Counteract)\[([^\]]+)\](?:\{([^}]*)\})?/g, (_a, _k: string, ref: string, label?: string) => label ?? ref.split('|').pop()!)
      .replace(/@Embed\[[^\]]*\]/g, '')
  );
}

const entities = (s: string) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');

function table(t: string): string {
  // A cell can't hold «|»: a link with a label becomes the link and the rest («[[Enfeebled]] 1»).
  const cell = (c: string) =>
    inline(c)
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_a, name: string, label: string) => (label.startsWith(name) ? `[[${name}]]${label.slice(name.length)}` : label))
      .replace(/\|/g, '/');
  const rows = [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => cell(c[1]!)));
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const line = (r: string[]) => `| ${[...r, ...Array(width - r.length).fill('')].join(' | ')} |`;
  return [line(rows[0]!), `|${' --- |'.repeat(width)}`, ...rows.slice(1).map(line)].join('\n');
}

const inline = (s: string) =>
  entities(
    s
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, '*$2*')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();

function html(s: string): string {
  let t = enrich(s);
  t = t.replace(/<table[\s\S]*?<\/table>/g, (x) => `\n\n${table(x)}\n\n`);
  t = t.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g, (_a, x: string) => `\n\n### ${inline(x)}\n\n`);
  t = t.replace(/<hr\s*\/?>/g, '\n\n---\n\n');
  t = t.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (_a, x: string) => '\n\n' + [...x.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((li, i) => `${i + 1}. ${inline(li[1]!)}`).join('\n') + '\n\n');
  t = t.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (_a, x: string) => '\n\n' + [...x.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((li) => `- ${inline(li[1]!)}`).join('\n') + '\n\n');
  t = t.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (_a, x: string) => `\n\n${inline(x)}\n\n`);
  return t
    .split('\n')
    .map((l) => (/^(\||- |\d+\. |### |---)/.test(l) ? l : inline(l)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Creatures ----------
const SIZE: Record<string, Pf2eStats['size']> = { tiny: 'tiny', sm: 'sm', med: 'med', lg: 'lg', huge: 'huge', grg: 'grg' };
const actionsOf = (i: Doc): Feature['actions'] => {
  const type = i.system.actionType?.value;
  if (type === 'reaction') return 'reaction';
  if (type === 'free') return 'free';
  if (type === 'action') return (i.system.actions?.value ?? 1) as 1 | 2 | 3;
  return null;
};
const words = (s: string) => s.replace(/-/g, ' ');
const sense = (x: { type: string; acuity?: string; range?: number }) =>
  [words(x.type), x.acuity && x.acuity !== 'precise' ? `(${x.acuity})` : '', x.range ? `${x.range} feet` : ''].filter(Boolean).join(' ');

function creature(d: Doc) {
  const s = d.system;
  const items = d.items ?? [];
  const strikes: Strike[] = items
    .filter((i) => i.type === 'melee')
    .map((i) => ({
      name: i.name,
      ranged: (i.system.traits?.value ?? []).some((t: string) => /^range/.test(t)) || !!i.system.range,
      bonus: i.system.bonus?.value ?? 0,
      traits: (i.system.traits?.value ?? []).map(words),
      damage: Object.values(i.system.damageRolls ?? {})
        .map((r: any) => `{${String(r.damage).replace(/\s+/g, '')}} ${[r.category === 'persistent' ? 'persistent' : '', r.damageType].filter(Boolean).join(' ')}`)
        .join(' plus '),
      effects: (i.system.attackEffects?.value ?? []).map((e: string) => {
        const a = items.find((x) => x.system.slug === e);
        return a?.name ?? e.split('-').map(cap).join(' ');
      }),
    }));
  const feature = (i: Doc): Feature => ({ name: i.name, actions: actionsOf(i), traits: (i.system.traits?.value ?? []).map(words), text: html(i.system.description?.value ?? '') });
  const by = (cat: string) => items.filter((i) => i.type === 'action' && i.system.category === cat).map(feature);
  const spellcasting: Spellcasting[] = items
    .filter((i) => i.type === 'spellcastingEntry')
    .map((e) => {
      const spells = items.filter((i) => i.type === 'spell' && i.system.location?.value === e._id);
      const rankOf = (sp: Doc) => (sp.system.traits?.value?.includes('cantrip') ? 0 : (sp.system.location?.heightenedLevel ?? sp.system.level?.value ?? 1));
      const ranks = [...new Set(spells.map(rankOf))].sort((a, b) => b - a);
      return {
        name: e.name,
        dc: e.system.spelldc?.dc ?? 0,
        attack: e.system.spelldc?.value ? e.system.spelldc.value : null,
        ranks: ranks.map((r) => ({
          rank: r,
          ...(e.system.slots?.[`slot${r}`]?.max && e.system.prepared?.value !== 'innate' ? { slots: e.system.slots[`slot${r}`].max } : {}),
          spells: spells.filter((sp) => rankOf(sp) === r).map((sp) => sp.name),
        })),
      };
    });
  const stats: Pf2eStats = {
    level: s.details.level.value,
    rarity: s.traits.rarity ?? 'common',
    size: SIZE[s.traits.size?.value] ?? 'med',
    traits: (s.traits.value ?? []).map(words),
    perception: s.perception.mod,
    senses: (s.perception.senses ?? []).map(sense).concat(s.perception.details ? [inline(s.perception.details)] : []),
    languages: [...(s.details.languages?.value ?? []).map(cap), ...(s.details.languages?.details ? [inline(s.details.languages.details)] : [])],
    skills: Object.entries(s.skills ?? {}).map(([k, v]: [string, any]) => ({ name: cap(k.replace(/-/g, ' ')), mod: v.base })).concat(
      items.filter((i) => i.type === 'lore').map((i) => ({ name: i.name, mod: i.system.mod?.value ?? 0 })),
    ),
    abilities: Object.fromEntries(Object.entries(s.abilities).map(([k, v]: [string, any]) => [k, v.mod])) as Pf2eStats['abilities'],
    items: items.filter((i) => ['weapon', 'armor', 'equipment', 'consumable', 'shield', 'backpack', 'treasure'].includes(i.type)).map((i) => i.name),
    ac: s.attributes.ac.value,
    saves: { fort: s.saves.fortitude.value, ref: s.saves.reflex.value, will: s.saves.will.value, ...(s.attributes.allSaves?.value ? { note: inline(s.attributes.allSaves.value) } : {}) },
    hp: s.attributes.hp.max,
    ...(s.attributes.hp.details ? { hpNote: inline(s.attributes.hp.details) } : {}),
    immunities: (s.attributes.immunities ?? []).map((x: any) => words(x.type)),
    weaknesses: (s.attributes.weaknesses ?? []).map((x: any) => `${words(x.type)} ${x.value}`),
    resistances: (s.attributes.resistances ?? []).map((x: any) => `${words(x.type)} ${x.value}${x.exceptions?.length ? ` (except ${x.exceptions.map(words).join(', ')})` : ''}`),
    speeds: [`${s.attributes.speed.value} feet`, ...(s.attributes.speed.otherSpeeds ?? []).map((x: any) => `${words(x.type)} ${x.value} feet`)],
    strikes,
    interaction: by('interaction'),
    defensive: by('defensive'),
    offensive: by('offensive'),
    spellcasting,
  };
  return {
    format: 1, id: `pf2e-${d.system.slug ?? d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, kind: 'monster', system: 'pf2e', lang: 'en', name: d.name,
    side: 'enemy', portraits: [], tags: [], notes: '', stats,
    source: { title: pub(d).title, attribution: 'Paizo Inc., ORC License' },
  };
}

// ---------- Compendium entries ----------
const field = (v: unknown) => (typeof v === 'string' ? v.trim() : v);
function spell(d: Doc) {
  const s = d.system;
  const cantrip = (s.traits.value ?? []).includes('cantrip');
  const area = s.area ? `${s.area.value}-foot ${s.area.type}` : '';
  const defense = s.defense?.save ? `${s.defense.save.basic ? 'basic ' : ''}${SAVES[s.defense.save.statistic] ?? s.defense.save.statistic}` : s.defense?.passive ? `${s.defense.passive.statistic}` : '';
  const fields: Record<string, unknown> = {
    rank: cantrip ? 0 : s.level.value,
    traditions: s.traits.traditions ?? [],
    traits: (s.traits.value ?? []).map(words),
    cast: s.time.value,
    range: s.range?.value,
    area,
    targets: s.target?.value,
    defense,
    duration: [s.duration?.sustained ? 'sustained' : '', s.duration?.value].filter(Boolean).join(', '),
  };
  if (s.traits.rarity && s.traits.rarity !== 'common') fields['rarity'] = s.traits.rarity;
  return entry(d, 'pf2e-spell', fields);
}
const ABILITY: Record<string, string> = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' };
const price = (p: Record<string, number> | undefined) =>
  (['pp', 'gp', 'sp', 'cp'] as const).filter((k) => p?.[k]).map((k) => `${p![k]} ${k}`).join(', ');
const bulk = (b: number | undefined) => (b === undefined ? '' : b === 0 ? '—' : b < 1 ? 'L' : String(b));
const traitsOf = (d: Doc) => (d.system.traits?.value ?? []).map(words);
function item(d: Doc) {
  const s = d.system;
  const dmg = s.damage?.die ? `${s.damage.dice ?? 1}${s.damage.die} ${s.damage.damageType ?? ''}`.trim() : s.damage?.formula ? `${s.damage.formula} ${s.damage.kind === 'healing' ? 'healing' : (s.damage.type ?? '')}`.trim() : '';
  return entry(d, 'pf2e-item', {
    level: s.level?.value ?? 0,
    kind: words(d.type === 'equipment' ? (s.usage?.value ? 'gear' : 'equipment') : d.type),
    category: words(s.category ?? ''),
    price: price(s.price?.value),
    bulk: bulk(s.bulk?.value),
    traits: traitsOf(d),
    damage: dmg,
    range: s.range ? `${s.range} feet` : '',
    ac: s.acBonus ? `+${s.acBonus}${s.dexCap !== undefined && s.dexCap !== null ? `, Dex cap +${s.dexCap}` : ''}${s.strength ? `, Str ${s.strength}` : ''}` : '',
    ...(s.traits?.rarity && s.traits.rarity !== 'common' ? { rarity: s.traits.rarity } : {}),
  });
}
function feat(d: Doc) {
  const s = d.system;
  return entry(d, 'pf2e-feat', {
    level: s.level?.value ?? 1,
    category: words(s.category ?? ''),
    actions: actionsOf(d) === null ? '' : String(actionsOf(d)),
    traits: traitsOf(d),
    prerequisites: (s.prerequisites?.value ?? []).map((p: { value: string }) => p.value).join('; '),
    ...(s.traits?.rarity && s.traits.rarity !== 'common' ? { rarity: s.traits.rarity } : {}),
  });
}
const boosts = (b: Record<string, { value: string[] }> | undefined) =>
  Object.values(b ?? {}).map((x) => (x.value.length >= 6 ? 'free' : x.value.map((v) => ABILITY[v] ?? v).join(' or '))).join(', ');

function entry(d: Doc, type: string, fields: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, field(v)]).filter(([, v]) => v !== '' && v !== undefined && v !== null && !(Array.isArray(v) && !v.length)));
  return { title: d.name, type, fields: clean, body: html(d.system.description?.value ?? '') };
}

// ---------- Build ----------
const commit = fetchData();
lang = JSON.parse(fs.readFileSync(path.join(CACHE, 'static/lang/en.json'), 'utf8'));
const data = Object.fromEntries(PACKS.map((p) => [p, pack(p)]));
for (const list of Object.values(data)) for (const d of list) names.set(d._id, d.name);

const conditions = data['conditions']!.filter(open);
const spells = data['spells']!.filter(open);
const actions = data['actions']!.filter(open);
const abilities = data['bestiary-ability-glossary-srd']!.filter(open);
const monsters = data['pathfinder-monster-core']!.filter(open);
const items = data['equipment']!.filter(open);
const feats = data['feats']!.filter(open);
const ancestries = data['ancestries']!.filter(open);
const heritages = data['heritages']!.filter(open);
const backgrounds = data['backgrounds']!.filter(open);
const classes = data['classes']!.filter(open);
for (const d of [...conditions, ...spells, ...actions, ...abilities, ...items, ...feats, ...ancestries, ...heritages, ...backgrounds, ...classes]) linked.add(d.name);
for (const n of linked) linkedLower.set(n.toLowerCase().replace(/-/g, ' '), n);

// The entries of the book, each with the doc it came from (for its translation).
const entryOf: [Doc, string, (d: Doc) => ReturnType<typeof entry>][] = [
  ...conditions.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'conditions', (x) => entry(x, 'pf2e-condition', x.system.value?.isValued ? { valued: true } : {})]),
  ...actions.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'actions', (x) => entry(x, 'pf2e-action', { actions: actionsOf(x) === null ? '' : String(actionsOf(x)), traits: (x.system.traits?.value ?? []).map(words) })]),
  ...abilities.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'bestiary-ability-glossary-srd', (x) => entry(x, 'pf2e-ability', { actions: actionsOf(x) === null ? '' : String(actionsOf(x)), traits: (x.system.traits?.value ?? []).map(words) })]),
  ...spells.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'spells', spell]),
  ...classes.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'classes', (x) => entry(x, 'pf2e-class', { hp: x.system.hp, key: (x.system.keyAbility?.value ?? []).map((v: string) => ABILITY[v] ?? v).join(' or ') })]),
  ...ancestries.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'ancestries', (x) => entry(x, 'pf2e-ancestry', { hp: x.system.hp, size: x.system.size, speed: x.system.speed ? `${x.system.speed} feet` : '', boosts: boosts(x.system.boosts), traits: traitsOf(x) })]),
  ...heritages.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'heritages', (x) => entry(x, 'pf2e-heritage', { ancestry: x.system.ancestry?.name ?? 'versatile' })]),
  ...backgrounds.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'backgrounds', (x) => entry(x, 'pf2e-background', { boosts: boosts(x.system.boosts), skills: [...(x.system.trainedSkills?.value ?? []).map(cap), ...(x.system.trainedSkills?.lore ?? [])] })]),
  ...feats.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'feats', feat]),
  ...items.map((d): [Doc, string, (x: Doc) => ReturnType<typeof entry>] => [d, 'equipment', item]),
];
const entries = [
  ...conditions.map((d) => entry(d, 'pf2e-condition', d.system.value?.isValued ? { valued: true } : {})),
  ...actions.map((d) => entry(d, 'pf2e-action', { actions: actionsOf(d) === null ? '' : String(actionsOf(d)), traits: (d.system.traits?.value ?? []).map(words) })),
  ...abilities.map((d) => entry(d, 'pf2e-ability', { actions: actionsOf(d) === null ? '' : String(actionsOf(d)), traits: (d.system.traits?.value ?? []).map(words) })),
  ...spells.map(spell),
  ...classes.map((d) => entry(d, 'pf2e-class', { hp: d.system.hp, key: (d.system.keyAbility?.value ?? []).map((v: string) => ABILITY[v] ?? v).join(' or ') })),
  ...ancestries.map((d) => entry(d, 'pf2e-ancestry', { hp: d.system.hp, size: d.system.size, speed: d.system.speed ? `${d.system.speed} feet` : '', boosts: boosts(d.system.boosts), traits: traitsOf(d) })),
  ...heritages.map((d) => entry(d, 'pf2e-heritage', { ancestry: d.system.ancestry?.name ?? 'versatile' })),
  ...backgrounds.map((d) => entry(d, 'pf2e-background', { boosts: boosts(d.system.boosts), skills: [...(d.system.trainedSkills?.value ?? []).map(cap), ...(d.system.trainedSkills?.lore ?? [])] })),
  ...feats.map(feat),
  ...items.map(item),
];
// One title — one entry (an action and a monster ability of the same name: the action stays).
const seen = new Set<string>();
const unique = entries.filter((e) => (seen.has(e.title) ? false : (seen.add(e.title), true)));

const cards = monsters.map(creature);

// ---------- The Russian translation ----------
const ru = fetchRu();
// A doc in Russian: its name and text, the fields the translation has (spells: range, targets, duration…), and for a
// creature — its abilities, strikes and gear by item id, its spells by name.
function translated(d: Doc, t: Ru, items?: Map<string, Ru>): Doc {
  const x: Doc = structuredClone(d);
  if (t.name) x.name = t.name;
  if (t.description) x.system.description = { ...(x.system.description ?? {}), value: t.description };
  for (const [k, at] of [['range', 'range'], ['target', 'target'], ['duration', 'duration'], ['cost', 'cost'], ['requirements', 'requirements']] as const) {
    const v = t[k];
    if (typeof v === 'string' && v.trim() && x.system[at] && typeof x.system[at] === 'object') x.system[at] = { ...x.system[at], value: v };
  }
  if (x.items) {
    const spellsRu = ru['spells']!;
    const gearRu = ru['equipment']!;
    const GEAR = ['weapon', 'armor', 'equipment', 'consumable', 'shield', 'backpack', 'treasure'];
    x.items = x.items.map((i) => {
      const it = items?.get(i._id) ?? (i.type === 'spell' ? spellsRu[i.name] : GEAR.includes(i.type) ? gearRu[i.name] : undefined);
      if (!it) return i;
      const y = structuredClone(i);
      if (it.name) y.name = it.name;
      if (it.description) y.system.description = { ...(y.system.description ?? {}), value: it.description };
      return y;
    });
  }
  return x;
}
const ruEntries = entryOf
  .filter(([d], i, all) => all.findIndex(([x]) => x.name === d.name) === i && ru[all[i]![1]]?.[d.name]?.name)
  .map(([d, packName, make]) => ({ ...make(translated(d, ru[packName]![d.name]!)), en: d.name }))
  .filter((e) => seen.has(e.en));
const ruAttribution = `Paizo Inc., ORC License; перевод — ${TRANSLATOR} (${TRANSLATION_URL})`;
const ruCards = monsters.flatMap((d, i) => {
  const t = ru['pathfinder-monster-core']![d.name];
  if (!t?.name) return [];
  const card = creature(translated(d, t, new Map((t.items ?? []).map((x) => [x.id, x]))));
  const en = cards[i]!;
  return [{ ...card, id: `${en.id}.ru`, lang: 'ru', origin: { id: en.id, relation: 'translation' as const }, source: { ...en.source, attribution: ruAttribution, translator: TRANSLATOR, url: TRANSLATION_URL } }];
});
fs.mkdirSync(path.join(OUT, 'bestiary'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'compendium'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'bestiary/pf2e.json'), JSON.stringify([...cards, ...ruCards]));
fs.writeFileSync(
  path.join(OUT, 'compendium/pf2e.ru.json'),
  JSON.stringify({
    system: 'pf2e',
    lang: 'ru',
    source: { title: 'Pathfinder Player Core, Monster Core, GM Core', attribution: `Paizo Inc.; перевод — ${TRANSLATOR}`, url: TRANSLATION_URL, license: 'ORC', translator: TRANSLATOR },
    entries: ruEntries,
  }),
);
fs.writeFileSync(
  path.join(OUT, 'compendium/pf2e.en.json'),
  JSON.stringify({
    system: 'pf2e',
    lang: 'en',
    source: { title: 'Pathfinder Player Core, Monster Core, GM Core', attribution: 'Paizo Inc.', url: 'https://paizo.com/orclicense', license: 'ORC' },
    entries: unique,
  }),
);
const manifestFile = path.join(OUT, 'content.json');
const old = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { release: 0 };
fs.writeFileSync(
  manifestFile,
  JSON.stringify(
    {
      scryingGlass: 'content', version: 1, id: 'pf2e-core', title: 'Pathfinder 2e: Monster Core, Player Core and GM Core', family: 'pf2e', release: old.release || 1,
      cards: cards.length + ruCards.length, books: 2,
      license: `This product is licensed under the ORC License held in the Library of Congress at TX 9-307-067 and available online at various locations including paizo.com/orclicense, azoralaw.com/orclicense, and others. All warranties are disclaimed as set forth therein. Attribution: This product is based on the following Licensed Material: Pathfinder Player Core © 2023 Paizo Inc.; Pathfinder Player Core 2 © 2024 Paizo Inc.; Pathfinder Monster Core © 2024 Paizo Inc.; Pathfinder GM Core © 2023 Paizo Inc. Data from the pf2e system for Foundry VTT (github.com/foundryvtt/pf2e, ${commit.slice(0, 7)}). Scrying Glass uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/licenses/communityuse). We are expressly prohibited from charging you to use or access this content. Scrying Glass is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit paizo.com. Russian translation: «Русский перевод Pathfinder 2e и Starfinder 2e» for Foundry VTT by ${TRANSLATOR} (${TRANSLATION_URL}), used with the author's permission; that module is distributed under the Open Game License 1.0a and Paizo's Community Use Policy.`,
    },
    null,
    1,
  ) + '\n',
);
console.log(`Russian: creatures ${ruCards.length}, entries ${ruEntries.length}`);
console.log(`creatures ${cards.length}, entries ${unique.length} (conditions ${conditions.length}, actions ${actions.length}, monster abilities ${abilities.length}, spells ${spells.length}, classes ${classes.length}, ancestries ${ancestries.length}, heritages ${heritages.length}, backgrounds ${backgrounds.length}, feats ${feats.length}, items ${items.length}); pf2e ${commit.slice(0, 7)}`);
