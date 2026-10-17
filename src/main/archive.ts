// Полная резервная копия одним файлом (.sgbackup — обычный ZIP): настройки, вся библиотека (карточки с картинками,
// таблицы, свои расы) и данные хранилища — состояние и файлы приложения (записки, таблицы, карточки), а с media —
// и все картинки и музыка хранилища. Восстанавливается в то же или другое хранилище (например, на новом компьютере).
//
//   manifest.json, settings.json, library/…, vault/…
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { folderDirs, folderFiles, readZip, writeZip, type ZipEntry } from './zip';

export const BACKUP_EXT = 'sgbackup';

export interface BackupManifest {
  scryingGlass: 'backup';
  version: 1;
  created: number;
  app: string;
  vaultName: string;
  media: boolean;
}

export interface BackupSources {
  vaultRoot: string | null;
  // Файлы приложения в хранилище (state.json, записки, таблицы, карточки) — пути внутри хранилища.
  vaultFiles: string[];
  library: string | null;
  settingsFile: string;
}

// Сколько весят части копии (для вопроса «вместе с картинками и музыкой?»).
export function backupSizes(src: BackupSources) {
  const sum = (l: { size: number }[]) => l.reduce((n, f) => n + f.size, 0);
  const lib = src.library ? sum(folderFiles(src.library)) : 0;
  const media = src.vaultRoot ? sum(folderFiles(src.vaultRoot)) : 0;
  return { library: lib, media };
}

export async function writeBackup(out: string, src: BackupSources, manifest: BackupManifest, onProgress?: (done: number, total: number) => void) {
  const enc = (v: unknown) => new TextEncoder().encode(JSON.stringify(v, null, 2));
  const entries: ZipEntry[] = [{ name: 'manifest.json', data: enc(manifest) }, { name: 'settings.json', abs: src.settingsFile }];
  if (src.library) {
    for (const f of folderFiles(src.library, (rel) => rel.endsWith('.tmp'))) entries.push({ name: `library/${f.rel}`, abs: f.abs });
    // Скрытый список уже разложенных встроенных таблиц: без него удалённые встроенные вернулись бы сами.
    const seeded = path.join(src.library, 'tables', '.builtin.json');
    if (fs.existsSync(seeded)) entries.push({ name: 'library/tables/.builtin.json', abs: seeded });
  }
  if (src.vaultRoot) {
    // Структура папок — всегда: пустые папки (новое приключение, стандартные папки) тоже должны вернуться.
    for (const d of folderDirs(src.vaultRoot)) entries.push({ name: `vault/${d}/`, data: new Uint8Array(0) });
    const files = new Set(src.vaultFiles);
    // С картинками и музыкой — вся папка хранилища (кроме скрытых и снимков импорта); состояние — всегда.
    if (manifest.media) for (const f of folderFiles(src.vaultRoot)) files.add(f.rel);
    for (const rel of files) entries.push({ name: `vault/${rel}`, abs: path.join(src.vaultRoot, ...rel.split('/')) });
  }
  await writeZip(out, entries, onProgress);
}

// Распаковать копию во временную папку tmp (vault/…, library/…); вернуть описание и настройки из копии.
export async function readBackup(file: string, tmp: string): Promise<{ manifest: BackupManifest; settings: Record<string, unknown> | null }> {
  const small = await readZip(file, tmp, (n) => n === 'manifest.json' || n === 'settings.json');
  const json = (n: string) => {
    const b = small.get(n);
    return b ? JSON.parse(new TextDecoder().decode(b)) : null;
  };
  const manifest = json('manifest.json') as BackupManifest | null;
  if (manifest?.scryingGlass !== 'backup') throw new Error(t('core.notBackup'));
  return { manifest, settings: json('settings.json') };
}

// Переложить распакованную часть (tmp/vault или tmp/library) в папку назначения: файлы копии заменяют такие же,
// остальные файлы в папке остаются. Сколько файлов записано.
export function placeFiles(from: string, to: string): number {
  let n = 0;
  for (const d of folderDirs(from)) fs.mkdirSync(path.join(to, ...d.split('/')), { recursive: true });
  for (const f of folderFiles(from)) {
    const dest = path.join(to, ...f.rel.split('/'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f.abs, dest + '.tmp');
    fs.renameSync(dest + '.tmp', dest);
    n++;
  }
  // Скрытые файлы, которые нужны (folderFiles пропускает скрытое): состояние хранилища, список встроенных таблиц.
  for (const rel of ['.scrying-glass/state.json', 'tables/.builtin.json']) {
    const src = path.join(from, ...rel.split('/'));
    if (!fs.existsSync(src)) continue;
    const dest = path.join(to, ...rel.split('/'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    n++;
  }
  return n;
}
