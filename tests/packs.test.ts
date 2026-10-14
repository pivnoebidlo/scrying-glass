import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { freeFolder, readPack, remap, writePack } from '../src/main/packs';

let tmp = '';
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('приключение одним файлом', () => {
  it('туда и обратно: файлы, состояние, общие карточки; музыка — по желанию', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-pack-'));
    const adv = path.join(tmp, 'vault', 'Страд');
    const w = (f: string, s: string | Buffer) => (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, s));
    w(path.join(adv, 'maps/замок.png'), Buffer.alloc(3000, 7));
    w(path.join(adv, 'music/тема.mp3'), Buffer.alloc(5000, 1));
    w(path.join(adv, 'handouts/Письмо.note.json'), '{"text":"Привет"}');
    w(path.join(adv, '.скрытое'), 'нет');
    w(path.join(tmp, 'lib/images/огр.png'), Buffer.alloc(100, 3));
    const slices = { scenes: [{ id: 's', name: 'Страд', adventure: 'Страд', map: { path: 'Страд/maps/замок.png' } }], maps: { 'Страд/maps/замок.png': { pins: [] } }, encounters: [], order: { 'monsters:Страд/monsters': ['a'] }, names: {} };
    const out = path.join(tmp, 'Страд.sgpack');
    await writePack(out, {
      folder: adv,
      manifest: { scryingGlass: 'adventure', version: 1, name: 'Страд', exported: 1, app: 'test', music: false },
      slices,
      library: [{ id: 'ogre', json: { id: 'ogre', name: 'Огр', portraits: ['images/огр.png'] }, images: [{ rel: 'images/огр.png', abs: path.join(tmp, 'lib/images/огр.png') }] }],
    });

    const un = path.join(tmp, 'un');
    const p = await readPack(out, un);
    expect(p.manifest.name).toBe('Страд');
    expect(p.slices).toEqual(slices);
    expect(p.cards).toEqual([{ id: 'ogre', json: { id: 'ogre', name: 'Огр', portraits: ['images/огр.png'] } }]);
    expect(fs.readFileSync(path.join(un, 'files/Страд/maps/замок.png'))).toEqual(Buffer.alloc(3000, 7));
    expect(fs.readFileSync(path.join(un, 'files/Страд/handouts/Письмо.note.json'), 'utf8')).toBe('{"text":"Привет"}');
    expect(fs.existsSync(path.join(un, 'library/images/огр.png'))).toBe(true);
    expect(fs.existsSync(path.join(un, 'files/Страд/music/тема.mp3'))).toBe(false);
    expect(fs.existsSync(path.join(un, 'files/Страд/.скрытое'))).toBe(false);
  });

  it('пути пересчитываются под новое название, тексты и чужие пути — нет', () => {
    const v = { name: 'Страд', adventure: 'Страд', path: 'Страд/maps/x.png', other: 'Страдания/x.png', lib: 'library:images/x.png', groups: { 'monsters:Страд/m': ['Страд/a.png'] } };
    expect(remap(v, 'Страд', 'Страд (2)')).toEqual({
      name: 'Страд',
      adventure: 'Страд (2)',
      path: 'Страд (2)/maps/x.png',
      other: 'Страдания/x.png',
      lib: 'library:images/x.png',
      groups: { 'monsters:Страд (2)/m': ['Страд (2)/a.png'] },
    });
  });

  it('свободное название папки', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-free-'));
    fs.mkdirSync(path.join(tmp, 'Страд'));
    fs.mkdirSync(path.join(tmp, 'Страд (2)'));
    expect(freeFolder(tmp, 'Страд')).toBe('Страд (3)');
    expect(freeFolder(tmp, 'Шахты')).toBe('Шахты');
  });

  it('чужой архив не принимается', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-bad-'));
    const f = path.join(tmp, 'x.sgpack');
    fs.writeFileSync(f, 'не zip');
    await expect(readPack(f, path.join(tmp, 'un'))).rejects.toThrow();
  });
});
