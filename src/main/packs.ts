// Приключение одним файлом (.sgpack — обычный ZIP): перенос на другой компьютер или подарок другому мастеру.
//
//   manifest.json            — что это, название приключения, версия приложения
//   state.json               — то, что приложение знает о приключении: сцены, карты (туман, метки, жетоны),
//                              заготовки боёв, порядок плиток, подписи портретов
//   files/<приключение>/…    — папка приключения целиком (музыка — по желанию)
//   library/cards/<id>.json, library/<картинки> — общие карточки, на которые ссылаются заготовки и метки
//
// Пишется и читается потоком (fflate): большие картинки и музыка не держатся в памяти целиком.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { once } from 'node:events';
import { Unzip, UnzipInflate, UnzipPassThrough, Zip, ZipDeflate, ZipPassThrough } from 'fflate';
import { AUDIO_EXT, IMAGE_EXT } from '../shared/vault';

export const PACK_EXT = 'sgpack';

export interface PackSlices {
  scenes: unknown[];
  maps: Record<string, unknown>;
  encounters: unknown[];
  order: Record<string, string[]>;
  names: Record<string, string>;
}

export interface PackManifest {
  scryingGlass: 'adventure';
  version: 1;
  name: string;
  exported: number;
  app: string;
  music: boolean;
}

export interface LibraryCard {
  id: string;
  json: unknown;
  // Картинки карточки: путь внутри библиотеки и файл на диске.
  images: { rel: string; abs: string }[];
}

// Файлы папки (пути от неё), без скрытых; без музыки, если music = false.
export function folderFiles(dir: string, music: boolean): { rel: string; abs: string; size: number }[] {
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
      if (e.isDirectory() && depth < 12) walk(abs, r, depth + 1);
      else if (e.isFile()) {
        if (!music && AUDIO_EXT.includes(path.extname(e.name).toLowerCase())) continue;
        out.push({ rel: r, abs, size: fs.statSync(abs).size });
      }
    }
  };
  walk(dir, '', 0);
  return out;
}

// Сжимать ли файл: картинки и музыка уже сжаты, их кладём как есть.
const packed = (name: string) => [...IMAGE_EXT, ...AUDIO_EXT].includes(path.extname(name).toLowerCase());

export async function writePack(
  out: string,
  p: { folder: string; manifest: PackManifest; slices: PackSlices; library: LibraryCard[] },
  onProgress?: (done: number, total: number) => void,
) {
  const files = folderFiles(p.folder, p.manifest.music);
  const total = files.reduce((n, f) => n + f.size, 0);
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

  const addBuffer = (name: string, data: Uint8Array) => {
    const f = new ZipDeflate(name, { level: 6 });
    zip.add(f);
    f.push(data, true);
  };
  const addFile = async (name: string, abs: string) => {
    const f = packed(name) ? new ZipPassThrough(name) : new ZipDeflate(name, { level: 6 });
    zip.add(f);
    for await (const chunk of fs.createReadStream(abs, { highWaterMark: 1 << 20 })) {
      f.push(chunk as Buffer);
      done += (chunk as Buffer).length;
      onProgress?.(done, total);
      if (ws.writableNeedDrain) await once(ws, 'drain');
    }
    f.push(new Uint8Array(0), true);
  };

  const enc = (v: unknown) => new TextEncoder().encode(JSON.stringify(v, null, 2));
  addBuffer('manifest.json', enc(p.manifest));
  addBuffer('state.json', enc(p.slices));
  for (const c of p.library) {
    addBuffer(`library/cards/${c.id}.json`, enc(c.json));
    for (const img of c.images) if (fs.existsSync(img.abs)) await addFile(`library/${img.rel}`, img.abs);
  }
  for (const f of files) await addFile(`files/${p.manifest.name}/${f.rel}`, f.abs);
  zip.end();
  await finished;
  if (failed) throw failed;
  fs.renameSync(tmp, out);
}

export interface ReadPack {
  manifest: PackManifest;
  slices: PackSlices;
  // Где лежат распакованные файлы: tmp/files/<название> и tmp/library.
  dir: string;
  cards: { id: string; json: unknown }[];
}

// Безопасный путь внутри архива: без абсолютных путей и «..».
const safeEntry = (name: string) => !name.startsWith('/') && !name.includes('\\') && !name.split('/').some((p) => p === '..' || p === '');

// Распаковать во временную папку tmp (её создаёт и потом удаляет вызывающий).
export async function readPack(file: string, tmp: string): Promise<ReadPack> {
  const small = new Map<string, Uint8Array[]>();
  const uz = new Unzip();
  uz.register(UnzipInflate);
  uz.register(UnzipPassThrough);
  let error: Error | null = null;
  uz.onfile = (f) => {
    const name = f.name;
    if (name.endsWith('/') || !safeEntry(name)) return;
    if (name === 'manifest.json' || name === 'state.json' || (name.startsWith('library/cards/') && name.endsWith('.json'))) {
      const parts: Uint8Array[] = [];
      small.set(name, parts);
      f.ondata = (err, data) => (err ? (error = err) : parts.push(data));
    } else if (name.startsWith('files/') || name.startsWith('library/')) {
      const dest = path.join(tmp, ...name.split('/'));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const fd = fs.openSync(dest, 'w');
      f.ondata = (err, data, final) => {
        if (err) error = err;
        else fs.writeSync(fd, data);
        if (final || err) fs.closeSync(fd);
      };
    } else return;
    f.start();
  };
  for await (const chunk of fs.createReadStream(file, { highWaterMark: 1 << 20 })) uz.push(chunk as Buffer);
  uz.push(new Uint8Array(0), true);
  if (error) throw error;

  const json = (name: string) => {
    const parts = small.get(name);
    if (!parts) return null;
    return JSON.parse(new TextDecoder().decode(Buffer.concat(parts)));
  };
  const manifest = json('manifest.json') as PackManifest | null;
  if (manifest?.scryingGlass !== 'adventure' || typeof manifest.name !== 'string') throw new Error('Это не файл приключения Scrying Glass');
  const slices = (json('state.json') ?? {}) as Partial<PackSlices>;
  const cards = [...small.keys()]
    .filter((n) => n.startsWith('library/cards/'))
    .map((n) => ({ id: path.basename(n, '.json'), json: json(n) }));
  return {
    manifest,
    slices: { scenes: slices.scenes ?? [], maps: slices.maps ?? {}, encounters: slices.encounters ?? [], order: slices.order ?? {}, names: slices.names ?? {} },
    dir: tmp,
    cards,
  };
}

// Пути приключения from -> to во всём, что пришло из архива: строки «from/…» и «monsters:from/…», поле adventure.
// Названия и прочие тексты не трогаем.
export function remap<T>(value: T, from: string, to: string): T {
  if (from === to) return value;
  const fix = (s: string) =>
    s.startsWith(from + '/') ? to + s.slice(from.length) : s.startsWith(`monsters:${from}/`) ? `monsters:${to}` + s.slice(`monsters:${from}`.length) : s;
  const walk = (v: unknown, key?: string): unknown => {
    if (typeof v === 'string') return key === 'adventure' && v === from ? to : fix(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [fix(k), walk(x, k)]));
    return v;
  };
  return walk(value) as T;
}

// Свободное название папки: «Страд», «Страд (2)», …
export function freeFolder(root: string, name: string): string {
  let n = name;
  for (let i = 2; fs.existsSync(path.join(root, n)); i++) n = `${name} (${i})`;
  return n;
}
