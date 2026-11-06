import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { CONTENT_MANIFEST, contentFile, validContent } from '../src/shared/content';
import { forSaving, PACK_FORMAT, validatePack, type SystemPack } from '../src/shared/syspack';

vi.mock('electron', () => ({ app: { getAppPath: () => process.cwd(), getPath: () => os.tmpdir() }, BrowserWindow: { getAllWindows: () => [] } }));

const { contentDirs, contentSystems, installContent, installedContent, removeContent, setContentLibrary } = await import('../src/main/content');
const { loadSystemPacks, savePack, systemPacks } = await import('../src/main/syspacks');

const lib = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-content-'));
afterAll(() => fs.rmSync(lib, { recursive: true, force: true }));

const pack = (title: string) => ({ scryingGlass: 'system', version: 1, id: 'super-rp', title, tracker: {}, sections: [{ id: 'main', title: 'Main', fields: [{ key: 'hp', title: 'HP', type: 'number' }] }] });
const manifest = { scryingGlass: 'content', version: 1, id: 'super-rp', title: 'SuperRoleplay', family: 'super-rp', release: 1 };

function zipFile(files: Record<string, string>) {
  const file = path.join(lib, 'package.sgcontent');
  fs.writeFileSync(file, zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]))));
  return file;
}

describe('a package brings a system', () => {
  setContentLibrary(lib);

  it('installs only the known files, and its system is read from the library', async () => {
    const file = zipFile({
      [CONTENT_MANIFEST]: JSON.stringify(manifest),
      'system/super-rp.json': JSON.stringify(pack('Packaged')),
      'compendium/super-rp.en.json': '{}',
      'cover.jpg': 'not taken',
      'future/thing.json': '{}',
    });
    await installContent(file);
    expect(installedContent().map((c) => c.id)).toEqual(['super-rp']);
    expect(fs.readdirSync(path.join(lib, 'content/super-rp')).sort()).toEqual(['compendium', CONTENT_MANIFEST, 'system'].sort());
    expect(contentSystems('super-rp')).toEqual(['super-rp']);
    expect(contentDirs('system')).toHaveLength(1);
    loadSystemPacks(lib);
    expect(systemPacks().map((p) => [p.id, p.title, p.own])).toEqual([['super-rp', 'Packaged', undefined]]);
  });

  it('the GM\'s own copy takes its place; removing the copy brings the package\'s back', () => {
    const saved = savePack(lib, pack('Mine'));
    loadSystemPacks(lib);
    expect(systemPacks().map((p) => [p.title, p.own])).toEqual([['Mine', true]]);
    expect(saved.id).toBe('super-rp');
    fs.rmSync(path.join(lib, 'systems/super-rp.json'));
    loadSystemPacks(lib);
    expect(systemPacks()[0]!.title).toBe('Packaged');
  });

  it('removing the package removes its system', () => {
    expect(removeContent('super-rp')).toBe(true);
    loadSystemPacks(lib);
    expect(systemPacks()).toEqual([]);
  });

  it('a manifest of the first version is still valid; only flat known files pass', () => {
    expect(validContent(manifest)?.id).toBe('super-rp');
    expect(contentFile('system/a.json')).toBe(true);
    expect(contentFile('system/deep/a.json')).toBe(false);
    expect(contentFile('other/a.json')).toBe(false);
  });
});

describe('the format of a pack', () => {
  it('is stamped when saved and kept when read', () => {
    const p = validatePack(pack('A')) as SystemPack;
    expect(p.format).toBeUndefined();
    const saved = forSaving(p) as SystemPack;
    expect(saved.format).toBe(PACK_FORMAT);
    expect((validatePack(saved) as SystemPack).format).toBe(PACK_FORMAT);
  });

  it('a pack of a newer format is read but never rewritten', () => {
    const p = validatePack({ ...pack('A'), format: PACK_FORMAT + 1 }) as SystemPack;
    expect(p.format).toBe(PACK_FORMAT + 1);
    expect(forSaving(p)).toBe('newer');
    expect(() => savePack(lib, { ...pack('A'), format: PACK_FORMAT + 1 })).toThrow('syspack:newer');
  });
});
