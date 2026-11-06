// Packages installed to the library (shared/content.ts): read, install from an .sgcontent file, remove. The system
// packs (main/syspacks.ts), built-in cards (main/cards.ts) and books (main/compendium.ts) read their folders.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { CONTENT_KINDS, CONTENT_MANIFEST, contentFile, validContent, type ContentKind, type ContentManifest } from '../shared/content';
import { readZip } from './zip';
import { t } from '../shared/i18n';

let library: string | null = null;
// The library changed (main/cards.ts setLibrary): its content is read from there.
export const setContentLibrary = (root: string | null) => (library = root);
const rootOf = (lib: string | null) => (lib ? path.join(lib, 'content') : null);
const root = () => rootOf(library);

export interface InstalledContent extends ContentManifest {
  dir: string;
}

// `lib`: system packs are read before the library is set, the cards' lines need them.
export function installedContent(lib = library): InstalledContent[] {
  const r = rootOf(lib);
  if (!r) return [];
  let names: string[] = [];
  try {
    names = fs.readdirSync(r);
  } catch {
    return [];
  }
  return names.flatMap((n) => {
    try {
      const m = validContent(JSON.parse(fs.readFileSync(path.join(r, n, CONTENT_MANIFEST), 'utf8')));
      return m && m.id === n ? [{ ...m, dir: path.join(r, n) }] : [];
    } catch {
      return [];
    }
  });
}

// The folders of one kind of data, one per package installed.
export const contentDirs = (kind: ContentKind, lib = library): string[] => installedContent(lib).map((c) => path.join(c.dir, kind));

// The ids of the systems a package brings.
export const contentSystems = (id: string): string[] => {
  const c = installedContent().find((x) => x.id === id);
  try {
    return c ? fs.readdirSync(path.join(c.dir, 'system')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
  } catch {
    return [];
  }
};

// Install an .sgcontent file: unpack to a temporary folder, check, then replace the content of that id.
export async function installContent(file: string): Promise<ContentManifest> {
  const r = root();
  if (!r) throw new Error(t('core.nowhere'));
  const tmp = path.join(r, `.install-${randomUUID().slice(0, 8)}`);
  fs.mkdirSync(tmp, { recursive: true });
  try {
    const small = await readZip(file, tmp, (name) => name === CONTENT_MANIFEST);
    const raw = small.get(CONTENT_MANIFEST);
    const m = raw ? validContent(JSON.parse(raw.toString('utf8'))) : null;
    if (!m) throw new Error(t('core.notContent'));
    // Only the known files stay.
    const dest = path.join(r, `.ready-${m.id}`);
    fs.rmSync(dest, { recursive: true, force: true });
    for (const kind of CONTENT_KINDS) {
      const dir = path.join(tmp, kind);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!contentFile(`${kind}/${f}`)) continue;
        fs.mkdirSync(path.join(dest, kind), { recursive: true });
        fs.renameSync(path.join(dir, f), path.join(dest, kind, f));
      }
    }
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, CONTENT_MANIFEST), JSON.stringify(m, null, 1));
    const final = path.join(r, m.id);
    fs.rmSync(final, { recursive: true, force: true });
    fs.renameSync(dest, final);
    return m;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export function removeContent(id: string): boolean {
  const c = installedContent().find((x) => x.id === id);
  if (!c) return false;
  fs.rmSync(c.dir, { recursive: true, force: true });
  return true;
}
