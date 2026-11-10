// The map editor's drafts (modules/tools/mapeditor/edit.ts) in the vault: «Name.map.json» in the maps folders of the
// adventures. The scan of the vault does not take them (an unknown kind to the rest of the app): the core finds them
// here, in the folders the tree says are maps folders.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { t } from '../shared/i18n';
import { folderRole, type VaultFolder } from '../shared/vault';
import { MAP_DRAFT_SUFFIX, isMapDraft, parseDraft, type MapDraft } from '../modules/tools/mapeditor/edit';
import { writeJsonAtomic } from './files';

type Resolve = (rel: string) => string | null;

export function listDrafts(resolve: Resolve, tree: VaultFolder | null): string[] {
  const out: string[] = [];
  const walk = (f: VaultFolder, inMaps: boolean) => {
    const maps = inMaps || folderRole(f.name) === 'maps';
    if (maps) {
      const dir = resolve(f.path);
      try {
        for (const name of fs.readdirSync(dir ?? '')) if (isMapDraft(name) && !name.startsWith('.')) out.push(f.path ? `${f.path}/${name}` : name);
      } catch {
        /* gone meanwhile */
      }
    }
    for (const sub of f.folders) walk(sub, maps);
  };
  if (tree) walk(tree, false);
  return out.sort((a, b) => a.localeCompare(b));
}

export function readDraft(resolve: Resolve, rel: string): MapDraft | null {
  const abs = isMapDraft(rel) ? resolve(rel) : null;
  try {
    return abs ? parseDraft(JSON.parse(fs.readFileSync(abs, 'utf8'))) : null;
  } catch {
    return null;
  }
}

export function writeDraft(resolve: Resolve, rel: string, draft: MapDraft): boolean {
  const abs = isMapDraft(rel) ? resolve(rel) : null;
  const clean = parseDraft(draft);
  if (!abs || !clean || !fs.existsSync(path.dirname(abs))) return false;
  writeJsonAtomic(abs, clean);
  return true;
}

const safe = (title: string) => title.replace(/[/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || t('core.name.map');
function freeName(dir: string, title: string, except?: string): string {
  const base = safe(title);
  let name = base + MAP_DRAFT_SUFFIX;
  for (let i = 2; fs.existsSync(path.join(dir, name)) && path.join(dir, name) !== except; i++) name = `${base} (${i})${MAP_DRAFT_SUFFIX}`;
  return name;
}

export function createDraft(resolve: Resolve, folder: string, title: string, draft: MapDraft): string | null {
  const dir = resolve(folder);
  const clean = parseDraft(draft);
  if (!dir || !clean) return null;
  fs.mkdirSync(dir, { recursive: true });
  const name = freeName(dir, title);
  writeJsonAtomic(path.join(dir, name), clean);
  return folder ? `${folder}/${name}` : name;
}

export function renameDraft(resolve: Resolve, rel: string, title: string): string | null {
  const abs = isMapDraft(rel) ? resolve(rel) : null;
  if (!abs || !fs.existsSync(abs)) return null;
  const dir = path.dirname(abs);
  const target = path.join(dir, freeName(dir, title, abs));
  if (target !== abs) fs.renameSync(abs, target);
  const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  return folder ? `${folder}/${path.basename(target)}` : path.basename(target);
}
