import { describe, expect, it } from 'vitest';
import {
  addHouse, addRoom, blankLayout, brushCells, brushesFor, draftOf, lineCells, moveProp, paint, parseDraft, placeProp, propAt, removeProp, resize, rotateProp, toggleDoor, togglePillar, toggleTower,
} from '../src/modules/tools/mapeditor/edit';
import { generateLayout, LAYOUT_STYLES, seededRandom } from '../src/modules/tools/mapgen/layout';

const room = () => addRoom(blankLayout('building', 12, 10, 7), { x: 2, y: 2, w: 5, h: 4 });

describe('the map editor', () => {
  it('a blank map is all ground; a room cuts floor out of the rock and is numbered', () => {
    const b = blankLayout('building', 12, 10, 7);
    expect(b.cells.every((r) => r === '#'.repeat(12))).toBe(true);
    expect(blankLayout('forest', 8, 8, 1).cells[0]).toBe('........');
    const l = room();
    expect(l.rooms).toEqual([{ x: 2, y: 2, w: 5, h: 4 }]);
    expect(l.cells[3]!.slice(2, 7)).toBe('.....');
    expect(l.cells[1]!.slice(2, 7)).toBe('#####');
  });
  it('a stroke paints its cells, thick or along a line; painting over a room\'s floor drops the room', () => {
    expect(brushCells(5, 5, 3)).toHaveLength(9);
    expect(lineCells({ x: 0, y: 0 }, { x: 4, y: 2 })).toHaveLength(5);
    const l = paint(room(), brushCells(4, 4, 1), '.');
    expect(l).toBe(paint(l, [{ x: 4, y: 4 }], '.'));
    const gone = paint(room(), Array.from({ length: 20 }, (_, i) => ({ x: 2 + (i % 5), y: 2 + Math.floor(i / 5) })), '#');
    expect(gone.rooms).toEqual([]);
  });
  it('doors, pillars and towers go on and off; a door knows its way through', () => {
    let l = paint(room(), [{ x: 7, y: 3 }, { x: 8, y: 3 }], '.');
    l = toggleDoor(l, 7, 3);
    expect(l.doors).toEqual([{ x: 7, y: 3, along: 'x' }]);
    expect(toggleDoor(l, 7, 3).doors).toEqual([]);
    expect(toggleDoor(l, 0, 0).doors).toHaveLength(1);
    expect(togglePillar(l, 3, 3).pillars).toEqual([{ x: 3, y: 3 }]);
    const town = paint(blankLayout('town', 10, 10, 1), [{ x: 1, y: 1 }], 'W');
    expect(town.wall).toEqual({ towers: [], gates: [] });
    expect(toggleTower(town, 1, 1).wall!.towers).toEqual([{ x: 1, y: 1 }]);
    expect(paint(town, [{ x: 1, y: 1 }], '.').wall).toBeUndefined();
  });
  it('a house is a rectangle of roof, not on another; a brush does not cut into it', () => {
    const t = addHouse(blankLayout('town', 12, 12, 1), { x: 2, y: 2, w: 3, h: 3 });
    expect(t.houses).toEqual([{ x: 2, y: 2, w: 3, h: 3 }]);
    expect(addHouse(t, { x: 3, y: 3, w: 3, h: 3 })).toBe(t);
    expect(paint(t, [{ x: 3, y: 3 }], ',')).toBe(t);
    expect(paint(t, [{ x: 3, y: 3 }], '.').houses).toBeUndefined();
  });
  it('things stand on floor, not on each other or a door; turn, move, go away', () => {
    let l = room();
    const placed = placeProp(l, 'table', 3, 3);
    expect(placed.index).toBe(0);
    l = placed.layout;
    expect(l.props![0]).toMatchObject({ kind: 'table', x: 3, y: 3, w: 2, h: 1 });
    expect(placeProp(l, 'barrel', 4, 3).index).toBe(-1);
    expect(placeProp(l, 'barrel', 0, 0).index).toBe(-1);
    expect(placeProp(l, 'rug', 2, 2).index).toBe(0);
    expect(propAt(l, 4, 3)).toBe(0);
    const turned = rotateProp(l, 0);
    expect(turned.props![0]).toMatchObject({ w: 1, h: 2, face: 1 });
    expect(moveProp(l, 0, 2, 4).props![0]).toMatchObject({ x: 2, y: 4 });
    expect(moveProp(l, 0, 0, 0)).toBe(l);
    expect(removeProp(l, 0).props).toEqual([]);
    // Rock painted under a thing takes it away.
    expect(paint(l, [{ x: 3, y: 3 }], '#').props).toEqual([]);
  });
  it('the map grows and shrinks from its top-left corner', () => {
    const l = resize(room(), 6, 6);
    expect([l.w, l.h, l.cells.length, l.cells[0]!.length]).toEqual([6, 6, 6, 6]);
    expect(l.rooms).toEqual([]);
    expect(resize(room(), 20, 12).cells[11]).toBe('#'.repeat(20));
  });
  it('every kind of map has its brushes; generated maps are drafts as they are', () => {
    for (const s of LAYOUT_STYLES) {
      expect(brushesFor(s).some((b) => b.id === 'erase')).toBe(true);
      const g = generateLayout(s, { rooms: 4 }, seededRandom(3));
      // Facing up is the default: a file need not say it.
      const plain = JSON.parse(JSON.stringify(g, (k, v) => (k === 'face' && v === 0 ? undefined : v)));
      expect(parseDraft(JSON.parse(JSON.stringify(draftOf(g))))!.layout).toEqual(plain);
    }
  });
  it('a stranger\'s draft keeps only what makes sense', () => {
    expect(parseDraft({ scryingGlass: 'map', layout: { style: 'building', w: 6, h: 6, cells: ['......'] } })).toBeNull();
    expect(parseDraft({ scryingGlass: 'map', layout: { style: 'nope', w: 6, h: 6, cells: Array(6).fill('......') } })).toBeNull();
    expect(parseDraft({ scryingGlass: 'map', layout: { style: 'cave', w: 6, h: 6, cells: Array(6).fill('..<>..') } })).toBeNull();
    const d = parseDraft({ scryingGlass: 'map', layout: { style: 'cave', w: 6, h: 6, seed: 3, cells: Array(6).fill('......'), rooms: [{ x: 4, y: 4, w: 9, h: 9 }, { x: 1, y: 1, w: 2, h: 2 }], props: [{ kind: 'dragon', x: 0, y: 0, w: 1, h: 1 }, { kind: 'barrel', x: 1, y: 1, w: 1, h: 1, extra: 'x' }] } })!;
    expect(d.layout.rooms).toEqual([{ x: 1, y: 1, w: 2, h: 2 }]);
    expect(d.layout.props).toEqual([{ kind: 'barrel', x: 1, y: 1, w: 1, h: 1 }]);
  });
});
