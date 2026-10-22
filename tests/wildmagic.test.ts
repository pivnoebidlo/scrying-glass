import { describe, expect, it } from 'vitest';
import en2014 from '../resources/compendium/dnd5e-2014.en.json';
import ru2014 from '../resources/compendium/dnd5e-2014.ru.json';
import en2024 from '../resources/compendium/dnd5e-2024.en.json';
import ru2024 from '../resources/compendium/dnd5e-2024.ru.json';
import { dieOf, isSurge, parseOwnTables, parseTable, rangeText, rowFor, surgeRows } from '../src/modules/tools/wildmagic/tables';

type Book = { entries: { title: string; type: string; body: string; en?: string }[] };
const covers = (rows: { from: number; to: number }[], die: number) => {
  for (let n = 1; n <= die; n++) expect(rows.filter((r) => n >= r.from && n <= r.to).length, `${n}`).toBe(1);
};

describe('дикая магия', () => {
  it('наша таблица: 50 строк по два числа, к100 без дыр; заклинания — из справочника обеих редакций', () => {
    for (const lang of ['en', 'ru']) {
      const rows = surgeRows(lang);
      expect(rows.length).toBe(50);
      expect(dieOf(rows)).toBe(100);
      covers(rows, 100);
    }
    for (const [lang, books] of [['en', [en2014, en2024]], ['ru', [ru2014, ru2024]]] as [string, Book[]][]) {
      for (const b of books) {
        const spells = new Set(b.entries.filter((e) => e.type === 'spell').map((e) => e.title.toLowerCase()));
        for (const r of surgeRows(lang))
          for (const m of r.text.matchAll(/\*([^*]+)\*/g)) {
            // Exactly the title: only then the italics become a link.
            expect(spells.has(m[1]!.toLowerCase()), `${lang}: ${m[1]}`).toBe(true);
          }
      }
    }
  });

  it('палочка чудес из справочника: обе редакции, оба языка — к100 без дыр (слитые строки 2014 разделяются)', () => {
    for (const b of [en2014, ru2014, en2024, ru2024] as Book[]) {
      const e = b.entries.find((x) => (x.en ?? x.title) === 'Wand of Wonder')!;
      const rows = parseTable(e.body.split('\n').filter((l) => l.trim().startsWith('|')).join('\n'));
      expect(dieOf(rows)).toBe(100);
      covers(rows, 100);
      expect(rows.every((r) => !/\d{2}[-–]\d{2}\s+(You|Вы)/.test(r.text))).toBe(true);
    }
  });

  it('свои таблицы: строки с числами, Markdown, просто строки; продолжение строки; 00 — это 100', () => {
    expect(parseTable('01–50 Тишина\n51-99 Гром\n00 Всё сразу')).toEqual([
      { from: 1, to: 50, text: 'Тишина' },
      { from: 51, to: 99, text: 'Гром' },
      { from: 100, to: 100, text: 'Всё сразу' },
    ]);
    expect(parseTable('| d20 | Effect |\n|---|---|\n| 01-10 | Sparks. 11-20 Smoke. |')).toEqual([
      { from: 1, to: 10, text: 'Sparks.' },
      { from: 11, to: 20, text: 'Smoke.' },
    ]);
    const plain = parseTable('Sparks\n# a comment\nSmoke\nFrogs');
    expect(plain.map((r) => r.from)).toEqual([1, 2, 3]);
    expect(dieOf(plain)).toBe(3);
    expect(parseTable('1. Sparks fly\n   and land far away\n2) Smoke')[0]!.text).toBe('Sparks fly and land far away');
    // A number inside the text is not a new row.
    expect(parseTable('01-50 On a 01-25, a rat appears.').length).toBe(1);
    const t = { id: 'x', title: 'x', die: 100, rows: parseTable('01–50 A\n51–100 B') };
    expect(rowFor(t, 51)?.text).toBe('B');
    expect(rangeText(t.rows[0]!, 100)).toBe('01–50');
    expect(parseOwnTables({ tables: [{ id: 'a', title: 'A', text: '1 x' }, { id: 1 }] })).toEqual([{ id: 'a', title: 'A', text: '1 x' }]);
  });

  it('проверка всплеска: 2014 — на 1, 2024 — на 20', () => {
    expect(isSurge(1, '2014')).toBe(true);
    expect(isSurge(20, '2014')).toBe(false);
    expect(isSurge(20, '2024')).toBe(true);
    expect(isSurge(1, '2024')).toBe(false);
  });
});
