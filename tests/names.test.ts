import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addList, entriesFor, filterNames, generateNames, lengthOf, listLang, nameText, parseList, parseListName, racesIn, RACES, soundOf, type NameBook,
} from '../src/shared/names';

const builtin = (lang: string): NameBook => {
  const dir = path.join(__dirname, '../src/modules/tools/names/builtin', lang);
  const book: NameBook = {};
  for (const f of fs.readdirSync(dir)) addList(book, parseListName(f)!, parseList(fs.readFileSync(path.join(dir, f), 'utf8')));
  return book;
};

describe('генератор имён', () => {
  it('имя файла списка: раса, пол, вид; как у выгрузки rpgd100 и свои', () => {
    expect(parseListName('human_man_names.txt')).toEqual({ race: 'human', gender: 'male', kind: 'names' });
    expect(parseListName('elves_woman_nicknames.txt')).toEqual({ race: 'elf', gender: 'female', kind: 'nicknames' });
    expect(parseListName('dwarf_surnames.txt')).toEqual({ race: 'dwarf', gender: 'any', kind: 'surnames' });
    expect(parseListName('orc_male_names.txt')).toEqual({ race: 'orc', gender: 'male', kind: 'names' });
    expect(parseListName('any_any_epithets.txt')).toEqual({ race: 'any', gender: 'any', kind: 'epithets' });
    expect(parseListName('notes.txt')).toBeNull();
    expect(parseListName('human_man_cats.txt')).toBeNull();
  });

  it('строки списка: без кавычек, пустых строк, комментариев и повторов', () => {
    expect(parseList('«Смурной»\n\n# комментарий\n"Тощий"\n«Смурной»\n Ушлый ')).toEqual(['Смурной', 'Тощий', 'Ушлый']);
    expect(listLang('Эоландир')).toBe('ru');
    expect(listLang('Aelith')).toBe('en');
  });

  it('длина и звучание', () => {
    expect(lengthOf('Pip')).toBe('short');
    expect(lengthOf('Aldric')).toBe('medium');
    expect(lengthOf('Nimblefingers')).toBe('long');
    expect(soundOf('Grukk')).toBe('harsh');
    expect(soundOf('Aelia')).toBe('melodic');
    expect(filterNames(['Aldric', 'Alaric', 'Bertram'], { length: 'any', sound: 'any', first: 'al' })).toEqual(['Aldric', 'Alaric']);
    expect(filterNames(['Ёжик', 'Ерёма'], { length: 'any', sound: 'any', first: 'е' })).toEqual(['Ёжик', 'Ерёма']);
  });

  it('свои списки добавляются к встроенным; прозвища и фамилии «для любой расы» — тоже', () => {
    const book: NameBook = {};
    addList(book, { race: 'human', gender: 'male', kind: 'names' }, ['Aldric']);
    addList(book, { race: 'human', gender: 'male', kind: 'names' }, ['Aldric', 'Bram']);
    addList(book, { race: 'any', gender: 'any', kind: 'nicknames' }, ['the Lame']);
    expect(entriesFor(book, 'human', 'male', 'names')).toEqual(['Aldric', 'Bram']);
    expect(entriesFor(book, 'human', 'male', 'nicknames')).toEqual(['the Lame']);
    expect(entriesFor(book, 'human', 'female', 'names')).toEqual([]);
  });

  it('генерация: сколько просили, без повторов; не больше, чем имён после фильтров', () => {
    const book = builtin('en');
    const o = { race: 'elf', gender: 'female' as const, form: 'full' as const, nickname: 'simple' as const, length: 'any' as const, sound: 'any' as const, first: '', count: 20 };
    const list = generateNames(book, o);
    expect(list).toHaveLength(20);
    expect(new Set(list.map((g) => nameText(g, (s) => `"${s}"`))).size).toBe(20);
    for (const g of list) expect(g.surname && g.nickname).toBeTruthy();
    expect(generateNames(book, { ...o, first: 'Ae', form: 'name', nickname: 'none' }).every((g) => g.name.startsWith('Ae') && !g.surname)).toBe(true);
    expect(generateNames(book, { ...o, first: 'Zz' })).toEqual([]);
    expect(nameText({ name: 'Aldric', surname: 'Moor', epithet: 'the Bold' }, (s) => s)).toBe('Aldric Moor, the Bold');
  });

  for (const lang of ['en', 'ru']) {
    it(`встроенные списки (${lang}): все расы и оба пола, у каждого звучания и длины есть имена`, () => {
      const book = builtin(lang);
      expect(racesIn(book)).toEqual([...RACES]);
      const all: string[] = [];
      for (const race of RACES) {
        for (const g of ['male', 'female'] as const) {
          expect(entriesFor(book, race, g, 'names').length, `${race} ${g}`).toBeGreaterThanOrEqual(30);
          expect(entriesFor(book, race, g, 'surnames').length).toBeGreaterThan(20);
          expect(entriesFor(book, race, g, 'nicknames').length).toBeGreaterThan(30);
          expect(entriesFor(book, race, g, 'epithets').length).toBeGreaterThan(30);
          all.push(...entriesFor(book, race, g, 'names'));
        }
      }
      for (const s of ['melodic', 'soft', 'harsh'] as const) expect(all.filter((n) => soundOf(n) === s).length, s).toBeGreaterThan(30);
      for (const l of ['short', 'medium', 'long'] as const) expect(all.filter((n) => lengthOf(n) === l).length, l).toBeGreaterThan(10);
    });
  }
});

describe('свои списки в библиотеке', () => {
  it('загрузка: язык по буквам, имя файла приводится к виду раса_пол_вид, непонятные — в ошибки', async () => {
    const os = await import('node:os');
    const { importNameLists, listNameLists } = await import('../src/main/names');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-names-'));
    try {
      const src = path.join(tmp, 'src');
      fs.mkdirSync(src);
      fs.writeFileSync(path.join(src, 'elves_man_names.txt'), 'Эоландир\nКелебрион\n');
      fs.writeFileSync(path.join(src, 'orc_male_names.txt'), 'Grukk\nMorgash\n');
      fs.writeFileSync(path.join(src, 'notes.txt'), 'что-то');
      fs.writeFileSync(path.join(src, 'human_woman_nicknames.txt'), '\n\n');
      const lib = path.join(tmp, 'lib');
      const r = importNameLists(lib, ['elves_man_names.txt', 'orc_male_names.txt', 'notes.txt', 'human_woman_nicknames.txt'].map((f) => path.join(src, f)));
      expect(r.count).toBe(2);
      expect(r.errors).toHaveLength(2);
      const lists = listNameLists(lib);
      expect(lists.map((l) => l.file).sort()).toEqual(['en/orc_man_names.txt', 'ru/elf_man_names.txt']);
      expect(listNameLists(null)).toEqual([]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
