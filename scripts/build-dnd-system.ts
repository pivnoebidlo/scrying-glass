// The D&D systems as packs: resources/systems/dnd5e-<edition>.json, one source for both editions. The words come from
// the plugin's dictionaries (the card's language), the numbers of the threat from the SRD (systems/dnd5e/difficulty.ts).
// Run: npm run build-dnd-system
import fs from 'node:fs';
import path from 'node:path';
import { dict, SYSTEMS } from '../src/systems/dnd5e/stats.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const [enSrc, ruSrc] = fs.readFileSync(path.join(ROOT, 'src/systems/dnd5e/i18n.ts'), 'utf8').split('export const ru');
const said = (part: string, k: string) => part.match(new RegExp(`'${k.replace(/\./g, '\\.')}': "((?:[^"\\\\]|\\\\.)*)"`))?.[1];
const T = (k: string) => ({ en: said(enSrc!, k) ?? k, ru: said(ruSrc!, k) ?? k });
const [en, ru] = [dict('en'), dict('ru')];
type D = typeof en;
const D = (f: (d: D) => string) => ({ en: f(en), ru: f(ru) });
const AB = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const SKILLS: Record<string, string> = {
  acrobatics: 'dex', 'animal-handling': 'wis', arcana: 'int', athletics: 'str', deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha', investigation: 'int', medicine: 'wis',
  nature: 'int', perception: 'wis', performance: 'cha', persuasion: 'cha', religion: 'int', 'sleight-of-hand': 'dex', stealth: 'dex', survival: 'wis',
};
const sk = (k: string) => k.replace(/-/g, '_');
const MONSTER = ['monster', 'npc'];
const HERO = ['character'];

const num = (key: string, title: unknown, more = {}) => ({ key, title, type: 'number', min: -99, max: 99999, ...more });
const txt = (key: string, title: unknown, more = {}) => ({ key, title, type: 'text', ...more });
const tags = (key: string, title: unknown, more = {}) => ({ key, title, type: 'tags', ...more });
const long = (key: string, title: unknown, more = {}) => ({ key, title, type: 'textarea', ...more });
const check = (bonus: string) => ({ type: 'd20', bonus });
const blocks = (key: string, title: unknown, links = 'em') => ({
  key, title, type: 'list', roll: check('row.atk'),
  columns: [
    { key: 'name', type: 'text', title: D((d) => d.traits) }, { key: 'uses', type: 'text', title: { en: 'Uses', ru: 'Использование' }, show: 'note' },
    { key: 'atk', type: 'number', title: T('dnd.sh.attack'), signed: true }, { key: 'dmg1', type: 'dice', title: T('dnd.sh.damage') }, { key: 'dmg2', type: 'dice', title: T('dnd.sh.damage') }, { key: 'dmg3', type: 'dice', title: T('dnd.sh.damage') },
    { key: 'text', type: 'long', title: { en: 'Text', ru: 'Текст' }, links },
  ],
});
const lines = (id: string, title: unknown, fields: unknown[], more = {}) => ({ id, title, view: 'lines', noTitle: true, fields, ...more });
const titled = (id: string, title: unknown, fields: unknown[], more = {}) => ({ id, title, view: 'lines', fields, ...more });
const TAB = {
  skills: T('dnd.sh.stats'), attacks: T('dnd.attacks'), spells: T('dnd.spells'), features: T('dnd.sh.features'), gear: T('dnd.sh.equipment'), person: T('dnd.sh.person'), notes: T('dnd.sh.notes'),
};

