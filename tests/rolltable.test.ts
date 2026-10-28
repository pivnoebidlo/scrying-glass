import { describe, expect, it } from 'vitest';
import { coverage, diceSpan, modelMarkdown, numbersText, parseRange, parseRollTable, rangeText, rollInline, rollOnTable, rowsFor, runTable, stepsMarkdown, tableModel, type TableSource } from '../src/shared/rolltable';

// A die that gives the faces in order.
const faces = (...list: number[]) => {
  let i = 0;
  return () => list[i++ % list.length]!;
};

describe('roll tables', () => {
  it('reads ranges', () => {
    expect(parseRange('3')).toEqual({ from: 3, to: 3 });
    expect(parseRange('01–05')).toEqual({ from: 1, to: 5 });
    expect(parseRange('96-00')).toEqual({ from: 96, to: 100 });
    expect(parseRange('**7-8**')).toEqual({ from: 7, to: 8 });
    expect(parseRange('11+')?.from).toBe(11);
    expect(parseRange('Head')).toBeNull();
    expect(parseRange('5–2')).toBeNull();
  });

  it('reads a Markdown table, the die from the last row', () => {
    const t = parseRollTable('Intro text.\n\n| d8 | Result | Note |\n|---|---|---|\n| 1–4 | Cut | bleeds |\n| 5–8 | Bruise |  |\n')!;
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0]!.cells).toEqual(['Cut — bleeds']);
    expect(t.rowDice.dice).toEqual([{ count: 1, sides: 8 }]);
    expect(rollOnTable(t, faces(6)).text).toBe('Bruise');
  });

  it('reads a grid: one die for the row, another for the column', () => {
    const body = '| d10 \\ d6 | 1–3 | 4–6 |\n|---|---|---|\n| 1–5 | [[A]] | [[B]] |\n| 6–10 | [[C]] | [[D]] |';
    const t = parseRollTable(body, 'к10 × к6')!;
    expect(t.cols).toHaveLength(2);
    expect(t.colDice?.dice).toEqual([{ count: 1, sides: 6 }]);
    const hit = rollOnTable(t, faces(7, 2));
    expect([hit.row.total, hit.col?.total, hit.text]).toEqual([7, 2, '[[C]]']);
    // Without the roll field: the dice are as big as the last row and column.
    expect(parseRollTable(body)!.rowDice.dice[0]!.sides).toBe(10);
  });

  it('sums the dice of a roll, finds no row for a gap', () => {
    const t = parseRollTable('| 2d6 | |\n|---|---|\n| 2–6 | Low |\n| 8–12 | High |', '2d6')!;
    expect(rollOnTable(t, faces(3, 2)).text).toBe('Low');
    expect(rollOnTable(t, faces(3, 4)).text).toBeNull();
  });

  it('goes on with a numbered line wrapped in a PDF', () => {
    const t = parseRollTable('Crits:\n1-2 Melee: your hat slips\nover your eyes.\n3 Ranged: attack again\n\nAfter the table.')!;
    expect(t.rows.map((r) => r.cells[0])).toEqual(['Melee: your hat slips over your eyes.', 'Ranged: attack again']);
  });

  it('reads numbered lines and plain lists', () => {
    expect(parseRollTable('1–2. Rain\n3: Fog\n4-6 Clear')!.rows.map((r) => r.range.to)).toEqual([2, 3, 6]);
    const list = parseRollTable('# Weather\n- Rain\n- Fog\n- Clear')!;
    expect(list.rowDice.dice[0]!.sides).toBe(3);
    expect(rollOnTable(list, faces(2)).text).toBe('Fog');
    expect(parseRollTable('Just a note.')).toBeNull();
  });

  it('rolls dice inside a result', () => {
    expect(rollInline('Bleeds {2d6} rounds, {1к4+1} more', faces(3, 4, 2))).toBe('Bleeds **7** (2d6: 3 + 4) rounds, **3** (1d4 + 1: 2) more');
    expect(rollInline('{no dice}', faces(1))).toBe('{no dice}');
  });

  it('rolls a chain of tables, without loops', () => {
    const tables: Record<string, TableSource> = {
      Crit: { title: 'Crit', path: 'p/Crit.md', table: parseRollTable('- [[Head]] and [[Crit]]')! },
      Head: { title: 'Head', path: 'p/Head.md', table: parseRollTable('- Stunned {1d4} rounds, see [[Stunned]]')! },
    };
    const steps = runTable(tables['Crit']!, (n) => tables[n] ?? null, faces(1));
    expect(steps.map((s) => [s.title, s.depth])).toEqual([
      ['Crit', 0],
      ['Head', 1],
    ]);
    expect(steps[1]!.text).toBe('Stunned **1** (1d4) rounds, see [[Stunned]]');
    expect(stepsMarkdown(steps, '—')).toBe('**Crit** (1d1: 1)\n[[Head]] and [[Crit]]\n\n→ **Head** (1d1: 1)\nStunned **1** (1d4) rounds, see [[Stunned]]');
  });
});

describe('roll table editor model', () => {
  it('reads a table into rows and writes it back', () => {
    const body = 'On a crit.\n\n| к10 \\ к6 | 1–3 | 4–6 |\n|---|---|---|\n| 1–5 | [[A]] | B |\n| 6–10 | C | D |\n\nAfter.';
    const m = tableModel(body, 'к10 × к6', 'к');
    expect([m.dice, m.colDice, m.cols.length, m.rows[1]!.cells, m.intro]).toEqual(['к10', 'к6', 2, ['C', 'D'], 'On a crit.\n\nAfter.']);
    const out = modelMarkdown(m, 'Result');
    expect(out.roll).toBe('к10 × к6');
    const again = tableModel(out.body, out.roll, 'к');
    expect(again.rows).toEqual(m.rows);
    expect(again.intro).toBe(m.intro);
  });

  it('turns a list into a table, a cell keeps one line and no bars', () => {
    const m = tableModel('Weather:\n- Rain\n- Fog', '', 'd');
    expect([m.dice, m.intro, m.rows.length]).toEqual(['d2', 'Weather:', 2]);
    m.rows[0]!.cells[0] = 'Rain | hail\nand wind';
    expect(modelMarkdown(m, 'Result').body).toBe('Weather:\n\n| d2 | Result |\n|---|---|\n| 1 | Rain / hail<br>and wind |\n| 2 | Fog |\n');
    // A multi-line result comes back as lines.
    expect(tableModel(modelMarkdown(m, 'Result').body, 'd2', 'd').rows[0]!.cells[0]).toBe('Rain / hail\nand wind');
  });

  it('makes rows for dice, checks the coverage', () => {
    expect(diceSpan('2к6')).toEqual({ from: 2, to: 12 });
    expect(rowsFor({ from: 2, to: 12 })).toHaveLength(11);
    expect(rowsFor({ from: 1, to: 100 }).map((r) => rangeText(r)).slice(0, 2)).toEqual(['1–10', '11–20']);
    const c = coverage([{ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 6, to: 6 }], { from: 1, to: 6 });
    expect([numbersText(c.gaps), numbersText(c.overlaps)]).toEqual(['4–5', '2']);
  });
});
