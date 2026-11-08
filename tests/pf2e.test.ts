import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { degreeOf, parseDice, rollDamage } from '../src/shared/dice';
import { conditionValue } from '../src/systems/tracker';
import { budgetOf, creatureXp, threatOf } from '../src/shared/threat';
import type { Pf2eStats } from '../src/systems/pf2e/stats';
import { systemOf, familyOf } from '../src/systems';
import { registerPacks } from '../src/systems/packs';
import { validatePack, type SystemPack } from '../src/shared/syspack';
import { upgradeCard } from '../src/shared/oldcards';
import type { Card } from '../src/shared/cards';
import { entrySubtitle, type BuiltinBook, type Entry } from '../src/shared/compendium';
import { fromPathbuilder, pathbuilderImporter, tableFields } from '../src/systems/pf2e/pathbuilder';
import { packResources } from '../src/shared/syspack';

const pack = validatePack(JSON.parse(fs.readFileSync('content/pf2e-core/system/pf2e.json', 'utf8'))) as SystemPack;
const PF = pack.threat!;
const CONDITIONS = (pack.tracker.conditions?.list ?? []) as string[];
const VALUED = (pack.tracker.conditions?.valued ?? []) as string[];
registerPacks([pack]);

describe('Pathfinder 2e: rules', () => {
  it('degrees of success: by 10, and a natural 20 / 1 shift one degree', () => {
    expect(degreeOf(30, 12, 20)).toBe('critical');
    expect(degreeOf(20, 12, 20)).toBe('success');
    expect(degreeOf(19, 12, 20)).toBe('failure');
    expect(degreeOf(10, 3, 20)).toBe('fumble');
    expect(degreeOf(19, 20, 20)).toBe('success');
    expect(degreeOf(25, 1, 20)).toBe('failure');
    expect(degreeOf(5, 1, 20)).toBe('fumble');
  });

  it('a critical hit doubles the whole damage, not the dice', () => {
    const d = rollDamage(parseDice('1d6+3')!, true, 'total');
    expect(d.rolls[0]).toHaveLength(1);
    expect(d.total).toBe((d.rolls[0]![0]! + 3) * 2);
    expect(rollDamage(parseDice('1d6+3')!, true).rolls[0]).toHaveLength(2);
  });

  it('the multiple attack penalty, agile weapons less: a step in the row, two more buttons', () => {
    const steps = (pack.sections.flatMap((x) => x.fields).find((f) => f.key === 'strikes')!.roll as { steps: string[] }).steps;
    expect(steps).toEqual(['0 - row.map', '0 - row.map * 2']);
    const card = (traits: string[]) => upgradeCard({ system: 'pf2e', lang: 'en', stats: { saves: {}, strikes: [{ name: 'Jaws', ranged: false, bonus: 10, traits, damage: '', effects: ['Grab'] }] } } as unknown as Card);
    expect((card([]).stats as { strikes: { map: number; plus: string; kind: string }[] }).strikes[0]).toMatchObject({ map: 5, plus: 'plus Grab', kind: 'Melee' });
    expect((card(['agile']).stats as { strikes: { map: number }[] }).strikes[0]!.map).toBe(4);
  });

  it('the XP budget: creatures by level against the party, budgets by its size', () => {
    expect(creatureXp(PF, 3, 3)).toBe(40);
    expect(creatureXp(PF, -2, 3)).toBe(0);
    expect(creatureXp(PF, 8, 3)).toBeNull();
    expect(budgetOf(PF, PF.levels[2]!, 4)).toBe(80);
    expect(budgetOf(PF, PF.levels[3]!, 5)).toBe(150);
    expect(threatOf(PF, [3, 3], { size: 4, level: 3 })).toMatchObject({ xp: 80, level: 2, next: 120 });
    expect(threatOf(PF, [1, 1], { size: 4, level: 3 }).level).toBe(0);
    expect(threatOf(PF, [9], { size: 4, level: 3 }).level).toBe('beyond');
    expect(threatOf(PF, [null, 3], { size: 4, level: 3 })).toMatchObject({ xp: 40, unknown: 1 });
  });

  it('a valued condition: the name and its number', () => {
    expect(conditionValue('Frightened 2')).toEqual({ name: 'Frightened', value: 2 });
    expect(conditionValue('Off-Guard')).toEqual({ name: 'Off-Guard', value: null });
    expect(VALUED.every((v) => CONDITIONS.includes(v))).toBe(true);
  });

  it('the system: a pack of its own family, the tracker reads a card', () => {
    expect(familyOf('pf2e')).toBe('pf2e');
    expect(systemOf('pf2e').combat({ hp: 20, ac: 18, perception: 7 })).toMatchObject({ hp: 20, ac: 18, initiative: 7 });
    expect(systemOf('pf2e').rank({ level: 6 })).toBe(6);
    expect(systemOf('pf2e').tracker.conditions.entry?.('Frightened 2')).toEqual(['Frightened']);
  });

  it('the types of entries come from the pack, with the line under the title', () => {
    expect(entrySubtitle({ type: 'pf2e-spell', fields: { rank: 3, traditions: ['arcane', 'occult'], act: '◆◆' } } as unknown as Entry)).toBe('Spell 3 · arcane, occult · ◆◆');
    expect(entrySubtitle({ type: 'pf2e-action', fields: { act: '⟲' } } as unknown as Entry)).toBe('Action · ⟲');
  });

  it('an old card gets the fields and keeps everything: an older app reads the same file', () => {
    const old = { level: 1, rarity: 'rare', size: 'med', traits: ['goblin'], abilities: { str: 2 }, saves: { fort: 5, ref: 4, will: 3, note: 'vs. fear' }, hp: 20, hpNote: 'regen', ac: 15, skills: [], interaction: [{ name: 'A', actions: 'reaction', traits: [], text: 'a --- b' }], defensive: [], offensive: [], strikes: [], spellcasting: [{ name: 'Innate', dc: 20, attack: 10, ranks: [{ rank: 1, spells: ['Heal'] }] }] };
    const c = upgradeCard({ system: 'pf2e', lang: 'ru', stats: old } as unknown as Card);
    const s = c.stats as Record<string, any>;
    expect(s).toMatchObject({ str: 2, dex: 0, fort: 5, will: 3, save_note: 'vs. fear', hp_note: 'regen', class: 'Существо', badges: ['rare', 'Средний', 'goblin'] });
    expect(s['interaction'][0]).toMatchObject({ act: '⟲', text: 'a\n\n---\n\nb' });
    expect(s['spell_text']).toBe('**Innate** КС 20, атака {1d20+10}; **Ранг 1** [[Heal]]');
    expect(s['saves']).toEqual(old.saves);
    expect(s['abilities']).toEqual(old.abilities);
    expect(upgradeCard(c)).toBe(c);
  });
});

