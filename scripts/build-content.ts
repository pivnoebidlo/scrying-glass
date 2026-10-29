// Pack downloadable content of systems: content/<id>/ → dist/content/<id>.sgcontent (shared/content.ts). The
// official author publishes the file to the Community. Run: npm run build-content [id …] (none — every folder).
import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { CONTENT_EXT, CONTENT_MANIFEST, contentFile, validContent } from '../src/shared/content.ts';

const SRC = path.resolve(import.meta.dirname, '../content');
const OUT = path.resolve(import.meta.dirname, '../dist/content');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(SRC).filter((d) => fs.existsSync(path.join(SRC, d, CONTENT_MANIFEST)));

fs.mkdirSync(OUT, { recursive: true });
for (const id of ids) {
  const dir = path.join(SRC, id);
  const m = validContent(JSON.parse(fs.readFileSync(path.join(dir, CONTENT_MANIFEST), 'utf8')));
  if (!m || m.id !== id) throw new Error(`${id}: a bad ${CONTENT_MANIFEST}`);
  // The manifest first: the app reads it without unpacking the rest.
  const files: Record<string, Uint8Array> = { [CONTENT_MANIFEST]: fs.readFileSync(path.join(dir, CONTENT_MANIFEST)) };
  for (const kind of ['bestiary', 'compendium']) {
    const sub = path.join(dir, kind);
    if (!fs.existsSync(sub)) continue;
    for (const f of fs.readdirSync(sub).sort()) {
      const name = `${kind}/${f}`;
      if (contentFile(name)) files[name] = fs.readFileSync(path.join(sub, f));
    }
  }
  const out = path.join(OUT, id + CONTENT_EXT);
  fs.writeFileSync(out, zipSync(files, { level: 9 }));
  console.log(`${out}: ${Object.keys(files).length} files, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
}
