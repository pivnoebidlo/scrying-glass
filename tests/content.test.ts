import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { validContent } from '../src/shared/content';

// Content of systems installed to a library (main/content.ts); the built-in cards read it (main/cards.ts).
vi.mock('electron', () => ({ app: { getAppPath: () => process.cwd() }, BrowserWindow: { getAllWindows: () => [] } }));
const { installContent, installedContent, removeContent } = await import('../src/main/content');
const { getCard, initCards, reloadBuiltin } = await import('../src/main/cards');

const lib = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-content-'));
afterAll(() => fs.rmSync(lib, { recursive: true, force: true }));
initCards(lib);

const manifest = { scryingGlass: 'content', version: 1, id: 'test-beasts', title: 'Test beasts', family: 'dnd5e', release: 2 };
const card = { format: 1, id: 'test-owlbear', kind: 'monster', system: 'dnd5e-2024', lang: 'en', name: 'Owlbear', portraits: [], tags: [], notes: '', stats: {} };
function pack(files: Record<string, string>): string {
  const file = path.join(lib, `pack-${Math.random().toString(36).slice(2)}.sgcontent`);
  fs.writeFileSync(file, zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]))));
  return file;
}

describe('content of systems', () => {
  it('a manifest from someone else: only what is known', () => {
    expect(validContent({ ...manifest, evil: 1 })).toEqual(manifest);
    expect(validContent({ ...manifest, id: '../x' })).toBeNull();
    expect(validContent({ ...manifest, scryingGlass: 'system' })).toBeNull();
    expect(validContent(JSON.parse(fs.readFileSync('content/dnd5e-srd/content.json', 'utf8')))).toMatchObject({ id: 'dnd5e-srd', family: 'dnd5e' });
  });

  it('installs, keeps only its own files, gives built-in cards; removed — they are gone', async () => {
    const file = pack({
      'content.json': JSON.stringify(manifest),
      'bestiary/beasts.json': JSON.stringify([card]),
      'bestiary/../../evil.json': '[]',
      'scripts/run.js': 'alert(1)',
    });
    expect(await installContent(file)).toMatchObject({ id: 'test-beasts', release: 2 });
    const dir = path.join(lib, 'content', 'test-beasts');
    expect(fs.readdirSync(dir).sort()).toEqual(['bestiary', 'content.json']);
    expect(installedContent().map((c) => c.id)).toEqual(['test-beasts']);
    reloadBuiltin();
    expect(getCard({ scope: 'srd', id: 'test-owlbear' })?.name).toBe('Owlbear');
    expect(removeContent('test-beasts')).toBe(true);
    reloadBuiltin();
    expect(getCard({ scope: 'srd', id: 'test-owlbear' })).toBeNull();
  });

  it('a file without a good manifest is refused, nothing is left', async () => {
    await expect(installContent(pack({ 'bestiary/x.json': '[]' }))).rejects.toThrow();
    expect(installedContent()).toEqual([]);
    expect(fs.readdirSync(path.join(lib, 'content'))).toEqual([]);
  });
});
