import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { placeFiles, readBackup, writeBackup } from '../src/main/archive';

let tmp = '';
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('полная резервная копия', () => {
  it('без картинок — только данные; с картинками — вся папка; восстановление в новую папку', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-archive-'));
    const w = (f: string, s: string) => (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, s));
    const vault = path.join(tmp, 'vault');
    const lib = path.join(tmp, 'lib');
    w(path.join(vault, '.scrying-glass/state.json'), '{"modules":{}}');
    w(path.join(vault, 'Страд/handouts/Письмо.note.json'), '{}');
    w(path.join(vault, 'Страд/maps/карта.png'), 'png');
    w(path.join(lib, 'cards/огр.json'), '{}');
    w(path.join(lib, 'images/огр.png'), 'png');
    w(path.join(tmp, 'settings.json'), '{"roles":null}');
    fs.mkdirSync(path.join(vault, 'Шахты/music'), { recursive: true });
    const src = { vaultRoot: vault, vaultFiles: ['.scrying-glass/state.json', 'Страд/handouts/Письмо.note.json'], library: lib, settingsFile: path.join(tmp, 'settings.json') };
    const m = (media: boolean) => ({ scryingGlass: 'backup' as const, version: 1 as const, created: 1, app: 't', vaultName: 'vault', media });

    await writeBackup(path.join(tmp, 'a.sgbackup'), src, m(false));
    await writeBackup(path.join(tmp, 'b.sgbackup'), src, m(true));

    const un = path.join(tmp, 'un');
    const r = await readBackup(path.join(tmp, 'a.sgbackup'), un);
    expect([r.manifest.media, r.settings]).toEqual([false, { roles: null }]);
    expect(fs.existsSync(path.join(un, 'vault/Страд/maps/карта.png'))).toBe(false);

    const un2 = path.join(tmp, 'un2');
    await readBackup(path.join(tmp, 'b.sgbackup'), un2);
    const target = path.join(tmp, 'новый компьютер');
    const lib2 = path.join(tmp, 'новая библиотека');
    expect(placeFiles(path.join(un2, 'vault'), target)).toBe(3);
    placeFiles(path.join(un2, 'library'), lib2);
    expect(fs.readFileSync(path.join(target, '.scrying-glass/state.json'), 'utf8')).toBe('{"modules":{}}');
    expect(fs.existsSync(path.join(target, 'Страд/maps/карта.png'))).toBe(true);
    expect(fs.existsSync(path.join(lib2, 'images/огр.png'))).toBe(true);
    // Пустые папки тоже возвращаются (даже в копии без картинок).
    const un3 = path.join(tmp, 'un3');
    await readBackup(path.join(tmp, 'a.sgbackup'), un3);
    const t3 = path.join(tmp, 'третий');
    placeFiles(path.join(un3, 'vault'), t3);
    expect(fs.existsSync(path.join(t3, 'Шахты/music'))).toBe(true);
  });

  it('чужой файл не принимается', async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-archive-'));
    fs.writeFileSync(path.join(tmp, 'x.sgbackup'), 'не zip');
    await expect(readBackup(path.join(tmp, 'x.sgbackup'), path.join(tmp, 'un'))).rejects.toThrow();
  });
});
