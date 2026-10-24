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
import type { PublishedMark } from '../shared/repo';
import { folderDirs, folderFiles as walkFolder, readEntry, readZip, safeEntry, writeZip, type ZipEntry } from './zip';

export const PACK_EXT = 'sgpack';

export interface PackSlices {
  scenes: unknown[];
  maps: Record<string, unknown>;
  encounters: unknown[];
  order: Record<string, string[]>;
  names: Record<string, string>;
  // Подборка правой панели приключения (без включённой сцены; у сцен — своя, внутри сцены).
  tray?: unknown;
  // The adventure's pinned journal notes and PDFs (paths; before 0.56 — one path).
  pinned?: string | string[];
  // Mausritter: the adventure's factions and exploration clock (none before 0.41).
  mausritter?: unknown;
  // The adventure's progress clocks (none before 0.54).
  clocks?: unknown;
  // The Forged in the Dark crew (none before 0.54).
  crew?: unknown;
  // The adventure's entry in the repository, if its author published it (shared/repo.ts; none before 0.57).
  repo?: PublishedMark;
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

// Файлы папки (пути от неё), без скрытых; без музыки, если music = false; without PDFs if pdf = false (the
// repository: books in a journal are seldom the GM's to share).
export const folderFiles = (dir: string, music: boolean, pdf = true) =>
  walkFolder(dir, (rel, isDir) => {
    const ext = path.extname(rel).toLowerCase();
    return !isDir && ((!music && AUDIO_EXT.includes(ext)) || (!pdf && ext === '.pdf'));
  });

// A lighter copy of a picture for the pack (shrink.ts): where it was written and its new name (another extension —
// an opaque PNG becomes a JPEG), or null — the picture goes as it is.
export type Shrink = (abs: string, rel: string) => { abs: string; rel: string } | null;

const SHRINKABLE = ['.png', '.jpg', '.jpeg', '.webp'];
// Text files of the folder that name pictures by path: cards, notes, sketches (JSON), journal and compendium (Markdown).
const NAMING = ['.json', '.md'];

// Paths renamed in everything of the pack's state: strings and keys equal to an old path (scenes, maps, trays, order…).
export function renameFiles<T>(value: T, names: Map<string, string>): T {
  if (!names.size) return value;
  const fix = (s: string) => names.get(s) ?? s;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return fix(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [fix(k), walk(x)]));
    return v;
  };
  return walk(value) as T;
}

// The same in a text file: a JSON string with the old path, or the path as it is in Markdown (the `image:` field).
export function renameInText(text: string, ext: string, names: Map<string, string>): string {
  let out = text;
  for (const [from, to] of names) {
    out = ext === '.json' ? out.split(JSON.stringify(from)).join(JSON.stringify(to)) : out.split(from).join(to);
  }
  return out;
}

// A free name next to the others: «x.jpg», else «x (2).jpg»…
function freeName(rel: string, taken: Set<string>): string {
  const ext = path.posix.extname(rel);
  const base = rel.slice(0, -ext.length);
  let name = rel;
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${base} (${i})${ext}`;
  return name;
}

export async function writePack(
  out: string,
  p: { folder: string; manifest: PackManifest; slices: PackSlices; library: LibraryCard[]; pdf?: boolean; shrink?: Shrink },
  onProgress?: (done: number, total: number) => void,
) {
  const enc = (v: unknown) => new TextEncoder().encode(JSON.stringify(v, null, 2));
  const files = folderFiles(p.folder, p.manifest.music, p.pdf);
  // Lighter pictures (publishing): a renamed one is renamed in the state and in the folder's text files too.
  const names = new Map<string, string>();
  const swapped = new Map<string, { abs: string; rel: string }>();
  if (p.shrink) {
    const taken = new Set(files.map((f) => f.rel.toLowerCase()));
    for (const f of files) {
      if (!SHRINKABLE.includes(path.extname(f.rel).toLowerCase())) continue;
      const small = p.shrink(f.abs, f.rel);
      if (!small) continue;
      const rel = small.rel === f.rel ? f.rel : freeName(small.rel, taken);
      taken.add(rel.toLowerCase());
      swapped.set(f.rel, { abs: small.abs, rel });
      if (rel !== f.rel) names.set(`${p.manifest.name}/${f.rel}`, `${p.manifest.name}/${rel}`);
    }
  }
  const entries: ZipEntry[] = [
    { name: 'manifest.json', data: enc(p.manifest) },
    { name: 'state.json', data: enc(renameFiles(p.slices, names)) },
  ];
  for (const c of p.library) {
    entries.push({ name: `library/cards/${c.id}.json`, data: enc(c.json) });
    for (const img of c.images) entries.push({ name: `library/${img.rel}`, abs: img.abs });
  }
  // Папки — тоже (пустые стандартные папки приключения должны вернуться).
  for (const d of folderDirs(p.folder)) entries.push({ name: `files/${p.manifest.name}/${d}/`, data: new Uint8Array(0) });
  for (const f of files) {
    const small = swapped.get(f.rel);
    const name = `files/${p.manifest.name}/${small?.rel ?? f.rel}`;
    const ext = path.extname(f.rel).toLowerCase();
    if (small) entries.push({ name, abs: small.abs });
    else if (names.size && NAMING.includes(ext)) {
      const text = fs.readFileSync(f.abs, 'utf8');
      const fixed = renameInText(text, ext, names);
      entries.push(fixed === text ? { name, abs: f.abs } : { name, data: new TextEncoder().encode(fixed) });
    } else entries.push({ name, abs: f.abs });
  }
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
// The adventure's name is a folder name inside the pack and the vault: one plain path part, nothing like «..».
const validManifest = (m: PackManifest | null): m is PackManifest =>
  m?.scryingGlass === 'adventure' && typeof m.name === 'string' && safeEntry(m.name) && !m.name.includes('/') && !m.name.startsWith('.');

export async function packManifest(file: string): Promise<PackManifest> {
  const b = await readEntry(file, 'manifest.json');
  const m = b ? (JSON.parse(new TextDecoder().decode(b)) as PackManifest) : null;
  if (!validManifest(m)) throw new Error(t('core.notAdventure'));
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
  if (!validManifest(manifest)) throw new Error(t('core.notAdventure'));
  const slices = (json('state.json') ?? {}) as Partial<PackSlices>;
  const cards = [...small.keys()]
    .filter((n) => n.startsWith('library/cards/'))
    .map((n) => ({ id: path.basename(n, '.json'), json: json(n) }));
  return {
    manifest,
    slices: { scenes: slices.scenes ?? [], maps: slices.maps ?? {}, encounters: slices.encounters ?? [], order: slices.order ?? {}, names: slices.names ?? {}, tray: slices.tray, pinned: typeof slices.pinned === 'string' || Array.isArray(slices.pinned) ? slices.pinned : undefined, mausritter: slices.mausritter, clocks: Array.isArray(slices.clocks) ? slices.clocks : undefined, crew: slices.crew, repo: validMark(slices.repo) },
    dir: tmp,
    cards,
  };
}

const validMark = (m: unknown): PublishedMark | undefined => {
  const o = m as PublishedMark | undefined;
  if (!o || typeof o.id !== 'string' || typeof o.version !== 'number') return undefined;
  return { id: o.id, version: o.version, ...(typeof o.source === 'string' ? { source: o.source } : {}) };
};

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