describe('Pathfinder 2e: the data (content/pf2e-core)', () => {
  const cards = JSON.parse(fs.readFileSync('content/pf2e-core/bestiary/pf2e.json', 'utf8')) as { id: string; name: string; system: string; stats: Pf2eStats }[];
  const book = JSON.parse(fs.readFileSync('content/pf2e-core/compendium/pf2e.en.json', 'utf8')) as BuiltinBook;
  const titles = new Set(book.entries.map((e) => e.title));

  it('Monster Core creatures with sane numbers, unique ids', () => {
    expect(cards.length).toBeGreaterThan(400);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const c of cards) {
      expect(c.system).toBe('pf2e');
      expect(c.stats.level, c.name).toBeGreaterThanOrEqual(-1);
      expect(c.stats.hp, c.name).toBeGreaterThan(0);
      expect(c.stats.ac, c.name).toBeGreaterThan(5);
      expect(c.stats.saves, c.name).toBeTruthy();
      expect(c.stats.abilities, c.name).toBeTruthy();
      expect((c.stats as unknown as Record<string, unknown>)['fort'], c.name).toBe(c.stats.saves.fort);
    }
  });

  it('the conditions of the tracker are in the compendium', () => {
    for (const c of CONDITIONS) expect(titles.has(c), c).toBe(true);
  });

  it('every [[link]] leads to an entry of the book; no markup of Foundry is left', () => {
    const texts = [...book.entries.map((e) => e.body), ...cards.flatMap((c) => [...c.stats.interaction, ...c.stats.defensive, ...c.stats.offensive].map((f) => f.text))];
    for (const t of texts) {
      for (const m of t.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) expect(titles.has(m[1]!), m[1]).toBe(true);
      expect(t).not.toMatch(/@\w+\[|\[\[\/|<[a-z]+[ >]/);
    }
  });
});

describe('books: an entry is found by its type and title', () => {
  for (const dir of fs.readdirSync('content').filter((d) => fs.existsSync(`content/${d}/compendium`)))
    for (const f of fs.readdirSync(`content/${dir}/compendium`))
      it(`${dir}/${f} has no two entries of one title`, () => {
        const b = JSON.parse(fs.readFileSync(`content/${dir}/compendium/${f}`, 'utf8')) as BuiltinBook;
        const keys = b.entries.map((e) => `${e.type}/${e.title}`);
        expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
      });
});

describe('Pathbuilder 2e import', () => {
  // As Pathbuilder exports: attribute scores, proficiency bonuses without the level.
  const exp = {
    success: true,
    build: {
      name: 'Anya', class: 'Summoner', level: 2, ancestry: 'Human', heritage: 'Versatile Human', background: 'Feral Child', keyability: 'cha', size: 2,
      languages: ['Common', 'Fey'],
      abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 14, cha: 16 },
      attributes: { ancestryhp: 8, classhp: 10, bonushp: 0, bonushpPerLevel: 0, speed: 25, speedBonus: 5 },
      proficiencies: { classDC: 2, perception: 2, fortitude: 4, reflex: 2, will: 4, acrobatics: 2, arcana: 0, nature: 2 },
      lores: [['Wilderness', 2]],
      feats: [['Forager', null, 'Awarded Feat', 1], ['Fleet', null, 'General Feat', 1]],
      weapons: [{ name: 'Dagger', display: 'Dagger', die: 'd4', damageBonus: 0, damageType: 'P', attack: 4, str: '' }, { name: 'Shortbow', display: 'Shortbow', die: 'd6', damageBonus: 0, damageType: 'P', attack: 5, str: 'striking' }],
      armor: [{ name: "Explorer's Clothing", display: "Explorer's Clothing", worn: true }],
      equipment: [['Backpack', 1], ['Chalk', 10]],
      money: { gp: 15 },
      acTotal: { acTotal: 14 },
      spellCasters: [{ name: 'Summoner', magicTradition: 'primal', spellcastingType: 'spontaneous', ability: 'cha', proficiency: 2, perDay: [5, 1], spells: [{ spellLevel: 0, list: ['Needle Darts'] }, { spellLevel: 1, list: ['Animal Allies'] }] }],
    },
  };

  it('is known by its shape, a character of Pathfinder in English', () => {
    expect(pathbuilderImporter.detect(exp)).toBe(true);
    expect(pathbuilderImporter.detect({ jsonType: 'character', data: '{}' })).toBe(false);
    expect(pathbuilderImporter.read(exp, {})).toMatchObject({ name: 'Anya', system: 'pf2e', lang: 'en' });
  });

  it('counts the totals by the rules: proficiency + level when trained + the modifier', () => {
    const c = fromPathbuilder(exp);
    expect(c.sheet).toBe('pf2e-character');
    expect(c.abilities).toMatchObject({ con: 2, dex: 1, wis: 2, cha: 3 });
    expect(c.hp).toBe(8 + (10 + 2) * 2);
    expect(c.perception).toBe(2 + 2 + 2);
    expect(c.saves).toEqual({ fort: 4 + 2 + 2, ref: 2 + 2 + 1, will: 4 + 2 + 2 });
    expect(c.classDC).toBe(10 + 2 + 2 + 3);
    expect(c.speed).toBe(30);
    expect(c.skills.find((s) => s.name === 'Acrobatics')).toEqual({ name: 'Acrobatics', mod: 5, rank: 1 });
    expect(c.skills.find((s) => s.name === 'Arcana')).toEqual({ name: 'Arcana', mod: 0, rank: 0 });
    expect(c.skills.find((s) => s.name === 'Wilderness Lore')?.mod).toBe(4);
    expect(c.strikes.map((s) => [s.name, s.ranged, s.bonus, s.damage])).toEqual([['Dagger', false, 4, '{1d4} piercing'], ['Shortbow', true, 5, '{2d6} piercing']]);
    expect(c.spellcasting[0]).toMatchObject({ dc: 17, attack: 7, ranks: [{ rank: 1, slots: 1, spells: ['Animal Allies'] }, { rank: 0, spells: ['Needle Darts'] }] });
    expect(c.feats.map((f) => f.name)).toEqual(['Forager', 'Fleet']);
    expect(c.equipment).toEqual(["Explorer's Clothing", 'Backpack', 'Chalk ×10']);
    expect(c.money.gp).toBe(15);
  });

  it('marks at the table: slots by rank without innate spells, Focus Points, hit points up to the card', () => {
    const more = { ...exp, build: { ...exp.build, focusPoints: 1, spellCasters: [...exp.build.spellCasters, { name: 'Elf', innate: true, perDay: [0, 1], spells: [{ spellLevel: 1, list: ['Fear'] }] }] } };
    expect(tableFields(more)).toEqual({ hero: 1, slot1_max: 1, focus_max: 1 });
    expect(tableFields({ nope: 1 })).toEqual({});
    const pack = validatePack(JSON.parse(fs.readFileSync('content/pf2e-core/system/pf2e.json', 'utf8'))) as SystemPack;
    const stats = pathbuilderImporter.read(more, {}).stats as Record<string, unknown>;
    const r = packResources(pack, stats as never, 'character');
    expect(r.limits).toEqual({ hp: 8 + (10 + 2) * 2, hero: 3, focus: 1, slot1: 1 });
    expect(r.resets).toEqual({ daily: ['slot1', 'focus'], refocus: ['focus'], session: ['hero'] });
    // A creature's stat block has no table.
    expect(packResources(pack, stats as never, 'monster').limits).toEqual({});
  });
});
