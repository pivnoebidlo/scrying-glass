import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dndFields, dndSync } from '../src/systems/dnd5e/fields';
import { blankCharacter, type Dnd5eCharacter } from '../src/systems/dnd5e/character';
import type { Dnd5eStats } from '../src/systems/dnd5e/stats';

const cards = ['2014', '2024'].flatMap((y) => JSON.parse(fs.readFileSync(`content/dnd5e-srd/bestiary/dnd5e-${y}.json`, 'utf8')) as { name: string; lang: string; system: string; stats: Dnd5eStats }[]);
// The old shape only: what a card had before the fields.
const OLD = ['size', 'type', 'alignment', 'ac', 'acNote', 'hp', 'hpFormula', 'speed', 'initiative', 'abilities', 'saves', 'skills', 'vulnerabilities', 'resistances', 'immunities', 'conditionImmunities', 'senses', 'languages', 'gear', 'cr', 'xp', 'pb', 'traits', 'actions', 'bonusActions', 'reactions', 'legendary', 'spellcasting'];
const pick = (s: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.filter((k) => s[k] !== undefined).map((k) => [k, s[k]]));

describe('карточки D&D и поля пакета', () => {
  it('все существа SRD: карточка → поля → карточка без потерь', () => {
    expect(cards.length).toBe(1308);
    for (const c of cards) {
      const back = dndSync(dndFields(c.stats, c.lang, c.system), c.lang);
      expect(pick(back, OLD), c.name).toEqual(pick(c.stats as unknown as Record<string, unknown>, OLD));
    }
  });

  it('правка в полях доходит до старой формы', () => {
    const c = cards.find((x) => x.lang === 'ru' && x.stats.actions.some((b) => b.attack))!;
    const f = dndFields(c.stats, 'ru', c.system);
    f['ac'] = 99;
    f['str'] = 30;
    f['save_dex'] = 7;
    f['speed_text'] = '40 фт., полёт 60 фт.';
    f['res_list'] = ['Огонь', 'странный яд'];
    const row = f['actions'].find((r: { atk?: number }) => r.atk !== undefined);
    row.atk = 11;
    row.dmg2 = '2d6';
    f['senses_text'] = 'тёмное зрение 120 фт.; пассивная Внимательность 15';
    const b = dndSync(f, 'ru') as unknown as Dnd5eStats;
    expect(b.ac).toBe(99);
    expect(b.abilities.str).toBe(30);
    expect(b.saves.dex).toBe(7);
    expect(b.speed).toEqual({ walk: 40, fly: 60 });
    expect(b.resistances).toEqual(['fire', 'странный яд']);
    expect(b.senses).toEqual({ passivePerception: 15, darkvision: 120 });
    const a = b.actions.find((x) => x.name === row.name)!.attack!;
    expect(a.bonus).toBe(11);
    expect(a.damage[1]).toBe('2d6');
  });

  it('персонаж: лист → поля → лист без потерь', () => {
    const c: Dnd5eCharacter = {
      ...blankCharacter(),
      player: 'Оля', classes: [{ name: 'Жрец', level: 3 }, { name: 'Воин', subclass: 'Мастер', level: 1 }], race: 'Человек', background: 'Послушник', alignment: 'ЗД', xp: 900,
      abilities: { str: 12, dex: 14, con: 13, int: 8, wis: 16, cha: 10 }, saves: ['wis', 'cha'], skills: { stealth: 1, 'sleight-of-hand': 2 }, pb: 3, inspiration: true,
      ac: 16, hpMax: 28, hitDie: '1d8', speed: 25, initiative: 4, details: { age: '30', eyes: 'серые' },
      attacks: [{ name: 'Булава', bonus: '+5', damage: '1к6 + 3 дробящий', notes: 'рядом' }],
      spellcasting: { ability: 'wis', dc: 14, slots: { 1: 4, 2: 2 }, spells: { 0: 'Свет', 1: 'Лечение ран, Благословение' } },
      coins: { gp: 15, sp: 0 }, text: { features: 'Умение', bonds: 'Храм' }, notes: [{ title: 'Долг', text: '10 зм' }],
    };
    const f = dndFields(c, 'ru', 'dnd5e-2024');
    expect(f['sk_sleight_of_hand']).toBe(2);
    expect(f['attacks'][0]).toMatchObject({ atk: 5, dmg1: '1d6+3' });
    expect(f['level']).toBe(4);
    expect(pick(dndSync(f, 'ru'), Object.keys(c))).toEqual(c);
    expect(pick(dndSync(dndFields(blankCharacter(), 'ru', 'dnd5e-2024'), 'ru'), Object.keys(blankCharacter()))).toEqual(blankCharacter());
  });
});
