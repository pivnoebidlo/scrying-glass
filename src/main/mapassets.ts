// The GM's own pictures for the map editor: <library>/assets/ (shared/mapassets.ts — the names). The core keeps an
// index of the folder — paths, names and sizes, never the pictures: the window shows thumbnails through sg-asset://l/
// and loads only the pictures a map uses. The index is made once and again only when the folder changes.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ASSET_DIR, ASSET_EXTS, parseAssetPath, type MapAsset } from '../shared/mapassets';

// Enough for any collection; a folder larger than this is cut (and says so).
export const MAX_ASSETS = 50000;

let cached: { root: string; list: MapAsset[]; cut: boolean } | null = null;
let watcher: fs.FSWatcher | null = null;
let watched: string | null = null;
let onChange: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export const assetsDir = (library: string) => path.join(library, ASSET_DIR);

function walk(root: string): { list: MapAsset[]; cut: boolean } {
  const list: MapAsset[] = [];
  let cut = false;
  const go = (dir: string, rel: string, depth: number) => {
    if (cut || depth > 8) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) go(path.join(dir, e.name), r, depth + 1);
      else if (e.isFile() && ASSET_EXTS.includes(path.extname(e.name).toLowerCase())) {
        const a = parseAssetPath(r);
        if (!a) continue;
        if (list.length >= MAX_ASSETS) {
          cut = true;
          return;
        }
        list.push(a);
      }
    }
  };
  go(root, '', 0);
  return { list, cut };
}

// The index of the library's assets (made now if the folder changed since).
export function listMapAssets(library: string | null): { list: MapAsset[]; cut: boolean } {
  if (!library) return { list: [], cut: false };
  const root = assetsDir(library);
  if (cached?.root !== root) {
    cached = { root, ...walk(root) };
    watch(root);
  }
  return { list: cached.list, cut: cached.cut };
}

// Tell the windows when the folder changes (a moment after the last change: copying a pack is thousands of events).
export function onMapAssetsChanged(fn: () => void) {
  onChange = fn;
}
function watch(root: string) {
  if (watched === root) return;
  watcher?.close();
  watcher = null;
  watched = root;
  try {
    fs.mkdirSync(root, { recursive: true });
    watcher = fs.watch(root, { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        cached = null;
        onChange?.();
      }, 800);
    });
  } catch {
    /* no watching: «Refresh» in the palette still works */
  }
}
export function forgetMapAssets() {
  cached = null;
}
