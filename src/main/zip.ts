// ZIP потоком (fflate): запись файлов с диска и из памяти, чтение с раскладкой по папке. Большие картинки и музыка
// не держатся в памяти целиком. Общее для приключения одним файлом (packs.ts) и полной резервной копии (archive.ts).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { once } from 'node:events';
import { Unzip, UnzipInflate, UnzipPassThrough, Zip, ZipDeflate, ZipPassThrough } from 'fflate';
import { AUDIO_EXT, IMAGE_EXT } from '../shared/vault';

export type ZipEntry = { name: string; abs: string } | { name: string; data: Uint8Array };

// Картинки и музыка уже сжаты — их кладём как есть.
const packed = (name: string) => [...IMAGE_EXT, ...AUDIO_EXT].includes(path.extname(name).toLowerCase());

export async function writeZip(out: string, entries: ZipEntry[], onProgress?: (done: number, total: number) => void) {
  const total = entries.reduce((n, e) => n + ('abs' in e ? safeSize(e.abs) : e.data.length), 0);
  let done = 0;
  const tmp = out + '.tmp';
  const ws = fs.createWriteStream(tmp);
  const finished = new Promise<void>((resolve, reject) => {
    ws.on('finish', resolve);
    ws.on('error', reject);
  });
  let failed: Error | null = null;
  const zip = new Zip((err, chunk, final) => {
    if (err) failed = err;
    else ws.write(chunk);
    if (final || err) ws.end();
  });
  for (const e of entries) {
    if ('data' in e) {
      const f = e.name.endsWith('/') ? new ZipPassThrough(e.name) : new ZipDeflate(e.name, { level: 6 });
      zip.add(f);
      f.push(e.data, true);
      done += e.data.length;
      continue;
    }
    if (!fs.existsSync(e.abs)) continue;
    const f = packed(e.name) ? new ZipPassThrough(e.name) : new ZipDeflate(e.name, { level: 6 });
    zip.add(f);
    for await (const chunk of fs.createReadStream(e.abs, { highWaterMark: 1 << 20 })) {
      f.push(chunk as Buffer);
      done += (chunk as Buffer).length;
      onProgress?.(done, total);
      if (ws.writableNeedDrain) await once(ws, 'drain');
    }
    f.push(new Uint8Array(0), true);
  }
  zip.end();
  await finished;
  if (failed) throw failed;
  fs.renameSync(tmp, out);
}

const safeSize = (f: string) => {
  try {
    return fs.statSync(f).size;
  } catch {
    return 0;
  }
};

// Безопасный путь внутри архива: без абсолютных путей и «..».
export const safeEntry = (name: string) => !name.startsWith('/') && !name.includes('\\') && !name.split('/').some((p) => p === '..' || p === '');

// Прочитать архив: небольшие файлы, для которых keep(name) — в память (возвращаются), остальные — в папку dir
// (по их путям в архиве). Возвращает содержимое небольших файлов.
export async function readZip(file: string, dir: string, keep: (name: string) => boolean): Promise<Map<string, Buffer>> {
  const small = new Map<string, Uint8Array[]>();
  const uz = new Unzip();
  uz.register(UnzipInflate);
  uz.register(UnzipPassThrough);
  let error: Error | null = null;
  uz.onfile = (f) => {
    const name = f.name;
    // Папка (в том числе пустая — например, только что созданное приключение).
    if (name.endsWith('/')) {
      if (safeEntry(name.slice(0, -1))) fs.mkdirSync(path.join(dir, ...name.slice(0, -1).split('/')), { recursive: true });
      return;
    }
    if (!safeEntry(name)) return;
    if (keep(name)) {
      const parts: Uint8Array[] = [];
      small.set(name, parts);
      f.ondata = (err, data) => (err ? (error = err) : parts.push(data));
    } else {
      const dest = path.join(dir, ...name.split('/'));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const fd = fs.openSync(dest, 'w');
      f.ondata = (err, data, final) => {
        if (err) error = err;
        else fs.writeSync(fd, data);
        if (final || err) fs.closeSync(fd);
      };
    }
    f.start();
  };
  for await (const chunk of fs.createReadStream(file, { highWaterMark: 1 << 20 })) uz.push(chunk as Buffer);
  uz.push(new Uint8Array(0), true);
  if (error) throw error;
  return new Map([...small].map(([k, v]) => [k, Buffer.concat(v)]));
}

// Вложенные папки (пути от неё), без скрытых.
export function folderDirs(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string, rel: string, depth: number) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || !e.isDirectory() || depth >= 12) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      out.push(r);
      walk(path.join(d, e.name), r, depth + 1);
    }
  };
  walk(dir, '', 0);
  return out;
}

// Файлы папки (пути от неё), без скрытых; skip — что пропустить (по пути от папки).
export function folderFiles(dir: string, skip: (rel: string, isDir: boolean) => boolean = () => false): { rel: string; abs: string; size: number }[] {
  const out: { rel: string; abs: string; size: number }[] = [];
  const walk = (d: string, rel: string, depth: number) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(d, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (depth < 12 && !skip(r, true)) walk(abs, r, depth + 1);
      } else if (e.isFile() && !skip(r, false)) out.push({ rel: r, abs, size: safeSize(abs) });
    }
  };
  walk(dir, '', 0);
  return out;
}
