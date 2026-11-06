// D&D cards and the fields of the D&D packs. A pack reads a flat object by field keys; the rest of the plugin (LSS,
// Reshape, the paper sheet) and older apps read the old shape, so a card holds both: `dndFields` adds the fields beside
// what is there, `dndSync` writes what was edited in the fields back into the old shape. Only pure functions.
import { parseBonus } from '../../shared/dice';
import { spellBlock } from './spells';
import { ABILITIES, crText, dict, type Ability, type Block, type Dnd5eStats, type Size, type SpeedKind } from './stats';
import { CHARACTER_TEXTS, isCharacter, totalLevel, type CharacterText, type Dnd5eCharacter } from './character';

type Row = Record<string, any>;
export type Fields = Record<string, any>;

const SPEEDS: SpeedKind[] = ['walk', 'burrow', 'climb', 'fly', 'swim'];
const SENSES = ['blindsight', 'darkvision', 'tremorsense', 'truesight'] as const;
const DETAILS = ['age', 'height', 'weight', 'eyes', 'skin', 'hair'] as const;
export const skillField = (key: string) => key.replace(/-/g, '_');
const CHAR_SKILLS = Object.keys(dict('en').skills);

// Key → word of the card's language and back; what isn't known stays as written.
const word = (table: Record<string, string>, key: string) => table[key] ?? key;
const keyOf = (table: Record<string, string>, w: string) => Object.entries(table).find(([, v]) => v.toLowerCase() === w.trim().toLowerCase())?.[0] ?? w.trim();

function speedText(s: Dnd5eStats, lang: string) {
  const lb = dict(lang);
  return SPEEDS.flatMap((k) => {
    const v = s.speed[k];
    if (v === undefined) return [];
    const label = lb.speed[k];
    return [`${label ? `${label} ` : ''}${v} ${lb.feet}${k === 'fly' && s.speed.hover ? ` (${lb.hover})` : ''}`];
  }).join(', ');
}
function sensesText(s: Dnd5eStats, lang: string) {
  const lb = dict(lang);
  const parts = SENSES.filter((k) => s.senses[k] !== undefined).map((k) => `${lb.senses[k]} ${s.senses[k]} ${lb.feet}`);
  return [parts.join(', '), `${lb.passive} ${s.senses.passivePerception}`].filter(Boolean).join('; ');
}
function parseSpeed(text: string, lang: string): Dnd5eStats['speed'] | null {
  const lb = dict(lang);
  const out: Dnd5eStats['speed'] = {};
  for (const part of text.split(',')) {
    const m = /^\s*(.*?)\s*(\d+)/.exec(part);
    if (!m) return null;
    const k = SPEEDS.find((x) => (lb.speed[x] ?? '').toLowerCase() === m[1]!.toLowerCase());
    if (!k) return null;
    out[k] = Number(m[2]);
    if (k === 'fly' && part.includes(`(${lb.hover})`)) out.hover = true;
  }
  return out;
}
function parseSenses(text: string, lang: string): Dnd5eStats['senses'] | null {
  const lb = dict(lang);
  const passive = new RegExp(`${lb.passive}\\s+(\\d+)`).exec(text);
  if (!passive) return null;
  const out: Dnd5eStats['senses'] = { passivePerception: Number(passive[1]) };
  for (const k of SENSES) {
    const m = new RegExp(`${lb.senses[k]}\\s+(\\d+)`).exec(text);
    if (m) out[k] = Number(m[1]);
  }
  return out;
}

const blockRow = (b: Block): Row => ({ ...b, ...(b.attack ? { atk: b.attack.bonus, dmg1: b.attack.damage[0] ?? '', dmg2: b.attack.damage[1] ?? '', dmg3: b.attack.damage[2] ?? '' } : {}) });
function rowBlock(r: Row): Block {
  const damage = [r['dmg1'], r['dmg2'], r['dmg3']].filter((d) => typeof d === 'string' && d.trim());
  const atk = r['atk'];
  return {
    name: String(r['name'] ?? ''),
    text: String(r['text'] ?? ''),
    ...(r['uses'] ? { uses: String(r['uses']) } : {}),
    ...(typeof atk === 'number' ? { attack: { bonus: atk, damage } } : {}),
  };
}
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

