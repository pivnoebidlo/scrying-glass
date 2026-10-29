import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { attackBlocks, diceOf, NO_RESHAPE, NO_WEAPON, ownTemplate, ownWeapon, parseOwnTemplates, parseOwnWeapons, POWER_CRS, reshape, TEMPLATES, WEAPONS } from '../src/systems/dnd5e/reshape';
import type { Dnd5eStats } from '../src/systems/dnd5e/stats';

const load = (file: string) => {
  const d = JSON.parse(fs.readFileSync(`content/dnd5e-srd/bestiary/${file}`, 'utf8')) as { cards: { id: string; stats: Dnd5eStats }[] } | { id: string; stats: Dnd5eStats }[];
  const cards = Array.isArray(d) ? d : d.cards;
  return (id: string) => structuredClone(cards.find((c) => c.id === id)!.stats);
};
const s14 = load('dnd5e-2014.json');
const s24 = load('dnd5e-2024.json');

describe('переделка статблока', () => {
  it('без изменений — тот же статблок', () => {
    const g = s14('srd51-guard');
    expect(reshape(g, NO_RESHAPE, 'en', '2014')).toEqual(g);
  });

  it('стражник-дварф: ТЕЛ +2, хиты, скорость, тёмное зрение, сопротивление, особенность', () => {
    const g = reshape(s14('srd51-guard'), { ...NO_RESHAPE, templates: ['dwarf'] }, 'en', '2014');
    expect(g.abilities.con).toBe(14);
    expect(g.hpFormula).toBe('2d8+4');
    expect(g.hp).toBe(13);
    expect(g.speed.walk).toBe(25);
    expect(g.senses.darkvision).toBe(60);
    expect(g.resistances).toContain('poison');
    expect(g.type).toBe('Humanoid (Dwarf)');
    expect(g.traits.map((t) => t.name)).toContain('Dwarven Resilience');
    // Strength did not change: the spear stays.
    expect(g.actions[0]!.text).toContain('+3 to hit');
  });

  it('ребёнок-обыватель: Маленький, к6, половина костей, атака и урон слабее', () => {
    const c = reshape(s14('srd51-commoner'), { ...NO_RESHAPE, templates: ['child'] }, 'en', '2014');
    expect(c.size).toEqual(['small']);
    expect(c.abilities.str).toBe(6);
    expect(c.hpFormula).toBe('1d6-1');
    expect(c.hp).toBe(2);
    expect(c.actions[0]!.text).toBe('Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 (1d4 - 2) bludgeoning damage.');
    expect(c.actions[0]!.attack).toEqual({ bonus: 0, damage: ['1d4-2'] });
  });

  it('русский текст 2014 и 2024: бонус и урон пересчитываются, кубы — как были', () => {
    const r14 = reshape(s14('srd51-scout.ru'), { ...NO_RESHAPE, abilities: { dex: 4 } }, 'ru', '2014');
    const bow = r14.actions.find((a) => a.name === 'Длинный лук')!;
    expect(bow.text).toContain('+6 к попаданию');
    expect(bow.text).toContain('8 (1к8 + 4)');
    // Shortsword: 1d6 + 2 = Dexterity (Str 11 is +0) — follows Dexterity too.
    expect(r14.actions.find((a) => a.name === 'Короткий меч')!.text).toContain('7 (1к6 + 4)');
    expect(r14.skills.find((x) => x.skill === 'stealth')!.bonus).toBe(8);
    const r24 = reshape(s24('srd52-guard.ru'), { ...NO_RESHAPE, abilities: { str: 4 } }, 'ru', '2024');
    expect(r24.actions[0]!.text).toBe('*Рукопашная или дальнобойная атака:* +5, досягаемость 5 футов или дистанция 20/60 футов. 6 (1d6 + 3) Колющего урона.');
  });

  it('КД: доспех средний — Ловкость до +2, без доспеха — вся', () => {
    const g = reshape(s14('srd51-guard'), { ...NO_RESHAPE, abilities: { dex: 6 } }, 'en', '2014');
    expect(g.ac).toBe(17); // chain shirt: +1 → +2
    const c = reshape(s14('srd51-commoner'), { ...NO_RESHAPE, abilities: { dex: 6 } }, 'en', '2014');
    expect(c.ac).toBe(13);
    expect(c.initiative).toBeUndefined();
    expect(reshape(s24('srd52-guard'), { ...NO_RESHAPE, abilities: { dex: 6 } }, 'en', '2024').initiative).toBe(4);
  });

  it('оружие: новая атака на языке и в редакции карточки, имя — и в мультиатаке, и в снаряжении', () => {
    const key = attackBlocks(s24('srd52-scout')).find((b) => b.name === 'Shortsword')!.key;
    const r = reshape(s24('srd52-scout'), { ...NO_RESHAPE, weapons: { [key]: 'battleaxe' } }, 'en', '2024');
    const axe = r.actions.find((a) => a.name === 'Battleaxe')!;
    expect(axe.text).toBe('Melee Attack Roll: +2, reach 5 ft. Hit: 4 (1d8) Slashing damage or 5 (1d10) Slashing damage if used with two hands.');
    expect(r.actions[0]!.text).toBe('The scout makes two attacks, using Battleaxe and Longbow in any combination.');
    expect(r.gear).toBe('Leather Armor, Longbow, Battleaxe');
    const ru = reshape(s14('srd51-commoner.ru'), { ...NO_RESHAPE, weapons: { 'actions:0': 'dagger' } }, 'ru', '2014');
    expect(ru.actions[0]!.text).toBe(
      '*Рукопашная или дальнобойная атака оружием:* +2 к попаданию, досягаемость 5 фт. или дальность 20/60 фт., одна цель. *Попадание:* 2 (1к4) Колющего урона.',
    );
  });

  it('СЛ спасброска следует за характеристикой, если её можно узнать', () => {
    const base = s14('srd51-commoner');
    base.actions.push({ name: 'Shove', text: 'Each creature must succeed on a DC 10 Strength saving throw.' });
    // DC 10 = 8 + 2 + 0: every ability is 10 — which one is unknown, the DC stays.
    expect(reshape(base, { ...NO_RESHAPE, abilities: { con: 4 } }, 'en', '2014').actions[1]!.text).toContain('DC 10');
    base.abilities.con = 14;
    expect(reshape(base, { ...NO_RESHAPE, abilities: { con: 4 } }, 'en', '2014').actions[1]!.text).toBe('Each creature must succeed on a DC 10 Strength saving throw.');
    base.actions[1]!.text = 'Each creature must succeed on a DC 12 Constitution saving throw.';
    expect(reshape(base, { ...NO_RESHAPE, abilities: { con: 4 } }, 'en', '2014').actions[1]!.text).toContain('DC 14');
  });

  it('у шаблонов и оружия есть оба языка', () => {
    for (const t of TEMPLATES) expect(t.name.en && t.name.ru).toBeTruthy();
    for (const x of WEAPONS) expect(x.name.en && x.name.ru).toBeTruthy();
  });

  it('сила: обыватель с ПО 0 до ПО 2 — БМ, КД, хиты, атака, урон, опыт', () => {
    const c = reshape(s14('srd51-commoner'), { ...NO_RESHAPE, cr: 2 }, 'en', '2014');
    expect([c.cr, c.xp, c.pb]).toEqual([2, 450, 2]);
    expect(c.ac).toBe(12);
    expect(c.hpFormula).toBe('10d8');
    expect(c.hp).toBe(45);
    expect(c.actions[0]!.attack!.bonus).toBe(5);
    expect(c.actions[0]!.text).toMatch(/^Melee Weapon Attack: \+5 to hit, reach 5 ft\., one target\. Hit: \d+ \(\d+d\d+\) bludgeoning damage\.$/);
    expect(c.actions[0]!.attack!.damage[0]).not.toBe('1d4');
  });

  it('сила: слабее — меньше, но не ниже единицы; без смены ПО — как было', () => {
    const g = reshape(s24('srd52-guard'), { ...NO_RESHAPE, cr: 0 }, 'en', '2024');
    expect(g.cr).toBe(0);
    expect(g.hp).toBeGreaterThanOrEqual(1);
    expect(g.hp).toBeLessThan(11);
    expect(g.actions[0]!.attack!.bonus).toBeLessThan(3);
    const same = s24('srd52-guard');
    expect(reshape(same, { ...NO_RESHAPE, cr: same.cr }, 'en', '2024')).toEqual(same);
  });

  it('СЛ в тексте растёт с силой; БМ с ПО 5 — +3', () => {
    const base = s14('srd51-commoner');
    base.actions.push({ name: 'Shove', text: 'Each creature must succeed on a DC 10 Strength saving throw.' });
    const r = reshape(base, { ...NO_RESHAPE, cr: 5 }, 'en', '2014');
    expect(r.pb).toBe(3);
    expect(r.actions[1]!.text).toContain('DC 14');
    expect(POWER_CRS[0]).toBe(0);
    expect(POWER_CRS.at(-1)).toBe(30);
  });

  it('человек — подвид без бонусов; возраст и народ — только гуманоидам', () => {
    const h = reshape(s14('srd51-guard'), { ...NO_RESHAPE, templates: ['human'] }, 'en', '2014');
    expect(h.type).toBe('Humanoid (Human)');
    expect(h.abilities).toEqual(s14('srd51-guard').abilities);
    const medusa = s14('srd51-medusa');
    expect(reshape(medusa, { ...NO_RESHAPE, templates: ['elf', 'child'] }, 'en', '2014')).toEqual(medusa);
    // Build and role work on anyone.
    expect(reshape(medusa, { ...NO_RESHAPE, templates: ['brute'] }, 'en', '2014').abilities.str).toBe(medusa.abilities.str + 2);
  });

  it('целитель: действие с модификатором Мудрости', () => {
    const c = reshape(s24('srd52-commoner.ru'), { ...NO_RESHAPE, templates: ['healer'] }, 'ru', '2024');
    expect(c.actions.at(-1)).toEqual({ name: 'Целебное касание (3/день)', text: 'Существо касается другого существа, и то восстанавливает 2к8 + 1 хитов.' });
  });

  it('народ — только гуманоиду без своего: гоблин остаётся гоблином, дроу можно сделать дварфом', () => {
    const goblin = s14('srd51-goblin');
    expect(reshape(goblin, { ...NO_RESHAPE, templates: ['gnome'] }, 'en', '2014')).toEqual(goblin);
    expect(reshape(goblin, { ...NO_RESHAPE, templates: ['child'] }, 'en', '2014').size).toEqual(['small']);
    expect(reshape(s14('srd51-drow'), { ...NO_RESHAPE, templates: ['dwarf'] }, 'en', '2014').type).toBe('Humanoid (Dwarf)');
    expect(reshape(s24('srd52-mage.ru'), { ...NO_RESHAPE, templates: ['dwarf'] }, 'ru', '2024').type).toBe('Гуманоид (волшебник, дварф)');
  });

  it('добавленное оружие — атакой или в снаряжение; прочие вещи — в снаряжение', () => {
    const r = reshape(s24('srd52-guard'), { ...NO_RESHAPE, added: [{ weapon: 'shortsword', attack: true }, { weapon: 'dagger', attack: false }], gear: 'Rope' }, 'en', '2024');
    expect(r.actions.map((a) => a.name)).toEqual(['Spear', 'Shortsword']);
    expect(r.actions[1]!.text).toBe('Melee Attack Roll: +3, reach 5 ft. Hit: 4 (1d6 + 1) Piercing damage.');
    expect(r.gear).toBe('Chain Shirt, Shield, Spear, Shortsword, Dagger, Rope');
    const c = reshape(s14('srd51-commoner'), { ...NO_RESHAPE, added: [{ weapon: 'dagger', attack: false }] }, 'en', '2014');
    expect(c.gear).toBe('Dagger');
  });

  it('свой шаблон: культист Морского бога — холод, плавание, особенность, язык; сочетается с народом', () => {
    const [cultist] = parseOwnTemplates({
      templates: [{
        id: 'own-sea', name: 'Культист Морского бога', abilities: { wis: 2, str: 'x' }, speeds: { swim: 30 }, resistances: ['cold'],
        skills: ['religion', 'nonsense'], blocks: [{ list: 'traits', name: 'Дитя глубин', text: 'Дышит водой.' }, { list: 'weird', name: 'x', text: 'y' }],
        language: 'Акван', subtype: 'глубоководный',
      }, { name: 'без id' }],
    });
    expect(cultist!.abilities).toEqual({ wis: 2 });
    expect(cultist!.skills).toEqual(['religion']);
    expect(cultist!.blocks).toHaveLength(1);
    const own = [ownTemplate(cultist!)];
    const g = reshape(s24('srd52-guard.ru'), { ...NO_RESHAPE, templates: ['own-sea', 'dwarf'] }, 'ru', '2024', own);
    expect(g.speed).toEqual({ walk: 25, swim: 30 });
    expect(g.resistances).toEqual(['cold', 'poison']);
    expect(g.traits.map((x) => x.name)).toEqual(['Дитя глубин', 'Дварфийская стойкость']);
    expect(g.languages).toBe('Общий, Акван, Дварфийский');
    expect(g.skills.find((x) => x.skill === 'religion')!.bonus).toBe(2);
    // The subtype of a GM's template goes only to a humanoid without a people of its own.
    const medusa = s14('srd51-medusa');
    expect(reshape(medusa, { ...NO_RESHAPE, templates: ['own-sea'] }, 'en', '2014', own).type).toBe(medusa.type);
    expect(reshape(s14('srd51-commoner'), { ...NO_RESHAPE, templates: ['own-sea'] }, 'en', '2014', own).type).toBe('Humanoid (глубоководный)');
  });

  it('иммунитет из шаблона убирает то же сопротивление', () => {
    const own = [ownTemplate({ id: 'own-x', name: 'X', immunities: ['poison'] })];
    const r = reshape(s14('srd51-guard'), { ...NO_RESHAPE, templates: ['dwarf', 'own-x'] }, 'en', '2014', own);
    expect(r.immunities).toEqual(['poison']);
    expect(r.resistances).toEqual([]);
  });

  it('свой народ: встаёт к народам, а карточку этого народа можно сделать другим и обратно', () => {
    const own = [ownTemplate({ id: 'own-tabaxi', name: 'Табакси', people: true, abilities: { dex: 2 }, darkvision: 60, subtype: 'табакси' })];
    expect(own[0]!.group).toBe('people');
    const g = reshape(s24('srd52-guard.ru'), { ...NO_RESHAPE, templates: ['dwarf', 'own-tabaxi'] }, 'ru', '2024', own);
    // One people at a time is the page's job; here the first with a subtype names it.
    expect(g.type).toBe('Гуманоид (дварф)');
    const tabaxi = reshape(s24('srd52-guard.ru'), { ...NO_RESHAPE, templates: ['own-tabaxi'] }, 'ru', '2024', own);
    expect(tabaxi.type).toBe('Гуманоид (табакси)');
    expect(tabaxi.abilities.dex).toBe(14);
    // A tabaxi card is a known people now: it can become an elf.
    expect(reshape(tabaxi, { ...NO_RESHAPE, templates: ['elf'] }, 'ru', '2024', own).type).toBe('Гуманоид (эльф)');
    // Without the GM's people the same card keeps its own.
    expect(reshape(tabaxi, { ...NO_RESHAPE, templates: ['elf'] }, 'ru', '2024').type).toBe('Гуманоид (табакси)');
  });

  it('другое название: сковородка с числами дубинки — и в снаряжении, в том же регистре', () => {
    const c = reshape(s24('srd52-commoner.ru'), { ...NO_RESHAPE, names: { 'actions:0': 'Сковородка' } }, 'ru', '2024');
    expect(c.actions[0]!.name).toBe('Сковородка');
    expect(c.actions[0]!.attack).toEqual({ bonus: 2, damage: ['1d4'] });
    expect(c.gear).toBe('Сковородка');
    const g = reshape(s24('srd52-guard.ru'), { ...NO_RESHAPE, weapons: { 'actions:0': 'battleaxe' }, names: { 'actions:0': 'Топор лесоруба' } }, 'ru', '2024');
    expect(g.actions[0]!.name).toBe('Топор лесоруба');
    expect(g.gear).toBe('Кольчужная рубаха, щит, топор лесоруба');
    const added = reshape(s24('srd52-guard'), { ...NO_RESHAPE, added: [{ weapon: 'club', attack: true, name: 'Frying Pan' }] }, 'en', '2024');
    expect(added.actions.at(-1)!.name).toBe('Frying Pan');
    expect(added.gear).toBe('Chain Shirt, Shield, Spear, Frying Pan');
  });

  it('без оружия: атака пропадает, из снаряжения — тоже; ключи остальных атак не сдвигаются', () => {
    const scout = s24('srd52-scout');
    const keys = attackBlocks(scout);
    const bow = keys.find((k) => k.name === 'Longbow')!.key;
    const sword = keys.find((k) => k.name === 'Shortsword')!.key;
    const r = reshape(scout, { ...NO_RESHAPE, weapons: { [sword]: NO_WEAPON, [bow]: 'heavy-crossbow' } }, 'en', '2024');
    expect(r.actions.map((a) => a.name)).toEqual(['Multiattack', 'Heavy Crossbow']);
    expect(r.gear).toBe('Leather Armor, Heavy Crossbow');
  });

  it('своё оружие: разбор, магический бонус и урон другого типа — в тексте атаки и в бросках', () => {
    expect(diceOf('2к6')).toBe('2d6');
    expect(diceOf('1d7')).toBeNull();
    const list = parseOwnWeapons({
      weapons: [
        { id: 'ownw-1', name: 'Пылающий клинок', dice: '1d8', type: 'slashing', kind: 'melee', bonus: 1, versatile: '1d10', extra: { dice: '2d6', type: 'fire' } },
        { id: 'ownw-2', name: 'Bad', dice: 'много', type: 'slashing' },
        { id: 'ownw-3', name: 'Frost Bow', dice: '1d8', type: 'piercing', kind: 'ranged', range: [150, 600], extra: { dice: '1d6', type: 'cold' } },
      ],
    });
    expect(list.map((x) => x.id)).toEqual(['ownw-1', 'ownw-3']);
    const weapons = list.map(ownWeapon);
    const base = s14('srd51-commoner');
    const r = reshape(base, { ...NO_RESHAPE, added: [{ weapon: 'ownw-1', attack: true }] }, 'ru', '2014', [], weapons);
    const blade = r.actions.at(-1)!;
    expect(blade.name).toBe('Пылающий клинок');
    // Commoner: STR 10, PB 2; +1 magic — +3 to hit, 1d8+1.
    expect(blade.attack?.bonus).toBe(3);
    expect(blade.attack?.damage).toEqual(['1d8+1', '1d10+1', '2d6']);
    expect(blade.text).toContain('плюс 7 (2к6) Огненного урона');
    const en = reshape(s24('srd52-commoner') ?? base, { ...NO_RESHAPE, added: [{ weapon: 'ownw-3', attack: true }] }, 'en', '2024', [], weapons);
    expect(en.actions.at(-1)!.text).toMatch(/Ranged Attack Roll: .*range 150\/600 ft\. Hit: .* Piercing damage plus 3 \(1d6\) Cold damage\./);
  });
});

