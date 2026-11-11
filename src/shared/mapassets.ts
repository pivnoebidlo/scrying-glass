// The GM's own pictures for the map editor: files in <library>/assets/ (any folders inside). A file's name says what it
// is and how many cells it takes: «Kiln_Stone_Brick_B1_2x3.png» — «Kiln Stone Brick», variant B1, 2 × 3 cells; without
// the size — one cell. The folders are the groups of the palette. Pure: the core indexes, the window shows.

export const ASSET_DIR = 'assets';
export const ASSET_EXTS = ['.png', '.webp', '.jpg', '.jpeg'];
export const MAX_ASSET_SIDE = 12;

export interface MapAsset {
  // The path inside assets/, with '/'.
  path: string;
  // The thing it is a variant of (its folder and name without the variant): «Decor/Pottery/Amphoras|Amphora Clay Brown».
  base: string;
  title: string;
  // What tells it from the other variants («A1», «B2 Broken»); '' — the only one.
  variant: string;
  // Its folder: the group of the palette.
  group: string;
  w: number;
  h: number;
}

// Words that only tell variants apart: A, B2, C1, a number, «Broken».
const VARIANT = /^(?:[A-Z]\d*|\d+|Broken|Var\d*|Variant\d*)$/i;

export function parseAssetPath(path: string): MapAsset | null {
  const clean = path.replace(/\\/g, '/');
  const slash = clean.lastIndexOf('/');
  const file = clean.slice(slash + 1);
  const dot = file.lastIndexOf('.');
  if (dot <= 0 || !ASSET_EXTS.includes(file.slice(dot).toLowerCase())) return null;
  let stem = file.slice(0, dot);
  let w = 1;
  let h = 1;
  const size = /[_\s-](\d{1,2})x(\d{1,2})$/i.exec(stem);
  if (size) {
    w = Math.min(MAX_ASSET_SIDE, Math.max(1, Number(size[1])));
    h = Math.min(MAX_ASSET_SIDE, Math.max(1, Number(size[2])));
    stem = stem.slice(0, size.index);
  }
  const words = stem.split(/[_\s]+/).filter(Boolean);
  if (!words.length) return null;
  // The variant: from the first word that only tells variants apart (never the first word) to the end — «B1 Lid».
  let cut = words.findIndex((w, i) => i > 0 && VARIANT.test(w));
  if (cut < 0) cut = words.length;
  const title = words.slice(0, cut).join(' ');
  const group = slash > 0 ? clean.slice(0, slash) : '';
  return { path: clean, base: `${group}|${title.toLowerCase()}`, title, variant: words.slice(cut).join(' '), group, w, h };
}

// A path from a map file, which may be anyone's: inside assets/, no way up, a picture.
export const safeAssetPath = (p: unknown): p is string =>
  typeof p === 'string' && p.length > 0 && p.length < 400 && !p.startsWith('/') && !/^[a-z]:/i.test(p) && !p.split('/').some((s) => s === '..' || s === '' || s === '.') && !p.includes('\\') && parseAssetPath(p) !== null;

// A group's title in the palette: «Decor / Pottery / Amphoras».
export const groupTitle = (group: string) => group.replace(/_/g, ' ').split('/').join(' / ');

// The things of the palette: the variants of one thing together, by group.
export interface AssetThing {
  base: string;
  title: string;
  group: string;
  variants: MapAsset[];
}
export function assetThings(list: readonly MapAsset[]): AssetThing[] {
  const by = new Map<string, AssetThing>();
  for (const a of list) {
    let t = by.get(a.base);
    if (!t) by.set(a.base, (t = { base: a.base, title: a.title, group: a.group, variants: [] }));
    t.variants.push(a);
  }
  const out = [...by.values()];
  for (const t of out) t.variants.sort((a, b) => a.variant.localeCompare(b.variant, undefined, { numeric: true }));
  return out.sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title, undefined, { numeric: true }));
}

// ---- Packs of assets (0.111) ----
// A folder of assets one GM gives another: «Name.sgassets», a ZIP of assets.json (the manifest below) and pictures/… —
// the pictures with their folders, as they lie in the pack's folder. Installed as a folder of <library>/assets/ with
// its manifest beside the pictures (PACK_MARK: a dot file, the index leaves it out): the palette shows it as any folder.
export const ASSET_PACK_EXT = '.sgassets';
export const ASSET_PACK_MANIFEST = 'assets.json';
export const PACK_MARK = '.sgassets.json';
export const PACK_PICTURES = 'pictures/';

export interface AssetPackManifest {
  scryingGlass: 'assets';
  version: 1;
  // The same pack in every copy: a newer release of it replaces the old one.
  id: string;
  title: string;
  release: number;
  author?: string;
  // Where the pictures come from and what one may do with them.
  license?: string;
  count?: number;
}

const PACK_ID = /^[A-Za-z0-9][A-Za-z0-9-]{3,40}$/;
const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

// A manifest from someone else's file: only what is known, or null.
export function validAssetPack(x: unknown): AssetPackManifest | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (o['scryingGlass'] !== 'assets' || o['version'] !== 1 || typeof o['id'] !== 'string' || !PACK_ID.test(o['id'])) return null;
  const title = text(o['title'], 120);
  if (!title) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined);
  const author = text(o['author'], 120);
  const license = text(o['license'], 2000);
  const count = num(o['count']);
  return { scryingGlass: 'assets', version: 1, id: o['id'], title, release: Math.max(1, num(o['release']) ?? 1), ...(author ? { author } : {}), ...(license ? { license } : {}), ...(count !== undefined ? { count } : {}) };
}

// A picture of a pack's ZIP: pictures/<path>, a picture, no way up.
export const packPicture = (name: string) => name.startsWith(PACK_PICTURES) && safeAssetPath(name.slice(PACK_PICTURES.length));

// The folder a pack goes to: its title made safe for a file name.
export const packFolder = (title: string) => title.replace(/[/\\:*?"<>|.]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Pack';

// An installed pack: its folder in assets/ and its manifest.
export interface InstalledAssetPack {
  folder: string;
  manifest: AssetPackManifest;
}
