import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '../src/shared/i18n';

// Subtitles are checked in Russian (the built-in compendium is Russian).
beforeAll(() => setLang('ru'));
afterAll(() => setLang('en'));
import { castingKind, entrySubtitle, keyFrom, NO_SPELL_FILTER, spellFilterOn, spellMatches, type SpellFilter, parseCustomTypes, parseEntry, serializeEntry, type BuiltinBook } from '../src/shared/compendium';

describe('записи справочника', () => {
  it('шапка: строки, числа, да/нет, списки в обоих видах; без шапки — заметка', () => {
    const e = parseEntry(
      '---\ntype: spell\nlevel: 3\nschool: Воплощение\nconcentration: false\nclasses: [Волшебник, Чародей]\ntags:\n  - огонь\n  - "урон: огнём"\nrange: "150 футов"\n---\n\nЯркая вспышка.\n',
      'Огненный шар',
    );
    expect(e).toEqual({
      title: 'Огненный шар',
      type: 'spell',
      fields: { level: 3, school: 'Воплощение', concentration: false, classes: ['Волшебник', 'Чародей'], tags: ['огонь', 'урон: огнём'], range: '150 футов' },
      body: 'Яркая вспышка.\n',
    });
    expect(parseEntry('Просто текст', 'Заметка').type).toBe('note');
    expect(entrySubtitle(e)).toBe('3 уровень, воплощение');
  });

  it('запись и чтение — туда и обратно; пустые поля не пишутся, опасные строки — в кавычках', () => {
    const e = { title: 'Плащ', type: 'item', fields: { rarity: 'Необычный', attunement: 'да', cost: '', tags: ['одежда'], note: 'a: b', n: '42' }, body: '# Плащ\n\nТекст' };
    const text = serializeEntry(e);
    expect(text).toBe('---\ntype: item\nrarity: Необычный\nattunement: да\ntags:\n  - одежда\nnote: "a: b"\nn: "42"\n---\n\n# Плащ\n\nТекст\n');
    const back = parseEntry(text, 'Плащ');
    expect(back.fields).toEqual({ rarity: 'Необычный', attunement: 'да', tags: ['одежда'], note: 'a: b', n: '42' });
    expect(entrySubtitle(back)).toBe('Предмет, необычный, требует настройки');
  });
});

import { entryHtml } from '../src/renderer/lib/entry/markup';

describe('разметка записи', () => {
  it('заголовки, списки, таблицы, ссылки; текст экранируется', () => {
    expect(entryHtml('## На высоких уровнях\nУрон **растёт** на [[Огненный шар|1к6]] <b>.\n\n- раз\n- два\n\n| Ур | Урон |\n|---|---|\n| 3 | 8к6 |')).toBe(
      '<h3>На высоких уровнях</h3><p>Урон <strong>растёт</strong> на <a class="wikilink" data-link="Огненный шар">1к6</a> &lt;b&gt;.</p><ul><li>раз</li><li>два</li></ul><table><thead><tr><th>Ур</th><th>Урон</th></tr></thead><tbody><tr><td>3</td><td>8к6</td></tr></tbody></table>',
    );
  });
});

