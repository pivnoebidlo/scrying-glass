// System packs from the core's side: the built-in ones (resources/systems/*.json, read only) and the GM's own
// (<library>/systems/*.json). Each file is checked (validatePack) — a pack may come from a stranger; a broken one is
// skipped with a line in the log. The GM's own pack with the id of a built-in one takes its place.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import { validatePack, type SystemPack } from '../shared/syspack';
import { registerPacks } from '../systems/packs';

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
  if (library) for (const p of readDir(path.join(library, 'systems'))) byId.set(p.id, p);
  list = [...byId.values()];
  registerPacks(list);
  return list;
}
