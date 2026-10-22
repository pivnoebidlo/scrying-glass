// Canvases (shared/sketch.ts) in the vault: read, save, create, rename — like the notes (main/notes.ts), only
// «….sketch.json» and only inside the vault.
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isSketchPath, parseSketch, SKETCH_SUFFIX, type Sketch } from '../shared/sketch';
import { writeJsonAtomic } from './files';

type Resolve = (rel: string) => string | null;

export function readSketchFile(abs: string): Sketch | null {
  try {
    return parseSketch(JSON.parse(fs.readFileSync(abs, 'utf8')));
  } catch {
    return null;
  }
}

export function readSketch(resolve: Resolve, rel: string): Sketch | null {
  const abs = isSketchPath(rel) ? resolve(rel) : null;
  return abs ? readSketchFile(abs) : null;
}

export function writeSketch(resolve: Resolve, rel: string, sketch: Sketch): boolean {
  const abs = isSketchPath(rel) ? resolve(rel) : null;
  const clean = parseSketch(sketch);
  if (!abs || !clean) return false;
  writeJsonAtomic(abs, clean);
  return true;
}

const safe = (title: string) => title.replace(/[/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || t('core.name.sketch');

function freeName(dir: string, title: string, except?: string): string {
  const base = safe(title);
  let name = base + SKETCH_SUFFIX;
  for (let i = 2; fs.existsSync(path.join(dir, name)) && path.join(dir, name) !== except; i++) name = `${base} (${i})${SKETCH_SUFFIX}`;
  return name;
}

// A new canvas in the folder (created if missing). Returns its path.
export function createSketch(resolve: Resolve, folder: string, title: string, sketch: Sketch): string | null {
  const dir = resolve(folder);
  const clean = parseSketch(sketch);
  if (!dir || !clean) return null;
  fs.mkdirSync(dir, { recursive: true });
  const name = freeName(dir, title);
  writeJsonAtomic(path.join(dir, name), clean);
  return folder ? `${folder}/${name}` : name;
}

// Rename (the title is the file name). Returns the new path (the same one if the name did not change).
export function renameSketch(resolve: Resolve, rel: string, title: string): string | null {
  const abs = isSketchPath(rel) ? resolve(rel) : null;
  if (!abs || !fs.existsSync(abs)) return null;
  const dir = path.dirname(abs);
  const target = path.join(dir, freeName(dir, title, abs));
  if (target !== abs) fs.renameSync(abs, target);
  const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  return folder ? `${folder}/${path.basename(target)}` : path.basename(target);
}
