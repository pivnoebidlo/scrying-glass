// Generators of the packages installed (shared/generators.ts): read from <library>/content/<id>/generators/, each file
// checked — it may come from a stranger; a broken one is skipped with a line in the log. Not in the state: tables are
// large, and the windows ask only for them.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { contentDirs } from './content';
import { packFile, validateGenerators, type GeneratorFile } from '../shared/generators';
import { systemPacks } from './syspacks';

export function generatorFiles(): GeneratorFile[] {
  const own = systemPacks().flatMap((p) => (p.kit ? [packFile(p.id, p.kit)] : []));
  return [...own, ...packageFiles()];
}

function packageFiles(): GeneratorFile[] {
  return contentDirs('generators').flatMap((dir) => {
    let names: string[] = [];
    try {
      names = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    } catch {
      return [];
    }
    return names.flatMap((f) => {
      try {
        const g = validateGenerators(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
        if (typeof g !== 'string') return [g];
        console.error(`Generators ${f}: ${g}`);
      } catch (e) {
        console.error(`Generators ${f}:`, e);
      }
      return [];
    });
  });
}
