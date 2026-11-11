import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { exportAssetPack, installAssetPack, installedPacks, readAssetPack, removeAssetPack } from '../src/main/assetpacks';
import { listMapAssets, forgetMapAssets } from '../src/main/mapassets';
import { writeZip } from '../src/main/zip';
import { packPicture, validAssetPack } from '../src/shared/mapassets';

const dirs: string[] = [];
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-packs-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  forgetMapAssets();
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
const put = (file: string, text = 'x') => (fs.mkdirSync(path.dirname(file), { recursive: true }), fs.writeFileSync(file, text));

describe('packs of map assets', () => {
  it('a folder goes as a pack; another library installs it, a new release replaces it, it goes to the trash', async () => {
    const mine = tmp();
    put(path.join(mine, 'assets', 'Forest', 'Trees', 'Oak_A1_2x2.png'));
    put(path.join(mine, 'assets', 'Forest', 'Rock.webp'));
    put(path.join(mine, 'assets', 'Forest', 'notes.txt'));
    const file = path.join(tmp(), 'Forest.sgassets');
    const m = await exportAssetPack(mine, 'Forest', { title: 'Deep forest', author: 'Me', license: 'CC BY 4.0' }, file);
    expect(m).toMatchObject({ title: 'Deep forest', release: 1, count: 2, author: 'Me' });
    expect(await readAssetPack(file)).toEqual(m);
    // The folder is that pack now: saved again, the next release of it.
    const file2 = path.join(tmp(), 'Forest2.sgassets');
    put(path.join(mine, 'assets', 'Forest', 'Bush.png'));
    const m2 = await exportAssetPack(mine, 'Forest', { title: 'Deep forest' }, file2);
    expect([m2.id, m2.release, m2.count]).toEqual([m.id, 2, 3]);

    const theirs = tmp();
    const got = await installAssetPack(theirs, file);
    expect(got).toMatchObject({ folder: 'Deep forest', replaced: false });
    expect(listMapAssets(theirs).list.map((a) => a.path).sort()).toEqual(['Deep forest/Rock.webp', 'Deep forest/Trees/Oak_A1_2x2.png']);
    expect(installedPacks(theirs)).toEqual([{ folder: 'Deep forest', manifest: m }]);
    // A newer release goes to the same folder; the old one to the library's trash.
    const again = await installAssetPack(theirs, file2);
    expect(again).toMatchObject({ folder: 'Deep forest', replaced: true });
    forgetMapAssets();
    expect(listMapAssets(theirs).list).toHaveLength(3);
    expect(fs.readdirSync(path.join(theirs, '.trash'))).toHaveLength(1);
    // A folder of the same name that is not this pack stays: the pack gets another.
    put(path.join(theirs, 'assets', 'Other', 'X.png'));
    expect(removeAssetPack(theirs, 'Other')).toBe(false);
    expect(removeAssetPack(theirs, '../x')).toBe(false);
    expect(removeAssetPack(theirs, 'Deep forest')).toBe(true);
    expect(installedPacks(theirs)).toEqual([]);
  });

  it('takes only pictures from someone else\'s file, and not a file that is no pack', async () => {
    const f = path.join(tmp(), 'odd.sgassets');
    const manifest = { scryingGlass: 'assets', version: 1, id: 'abcd1234', title: 'Odd / pack', release: 3 };
    await writeZip(f, [
      { name: 'assets.json', data: Buffer.from(JSON.stringify(manifest)) },
      { name: 'pictures/ok/Cat.png', data: Buffer.from('x') },
      { name: 'pictures/run.sh', data: Buffer.from('x') },
      { name: 'other/Dog.png', data: Buffer.from('x') },
    ]);
    const lib = tmp();
    const got = await installAssetPack(lib, f);
    expect(got.folder).toBe('Odd pack');
    expect(listMapAssets(lib).list.map((a) => a.path)).toEqual(['Odd pack/ok/Cat.png']);
    expect(fs.existsSync(path.join(lib, 'assets', 'Odd pack', 'run.sh'))).toBe(false);
    const bad = path.join(tmp(), 'bad.sgassets');
    await writeZip(bad, [{ name: 'pictures/Cat.png', data: Buffer.from('x') }]);
    await expect(installAssetPack(lib, bad)).rejects.toThrow('assetpack:bad');
    expect(validAssetPack({ ...manifest, id: '../x' })).toBeNull();
    expect(packPicture('pictures/../x.png')).toBe(false);
  });
});