function monsterFields(s: Dnd5eStats, lang: string, system: string): Fields {
  const lb = dict(lang);
  const spell = s.spellcasting ? spellBlock(s, s.spellcasting, lang, system) : null;
  const blocks = (list: Block[], where: 'traits' | 'actions') => [...list.map(blockRow), ...(spell && s.spellcasting?.where === where ? [{ ...blockRow(spell), spell: true }] : [])];
  return {
    ...s,
    cr_text: crText(s.cr),
    size_text: s.size.map((x) => lb.sizes[x] ?? x).join(` ${lb.or} `),
    ac_note: s.acNote ?? '',
    hp_formula: s.hpFormula ?? '',
    speed_text: speedText(s, lang),
    ...Object.fromEntries(ABILITIES.map((a) => [a, s.abilities[a]])),
    ...Object.fromEntries(ABILITIES.filter((a) => s.saves[a] !== undefined).map((a) => [`save_${a}`, s.saves[a]])),
    skill_list: s.skills.map((x) => ({ key: x.skill, name: word(lb.skills, x.skill), bonus: x.bonus })),
    vuln_list: s.vulnerabilities.map((x) => word(lb.damage, x)),
    res_list: s.resistances.map((x) => word(lb.damage, x)),
    imm_list: s.immunities.map((x) => word(lb.damage, x)),
    cond_list: s.conditionImmunities.map((x) => word(lb.conditions, x)),
    senses_text: sensesText(s, lang),
    traits: blocks(s.traits, 'traits'),
    actions: blocks(s.actions, 'actions'),
    bonus_actions: s.bonusActions.map(blockRow),
    reactions: s.reactions.map(blockRow),
    legendary_intro: s.legendary?.intro ?? '',
    legendary_actions: (s.legendary?.actions ?? []).map(blockRow),
  };
}

// A list as it was stays as it was: words the data wrote itself don't turn into keys.
const terms = (old: string[], now: string[] | undefined, table: Record<string, string>) => {
  const list = now ?? [];
  return list.length === old.length && list.every((w, i) => w === word(table, old[i]!)) ? old : list.map((w) => keyOf(table, w));
};

function monsterSync(f: Fields, lang: string): Dnd5eStats {
  const lb = dict(lang);
  const old = f as unknown as Dnd5eStats;
  const sizes = String(f['size_text'] ?? '').split(` ${lb.or} `).map((w) => keyOf(lb.sizes, w) as Size);
  const blocks = (v: unknown) => rows(v).filter((r) => !r['spell']).map(rowBlock);
  const legendary = rows(f['legendary_actions']).length || f['legendary_intro'] ? { intro: String(f['legendary_intro'] ?? ''), actions: blocks(f['legendary_actions']) } : undefined;
  const { legendary: _l, acNote: _a, hpFormula: _h, ...rest } = old;
  return {
    ...rest,
    size: sizes.some(Boolean) ? sizes : old.size,
    ...(f['ac_note'] ? { acNote: f['ac_note'] } : {}),
    ...(f['hp_formula'] ? { hpFormula: f['hp_formula'] } : {}),
    speed: f['speed_text'] === speedText(old, lang) ? old.speed : (parseSpeed(String(f['speed_text'] ?? ''), lang) ?? old.speed),
    abilities: Object.fromEntries(ABILITIES.map((a) => [a, Number(f[a] ?? old.abilities[a])])) as Record<Ability, number>,
    saves: Object.fromEntries(ABILITIES.filter((a) => typeof f[`save_${a}`] === 'number').map((a) => [a, f[`save_${a}`] as number])),
    skills: rows(f['skill_list']).map((r) => ({ skill: String(r['key'] || keyOf(lb.skills, String(r['name'] ?? ''))), bonus: Number(r['bonus'] ?? 0) })),
    vulnerabilities: terms(old.vulnerabilities, f['vuln_list'], lb.damage),
    resistances: terms(old.resistances, f['res_list'], lb.damage),
    immunities: terms(old.immunities, f['imm_list'], lb.damage),
    conditionImmunities: terms(old.conditionImmunities, f['cond_list'], lb.conditions),
    senses: f['senses_text'] === sensesText(old, lang) ? old.senses : (parseSenses(String(f['senses_text'] ?? ''), lang) ?? old.senses),
    traits: blocks(f['traits']),
    actions: blocks(f['actions']),
    bonusActions: blocks(f['bonus_actions']),
    reactions: blocks(f['reactions']),
    ...(legendary ? { legendary } : {}),
  };
}

const firstDice = (s: string) => /\d*[dк]\d+(?:\s*[+−-]\s*\d+)?/i.exec(s)?.[0].replace(/к/gi, 'd').replace(/\s+/g, '').replace('−', '-') ?? '';