function sections() {
  return [
    lines('who', { en: 'Who', ru: 'Кто' }, [
      txt('race', { en: 'Race', ru: 'Раса' }, { bare: true }), txt('background', { en: 'Background', ru: 'Предыстория' }, { bare: true, join: ',' }), txt('alignment', { en: 'Alignment', ru: 'Мировоззрение' }, { bare: true, join: ',' }),
      num('level', { en: 'Level', ru: 'Уровень' }), txt('player', { en: 'Player', ru: 'Игрок' }, { join: ';' }),
    ], { kinds: HERO }),
    lines('vitals', { en: 'Vitals', ru: 'Основное' }, [
      num('ac', D((d) => d.ac)), txt('ac_note', { en: 'Armor note', ru: 'Заметка о доспехе' }, { bare: true, join: ';' }),
      num('hp', D((d) => d.hp)), txt('hp_formula', { en: 'Hit dice', ru: 'Кости хитов' }, { bare: true, join: ';' }), txt('hit_die', { en: 'Hit die', ru: 'Кость хитов' }, { join: ';' }),
      txt('speed_text', D((d) => d.speedLabel)), num('speed_ft', D((d) => d.speedLabel), { hideZero: true }),
      num('initiative', D((d) => d.initiative), { auto: 'dex_mod', signed: true, roll: check('initiative') }),
      num('pb', { en: 'Proficiency Bonus', ru: 'Бонус мастерства' }, { signed: true, auto: '2 + floor((level - 1) / 4)', hidden: false }),
    ]),
    {
      id: 'abilities', title: { en: 'Abilities', ru: 'Характеристики' }, view: 'grid', noTitle: true,
      grid: { columns: AB.map((a) => D((d) => d.abilities[a])), rows: ['', D((d) => d.mod), D((d) => d.save)] },
      fields: [
        ...AB.map((a) => num(a, D((d) => d.abilities[a]), { min: 0, default: 10 })),
        ...AB.map((a) => ({ key: `${a}_mod`, title: { en: `${en.abilities[a]} modifier`, ru: `Модификатор ${ru.abilities[a]}` }, type: 'formula', formula: `floor((${a} - 10) / 2)`, signed: true, roll: check(`${a}_mod`) })),
        ...AB.map((a) => num(`save_${a}`, { en: `${en.abilities[a]} save`, ru: `Спасбросок ${ru.abilities[a]}` }, { auto: `${a}_mod + sv_${a} * pb`, signed: true, roll: check(`save_${a}`) })),
      ],
    },
    lines('details', { en: 'Details', ru: 'Подробности' }, [
      { key: 'skill_list', title: D((d) => d.skillsLabel), type: 'list', roll: check('row.bonus'), columns: [{ key: 'name', type: 'text', title: D((d) => d.skillsLabel) }, { key: 'bonus', type: 'number', title: T('dnd.sh.bonus'), signed: true }] },
      tags('vuln_list', D((d) => d.vulnerabilities)), tags('res_list', D((d) => d.resistances)), tags('imm_list', D((d) => d.immunities)), tags('cond_list', D((d) => d.conditionImmunities)),
      txt('gear', D((d) => d.gear)), txt('senses_text', D((d) => d.sensesLabel)), txt('languages', D((d) => d.languages)),
      txt('cr_text', D((d) => d.cr)), num('xp', { en: 'XP', ru: 'ОО' }, { join: ';', hideZero: true, min: 0 }),
      num('cr', D((d) => d.cr), { hidden: true, min: 0 }),
    ]),
    titled('traits', D((d) => d.traits), [blocks('traits', D((d) => d.traits))], { kinds: MONSTER }),
    titled('actions', D((d) => d.actions), [blocks('actions', D((d) => d.actions))], { kinds: MONSTER }),
    titled('bonus', D((d) => d.bonusActions), [blocks('bonus_actions', D((d) => d.bonusActions))], { kinds: MONSTER }),
    titled('reactions', D((d) => d.reactions), [blocks('reactions', D((d) => d.reactions))], { kinds: MONSTER }),
    titled('legendary', D((d) => d.legendary), [long('legendary_intro', { en: 'Intro', ru: 'Вступление' }, { bare: true }), blocks('legendary_actions', D((d) => d.legendary))], { kinds: MONSTER }),

    { id: 'saves', title: { en: 'Saving throws', ru: 'Спасброски' }, view: 'grid', tab: TAB.skills, kinds: HERO, grid: { columns: AB.map((a) => D((d) => d.abilities[a])), rows: [{ en: 'Proficiency', ru: 'Владение' }] }, fields: AB.map((a) => ({ key: `sv_${a}`, title: { en: `${en.abilities[a]} save proficiency`, ru: `Владение спасброском ${ru.abilities[a]}` }, type: 'dots', max: 1 })) },
    {
      id: 'skills', title: D((d) => d.skillsLabel), view: 'grid', tab: TAB.skills, kinds: HERO,
      grid: { columns: [{ en: 'Proficiency', ru: 'Владение' }, T('dnd.sh.bonus')], rows: Object.keys(SKILLS).map((k) => D((d) => d.skills[k]!)) },
      fields: Object.entries(SKILLS).flatMap(([k, a]) => [
        { key: `sk_${sk(k)}`, title: D((d) => d.skills[k]!), type: 'dots', max: 2 },
        { key: `skb_${sk(k)}`, title: D((d) => `${d.skills[k]} +`), type: 'formula', formula: `${a}_mod + sk_${sk(k)} * pb`, signed: true, roll: check(`skb_${sk(k)}`) },
      ]),
    },
    titled('attacks', T('dnd.attacks'), [
      { key: 'attacks', title: T('dnd.attacks'), type: 'list', roll: check('row.atk'), columns: [{ key: 'name', type: 'text', title: T('dnd.sh.attack') }, { key: 'atk', type: 'number', title: T('dnd.sh.bonus'), signed: true }, { key: 'dmg1', type: 'dice', title: T('dnd.sh.damage') }, { key: 'notes', type: 'long', title: { en: 'Notes', ru: 'Заметки' } }] },
      long('text_attacks', T('dnd.attacks'), { bare: true }),
    ], { kinds: HERO, tab: TAB.attacks, noTitle: true }),
    lines('spellcasting', T('dnd.spells'), [
      { key: 'spell_ability', title: T('dnd.sh.ability'), type: 'select', options: AB.map((a) => D((d) => d.abilities[a])) },
      { key: 'spell_mod', title: { en: 'Spell modifier', ru: 'Модификатор заклинаний' }, type: 'formula', formula: AB.slice(0, -1).reduceRight((rest, a, i) => `if(eq(spell_ability, ${i + 1}), ${a}_mod, ${rest})`, 'cha_mod'), hidden: true },
      num('spell_dc', T('dnd.sh.dc'), { auto: '8 + pb + spell_mod', join: ';' }), num('spell_attack', T('dnd.sh.atk'), { auto: 'pb + spell_mod', signed: true, join: ';', roll: check('spell_attack') }),
      long('spells_0', T('dnd.cantrips'), { links: 'text' }),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((l) => [
        num(`slots_${l}`, { en: `Level ${l} slots`, ru: `Ячейки ${l} уровня` }, { hidden: true, min: 0 }),
        { key: `slot_${l}`, title: { en: `Level ${l}`, ru: `${l} уровень` }, type: 'track', boxes: `slots_${l}`, live: 'both' },
        long(`spells_${l}`, { en: `Level ${l}`, ru: `${l} уровень` }, { links: 'text', bare: true }),
      ]),
    ], { kinds: HERO, tab: TAB.spells }),
    lines('features', TAB.features, ['features', 'traits', 'proficiencies'].map((k) => long(`text_${k}`, T(`dnd.text.${k}`))), { kinds: HERO, tab: TAB.features }),
    lines('gear', TAB.gear, [long('text_equipment', T('dnd.text.equipment')), ...['cp', 'sp', 'ep', 'gp', 'pp'].map((k, i) => num(k, D((d) => (d === ru ? { cp: 'мм', sp: 'см', ep: 'эм', gp: 'зм', pp: 'пм' } : { cp: 'cp', sp: 'sp', ep: 'ep', gp: 'gp', pp: 'pp' })[k]!), { hideZero: true, min: 0, ...(i ? { join: ',' } : {}) }))], { kinds: HERO, tab: TAB.gear }),
    lines('person', TAB.person, ['personality', 'ideals', 'bonds', 'flaws', 'appearance', 'background', 'allies'].map((k) => long(`text_${k}`, T(`dnd.text.${k}`))), { kinds: HERO, tab: TAB.person }),
    lines('notes', TAB.notes, [long('text_quests', T('dnd.text.quests')), { key: 'notes', title: TAB.notes, type: 'list', columns: [{ key: 'title', type: 'text', title: { en: 'Title', ru: 'Заголовок' } }, { key: 'text', type: 'long', title: { en: 'Text', ru: 'Текст' } }] }], { kinds: HERO, tab: TAB.notes }),
  ];
}