describe('встроенный справочник', () => {
  for (const system of ['dnd5e-2014', 'dnd5e-2024']) {
    it(`${system}: у заклинаний и предметов есть поля, названия не повторяются`, async () => {
      const fs = await import('node:fs');
      const book = JSON.parse(fs.readFileSync(`resources/compendium/${system}.json`, 'utf8')) as BuiltinBook;
      const spells = book.entries.filter((e) => e.type === 'spell');
      expect(spells.length).toBeGreaterThan(300);
      for (const s of spells) {
        expect(typeof s.fields['level']).toBe('number');
        expect(s.fields['school'], s.title).toBeTruthy();
        expect(s.fields['casting_time'], s.title).toBeTruthy();
      }
      expect(book.entries.filter((e) => e.type === 'item').every((e) => e.fields['category'])).toBe(true);
      expect(book.entries.filter((e) => e.type === 'condition').length).toBe(15);
      const keys = book.entries.map((e) => `${e.type}/${e.title}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  }
});

describe('свои типы записей', () => {
  it('ключ из подписи — латиницей', () => {
    expect(keyFrom('Сфера влияния')).toBe('sfera_vliyaniya');
    expect(keyFrom('Мировоззрение')).toBe('mirovozzrenie');
    expect(keyFrom('3 круг')).toBe('f_3_krug');
    expect(keyFrom('')).toBe('');
  });

  it('разбор файла: встроенные id, повторы, занятые ключи и битые поля пропускаются', () => {
    const types = parseCustomTypes({
      types: [
        { id: 'deity', title: 'Божество', fields: [
          { key: 'alignment', title: 'Мировоззрение', kind: 'select', options: ['Добро', '', 1] },
          { key: 'tags', title: 'Метки' },
          { key: 'alignment', title: 'Повтор' },
          { key: 'domains', title: 'Домены', kind: 'list', subtitle: true },
          { key: 'x', title: 'Странный вид', kind: 'table' },
        ] },
        { id: 'spell', title: 'Не заклинание' },
        { id: 'deity', title: 'Повтор' },
        { id: 'плохо', title: 'Кириллица в ключе' },
        { id: 'faction', title: 'Фракция' },
      ],
    });
    expect(types.map((t) => t.id)).toEqual(['deity', 'faction']);
    expect(types[0]!.fields).toEqual([
      { key: 'alignment', title: 'Мировоззрение', kind: 'select', options: ['Добро'] },
      { key: 'domains', title: 'Домены', kind: 'list', subtitle: true },
      { key: 'x', title: 'Странный вид', kind: 'text' },
    ]);
    expect(types[1]!.plural).toBe('Фракция');
    expect(parseCustomTypes(null)).toEqual([]);
  });

  it('строка под названием и порядок полей в файле — по своему типу', () => {
    const [deity] = parseCustomTypes({ types: [{ id: 'deity', title: 'Божество', fields: [
      { key: 'alignment', title: 'Мировоззрение', kind: 'text', subtitle: true },
      { key: 'domains', title: 'Домены', kind: 'list', subtitle: true },
      { key: 'symbol', title: 'Символ', kind: 'text' },
    ] }] });
    const e = parseEntry('---\ntype: deity\nsymbol: Молот\ndomains: [Война, Кузня]\nalignment: Хаотично-доброе\n---\nТекст', 'Морадин');
    expect(entrySubtitle(e, deity)).toBe('Божество, Хаотично-доброе, Война, Кузня');
    expect(entrySubtitle({ ...e, fields: {} }, deity)).toBe('Божество');
    expect(serializeEntry(e, deity)).toBe('---\ntype: deity\nalignment: Хаотично-доброе\ndomains:\n  - Война\n  - Кузня\nsymbol: Молот\n---\n\nТекст\n');
  });
});

describe('фильтр заклинаний', () => {
  const fireball = { level: 3, school: 'Воплощение', classes: ['Чародей', 'Волшебник'], casting_time: 'Действие' };
  const shield = { level: 1, school: 'Ограждение', classes: ['Чародей', 'Волшебник'], casting_time: 'Реакция, которую вы совершаете…' };
  const detect = { level: 1, school: 'Прорицание', classes: 'Бард, Жрец', casting_time: 'Действие', ritual: true, concentration: true };

  it('время накладывания', () => {
    expect(castingKind('Бонусное действие')).toBe('bonus');
    expect(castingKind('1 минута')).toBe('long');
    expect(castingKind('Action')).toBe('action');
    expect(castingKind(undefined)).toBeNull();
  });

  it('признаки: внутри — любое, между — все', () => {
    const f = (p: Partial<SpellFilter>) => ({ ...NO_SPELL_FILTER, ...p });
    expect(spellMatches(fireball, NO_SPELL_FILTER)).toBe(true);
    expect(spellMatches(fireball, f({ levels: [1, 3] }))).toBe(true);
    expect(spellMatches(shield, f({ levels: [3] }))).toBe(false);
    expect(spellMatches(detect, f({ classes: ['жрец'] }))).toBe(true);
    expect(spellMatches(fireball, f({ classes: ['Жрец'] }))).toBe(false);
    expect(spellMatches(shield, f({ times: ['reaction'], schools: ['Ограждение'] }))).toBe(true);
    expect(spellMatches(fireball, f({ times: ['reaction'] }))).toBe(false);
    expect(spellMatches(detect, f({ ritual: 'yes', concentration: 'yes' }))).toBe(true);
    expect(spellMatches(fireball, f({ ritual: 'yes' }))).toBe(false);
    expect(spellMatches(fireball, f({ concentration: 'no' }))).toBe(true);
    expect(spellFilterOn(NO_SPELL_FILTER)).toBe(false);
    expect(spellFilterOn(f({ ritual: 'yes' }))).toBe(true);
  });
});
