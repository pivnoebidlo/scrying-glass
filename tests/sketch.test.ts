import { describe, expect, it } from 'vitest';
import { aspectOf, itemAt, isSketchPath, newSketch, parseSketch, sketchTitle, SKETCH_FRAMES, type SketchItem } from '../src/shared/sketch';
import { fileKind, prettyName } from '../src/shared/vault';

describe('canvas files', () => {
  it('is its own kind of file, titled by its name', () => {
    expect(fileKind('Map.sketch.json')).toBe('sketch');
    expect(fileKind('Letter.note.json')).toBe('note');
    expect(isSketchPath('a/b/Карта клада.sketch.json')).toBe(true);
    expect(sketchTitle('a/b/Карта клада.sketch.json')).toBe('Карта клада');
    expect(prettyName('a/b/Карта клада.sketch.json')).toBe('Карта клада');
  });
});

describe('parseSketch', () => {
  it('keeps a valid canvas and drops what is broken', () => {
    const s = parseSketch({
      scryingGlass: 'sketch',
      base: { kind: 'image', path: 'maps/town.jpg' },
      aspect: 1.5,
      items: [
        { t: 'pen', color: '#C62828', width: 0.007, points: [0.1, 0.1, 0.2, 0.2, 0.3] },
        { t: 'pen', color: '#000000', points: [0.1] },
        { t: 'rect', color: 'red', x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.4, fill: 'tint' },
        { t: 'text', text: '   ' },
        { t: 'text', text: 'Here be dragons', x: 0.5, y: 0.5, font: 'nope' },
        { t: 'area', color: '#2e7d32', points: [0.1, 0.1, 0.4, 0.1, 0.3, 0.4] },
        { t: 'teleport' },
      ],
    })!;
    expect(s.aspect).toBe(1.5);
    expect(s.items.map((i) => i.t)).toEqual(['pen', 'rect', 'text', 'area']);
    expect(s.items[0]).toMatchObject({ color: '#c62828', points: [0.1, 0.1, 0.2, 0.2] });
    expect(s.items[1]).toMatchObject({ color: '#1b1b1b', fill: 'tint' });
    expect(s.items[2]).toMatchObject({ font: 'marck' });
    expect(parseSketch({ scryingGlass: 'note' })).toBeNull();
  });

  it('takes the proportions of the sheet on paper, sane ones otherwise', () => {
    expect(aspectOf({ kind: 'paper', paper: 'paper', edge: 'torn', shape: 'portrait' }, 2)).toBe(3 / 4);
    expect(aspectOf({ kind: 'color', color: '#ffffff' }, 100)).toBe(4);
    expect(aspectOf({ kind: 'color', color: '#ffffff' }, NaN)).toBe(SKETCH_FRAMES.landscape);
    expect(parseSketch({ ...newSketch(), base: { kind: 'paper', shape: 'scroll' } })!.aspect).toBe(9 / 16);
  });
});

describe('itemAt (the eraser)', () => {
  const items: SketchItem[] = [
    { t: 'line', color: '#000000', width: 0.003, x1: 0, y1: 0.5, x2: 1, y2: 0.5, fill: 'none' },
    { t: 'rect', color: '#000000', width: 0.003, x1: 0.6, y1: 0.1, x2: 0.9, y2: 0.3, fill: 'none' },
    { t: 'ellipse', color: '#000000', width: 0.003, x1: 0.1, y1: 0.1, x2: 0.3, y2: 0.3, fill: 'solid' },
    { t: 'area', color: '#000000', points: [0.1, 0.7, 0.4, 0.7, 0.4, 0.95, 0.1, 0.95] },
    { t: 'text', color: '#000000', x: 0.8, y: 0.8, size: 0.05, font: 'marck', text: 'Lair' },
  ];
  const at = (x: number, y: number) => itemAt(items, x, y, 1000, 800);
  it('finds the item under the pointer', () => {
    expect(at(0.5, 0.502)).toBe(0);
    expect(at(0.6, 0.2)).toBe(1); // on the edge of the rectangle
    expect(at(0.75, 0.2)).toBe(-1); // inside an outline — nothing
    expect(at(0.2, 0.2)).toBe(2); // inside a filled ellipse
    expect(at(0.25, 0.8)).toBe(3); // inside an area
    expect(at(0.8, 0.8)).toBe(4);
    expect(at(0.5, 0.3)).toBe(-1);
  });
  it('takes the topmost one', () => {
    expect(itemAt([...items, { t: 'pen', color: '#000000', width: 0.01, points: [0.4, 0.5, 0.6, 0.5] }], 0.5, 0.5, 1000, 800)).toBe(5);
  });
});
