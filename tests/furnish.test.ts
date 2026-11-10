import { describe, expect, it } from 'vitest';
import { furnish, ROOM_THEMES, type Prop } from '../src/modules/tools/mapgen/furnish';
import { generateLayout, LAYOUT_STYLES, seededRandom, type Layout } from '../src/modules/tools/mapgen/layout';
import { themeOf } from '../src/systems/dnd5e/tools/dungeon/generate';

const cellsOf = (p: Prop) => Array.from({ length: p.w * p.h }, (_, i) => [p.x + (i % p.w), p.y + Math.floor(i / p.w)] as const);

describe('things on a generated map', { timeout: 30000 }, () => {
  it('stand on their ground, never on each other, never in a doorway', () => {
    for (const style of LAYOUT_STYLES)
      for (let seed = 1; seed <= 6; seed++) {
        const l = generateLayout(style, { rooms: 6 }, seededRandom(seed * 31 + style.length));
        const taken = new Map<string, string>();
        for (const p of l.props ?? []) {
          for (const [x, y] of cellsOf(p)) {
            const c = l.cells[y]?.[x];
            const ground = style === 'building' || style === 'cave' ? c === '.' : style === 'town' ? c === 'P' || c === ',' : c === '.';
            expect(ground, `${style} ${p.kind} on «${c}»`).toBe(true);
            if (p.kind === 'rug') continue;
            expect(taken.get(`${x},${y}`), `${style}: ${p.kind} on ${taken.get(`${x},${y}`)}`).toBeUndefined();
            taken.set(`${x},${y}`, p.kind);
            expect(l.doors.some((d) => Math.abs(d.x - x) <= 1 && Math.abs(d.y - y) <= 1), `${style}: ${p.kind} by a door`).toBe(false);
          }
        }
      }
  });
  it('outdoors, the places stay clear; a town has stalls on its squares', () => {
    const w = generateLayout('forest', { rooms: 5 }, seededRandom(3));
    for (const p of w.props ?? []) for (const a of w.rooms) expect(p.x >= a.x - 1 && p.y >= a.y - 1 && p.x <= a.x + a.w && p.y <= a.y + a.h).toBe(false);
    const t = generateLayout('town', { rooms: 5 }, seededRandom(5));
    expect((t.props ?? []).some((p) => p.kind === 'stall')).toBe(true);
  });
  it('a room is furnished by what it is for; the same layout — the same things', () => {
    const l = generateLayout('building', { rooms: 4, themes: ['crypt', 'barracks', 'library', 'storage'] }, seededRandom(7));
    const kinds = (i: number) => new Set((l.props ?? []).filter((p) => { const a = l.rooms[i]!; return p.x >= a.x && p.y >= a.y && p.x < a.x + a.w && p.y < a.y + a.h; }).map((p) => p.kind));
    expect(kinds(0).has('sarcophagus')).toBe(true);
    expect(kinds(1).has('bed')).toBe(true);
    expect(kinds(2).has('shelf')).toBe(true);
    expect([...kinds(3)].every((k) => ['barrel', 'crate', 'sack'].includes(k))).toBe(true);
    const { props, ...bare } = l;
    expect(furnish(bare as Layout, ['crypt', 'barracks', 'library', 'storage'])).toEqual(props);
    expect(JSON.parse(JSON.stringify(l))).toEqual(l);
  });
  it('a dungeon room takes its theme from its part in the story', () => {
    expect(themeOf('tomb', 'lair')).toBe('crypt');
    expect(themeOf('fortress', 'guardian')).toBe('barracks');
    expect(themeOf('cave', 'reward')).toBe('treasury');
    expect(themeOf('cave', 'puzzle')).toBeUndefined();
    for (const t of ['tomb', 'temple', 'fortress', 'tower', 'ruins'] as const)
      for (const role of ['guardian', 'puzzle', 'lair', 'empty', 'trap', 'climax', 'reward'] as const) expect(ROOM_THEMES).toContain(themeOf(t, role));
  });
});