const BUDGET = fs.readFileSync(path.join(ROOT, 'src/systems/dnd5e/difficulty.ts'), 'utf8').match(/const BUDGET[^=]*= (\[[\s\S]*?\]);\n/)![1]!;
const perHero = Function(`return ${BUDGET}`)() as number[][];
fs.mkdirSync(path.join(ROOT, 'resources/systems'), { recursive: true });
for (const id of SYSTEMS) {
  const pack = {
    scryingGlass: 'system', version: 1, format: 8, id, family: 'dnd5e', title: id === 'dnd5e-2024' ? 'D&D 5e (2024)' : 'D&D 5e (2014)', short: id.slice(-4),
    uses: ['worldtime', 'names', 'npc', 'tavern', 'settlement', 'hooks'], rank: 'cr + level',
    tracker: { init: { type: 'roll', dice: '1d20', bonus: 'initiative' }, hp: 'hp', defence: 'ac' },
    threat: { party: 4, xpField: 'xp', xp: {}, perHero, levels: [T('dnd.rating.low'), T('dnd.rating.moderate'), T('dnd.rating.high')].map((title) => ({ title })), below: T('dnd.rating.trivial'), beyond: T('dnd.rating.beyond') },
    sections: sections(),
  };
  fs.writeFileSync(path.join(ROOT, `resources/systems/${id}.json`), JSON.stringify(pack, null, 1) + '\n');
}
