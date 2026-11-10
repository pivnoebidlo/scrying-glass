import { describe, expect, it } from 'vitest';
import {
  addBuilding, addHouse, addRoom, blankLayout, brushCells, brushesFor, draftOf, lineCells, moveProp, paint, parseDraft, placeProp, propAt, moveProps, propsIn, removeProp, removeProps, resize, rotateProp, setTone, stretchProp, tintProp, toggleDoor, togglePillar, toggleRoof, toggleTower,
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
  it('things stand on floor, on each other too, not on a door; turn, move, go away', () => {
    let l = room();
    const placed = placeProp(l, 'table', 3, 3);
    expect(placed.index).toBe(0);
    l = placed.layout;
    expect(l.props![0]).toMatchObject({ kind: 'table', x: 3, y: 3, w: 2, h: 1 });
    // A candle on the table: the later thing lies on top and is the one picked.
    const candle = placeProp(l, 'candle', 4, 3);
    expect(candle.index).toBe(1);
    expect(propAt(candle.layout, 4, 3)).toBe(1);
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
  it('things stretch and take a colour', () => {
    let l = placeProp(room(), 'rug', 1, 1).layout;
    l = stretchProp(l, 0, 6, 1);
    expect(l.props![0]).toMatchObject({ w: 6, h: 1 });
    // Not past the walls, and not a thing that does not stretch.
    expect(stretchProp(l, 0, 40, 1)).toBe(l);
    const barrel = placeProp(l, 'barrel', 2, 3).layout;
    expect(stretchProp(barrel, 1, 3, 3)).toBe(barrel);
    expect(tintProp(l, 0, 0.1).props![0]!.tint).toBe(0.1);
    expect(parseDraft(JSON.parse(JSON.stringify(draftOf(l))))!.layout.props![0]).toMatchObject({ w: 6, h: 1 });
  });
  it('several things are picked by a rectangle, moved together (all or none) and taken away', () => {
    let l = room();
    for (const [x, y] of [[2, 2], [3, 2], [6, 5]] as const) l = placeProp(l, 'barrel', x, y).layout;
    expect(propsIn(l, { x: 1, y: 1, w: 3, h: 2 })).toEqual([0, 1]);
    const moved = moveProps(l, [0, 1], 1, 1);
    expect(moved.props!.map((p) => [p.x, p.y])).toEqual([[3, 3], [4, 3], [6, 5]]);
    // One of them would go into the wall: none moves.
    expect(moveProps(l, [0, 1], -2, 0)).toBe(l);
    expect(removeProps(l, [0, 2]).props!.map((p) => [p.x, p.y])).toEqual([[3, 2]]);
  });
  it('lava, ice, mud and pits are painted and kept; the ground takes a colour of its kind', () => {
    let l = blankLayout('cave', 10, 8, 1);
    l = paint(l, [{ x: 1, y: 1 }, { x: 2, y: 1 }], 'L');
    l = paint(l, [{ x: 1, y: 2 }], 'I');
    l = paint(l, [{ x: 2, y: 2 }], 'X');
    expect(brushesFor('cave').map((b) => b.cell)).toEqual(expect.arrayContaining(['L', 'I', 'M', 'X']));
    // Things stand on ice, not in lava.
    expect(placeProp(l, 'barrel', 1, 2).index).toBe(0);
    expect(placeProp(l, 'barrel', 1, 1).index).toBe(-1);
    l = setTone(l, 'frost');
    expect(l.tone).toBe('frost');
    // A tone of another kind of map is not taken.
    expect(setTone(blankLayout('meadow', 8, 8, 1), 'frost').tone).toBeUndefined();
    const back = parseDraft(JSON.parse(JSON.stringify(draftOf(l))))!.layout;
    expect(back.cells).toEqual(l.cells);
    expect(back.tone).toBe('frost');
    expect(setTone(l, null).tone).toBeUndefined();
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

  it('lets houses stand in the wild and lava and pits lie anywhere', () => {
    const ids = (style: Parameters<typeof brushesFor>[0]) => brushesFor(style).map((b) => b.id);
    for (const style of ['forest', 'swamp', 'meadow', 'shore'] as const) expect(ids(style)).toContain('house');
    for (const style of ['building', 'cave', 'town', 'forest'] as const) expect(ids(style)).toEqual(expect.arrayContaining(['lava', 'pit', 'mud', 'ice']));
    const lodge = addHouse(blankLayout('forest', 12, 12, 1), { x: 3, y: 3, w: 3, h: 2 });
    expect(lodge.houses).toEqual([{ x: 3, y: 3, w: 3, h: 2 }]);
    expect(lodge.cells[3]!.slice(3, 6)).toBe('HHH');
    // Painting grass over it takes the house away.
    expect(paint(lodge, [{ x: 4, y: 3 }], '.').houses ?? []).toEqual([]);
  });

  it('puts up a building of walls, floor, doors and a roof outdoors', () => {
    let l = addBuilding(blankLayout('meadow', 12, 10, 1), { x: 2, y: 2, w: 5, h: 4 });
    expect(l.cells.slice(2, 6).map((r) => r.slice(2, 7))).toEqual(['BBBBB', 'BFFFB', 'BFFFB', 'BBBBB']);
    // A room built onto it shares the wall.
    l = addBuilding(l, { x: 6, y: 2, w: 4, h: 4 });
    expect(l.cells[3]!.slice(2, 10)).toBe('BFFFBFFB');
    // A door goes into a wall only, across the wall it is in; away again — the wall is back.
    expect(toggleDoor(l, 4, 3)).toBe(l);
    const withDoor = toggleDoor(l, 4, 2);
    expect(withDoor.cells[2]![4]).toBe('F');
    expect(withDoor.doors).toEqual([{ x: 4, y: 2, along: 'y' }]);
    expect(toggleDoor(withDoor, 6, 3).doors.at(-1)).toEqual({ x: 6, y: 3, along: 'x' });
    const back = toggleDoor(withDoor, 4, 2);
    expect(back.cells[2]![4]).toBe('B');
    expect(back.doors).toEqual([]);
    // One roof for the whole building, on and off; it goes when the building does.
    const roofed = toggleRoof(withDoor, 3, 3);
    expect(roofed.roofs).toEqual([{ x: 3, y: 3 }]);
    expect(toggleRoof(roofed, 8, 4).roofs).toBeUndefined();
    expect(toggleRoof(roofed, 0, 0)).toBe(roofed);
    const cleared: { x: number; y: number }[] = [];
    for (let y = 2; y < 6; y++) for (let x = 2; x < 10; x++) cleared.push({ x, y });
    expect(paint(roofed, cleared, '.').roofs).toBeUndefined();
    // Things stand on its floor; the draft keeps it all.
    expect(placeProp(roofed, 'table', 3, 3, 0, 0.5).index).toBeGreaterThanOrEqual(0);
    expect(parseDraft(draftOf(roofed))!.layout).toMatchObject({ roofs: [{ x: 3, y: 3 }], doors: [{ x: 4, y: 2, along: 'y' }] });
    // A room marked over it keeps its walls and floor.
    expect(addRoom(roofed, { x: 2, y: 2, w: 5, h: 4 }).cells[2]!.slice(2, 7)).toBe('BBFBB');
  });
});
