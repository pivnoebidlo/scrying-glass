// Packs of the GM's assets (shared/mapassets.ts): a folder of <library>/assets/ saved as one «.sgassets» file, and such a
// file installed as a folder there. A pack from someone else's hands: only its manifest and pictures are taken.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import {
  ASSET_PACK_MANIFEST, PACK_MARK, PACK_PICTURES, packFolder, packPicture, safeAssetPath, validAssetPack,
  type AssetPackManifest, type InstalledAssetPack,
} from '../shared/mapassets';
import { assetsDir, forgetMapAssets } from './mapassets';
import { discard } from './trash';
import { folderFiles, readEntry, readZip, writeZip } from './zip';

// A folder right inside assets/: one name, no way up.
const oneFolder = (folder: string) => !!folder && !/[/\\]/.test(folder) && folder !== '.' && folder !== '..' && !folder.startsWith('.');

function readMark(dir: string): AssetPackManifest | null {
  try {
    return validAssetPack(JSON.parse(fs.readFileSync(path.join(dir, PACK_MARK), 'utf8')));
  } catch {
    return null;
  }
}

// The packs installed (or saved) in the library: folders of assets/ with a manifest.
export function installedPacks(library: string): InstalledAssetPack[] {
  const root = assetsDir(library);
  let names: fs.Dirent[] = [];
  try {
    names = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  return names.flatMap((e) => {
    if (!e.isDirectory() || e.name.startsWith('.')) return [];
    const manifest = readMark(path.join(root, e.name));
    return manifest ? [{ folder: e.name, manifest }] : [];
  });
}

// The pictures of a folder of assets, as the pack will hold them.
const picturesOf = (dir: string) => folderFiles(dir).filter((f) => safeAssetPath(f.rel));

// A folder of assets as a pack: the same pack again (a new release) if it was one, else a new one.
export async function exportAssetPack(library: string, folder: string, meta: { title: string; author?: string; license?: string }, out: string): Promise<AssetPackManifest> {
  if (!oneFolder(folder)) throw new Error('assetpack:folder');
  const dir = path.join(assetsDir(library), folder);
  const pictures = picturesOf(dir);
  if (!pictures.length) throw new Error('assetpack:empty');
  const before = readMark(dir);
  const manifest = validAssetPack({
    scryingGlass: 'assets',
    version: 1,
    id: before?.id ?? randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x'),
    title: meta.title,
    release: before ? before.release + 1 : 1,
    author: meta.author,
    license: meta.license,
    count: pictures.length,
  });
  if (!manifest) throw new Error('assetpack:title');
  await writeZip(out, [{ name: ASSET_PACK_MANIFEST, data: Buffer.from(JSON.stringify(manifest, null, 2)) }, ...pictures.map((f) => ({ name: PACK_PICTURES + f.rel, abs: f.abs }))]);
  // The folder remembers it is this pack: the next one is its next release.
  fs.writeFileSync(path.join(dir, PACK_MARK), JSON.stringify(manifest, null, 2));
  return manifest;
}

// What a pack file is, before installing it.
export async function readAssetPack(file: string): Promise<AssetPackManifest | null> {
  try {
    const raw = await readEntry(file, ASSET_PACK_MANIFEST);
    return raw ? validAssetPack(JSON.parse(raw.toString('utf8'))) : null;
  } catch {
    return null;
  }
}

// Install a pack: into its folder (a release of a pack there already replaces it, the old one goes to the library's
// trash), else into a new folder named after it.
export async function installAssetPack(library: string, file: string): Promise<InstalledAssetPack & { replaced: boolean }> {
  const manifest = await readAssetPack(file);
  if (!manifest) throw new Error('assetpack:bad');
  const root = assetsDir(library);
  fs.mkdirSync(root, { recursive: true });
  const had = installedPacks(library).find((p) => p.manifest.id === manifest.id);
  const tmp = path.join(root, `.install-${randomBytes(6).toString('hex')}`);
  try {
    await readZip(file, tmp, () => false);
    const pics = path.join(tmp, PACK_PICTURES.slice(0, -1));
    // Only pictures stay: anything else the ZIP held goes.
    for (const f of folderFiles(pics)) if (!packPicture(PACK_PICTURES + f.rel)) fs.rmSync(f.abs, { force: true });
    if (!fs.existsSync(pics) || !picturesOf(pics).length) throw new Error('assetpack:empty');
    let folder = had?.folder ?? packFolder(manifest.title);
    if (had) discard(library, [`assets/${had.folder}`], { title: had.manifest.title, kind: 'folder' });
    else for (let i = 2; fs.existsSync(path.join(root, folder)); i++) folder = `${packFolder(manifest.title)} (${i})`;
    fs.renameSync(pics, path.join(root, folder));
    fs.writeFileSync(path.join(root, folder, PACK_MARK), JSON.stringify(manifest, null, 2));
    forgetMapAssets();
    return { folder, manifest, replaced: !!had };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// A pack's folder to the library's trash.
export function removeAssetPack(library: string, folder: string): boolean {
  if (!oneFolder(folder) || !readMark(path.join(assetsDir(library), folder))) return false;
  const ok = discard(library, [`assets/${folder}`], { title: folder, kind: 'folder' });
  forgetMapAssets();
  return ok;
}
