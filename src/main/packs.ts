// Приключение одним файлом (.sgpack — обычный ZIP): перенос на другой компьютер или подарок другому мастеру.
//
//   manifest.json            — что это, название приключения, версия приложения
//   state.json               — то, что приложение знает о приключении: сцены, карты (туман, метки, жетоны),
//                              заготовки боёв, порядок плиток, подписи портретов
//   files/<приключение>/…    — папка приключения целиком (музыка — по желанию)
//   library/cards/<id>.json, library/<картинки> — общие карточки, на которые ссылаются заготовки и метки
//
// Пишется и читается потоком (zip.ts, fflate): большие картинки и музыка не держатся в памяти целиком.
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AUDIO_EXT } from '../shared/vault';
import { folderDirs, folderFiles as walkFolder, readEntry, readZip, writeZip, type ZipEntry } from './zip';

export const PACK_EXT = 'sgpack';

export interface PackSlices {
  scenes: unknown[];
  maps: Record<string, unknown>;
  encounters: unknown[];
  order: Record<string, string[]>;
  names: Record<string, string>;
  // Подборка правой панели приключения (без включённой сцены; у сцен — своя, внутри сцены).
  tray?: unknown;
  // The adventure's pinned journal note (its path).
  pinned?: string;
  // Mausritter: the adventure's factions and exploration clock (none before 0.41).
  mausritter?: unknown;
  // The adventure's progress clocks (none before 0.54).
  clocks?: unknown;
}

export interface PackManifest {
  scryingGlass: 'adventure';
  version: 1;
  name: string;
  exported: number;
  app: string;
  music: boolean;
  // Ролевая система приключения (нет — файл из версии до 0.18: D&D по умолчанию).
  system?: string;
}

export interface LibraryCard {
  id: string;
  json: unknown;
  // Картинки карточки: путь внутри библиотеки и файл на диске.
  images: { rel: string; abs: string }[];
}

// Файлы папки (пути от неё), без скрытых; без музыки, если music = false.
export const folderFiles = (dir: string, music: boolean) =>
  walkFolder(dir, (rel, isDir) => !isDir && !music && AUDIO_EXT.includes(path.extname(rel).toLowerCase()));

export async function writePack(
  out: string,
  p: { folder: string; manifest: PackManifest; slices: PackSlices; library: LibraryCard[] },
  onProgress?: (done: number, total: number) => void,
) {
  const enc = (v: unknown) => new TextEncoder().encode(JSON.stringify(v, null, 2));
  const entries: ZipEntry[] = [
    { name: 'manifest.json', data: enc(p.manifest) },
    { name: 'state.json', data: enc(p.slices) },
  ];
  for (const c of p.library) {
    entries.push({ name: `library/cards/${c.id}.json`, data: enc(c.json) });
    for (const img of c.images) entries.push({ name: `library/${img.rel}`, abs: img.abs });
  }
  // Папки — тоже (пустые стандартные папки приключения должны вернуться).
  for (const d of folderDirs(p.folder)) entries.push({ name: `files/${p.manifest.name}/${d}/`, data: new Uint8Array(0) });
  for (const f of folderFiles(p.folder, p.manifest.music)) entries.push({ name: `files/${p.manifest.name}/${f.rel}`, abs: f.abs });
  await writeZip(out, entries, onProgress);
}

export interface ReadPack {
  manifest: PackManifest;
  slices: PackSlices;
  // Где лежат распакованные файлы: tmp/files/<название> и tmp/library.
  dir: string;
  cards: { id: string; json: unknown }[];
}

// Описание приключения из файла — без распаковки (для вопроса о названии).
export async function packManifest(file: string): Promise<PackManifest> {
  const b = await readEntry(file, 'manifest.json');
  const m = b ? (JSON.parse(new TextDecoder().decode(b)) as PackManifest) : null;
  if (m?.scryingGlass !== 'adventure' || typeof m.name !== 'string') throw new Error(t('core.notAdventure'));
  return m;
}

// Распаковать во временную папку tmp (её создаёт и потом удаляет вызывающий).
export async function readPack(file: string, tmp: string): Promise<ReadPack> {
  const small = await readZip(file, tmp, (n) => n === 'manifest.json' || n === 'state.json' || (n.startsWith('library/cards/') && n.endsWith('.json')));
  const json = (name: string) => {
    const b = small.get(name);
    return b ? JSON.parse(new TextDecoder().decode(b)) : null;
  };
  const manifest = json('manifest.json') as PackManifest | null;
  if (manifest?.scryingGlass !== 'adventure' || typeof manifest.name !== 'string') throw new Error(t('core.notAdventure'));
  const slices = (json('state.json') ?? {}) as Partial<PackSlices>;
  const cards = [...small.keys()]
    .filter((n) => n.startsWith('library/cards/'))
    .map((n) => ({ id: path.basename(n, '.json'), json: json(n) }));
  return {
    manifest,
    slices: { scenes: slices.scenes ?? [], maps: slices.maps ?? {}, encounters: slices.encounters ?? [], order: slices.order ?? {}, names: slices.names ?? {}, tray: slices.tray, pinned: typeof slices.pinned === 'string' ? slices.pinned : undefined, mausritter: slices.mausritter, clocks: Array.isArray(slices.clocks) ? slices.clocks : undefined },
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
