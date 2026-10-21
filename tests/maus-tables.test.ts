import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, generate, hex, KINDS, landmarkDetailRow, rangeOf, room, rowFor, settlement, treasure, treasureItem, weather, type Line } from '../src/modules/tools/maus/generate';
import { lineText } from '../src/modules/tools/maus/text';
import { SRD_TABLES } from '../src/modules/tools/maus/srd';

// Rolls in a fixed order (then 1 forever).
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++] ?? 1;
};
const labels = (lines: Line[]) => lines.map((l) => l.label);

describe('Mausritter tables', () => {
  it('ranges and rows', () => {
    expect([rangeOf('3-5'), rangeOf('3–5'), rangeOf('5+'), rangeOf('11'), rangeOf('')]).toEqual([[3, 5], [3, 5], [5, Infinity], [11, 11], null]);
    expect(rowFor('governance', 7)).toBe(2);
    expect(rowFor('treasure', 7)).toBe(5);
  });

  it('English and Russian tables have the same rows', () => {
    for (const id of Object.keys(SRD_TABLES.en)) expect(SRD_TABLES.ru[id]!.rows.length).toBe(SRD_TABLES.en[id]!.rows.length);
  });

  it('settlement: size is the lower of 2d6; cities get two features, towns two trades; hamlets and up — a tavern', () => {
    const city = settlement(seq(6, 6));
    expect(city.lines[0]!.cells[0]!.row).toBe(5);
    expect(labels(city.lines).filter((l) => l === 'feature')).toHaveLength(2);
    expect(labels(city.lines).filter((l) => l === 'industry')).toHaveLength(2);
    expect(labels(city.lines)).toContain('tavern');
    const farm = settlement(seq(1, 6));
    expect(labels(farm.lines).filter((l) => l === 'feature')).toHaveLength(1);
    expect(labels(farm.lines)).not.toContain('tavern');
  });

  it('hex: the landmark column follows the hex type; landmark details by d6 and d8', () => {
    const river = hex(seq(5, 3));
    expect(river.lines[1]!.cells[0]!.col).toBe(3);
    expect(lineText(river.lines[1]!, 'en')).toBe('Draping willow');
    expect(landmarkDetailRow(1, 7)).toBe(0);
    expect(landmarkDetailRow(2, 1)).toBe(1);
    expect(landmarkDetailRow(6, 8)).toBe(40);
  });

  it('rooms: a lair (d6 6) with a creature on 1–5 and treasure on 1–4', () => {
    const lair = room(1, seq(6, 5, 4, 2));
    expect(lair.extra?.key).toBe('room.creature+treasure');
    const empty = room(2, seq(1, 4, 2, 1));
    expect(empty.extra?.key).toBe('room.none');
  });

  it('treasure: two d20 and one more per «yes»; a magic sword may be cursed; pips are counted', () => {
    expect(treasure({ former: true, magical: false, guarded: true, adversity: false }).lines).toHaveLength(4);
    // d20 1 — a sword: class d6 2, sword d10 3, cursed (d6 1), curse d6 4.
    const sword = treasureItem(seq(1, 2, 3, 1, 4));
    expect(sword.extra?.key).toBe('cursed');
    expect(lineText(sword.sub![1]!, 'en')).toBe('Rusty nail — Critical damage: Give a Frightened Condition');
    const box = treasureItem(seq(11, 3));
    expect(box.extra).toEqual({ key: 'pips', params: { count: 300 } });
  });

  it('weather: bold weather is poor for travel', () => {
    expect(weather({ season: 'Winter' }, seq(1, 1)).lines[0]!.extra?.key).toBe('poor');
    expect(weather({ season: 'Spring' }, seq(6, 6)).lines[0]!.extra).toBeUndefined();
  });

  it('every table gives text in both languages', () => {
    for (let n = 0; n < 200; n++) {
      for (const kind of KINDS) {
        const r = generate(kind, { ...DEFAULT_OPTIONS, former: true, magical: true, season: 'Autumn' });
        const all = (ls: Line[]): Line[] => ls.flatMap((l) => [l, ...all(l.sub ?? [])]);
        for (const l of all(r.lines)) {
          for (const lang of ['en', 'ru'] as const) expect(lineText(l, lang).trim()).not.toBe('');
        }
      }
    }
  });
});
