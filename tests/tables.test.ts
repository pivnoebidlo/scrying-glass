import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { expand, parseTable, rollTable, tableDie, tableKey } from '../src/shared/tables';
import { createTable, isTablePath, listLibraryTables, readTable, seedLibraryTables, tableResolver, writeTable } from '../src/main/tables';

// Ядро ходит в Electron только за окнами (рассылка событий) — в тестах окон нет.
vi.mock('electron', () => ({ BrowserWindow: { getAllWindows: () => [] } }));

// Предсказуемая «случайность»: значения по кругу.
const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length]!;
};

describe('разбор таблиц', () => {
  it('название, пояснение, варианты списком и с весом', () => {
    const t = parseTable('# Слухи\n\nЧто болтают в таверне.\n\n- Мельник хитрит\n- 3× Огни на болоте\n* Звёздочкой тоже можно', 'файл');
    expect(t.title).toBe('Слухи');
    expect(t.description).toBe('Что болтают в таверне.');
    expect(t.entries.map((e) => [e.text, e.weight])).toEqual([['Мельник хитрит', 1], ['Огни на болоте', 3], ['Звёздочкой тоже можно', 1]]);
    expect(tableDie(t)).toBeNull();
  });

  it('диапазоны, номера и строки Markdown-таблицы — как d20', () => {
    const t = parseTable('1-3: Ясно\n4. Дождь\n| d6 | Погода |\n|---|---|\n| 5–6 | Гроза | ливень |', 'Погода');
    expect(t.title).toBe('Погода');
    expect(t.entries.map((e) => [e.from, e.to, e.text])).toEqual([[1, 3, 'Ясно'], [4, 4, 'Дождь'], [5, 6, 'Гроза · ливень']]);
    expect(tableDie(t)).toBe(6);
  });
});

describe('броски по таблицам', () => {
  it('таблица с номерами: число и вариант по диапазону', () => {
    const t = parseTable('1-3: Ясно\n4-6: Дождь', 'Погода');
    expect(rollTable(t, { resolve: () => null, random: seq(0.6) })).toEqual({ index: 1, number: 4, text: 'Дождь' });
  });

  it('вес учитывается', () => {
    const t = parseTable('- редко\n- 9× часто', 'т');
    expect(rollTable(t, { resolve: () => null, random: seq(0.05) })!.text).toBe('редко');
    expect(rollTable(t, { resolve: () => null, random: seq(0.5) })!.text).toBe('часто');
  });

  it('ссылки на другие таблицы, выбор из вариантов, кубы', () => {
    const names = parseTable('# Имена\n- Борин', 'Имена');
    const resolve = (n: string) => (tableKey(n) === tableKey('имена') ? names : null);
    expect(expand('[[Имена]], {кузнец|пекарь}', { resolve, random: seq(0.9) })).toBe('Борин, пекарь');
    expect(expand('[[Имена|подпись]] и [[Нет такой]]', { resolve })).toBe('Борин и Нет такой');
    const gold = Number(expand('{2d6+1}', { resolve }));
    expect(gold).toBeGreaterThanOrEqual(3);
    expect(gold).toBeLessThanOrEqual(13);
    expect(expand('{просто скобки}', { resolve })).toBe('{просто скобки}');
  });

  it('таблица, которая ссылается сама на себя, не зацикливается', () => {
    const self = parseTable('# Эхо\n- эхо [[Эхо]]', 'Эхо');
    const text = rollTable(self, { resolve: () => self })!.text;
    expect(text.startsWith('эхо эхо')).toBe(true);
  });

  it('названия сравниваются без регистра и с «ё» = «е»', () => {
    expect(tableKey('  Ёжики  в тумане ')).toBe(tableKey('ежики в тумане'));
  });
});

describe('встроенные таблицы', () => {
  const dir = path.join(__dirname, '../src/modules/tools/tables/builtin');
  const list = fs.readdirSync(dir).map((f) => parseTable(fs.readFileSync(path.join(dir, f), 'utf8'), f.replace(/\.md$/, '')));
  const resolve = (n: string) => list.find((t) => tableKey(t.title) === tableKey(n)) ?? null;

  it('в каждой есть варианты, название совпадает с именем файла', () => {
    for (const t of list) expect(t.entries.length, t.title).toBeGreaterThan(3);
    expect(fs.readdirSync(dir).map((f) => f.replace(/\.md$/, '')).sort()).toEqual(list.map((t) => t.title).sort());
  });

  it('все [[ссылки]] находят таблицу, после броска не остаётся скобок', () => {
    for (const t of list) {
      for (const e of t.entries) {
        for (const m of e.text.matchAll(/\[\[([^\]|]+)/g)) expect(resolve(m[1]!), `${t.title}: ${m[1]}`).not.toBeNull();
      }
      for (let i = 0; i < 20; i++) expect(rollTable(t, { resolve })!.text, t.title).not.toMatch(/[[\]{}]/);
    }
  });
});

describe('таблицы в библиотеке', () => {
  it('встроенные кладутся один раз: удалённая сама не возвращается, «вернуть» — возвращает', () => {
    const lib = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-lib-'));
    try {
      const files = [{ name: 'Погода', text: '- ясно' }, { name: 'Слухи', text: '- слух' }];
      expect(seedLibraryTables(lib, files)).toBe(2);
      fs.rmSync(path.join(lib, 'tables', 'Погода.md'));
      expect(seedLibraryTables(lib, files)).toBe(0);
      expect(listLibraryTables(lib).map((t) => t.path)).toEqual(['library:tables/Слухи.md']);
      // Новая встроенная таблица в следующей версии приложения — кладётся.
      expect(seedLibraryTables(lib, [...files, { name: 'Имена', text: '- Борин' }])).toBe(1);
      expect(seedLibraryTables(lib, files, true)).toBe(1);
      expect(fs.existsSync(path.join(lib, 'tables', 'Погода.md'))).toBe(true);
    } finally {
      fs.rmSync(lib, { recursive: true, force: true });
    }
  });

  it('пути таблиц: хранилище — только в папках таблиц, библиотека — только в tables/', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-tables-'));
    try {
      const resolve = tableResolver((r) => path.join(root, 'vault', r), (r) => path.join(root, 'lib', r));
      expect(isTablePath('Страд/таблицы/Слухи.md')).toBe(true);
      expect(isTablePath('Страд/заметки/Слухи.md')).toBe(false);
      expect(isTablePath('library:tables/Слухи.md')).toBe(true);
      expect(isTablePath('library:cards/x.md')).toBe(false);
      expect(createTable(resolve, 'Страд/заметки', 'Т', '- а')).toBeNull();
      const v = createTable(resolve, 'Страд/таблицы', 'Слухи: новые', '- а')!;
      const l = createTable(resolve, 'library:tables', 'Слухи', '- б')!;
      expect([v, l]).toEqual(['Страд/таблицы/Слухи новые.md', 'library:tables/Слухи.md']);
      expect(writeTable(resolve, l, '- в')).toBe(true);
      expect(readTable(resolve, l)).toBe('- в');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
