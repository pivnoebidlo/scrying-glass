// Автоматические снимки данных приложения: страховка от сбоев и ошибок. В снимок входит всё маленькое и ценное —
// состояние хранилища (.scrying-glass/state.json: сцены, туман, метки, жетоны, заготовки), записки, таблицы и
// карточки хранилища, библиотека без картинок (карточки, таблицы, свои расы, портреты SRD) и настройки приложения.
// Картинки и музыку не копируем: это файлы пользователя, их много (для них — Time Machine, облако).
//
// <userData>/backups/<время>/{meta.json, settings.json, vault/…, library/…}. Снимок не делается, если ничего не
// изменилось с прошлого. Хранятся последние KEEP_LAST, старше — по одному на день за KEEP_DAYS дней; сделанные
// вручную не удаляются.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

const KEEP_LAST = 20;
const KEEP_DAYS = 30;

export type Reason = 'open' | 'auto' | 'quit' | 'manual' | 'before-restore';

export interface SnapshotMeta {
  id: string;
  created: number;
  reason: Reason;
  // Хранилище, чьи данные в снимке (абсолютный путь) и его название.
  vault: string | null;
  vaultName: string;
  files: number;
  bytes: number;
  hash: string;
}

export interface Sources {
  dir: string;
  vaultRoot: string | null;
  // Файлы приложения в хранилище (пути внутри хранилища): state.json, записки, таблицы, карточки.
  vaultFiles: string[];
  library: string | null;
  settingsFile: string;
}

// Файлы библиотеки, которые входят в снимок: всё, кроме картинок (images/) — их много и они большие.
function libraryFiles(lib: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, rel: string, depth: number) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (depth < 6 && !(rel === '' && e.name === 'images')) walk(path.join(dir, e.name), r, depth + 1);
      } else if (e.isFile() && /\.(json|md|txt)$/i.test(e.name) && !e.name.endsWith('.tmp')) out.push(r);
    }
  };
  walk(lib, '', 0);
  return out;
}

const stamp = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
};

export function listSnapshots(dir: string): SnapshotMeta[] {
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out: SnapshotMeta[] = [];
  for (const n of names) {
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(dir, n, 'meta.json'), 'utf8')) as SnapshotMeta);
    } catch {
      /* недописанный или чужой каталог */
    }
  }
  return out.sort((a, b) => b.created - a.created);
}

// Сделать снимок. null — нечего сохранять или ничего не изменилось с прошлого снимка этого хранилища (force —
// сохранить всё равно).
export function createSnapshot(src: Sources, reason: Reason, force = false): SnapshotMeta | null {
  const items: { to: string; from: string }[] = [];
  if (src.vaultRoot) for (const rel of src.vaultFiles) items.push({ to: `vault/${rel}`, from: path.join(src.vaultRoot, ...rel.split('/')) });
  if (src.library) for (const rel of libraryFiles(src.library)) items.push({ to: `library/${rel}`, from: path.join(src.library, ...rel.split('/')) });
  items.push({ to: 'settings.json', from: src.settingsFile });

  const hash = createHash('sha1');
  const data: { to: string; buf: Buffer }[] = [];
  for (const it of items.sort((a, b) => a.to.localeCompare(b.to))) {
    let buf: Buffer;
    try {
      buf = fs.readFileSync(it.from);
    } catch {
      continue;
    }
    hash.update(it.to).update('\0').update(buf);
    data.push({ to: it.to, buf });
  }
  if (!data.length) return null;
  const digest = hash.digest('hex');
  const last = listSnapshots(src.dir).find((s) => s.vault === src.vaultRoot);
  if (!force && last?.hash === digest) return null;

  const now = new Date();
  let id = stamp(now);
  for (let i = 2; fs.existsSync(path.join(src.dir, id)); i++) id = `${stamp(now)}-${i}`;
  const root = path.join(src.dir, id);
  const tmp = root + '.tmp';
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const d of data) {
    const file = path.join(tmp, ...d.to.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, d.buf);
  }
  const meta: SnapshotMeta = {
    id,
    created: now.getTime(),
    reason,
    vault: src.vaultRoot,
    vaultName: src.vaultRoot ? path.basename(src.vaultRoot) : '',
    files: data.length,
    bytes: data.reduce((n, d) => n + d.buf.length, 0),
    hash: digest,
  };
  fs.writeFileSync(path.join(tmp, 'meta.json'), JSON.stringify(meta, null, 2));
  // Снимок появляется целиком или никак: каталог переименовывается в самом конце.
  fs.renameSync(tmp, root);
  prune(src.dir, now.getTime());
  return meta;
}

// Что удалить: всё, кроме последних KEEP_LAST, последнего за каждый день из последних KEEP_DAYS и ручных.
export function toPrune(list: SnapshotMeta[], now: number): string[] {
  const keep = new Set<string>();
  const sorted = [...list].sort((a, b) => b.created - a.created);
  sorted.slice(0, KEEP_LAST).forEach((s) => keep.add(s.id));
  const days = new Set<string>();
  for (const s of sorted) {
    if (s.reason === 'manual') keep.add(s.id);
    if (now - s.created > KEEP_DAYS * 86_400_000) continue;
    const day = new Date(s.created).toDateString();
    if (!days.has(day)) {
      days.add(day);
      keep.add(s.id);
    }
  }
  return sorted.filter((s) => !keep.has(s.id)).map((s) => s.id);
}

function prune(dir: string, now: number) {
  for (const id of toPrune(listSnapshots(dir), now)) fs.rmSync(path.join(dir, id), { recursive: true, force: true });
}

// Вернуть файлы из снимка: части хранилища — в хранилище (только в то же, из которого снимок), библиотеки — в
// библиотеку. Файлы, появившиеся после снимка, не трогаем. Возвращает, сколько файлов записано.
export function restoreSnapshot(dir: string, id: string, to: { vaultRoot: string | null; library: string | null }, parts: { vault: boolean; library: boolean }): number {
  const root = path.join(dir, id);
  let n = 0;
  const copy = (sub: string, target: string) => {
    const base = path.join(root, sub);
    const walk = (d: string) => {
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(d, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) walk(abs);
        else if (e.isFile()) {
          const dest = path.join(target, path.relative(base, abs));
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          const tmp = dest + '.tmp';
          fs.copyFileSync(abs, tmp);
          fs.renameSync(tmp, dest);
          n++;
        }
      }
    };
    walk(base);
  };
  if (parts.vault && to.vaultRoot) copy('vault', to.vaultRoot);
  if (parts.library && to.library) copy('library', to.library);
  return n;
}
