import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { attackBlocks, NO_RESHAPE, POWER_CRS, reshape, TEMPLATES, WEAPONS } from '../src/systems/dnd5e/reshape';
import type { Dnd5eStats } from '../src/systems/dnd5e/stats';

const load = (file: string) => {
  const d = JSON.parse(fs.readFileSync(`resources/srd/${file}`, 'utf8')) as { cards: { id: string; stats: Dnd5eStats }[] } | { id: string; stats: Dnd5eStats }[];
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
});
