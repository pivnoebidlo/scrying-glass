import { describe, expect, it } from 'vitest';
import en2014 from '../content/dnd5e-srd/compendium/dnd5e-2014.en.json';
import ru2014 from '../content/dnd5e-srd/compendium/dnd5e-2014.ru.json';
import en2024 from '../content/dnd5e-srd/compendium/dnd5e-2024.en.json';
import ru2024 from '../content/dnd5e-srd/compendium/dnd5e-2024.ru.json';
import { dieOf, parseOwnTables, parseTable, rangeText, tableBody } from '../src/systems/dnd5e/tools/wildmagic/tables';
import { parseRollTable } from '../src/shared/rolltable';

type Book = { entries: { title: string; type: string; body: string; en?: string }[] };
const covers = (rows: { from: number; to: number }[], die: number) => {
  for (let n = 1; n <= die; n++) expect(rows.filter((r) => n >= r.from && n <= r.to).length, `${n}`).toBe(1);
};

describe('дикая магия', () => {
  it('таблицы в справочнике обеих редакций: к100 без дыр, ссылки ведут на заклинания, а не бросают дальше', () => {
    for (const b of [en2014, ru2014, en2024, ru2024] as unknown as Book[]) {
      const spells = new Set(b.entries.filter((e) => e.type === 'spell').map((e) => e.title));
      const tables = b.entries.filter((e) => e.type === 'table');
      expect(tables.length).toBe(2);
      for (const e of tables) {
        const t = parseRollTable(e.body, 'd100')!;
        expect(t, e.title).toBeTruthy();
        for (let n = 1; n <= 100; n++) expect(t.rows.filter((r) => n >= r.range.from && n <= r.range.to).length, `${e.title} ${n}`).toBe(1);
        for (const m of e.body.matchAll(/\[\[([^\]|]+)/g)) expect(spells.has(m[1]!), m[1]).toBe(true);
      }
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
    expect(rangeText(parseTable('01–50 A\n51–100 B')[0]!, 100)).toBe('01–50');
    const moved = tableBody({ id: 'a', title: 'Мои', text: '01–50 A | a\n51–00 B' })!;
    expect(moved.die).toBe(100);
    expect(parseRollTable(moved.body, 'd100')!.rows.length).toBe(2);
    expect(parseOwnTables({ tables: [{ id: 'a', title: 'A', text: '1 x' }, { id: 1 }] })).toEqual([{ id: 'a', title: 'A', text: '1 x' }]);
  });
});
