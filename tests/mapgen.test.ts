import { describe, expect, it } from 'vitest';
import { cellCentre, generateLayout, groupCells, inReveal, LAYOUT_STYLES, roomCells, roomCentre, roomReveal, walkable, WILD_STYLES, type Layout } from '../src/modules/tools/mapgen/layout';

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
      if (walkable(l.cells[y]?.[x]) && !seen.has(key(x, y))) {
        seen.add(key(x, y));
        stack.push({ x, y });
      }
    }
  }
  return seen;
}

// Many layouts in a row: seconds alone, longer when the whole suite runs at once.
describe('генератор карт', { timeout: 30000 }, () => {
  const r = seeded(17);
  const variants = (['building', 'cave'] as const).flatMap((style) => [3, 5, 8, 12].flatMap((rooms) => [false, true].map((chain) => ({ style, rooms, chain }))));

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

  it('крупные существа: квадрат на полу, не друг на друге; у чётного размера центр — на углу клетки', () => {
    for (let i = 0; i < 60; i++) {
      const l = generateLayout('building', { rooms: 3, chain: true, big: [0] }, r);
      const group = groupCells(l, 0, 2, r, 2);
      const taken = new Set<string>();
      for (const c of group) {
        for (let y = 0; y < 2; y++) {
          for (let x = 0; x < 2; x++) {
            expect(l.cells[c.y + y]![c.x + x]).toBe('.');
            expect(taken.has(`${c.x + x},${c.y + y}`)).toBe(false);
            taken.add(`${c.x + x},${c.y + y}`);
          }
        }
      }
    }
    const l = generateLayout('building', { rooms: 3 }, r);
    expect(cellCentre(l, { x: 4, y: 6 }, 2)).toEqual({ x: 5 / l.w, y: 7 / l.h });
    expect(cellCentre(l, { x: 4, y: 6 })).toEqual({ x: 4.5 / l.w, y: 6.5 / l.h });
  });

  it('открытая комната показывает её и стены, но не другие комнаты и не проходы дальше', () => {
    for (const style of ['building', 'cave'] as const) {
      for (let i = 0; i < 40; i++) {
        const l = generateLayout(style, { rooms: 6, chain: true }, r);
        const rects = roomReveal(l, 2);
        expect(rects.length % 4).toBe(0);
        const seen = new Set<string>();
        for (let n = 0; n < rects.length; n += 4) {
          const x0 = Math.round(rects[n]! * l.w);
          const y = Math.round(rects[n + 1]! * l.h);
          const w = Math.round(rects[n + 2]! * l.w);
          for (let x = x0; x < x0 + w; x++) seen.add(`${x},${y}`);
        }
        const a = l.rooms[2]!;
        expect(seen.has(`${a.x + (a.w >> 1)},${a.y + (a.h >> 1)}`)).toBe(true);
        for (const other of [0, 5]) {
          const b = l.rooms[other]!;
          expect(seen.has(`${b.x + (b.w >> 1)},${b.y + (b.h >> 1)}`)).toBe(false);
        }
        // Floor outside the room is shown only at its doors.
        for (const k of seen) {
          const [x, y] = k.split(',').map(Number) as [number, number];
          const out = x < a.x || y < a.y || x >= a.x + a.w || y >= a.y + a.h;
          if (out && l.cells[y]![x] === '.') expect(l.doors.some((d) => d.x === x && d.y === y), `${style} ${k}`).toBe(true);
        }
      }
    }
  });

  it('открытые пространства: все места связаны тропами, в них можно встать, у края — своя природа', () => {
    for (const style of WILD_STYLES) {
      for (const rooms of [3, 8, 20]) {
        for (let i = 0; i < 15; i++) {
          const l = generateLayout(style, { rooms }, r);
          expect(l.style).toBe(style);
          expect(l.cells).toHaveLength(l.h);
          for (const row of l.cells) expect(row).toHaveLength(l.w);
          expect(Math.max(l.w, l.h)).toBeLessThanOrEqual(200);
          const seen = reached({ ...l, rooms: [l.rooms[0]!] });
          for (const a of l.rooms) expect(seen.has(`${a.x + (a.w >> 1)},${a.y + (a.h >> 1)}`), `${style} ${rooms}`).toBe(true);
          l.rooms.forEach((_, n) => expect(roomCells(l, n).length, style).toBeGreaterThan(8));
          expect(l.doors).toEqual([]);
        }
      }
    }
    const all = (style: (typeof WILD_STYLES)[number]) => generateLayout(style, { rooms: 6 }, r).cells.join('');
    expect(all('shore')).toMatch(/~/);
    expect(all('shore')).toMatch(/S/);
    expect(all('forest').split('T').length).toBeGreaterThan(all('meadow').split('T').length);
    expect(all('swamp')).toMatch(/~/);
  });

  it('место открывается кругом вокруг себя, не дальше двух клеток от поляны', () => {
    const l = generateLayout('forest', { rooms: 5 }, r);
    const rects = roomReveal(l, 1);
    const a = l.rooms[1]!;
    expect(rects.length).toBeGreaterThan(0);
    for (let n = 0; n < rects.length; n += 4) {
      expect(rects[n]! * l.w).toBeGreaterThanOrEqual(a.x - 2.5);
      expect((rects[n]! + rects[n + 2]!) * l.w).toBeLessThanOrEqual(a.x + a.w + 2.5);
    }
  });

  it('город: площади связаны улицами, дома не на них и не касаются друг друга, у домов есть подход', () => {
    const r = seeded(29);
    for (const rooms of [3, 5, 9, 16, 30]) {
      for (let i = 0; i < 4; i++) {
        const l = generateLayout('town', { rooms }, r);
        expect(l.rooms).toHaveLength(rooms);
        for (const row of l.cells) expect(row).toHaveLength(l.w);
        const seen = reached(l);
        for (const a of l.rooms) {
          expect(seen.has(`${a.x + (a.w >> 1)},${a.y + (a.h >> 1)}`)).toBe(true);
          expect(roomCells(l, l.rooms.indexOf(a)).length).toBeGreaterThan(20);
        }
        // All free ground joins up: no yard is shut in by houses.
        expect(seen.size).toBe(l.cells.join('').split('').filter(walkable).length);
        const houses = l.houses!;
        expect(houses.length).toBeGreaterThan(rooms);
        expect(houses.reduce((n, a) => n + a.w * a.h, 0)).toBe(l.cells.join('').split('H').length - 1);
        const apart = houses.every((a) => houses.every((b) => a === b || a.x > b.x + b.w || b.x > a.x + a.w || a.y > b.y + b.h || b.y > a.y + a.h));
        expect(apart).toBe(true);
        for (const p of l.pillars) expect(l.cells[p.y]![p.x]).toBe('P');
        const marks = l.landmarks!;
        expect(marks.length).toBeGreaterThanOrEqual(2);
        expect(marks.length).toBeLessThanOrEqual(8);
        expect(new Set(marks.map((m) => m.house)).size).toBe(marks.length);
        expect(marks.map((m) => m.kind).slice(0, 2)).toEqual(['tavern', 'temple']);
        for (const m of marks) expect(houses[m.house]).toBeTruthy();
        const sight = roomReveal(l, 0);
        expect(sight.length).toBeGreaterThan(0);
        // A house is seen whole or not at all.
        const whole = houses.every((a) => {
          const cells = Array.from({ length: a.w * a.h }, (_, n) => inReveal(l, sight, { x: a.x + (n % a.w), y: a.y + Math.floor(n / a.w) }));
          return new Set(cells).size === 1;
        });
        expect(whole).toBe(true);
      }
    }
  });
});
