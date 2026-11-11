import { describe, expect, it } from 'vitest';
import {
  misfit,
  addBuilding, addHouse, addRoom, blankLayout, brushCells, brushesFor, draftOf, lineCells, moveProp, paint, parseDraft, placeProp, propAt, moveProps, propsIn, removeProp, removeProps, resize, rotateProp, setGenre, setLight, setTone, swapKind, stretchProp, tintProp, toggleDoor, togglePillar, toggleRoof, toggleTower, wipe,
  edgePath, nearestSide, setEdges, toggleEdgeDoor,
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

  it('keeps the time of day and finds the lights', async () => {
    const { lightsOf } = await import('../src/modules/tools/mapgen/draw');
    let l = placeProp(blankLayout('forest', 12, 10, 1), 'campfire', 4, 4, 0, 0.5).layout;
    l = paint(l, [{ x: 8, y: 8 }], 'L');
    const night = setLight(l, 'night');
    expect(night.light).toBe('night');
    expect(setLight(night, null).light).toBeUndefined();
    expect(setLight(night, 'night')).toBe(night);
    expect(parseDraft(draftOf(night))!.layout.light).toBe('night');
    expect(parseDraft({ ...draftOf(night), layout: { ...night, light: 'eclipse' } })!.layout.light).toBeUndefined();
    const lights = lightsOf(night);
    expect(lights).toHaveLength(2);
    expect(lights[0]).toMatchObject({ x: 4.5, y: 4.5 });
  });

  it('wakes a chest into a mimic and back', () => {
    const { layout: l, index } = placeProp(room(), 'chest', 3, 3, 0, 0.5);
    const m = swapKind(l, index, 'mimic');
    expect(m.props![index]!.kind).toBe('mimic');
    expect(parseDraft(draftOf(m))!.layout.props![index]!.kind).toBe('mimic');
    expect(swapKind(m, index, 'chest').props![index]!.kind).toBe('chest');
    expect(swapKind(m, 99, 'chest')).toBe(m);
  });

  it('stretches a thing from any side and puts things on trees', () => {
    const { layout: l, index } = placeProp(blankLayout('meadow', 12, 10, 1), 'rug', 5, 5, 0, 0.5);
    // Pulled by the top-left corner: the bottom-right one stays.
    const big = stretchProp(l, index, 4, 3, 3, 4);
    expect(big.props![index]).toMatchObject({ x: 3, y: 4, w: 4, h: 3 });
    // Off the map — nothing changes.
    expect(stretchProp(l, index, 8, 2, -1, 5)).toBe(l);
    // A nest on a tree, a raven on a boulder.
    let wild = paint(blankLayout('forest', 8, 8, 1), [{ x: 2, y: 2 }, { x: 4, y: 4 }], 'T');
    wild = paint(wild, [{ x: 6, y: 6 }], 'R');
    const nest = placeProp(wild, 'nest', 2, 2);
    expect(nest.index).toBeGreaterThanOrEqual(0);
    expect(placeProp(nest.layout, 'nest', 6, 6).index).toBeGreaterThanOrEqual(0);
    // Water is still no place for a chair.
    expect(placeProp(paint(wild, [{ x: 1, y: 1 }], '~'), 'chair', 1, 1).index).toBe(-1);
  });

  it('keeps the world of a map and its grounds', async () => {
    const { tonesIn } = await import('../src/modules/tools/mapgen/layout');
    const l = blankLayout('building', 8, 8, 1);
    const ship = setGenre(l, 'scifi');
    expect(ship.genre).toBe('scifi');
    expect(setGenre(ship, 'fantasy').genre).toBeUndefined();
    expect(setGenre(l, 'fantasy')).toBe(l);
    expect(parseDraft(draftOf(ship))!.layout.genre).toBe('scifi');
    expect(parseDraft(draftOf({ ...l, genre: 'weirdwest' as never }))!.layout.genre).toBeUndefined();
    expect(tonesIn('building', 'scifi')).toContain('metal');
    expect(tonesIn('building', 'fantasy')).not.toContain('metal');
    expect(tonesIn('meadow', 'scifi')).toEqual(expect.arrayContaining(['mars', 'moon', 'winter']));
    expect(setTone(ship, 'metal').tone).toBe('metal');
  });

  it('builds rooms of any material indoors, with doors in their walls and things on them', () => {
    let l = blankLayout('building', 12, 10, 1);
    const all: { x: number; y: number }[] = [];
    for (let y = 1; y < 9; y++) for (let x = 1; x < 11; x++) all.push({ x, y });
    l = paint(l, all, 's');
    l = paint(l, [1, 2, 3, 4, 5, 6, 7, 8].map((y) => ({ x: 6, y })), 'r');
    // A door in the brick wall: the floor beside it, across the wall; away — the brick is back.
    const d = toggleDoor(l, 6, 4);
    expect(d.cells[4]![6]).toBe('s');
    expect(d.doors).toEqual([{ x: 6, y: 4, along: 'x' }]);
    expect(toggleDoor(d, 6, 4).cells[4]![6]).toBe('r');
    // Things stand on the stone floor; a window hangs on the wall itself.
    expect(placeProp(d, 'table', 2, 2).index).toBeGreaterThanOrEqual(0);
    expect(placeProp(d, 'window', 6, 2).index).toBeGreaterThanOrEqual(0);
    expect(placeProp(d, 'table', 6, 6).index).toBe(-1);
    // A pillar on a marble floor; the draft keeps it all.
    const m = togglePillar(paint(d, [{ x: 3, y: 6 }], 'm'), 3, 6);
    expect(m.pillars).toEqual([{ x: 3, y: 6 }]);
    expect(parseDraft(draftOf(m))!.layout.cells).toEqual(m.cells);
  });

  it('gives a castle wall its walk and puts gates into fortifications', () => {
    const band: { x: number; y: number }[] = [];
    for (let y = 2; y < 5; y++) for (let x = 1; x < 9; x++) band.push({ x, y });
    let l = paint(blankLayout('meadow', 10, 10, 1), band, 'g');
    // Three thick: the middle row is the walk, the ends stay wall.
    expect(l.cells[3]).toBe('.gwwwwwwg.');
    expect(l.cells[2]).toBe('.gggggggg.');
    // Two walls with a gap of one: the gap is the walk too.
    let two = paint(blankLayout('meadow', 10, 10, 1), [1, 2, 3, 4, 5].map((x) => ({ x, y: 6 })), 'g');
    two = paint(two, [1, 2, 3, 4, 5].map((x) => ({ x, y: 8 })), 'g');
    expect(two.cells[7]).toBe('.wwwww....');
    // A breach: the wall is open there, the walk runs up to it.
    l = paint(l, [{ x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }], '.');
    expect(l.cells[3]).toBe('.gww.wwwg.');
    // A gate in a palisade, and things on the walk.
    let camp = paint(blankLayout('forest', 8, 8, 1), [1, 2, 3, 4, 5].map((x) => ({ x, y: 1 })), 'p');
    camp = toggleDoor(camp, 3, 1);
    expect(camp.doors).toEqual([{ x: 3, y: 1, along: 'y' }]);
    expect(placeProp(paint(blankLayout('meadow', 10, 10, 1), band, 'g'), 'brazier', 3, 3).index).toBeGreaterThanOrEqual(0);
  });

  it('says why a thing does not go down', () => {
    const rock = blankLayout('building', 10, 10, 1);
    const sedan = { kind: 'sedan' as const, x: 2, y: 2, w: 2, h: 3 };
    expect(misfit(rock, sedan)).toBe('rock');
    expect(placeProp(rock, 'sedan', 2, 2).index).toBe(-1);
    const field = blankLayout('meadow', 10, 10, 1);
    expect(misfit(field, sedan)).toBeNull();
    expect(misfit(field, { ...sedan, x: 9 })).toBe('edge');
    expect(misfit(paint(field, [{ x: 2, y: 2 }], '~'), sedan)).toBe('water');
    // Things for walls and the GM's pictures go anywhere.
    expect(misfit(rock, { kind: 'window', x: 1, y: 1, w: 1, h: 1 })).toBeNull();
    expect(misfit(rock, { kind: 'asset', x: 1, y: 1, w: 2, h: 2 })).toBeNull();
  });

  it('the eraser takes everything under it: things, doors, fences, the ground', () => {
    let l = paint(blankLayout('meadow', 10, 10, 1), [1, 2, 3, 4, 5].map((x) => ({ x, y: 4 })), 'f');
    l = toggleDoor(l, 3, 4);
    l = placeProp(l, 'rug', 6, 6).layout;
    l = placeProp(l, 'chest', 6, 6).layout;
    expect(l.props).toHaveLength(2);
    const e = wipe(l, [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 6, y: 6 }], '.');
    expect(e.cells[4]).toBe('.ff..f....');
    expect(e.doors).toEqual([]);
    expect(e.props).toEqual([]);
    // Nothing there: the same layout.
    expect(wipe(e, [{ x: 8, y: 8 }], '.')).toBe(e);
    // Indoors the ground is rock.
    expect(wipe(room(), [{ x: 3, y: 3 }], '#').cells[3]![3]).toBe('#');
  });
  it('the new fences are walls a draft keeps', () => {
    const l = blankLayout('meadow', 8, 8, 1);
    expect(parseDraft(draftOf({ ...l, cells: ['fleibn..', ...l.cells.slice(1)] }))).not.toBeNull();
    for (const id of ['picket', 'wattle', 'drystone', 'railing', 'barbed', 'chainlink'] as const) expect(brushesFor('forest').some((b) => b.id === id)).toBe(true);
  });

  it('thin walls go along the sides of cells, take doors, and go with the eraser', () => {
    const l = blankLayout('meadow', 6, 6, 1);
    // From corner to corner, a step at a time along the longer way: an L of three sides.
    expect(edgePath({ x: 1, y: 1 }, { x: 3, y: 2 })).toEqual([
      { x: 1, y: 1, side: 'top' },
      { x: 2, y: 1, side: 'top' },
      { x: 3, y: 1, side: 'left' },
    ]);
    let w = setEdges(l, edgePath({ x: 0, y: 2 }, { x: 6, y: 2 }), 'k');
    expect(w.edges).toHaveLength(6);
    // The map's own edge is a side too; past it — none.
    expect(setEdges(l, [{ x: 6, y: 0, side: 'top' }], 'k')).toBe(l);
    // The same again changes nothing; another kind replaces it.
    expect(setEdges(w, [{ x: 0, y: 2, side: 'top' }], 'k')).toBe(w);
    expect(setEdges(w, [{ x: 0, y: 2, side: 'top' }], 'p').edges!.find((e) => e.x === 0)!.kind).toBe('p');
    // Near a side, not in the middle of a cell.
    expect(nearestSide(w, 2.5, 2.1)).toEqual({ x: 2, y: 2, side: 'top' });
    expect(nearestSide(w, 2.5, 2.5)).toBeNull();
    w = toggleEdgeDoor(w, { x: 2, y: 2, side: 'top' });
    expect(w.edges!.find((e) => e.x === 2)!.door).toBe(true);
    // A door stays when the wall is painted over with another kind.
    expect(setEdges(w, [{ x: 2, y: 2, side: 'top' }], 'B').edges!.find((e) => e.x === 2)).toEqual({ x: 2, y: 2, side: 'top', kind: 'B', door: true });
    // Kept in a draft; nonsense from a file is not.
    const back = parseDraft(draftOf({ ...w, edges: [...w.edges!, { x: 9, y: 9, side: 'top', kind: 'k' }, { x: 1, y: 1, side: 'top', kind: 'Z' }] }))!;
    expect(back.layout.edges).toHaveLength(6);
    // The eraser takes the sides of its cells; a smaller map, the sides past its edge.
    expect(wipe(w, [{ x: 3, y: 2 }], '.').edges).toHaveLength(5);
    expect(resize(w, 6, 6).edges).toHaveLength(6);
    expect(setEdges(w, edgePath({ x: 0, y: 2 }, { x: 6, y: 2 }), null).edges).toBeUndefined();
  });
});