function characterFields(c: Dnd5eCharacter): Fields {
  const sp = c.spellcasting;
  const levels = Array.from({ length: 10 }, (_, i) => i);
  return {
    ...c,
    level: totalLevel(c),
    ...Object.fromEntries(ABILITIES.map((a) => [a, c.abilities[a]])),
    ...Object.fromEntries(ABILITIES.map((a) => [`sv_${a}`, c.saves.includes(a) ? 1 : 0])),
    ...Object.fromEntries(CHAR_SKILLS.map((k) => [`sk_${skillField(k)}`, c.skills[k] ?? 0])),
    insp: c.inspiration ? 1 : 0,
    hp: c.hpMax,
    hit_die: c.hitDie ?? '',
    speed_ft: c.speed,
    ...(c.details ? Object.fromEntries(DETAILS.map((k) => [`detail_${k}`, c.details![k] ?? ''])) : {}),
    attacks: c.attacks.map((a) => ({ ...a, atk: parseBonus(a.bonus) ?? undefined, dmg1: firstDice(a.damage), crit: '' })),
    ...(sp
      ? {
          spell_ability: ABILITIES.indexOf(sp.ability),
          ...(sp.dc !== undefined ? { spell_dc: sp.dc } : {}),
          ...(sp.attack !== undefined ? { spell_attack: sp.attack } : {}),
          ...Object.fromEntries(levels.slice(1).map((l) => [`slots_${l}`, sp.slots[l] ?? 0])),
          ...Object.fromEntries(levels.map((l) => [`spells_${l}`, sp.spells[l] ?? ''])),
        }
      : {}),
    ...(c.coins ?? {}),
    ...Object.fromEntries(CHARACTER_TEXTS.map((k) => [`text_${k}`, c.text[k] ?? ''])),
  };
}

function characterSync(f: Fields): Dnd5eCharacter {
  const old = f as unknown as Dnd5eCharacter;
  const { pb: _p, initiative: _i, hitDie: _h, inspiration: _n, details: _d, spellcasting: _s, coins: _c, ...rest } = old;
  const levels = Array.from({ length: 10 }, (_, i) => String(i));
  const details = Object.fromEntries(DETAILS.flatMap((k) => (f[`detail_${k}`] ? [[k, f[`detail_${k}`]]] : [])));
  const coins = Object.fromEntries(['cp', 'sp', 'ep', 'gp', 'pp'].flatMap((k) => (typeof f[k] === 'number' && (f[k] || old.coins?.[k as 'cp'] !== undefined) ? [[k, f[k]]] : [])));
  const hadSpells = !!old.spellcasting || typeof f['spell_ability'] === 'number';
  const text = Object.fromEntries(CHARACTER_TEXTS.flatMap((k) => (f[`text_${k}`] ? [[k, f[`text_${k}`]]] : []))) as Partial<Record<CharacterText, string>>;
  return {
    ...rest,
    abilities: Object.fromEntries(ABILITIES.map((a) => [a, Number(f[a] ?? old.abilities[a])])) as Record<Ability, number>,
    saves: ABILITIES.filter((a) => (f[`sv_${a}`] ?? 0) > 0),
    skills: Object.fromEntries(CHAR_SKILLS.flatMap((k) => ((f[`sk_${skillField(k)}`] ?? 0) > 0 ? [[k, f[`sk_${skillField(k)}`]]] : []))) as Dnd5eCharacter['skills'],
    ...(old.pb !== undefined || f['pb'] !== undefined ? { pb: f['pb'] } : {}),
    ...(old.initiative !== undefined || f['initiative'] !== undefined ? { initiative: f['initiative'] } : {}),
    ...(f['insp'] ? { inspiration: true } : old.inspiration === false ? { inspiration: false } : {}),
    hpMax: Number(f['hp'] ?? old.hpMax),
    ...(f['hit_die'] ? { hitDie: f['hit_die'] } : {}),
    speed: Number(f['speed_ft'] ?? old.speed),
    ...(old.details || Object.keys(details).length ? { details } : {}),
    attacks: rows(f['attacks']).map((r) => ({ name: String(r['name'] ?? ''), bonus: String(r['bonus'] ?? ''), damage: String(r['damage'] ?? ''), ...(r['notes'] ? { notes: String(r['notes']) } : {}) })),
    ...(hadSpells
      ? {
          spellcasting: {
            ability: ABILITIES[Number(f['spell_ability'] ?? 0)] ?? 'int',
            ...(typeof f['spell_dc'] === 'number' ? { dc: f['spell_dc'] } : {}),
            ...(typeof f['spell_attack'] === 'number' ? { attack: f['spell_attack'] } : {}),
            slots: Object.fromEntries(levels.slice(1).flatMap((l) => (f[`slots_${l}`] ? [[l, f[`slots_${l}`]]] : []))),
            spells: Object.fromEntries(levels.flatMap((l) => (f[`spells_${l}`] ? [[l, f[`spells_${l}`]]] : []))),
          },
        }
      : {}),
    ...(old.coins || Object.keys(coins).length ? { coins } : {}),
    text,
  };
}

// Whether a card already has its fields: `str` is one of them for a stat block and a sheet alike.
export const hasDndFields = (s: unknown) => !!s && typeof s === 'object' && 'str' in s;
export const dndFields = (s: unknown, lang: string, system: string): Fields => (isCharacter(s) ? characterFields(s) : monsterFields(s as Dnd5eStats, lang, system));
// The old shape from the fields; the fields stay.
export const dndSync = (f: Fields, lang: string): Fields => ({ ...f, ...(isCharacter(f) ? characterSync(f) : { ...monsterSync(f, lang), cr_text: crText(Number(f['cr'] ?? 0)) }) });
