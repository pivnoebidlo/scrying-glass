import { describe, expect, it } from 'vitest';
import { assetThings, groupTitle, parseAssetPath, safeAssetPath } from '../src/shared/mapassets';
import { blankLayout, draftOf, parseDraft, placeAsset, rotateProp, setAssetVariant } from '../src/modules/tools/mapeditor/edit';

describe("the GM's own assets", () => {
  it('reads the name, the variant, the size and the group from a path', () => {
    expect(parseAssetPath('Workplace_Equipment/Pottery/Kiln_Stone_Brick_B1_2x3.png')).toEqual({
      path: 'Workplace_Equipment/Pottery/Kiln_Stone_Brick_B1_2x3.png',
      base: 'Workplace_Equipment/Pottery|kiln stone brick',
      title: 'Kiln Stone Brick',
      variant: 'B1',
      group: 'Workplace_Equipment/Pottery',
      w: 2,
      h: 3,
    });
    expect(parseAssetPath('Amphora_Clay_Brown_B1_Lid_1x1.png')).toMatchObject({ title: 'Amphora Clay Brown', variant: 'B1 Lid', group: '', w: 1, h: 1 });
    expect(parseAssetPath('trees/Big Oak.webp')).toMatchObject({ title: 'Big Oak', variant: '', w: 1, h: 1 });
    expect(parseAssetPath('Huge_40x40.png')).toMatchObject({ w: 12, h: 12 });
    expect(parseAssetPath('notes.txt')).toBeNull();
    expect(groupTitle('Decor/Pottery/Plant_Pots')).toBe('Decor / Pottery / Plant Pots');
  });

  it('puts the variants of one thing together', () => {
    const list = ['Jugs/Jug_Clay_Brown_A2_1x1.png', 'Jugs/Jug_Clay_Brown_A1_1x1.png', 'Jugs/Jug_Clay_Brown_A1_Broken_1x1.png', 'Jugs/Jug_Clay_Gold_A1_1x1.png'].map((p) => parseAssetPath(p)!);
    const things = assetThings(list);
    expect(things.map((t) => [t.title, t.variants.map((v) => v.variant)])).toEqual([
      ['Jug Clay Brown', ['A1', 'A1 Broken', 'A2']],
      ['Jug Clay Gold', ['A1']],
    ]);
  });

  it('takes only safe paths from a map file', () => {
    expect(safeAssetPath('Decor/Pot_A1.png')).toBe(true);
    for (const bad of ['../secret.png', '/etc/x.png', 'C:/x.png', 'a//b.png', 'a\\b.png', 'x.svg', '', 3]) expect(safeAssetPath(bad)).toBe(false);
  });

  it('puts a picture anywhere, turns it with its size and changes its variant', () => {
    const kiln = parseAssetPath('Kiln_B1_2x3.png')!;
    // Indoors on rock too: a picture is the GM's choice.
    const { layout: l, index } = placeAsset(blankLayout('building', 10, 10, 1), kiln, 1, 1);
    expect(l.props![index]).toEqual({ kind: 'asset', asset: 'Kiln_B1_2x3.png', x: 1, y: 1, w: 2, h: 3 });
    expect(rotateProp(l, index).props![index]).toMatchObject({ w: 3, h: 2, face: 1 });
    const small = setAssetVariant(l, index, parseAssetPath('Kiln_A1_1x2.png')!);
    expect(small.props![index]).toMatchObject({ asset: 'Kiln_A1_1x2.png', w: 1, h: 2 });
    // Too big for the map — stays as it was.
    expect(placeAsset(l, kiln, 9, 9).index).toBe(-1);
    // The draft keeps it; a strange path is dropped.
    expect(parseDraft(draftOf(l))!.layout.props).toEqual(l.props);
    const bad = { ...l, props: [{ ...l.props![0]!, asset: '../../x.png' }] };
    expect(parseDraft(draftOf(bad))!.layout.props).toEqual([]);
  });
});
