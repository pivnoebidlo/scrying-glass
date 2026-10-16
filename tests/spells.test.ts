import { describe, expect, it } from 'vitest';
import { blankStats, type Dnd5eStats } from '../src/systems/dnd5e/stats';
import { groupLabel, newSpellcasting, parseSpellcasting, spellBlock, type Spellcasting } from '../src/systems/dnd5e/spells';

const acolyte = (): Dnd5eStats => ({ ...blankStats(), abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 11 }, pb: 2 });

describe('колдовство в статблоке', () => {
  it('подписи групп', () => {
    expect(groupLabel({ kind: 'level', level: 1, slots: 3, spells: [] }, 'ru')).toBe('1-й уровень (3 ячейки)');
    expect(groupLabel({ kind: 'level', level: 2, slots: 5, spells: [] }, 'ru')).toBe('2-й уровень (5 ячеек)');
    expect(groupLabel({ kind: 'level', level: 3, slots: 1, spells: [] }, 'en')).toBe('3rd level (1 slot)');
    expect(groupLabel({ kind: 'day', times: 1, each: true, spells: [] }, 'ru')).toBe('1/день каждое');
    expect(groupLabel({ kind: 'will', spells: [] }, 'en')).toBe('At will');
  });

  it('блок: СЛ и атака считаются от характеристики, пустые группы не показываются', () => {
    const sc: Spellcasting = { where: 'traits', ability: 'wis', groups: [{ kind: 'cantrips', spells: ['Свет', 'Священное пламя'] }, { kind: 'will', spells: [] }] };
    const b = spellBlock(acolyte(), sc, 'ru', 'dnd5e-2014');
    expect(b.name).toBe('Использование заклинаний');
    expect(b.text).toBe('Заклинательная характеристика — Мудрость (СЛ спасброска 12, +4 к атаке заклинаниями).\n\n- **Заговоры (неограниченно):** *Свет*, *Священное пламя*');
    expect(b.attack).toEqual({ bonus: 4, damage: [] });
    expect(spellBlock(acolyte(), { ...sc, dc: 15, attack: 7 }, 'en', 'dnd5e-2024').text).toContain('spell save DC 15, +7 to hit');
    expect(spellBlock(acolyte(), sc, 'ru', 'dnd5e-2024').name).toBe('Сотворение заклинаний');
  });

  it('новое колдовство — от самой высокой ментальной характеристики', () => {
    expect(newSpellcasting(acolyte(), 'dnd5e-2024')).toMatchObject({ ability: 'wis', where: 'actions' });
  });

  it('разбор SRD 2014 по-русски', () => {
    const sc = parseSpellcasting(
      {
        name: 'Использование заклинаний',
        text: 'Послушник является заклинателем 1-го уровня. Его базовой характеристикой заклинаний является Мудрость (СЛ спасброска от заклинаний 12, +4 к попаданию атаками заклинаниями). У послушника подготовлены следующие заклинания жреца:\n\nЗаговоры (неограниченно): *Свет*, *Священное пламя*, *Тауматургия*\n1-й уровень (3 ячейки): *Благословение*, *Лечение ран*, *Святилище*',
      },
      'traits',
      acolyte()
    );
    expect(sc).toEqual({
      where: 'traits',
      ability: 'wis',
      groups: [
        { kind: 'cantrips', spells: ['Свет', 'Священное пламя', 'Тауматургия'] },
        { kind: 'level', level: 1, slots: 3, spells: ['Благословение', 'Лечение ран', 'Святилище'] },
      ],
    });
  });

  it('разбор SRD 2024: заданные СЛ и атака сохраняются, «без материальных компонентов» — в примечание', () => {
    const sc = parseSpellcasting(
      {
        name: 'Сотворение заклинаний',
        text: 'Дракон сотворяет одно из следующих заклинаний, не требуя материальных компонентов и используя Харизму как заклинательную характеристику (СЛ спасброска 17, +9 к атаке заклинаниями):\n\n- **По желанию:** *Обнаружение магии*, *Страх*\n- **1/день каждое:** *Разговор с мёртвыми*, *Сфера кислоты*',
      },
      'actions',
      acolyte()
    );
    expect(sc).toMatchObject({ ability: 'cha', dc: 17, attack: 9, note: 'Не требует материальных компонентов.' });
    expect(sc!.groups).toEqual([
      { kind: 'will', spells: ['Обнаружение магии', 'Страх'] },
      { kind: 'day', times: 1, each: true, spells: ['Разговор с мёртвыми', 'Сфера кислоты'] },
    ]);
  });

  it('разбор по-английски; без групп — null', () => {
    const sc = parseSpellcasting({ name: 'Spellcasting', text: 'The acolyte is a 1st-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks). The acolyte has following cleric spells prepared:\n\n- Cantrips (at will): light, sacred flame\n- 1st level (3 slots): bless, cure wounds' }, 'traits', acolyte());
    expect(sc!.groups).toEqual([
      { kind: 'cantrips', spells: ['light', 'sacred flame'] },
      { kind: 'level', level: 1, slots: 3, spells: ['bless', 'cure wounds'] },
    ]);
    expect(parseSpellcasting({ name: 'Spellcasting', text: 'Magic.' }, 'traits', acolyte())).toBeNull();
  });
});
