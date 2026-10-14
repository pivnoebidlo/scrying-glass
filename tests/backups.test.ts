import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createSnapshot, listSnapshots, restoreSnapshot, toPrune, type SnapshotMeta } from '../src/main/backups';

let tmp = '';
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

function setup() {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-backup-'));
  const vault = path.join(tmp, 'vault');
  const lib = path.join(tmp, 'lib');
  const write = (f: string, s: string) => (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, s));
  write(path.join(vault, '.scrying-glass/state.json'), '{"v":1}');
  write(path.join(vault, 'Страд/handouts/Письмо.note.json'), '{"text":"а"}');
  write(path.join(vault, 'Страд/maps/карта.png'), 'картинка — не входит');
  write(path.join(lib, 'cards/goblin.json'), '{}');
  write(path.join(lib, 'tables/Слухи.md'), '- слух');
  write(path.join(lib, 'images/big.png'), 'большая картинка — не входит');
  write(path.join(tmp, 'settings.json'), '{}');
  const src = {
    dir: path.join(tmp, 'backups'),
    vaultRoot: vault,
    vaultFiles: ['.scrying-glass/state.json', 'Страд/handouts/Письмо.note.json'],
    library: lib,
    settingsFile: path.join(tmp, 'settings.json'),
  };
  return { vault, lib, src, write };
}

describe('снимки', () => {
  it('без изменений второй снимок не делается; картинки не входят; восстановление возвращает данные', () => {
    const { vault, lib, src, write } = setup();
    const a = createSnapshot(src, 'open')!;
    expect(a.files).toBe(5); // state, записка, карточка, таблица, настройки
    expect(createSnapshot(src, 'auto')).toBeNull();
    expect(createSnapshot(src, 'manual', true)).not.toBeNull();

    write(path.join(vault, '.scrying-glass/state.json'), '{"v":2}');
    write(path.join(lib, 'tables/Слухи.md'), '- испорчено');
    write(path.join(vault, 'Страд/handouts/Новая.note.json'), '{}');
    expect(createSnapshot(src, 'auto')).not.toBeNull();

    const n = restoreSnapshot(src.dir, a.id, { vaultRoot: vault, library: lib }, { vault: true, library: true });
    expect(n).toBe(4);
    expect(fs.readFileSync(path.join(vault, '.scrying-glass/state.json'), 'utf8')).toBe('{"v":1}');
    expect(fs.readFileSync(path.join(lib, 'tables/Слухи.md'), 'utf8')).toBe('- слух');
    // Файл, появившийся после снимка, остаётся.
    expect(fs.existsSync(path.join(vault, 'Страд/handouts/Новая.note.json'))).toBe(true);
    expect(listSnapshots(src.dir)).toHaveLength(3);
  });

  it('хранятся последние 20, по одному на день за месяц и ручные', () => {
    const day = 86_400_000;
    // Местные 23:00: 30 снимков за последние 15 часов — внутри одних местных суток в любом часовом поясе (снимки
    // «по одному на день» считаются по местной дате).
    const now = new Date(2026, 9, 14, 23).getTime();
    const snap = (i: number, created: number, reason: SnapshotMeta['reason'] = 'auto'): SnapshotMeta => ({ id: `s${i}`, created, reason, vault: null, vaultName: '', files: 1, bytes: 1, hash: String(i) });
    // 30 снимков за последние сутки (каждые 30 минут), по два в день за 40 дней до этого, один старый ручной.
    const list = [
      ...Array.from({ length: 30 }, (_, i) => snap(i, now - i * 1_800_000)),
      ...Array.from({ length: 80 }, (_, i) => snap(100 + i, now - day * (1 + Math.floor(i / 2)) - (i % 2) * 3_600_000)),
      snap(999, now - 100 * day, 'manual'),
    ];
    const gone = new Set(toPrune(list, now));
    const kept = list.filter((s) => !gone.has(s.id));
    expect(kept.some((s) => s.id === 's999')).toBe(true);
    expect(kept.filter((s) => s.id.startsWith('s') && Number(s.id.slice(1)) < 30)).toHaveLength(20);
    // По одному в день за последние 30 дней (сегодня уже покрыт последними снимками) — не больше 31 дня.
    const days = new Set(kept.filter((s) => s.reason !== 'manual').map((s) => new Date(s.created).toDateString()));
    expect(days.size).toBeLessThanOrEqual(31);
    expect(kept.every((s) => s.reason === 'manual' || now - s.created <= 30 * day || Number(s.id.slice(1)) < 30)).toBe(true);
  });
});
