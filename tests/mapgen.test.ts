import { describe, expect, it } from 'vitest';
import { generateLayout, LAYOUT_STYLES, roomCentre, type Layout } from '../src/modules/tools/mapgen/layout';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// Floor cells reachable from the first room.
function reached(l: Layout) {
  const a = l.rooms[0]!;
  const key = (x: number, y: number) => `${x},${y}`;
  let start = { x: a.x + (a.w >> 1), y: a.y + (a.h >> 1) };
  const seen = new Set([key(start.x, start.y)]);
  const stack = [start];
  while (stack.length) {
    start = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = start.x + dx;
      const y = start.y + dy;
      if (l.cells[y]?.[x] === '.' && !seen.has(key(x, y))) {
        seen.add(key(x, y));
        stack.push({ x, y });
      }
    }
  }
  return seen;
}

describe('генератор карт', () => {
  const r = seeded(17);
  const variants = LAYOUT_STYLES.flatMap((style) => [3, 5, 8, 12].flatMap((rooms) => [false, true].map((chain) => ({ style, rooms, chain }))));

  it('любой вид и размер: все комнаты связаны, вся земля достижима, края — камень', () => {
    for (const v of variants) {
      for (let i = 0; i < 15; i++) {
        const l = generateLayout(v.style, { rooms: v.rooms, chain: v.chain }, r);
        expect(l.rooms).toHaveLength(v.rooms);
        expect(l.cells).toHaveLength(l.h);
        for (const row of l.cells) expect(row).toHaveLength(l.w);
        const seen = reached(l);
        for (const a of l.rooms) expect(seen.has(`${a.x + (a.w >> 1)},${a.y + (a.h >> 1)}`), JSON.stringify(v)).toBe(true);
        expect(seen.size).toBe(l.cells.join('').split('.').length - 1);
        expect(l.cells[0]).not.toContain('.');
        expect(l.cells.at(-1)).not.toContain('.');
        for (const row of l.cells) expect(row[0] + row.at(-1)!).toBe('##');
      }
    }
  });

  it('у постройки двери стоят на полу, комнаты не накладываются, карта разумного размера', () => {
    for (let i = 0; i < 80; i++) {
      const l = generateLayout('building', { rooms: 8 }, r);
      expect(l.doors.length).toBeGreaterThan(0);
      for (const d of l.doors) {
        expect(l.cells[d.y]![d.x]).toBe('.');
        // A door stands in a passage: floor on both sides along the way, rock at its ends.
        const [dx, dy] = d.along === 'x' ? [1, 0] : [0, 1];
        expect(l.cells[d.y + dy]![d.x + dx]! + l.cells[d.y - dy]![d.x - dx]!).toBe('..');
        expect(l.cells[d.y + dx]![d.x + dy]! + l.cells[d.y - dx]![d.x - dy]!, JSON.stringify(d)).toBe('##');
      }
      l.rooms.forEach((a, n) => {
        for (const b of l.rooms.slice(n + 1)) expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true);
      });
      expect(Math.max(l.w, l.h)).toBeLessThanOrEqual(200);
    }
  });

  it('большая комната больше; у пещеры нет дверей; метка — в долях карты; данные переживают JSON', () => {
    const big = generateLayout('building', { rooms: 5, chain: true, big: [3] }, r);
    expect(big.rooms[3]!.w).toBeGreaterThanOrEqual(8);
    const c = generateLayout('cave', { rooms: 5 }, r);
    expect(c.doors).toEqual([]);
    const p = roomCentre(c, 2);
    expect(p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1).toBe(true);
    expect(JSON.parse(JSON.stringify(c))).toEqual(c);
  });
});
