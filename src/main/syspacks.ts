// System packs from the core's side: the built-in ones (resources/systems/*.json, read only) and the GM's own
// (<library>/systems/*.json). Each file is checked (validatePack) — a pack may come from a stranger; a broken one is
// skipped with a line in the log. The GM's own pack with the id of a built-in one takes its place.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import { loc, packLangs, validatePack, type SystemPack } from '../shared/syspack';
import type { BuiltinBook } from '../shared/compendium';
import { systems } from '../systems';
import { registerPacks } from '../systems/packs';
import { writeJsonAtomic } from './files';

let list: SystemPack[] = [];
export const systemPacks = () => list;

function readDir(dir: string): SystemPack[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files.flatMap((f) => {
    try {
      const p = validatePack(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
      if (typeof p === 'string') {
        console.error(`System pack ${f}: ${p}`);
        return [];
      }
      return [p];
    } catch (e) {
      console.error(`System pack ${f}:`, e);
      return [];
    }
  });
}

// Read the packs again (on start, when the library changes) and register them; the list goes to the windows with
// the state.
export function loadSystemPacks(library: string | null): SystemPack[] {
  const byId = new Map<string, SystemPack>();
  for (const p of readDir(path.join(app.getAppPath(), 'resources', 'systems'))) byId.set(p.id, p);
  if (library) for (const p of readDir(path.join(library, 'systems'))) byId.set(p.id, { ...p, own: true });
  list = [...byId.values()];
  registerPacks(list);
  return list;
}

const fileOf = (library: string, id: string) => path.join(library, 'systems', `${id}.json`);
// Ids of the systems written in code: a pack can't take one.
const codeIds = () => systems.map((s) => s.id).filter((id) => !list.some((p) => p.id === id));

// Write the GM's own pack (from the builder or a file): checked as one from a stranger. `was` — its id before an
// edit: a pack renamed leaves its old file. Errors: `syspack:<what>`.
export function savePack(library: string, raw: unknown, was?: string): SystemPack {
  const p = validatePack(raw);
  if (typeof p === 'string') throw new Error(`syspack:${p}`);
  if (codeIds().includes(p.id)) throw new Error('syspack:builtin-id');
  const { own: _own, ...clean } = p;
  fs.mkdirSync(path.join(library, 'systems'), { recursive: true });
  writeJsonAtomic(fileOf(library, p.id), clean);
  if (was && was !== p.id) fs.rmSync(fileOf(library, was), { force: true });
  return p;
}

// The compendiums of the packs as built-in books, one per language: entries of the type «rule» with their category.
export function packBooks(): BuiltinBook[] {
  return list
    .filter((p) => p.compendium?.length)
    .flatMap((p) =>
      packLangs(p).map((lang) => ({
        system: p.id,
        lang,
        source: { title: loc(p.title, lang), attribution: p.license ?? '', url: p.url ?? '', license: '' },
        entries: p.compendium!.map((e) => ({
          title: loc(e.title, lang),
          type: 'rule',
          fields: (e.category ? { category: loc(e.category, lang) } : {}) as Record<string, string>,
          body: loc(e.text, lang),
        })),
      })),
    );
}

export const ownPackFile = (library: string, id: string) => (list.some((p) => p.id === id && p.own) ? `systems/${id}.json` : null);
