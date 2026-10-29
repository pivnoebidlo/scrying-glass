// Content of a system (.sgcontent): its built-in creatures and compendium books, downloaded from the repository and
// kept in <library>/content/<id>/ — D&D's SRD and later Pathfinder's are not in the installer. Inside the ZIP:
// content.json (the manifest below), bestiary/<system>.json (cards, as resources/srd/) and
// compendium/<system>.<lang>.json (BuiltinBook, as resources/compendium/). Pure: the core and the scripts use it.
// No imports: the build scripts run it as it is.

export const CONTENT_MANIFEST = 'content.json';
export const CONTENT_EXT = '.sgcontent';

export interface ContentManifest {
  scryingGlass: 'content';
  version: 1;
  // 'dnd5e-srd' — the folder it is installed to.
  id: string;
  title: string;
  // The family of systems it is for (systems/index.ts).
  family: string;
  // 1, 2, … — a newer one replaces the old.
  release: number;
  // What it holds, by system: numbers of cards and books (shown before downloading and in the settings).
  cards?: number;
  books?: number;
  // The license or attribution its sources ask for.
  license?: string;
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

// A manifest from someone else's file: only what is known, or null.
export function validContent(x: unknown): ContentManifest | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (o['scryingGlass'] !== 'content' || o['version'] !== 1) return null;
  if (typeof o['id'] !== 'string' || !ID_RE.test(o['id']) || typeof o['title'] !== 'string' || !o['title'].trim()) return null;
  if (typeof o['family'] !== 'string' || !ID_RE.test(o['family'])) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined);
  const release = num(o['release']) ?? 1;
  return {
    scryingGlass: 'content',
    version: 1,
    id: o['id'],
    title: o['title'].trim().slice(0, 120),
    family: o['family'],
    release,
    ...(num(o['cards']) !== undefined ? { cards: num(o['cards']) } : {}),
    ...(num(o['books']) !== undefined ? { books: num(o['books']) } : {}),
    ...(typeof o['license'] === 'string' && o['license'].trim() ? { license: o['license'].trim().slice(0, 2000) } : {}),
  };
}

// The files of the ZIP the app takes: bestiary/<name>.json and compendium/<name>.json, nothing deeper.
export const contentFile = (name: string) => /^(bestiary|compendium)\/[A-Za-z0-9][A-Za-z0-9._-]{0,80}\.json$/.test(name);
