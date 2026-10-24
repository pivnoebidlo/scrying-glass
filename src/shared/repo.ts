// The adventure repository: a catalog of .sgpack files that GMs publish and download. The repo service (server/)
// holds the S3 keys; the app talks only to it and moves the files straight to and from S3 by short-lived links.
//
// An author is a key pair (Ed25519) the app makes on the first publish: the public key is the author's id, every
// write request is signed. An adventure in the repository is «author + id»: two authors may publish the same
// adventure, each gets an entry of their own; a new version from the same key replaces the old one.
//
// No imports here: the service runs this file as is (Node type stripping).

export const REPO_API = 1;
// The app's own repository (Settings → Community: the GM may turn it off and add others).
export const DEFAULT_REPO_URL = 'https://sg.sbin.ru';
export const OFFICIAL_SOURCE = 'official';

export interface RepoEntry {
  // The author's public key (Ed25519, base64url, 43 characters) and the name they chose.
  author: string;
  authorName: string;
  // The adventure's id, made by the author's app on the first publish.
  id: string;
  title: string;
  description: string;
  // Role-playing system (systems/index.ts) and language of the adventure.
  system: string;
  lang: string;
  // 1, 2, … — each publish of the same adventure is a new version.
  version: number;
  // Bytes of the .sgpack; music inside or not.
  size: number;
  music: boolean;
  // The app version that made the pack.
  app: string;
  cover: boolean;
  published: number;
  updated: number;
  downloads: number;
}

export interface RepoCatalog {
  api: number;
  // The largest pack the service takes, bytes.
  maxSize: number;
  entries: RepoEntry[];
}

// The app asks to publish: what the adventure is; the answer — where to put the files.
export interface PublishRequest {
  ts: number;
  id: string;
  title: string;
  description: string;
  system: string;
  lang: string;
  music: boolean;
  size: number;
  app: string;
  authorName: string;
  // Bytes of the cover picture (JPEG), none — no cover.
  cover?: number;
}

export interface PublishTicket {
  upload: string;
  version: number;
  // Presigned PUT links.
  pack: string;
  cover?: string;
}

export const LIMITS = { title: 120, description: 4000, authorName: 60, cover: 512 * 1024, report: 1000 } as const;

// A complaint about an entry: anyone may send one (one per address and entry), only the admin sees them.
export const REPORT_REASONS = ['rights', 'content', 'broken', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export interface Report {
  reason: ReportReason;
  text: string;
  at: number;
}
// What the admin sees: entries with complaints.
export interface ReportedEntry {
  author: string;
  id: string;
  title: string;
  authorName: string;
  reports: Report[];
}
// A signed request is good for this long (the clocks of the GM and the service may differ a little).
export const MAX_SKEW = 10 * 60 * 1000;

export const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
export const AUTHOR_RE = /^[A-Za-z0-9_-]{43}$/;
const SYSTEM_RE = /^[a-z0-9-]{1,32}$/;
const LANG_RE = /^[a-z]{2,3}$/;

// What exactly is signed: the method, the path and the body as sent.
export const signedText = (method: string, path: string, body: string) => `${method.toUpperCase()} ${path}\n${body}`;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// A publish request as the service accepts it, or what is wrong with it.
export function checkPublish(x: unknown): PublishRequest | string {
  if (!x || typeof x !== 'object') return 'body';
  const o = x as Record<string, unknown>;
  const title = str(o['title'], LIMITS.title);
  if (typeof o['ts'] !== 'number') return 'ts';
  if (typeof o['id'] !== 'string' || !ID_RE.test(o['id'])) return 'id';
  if (!title) return 'title';
  if (typeof o['system'] !== 'string' || !SYSTEM_RE.test(o['system'])) return 'system';
  if (typeof o['lang'] !== 'string' || !LANG_RE.test(o['lang'])) return 'lang';
  if (typeof o['size'] !== 'number' || !(o['size'] > 0)) return 'size';
  const cover = o['cover'];
  if (cover !== undefined && (typeof cover !== 'number' || !(cover > 0) || cover > LIMITS.cover)) return 'cover';
  return {
    ts: o['ts'],
    id: o['id'],
    title,
    description: str(o['description'], LIMITS.description),
    system: o['system'],
    lang: o['lang'],
    music: o['music'] === true,
    size: o['size'],
    app: str(o['app'], 32),
    authorName: str(o['authorName'], LIMITS.authorName),
    ...(typeof cover === 'number' ? { cover } : {}),
  };
}

// The app's side: where adventures come from, the author's name and key (null — nothing published from here yet).
export interface RepoInfo {
  sources: SourceInfo[];
  name: string;
  author: string | null;
}

// A place to find adventures. Only repositories (this protocol) so far; other kinds (cloud drives) will come.
export interface SourceInfo {
  id: string;
  kind: 'repo';
  // Empty for the official one (the window names it in its language).
  name: string;
  url: string;
  off: boolean;
  official: boolean;
  // The GM keeps this repository: complaints, taking down any entry.
  admin: boolean;
}

export interface RepoProgress {
  phase: 'pack' | 'upload' | 'download';
  done: number;
  total: number;
}

// What the app remembers in the vault (state.json, module repo): its own published adventures and the ones it
// downloaded, by adventure folder. `source` — where (none — the official repository, as before 0.57). An adventure
// keeps its id in every source it is published to; the mark tells the last one.
export interface PublishedMark {
  id: string;
  version: number;
  source?: string;
}
export interface InstalledMark {
  author: string;
  id: string;
  version: number;
  source?: string;
}

export const sourceOf = (m: { source?: string }) => m.source ?? OFFICIAL_SOURCE;

// The entry an installed adventure came from (entries of that source), if it has a newer version.
export const updateFor = (entries: RepoEntry[], m: InstalledMark | undefined) =>
  m ? entries.find((e) => e.author === m.author && e.id === m.id && e.version > m.version) : undefined;

// Search over the catalog: every word of the query in the title, description or author's name.
export function matchesQuery(e: RepoEntry, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${e.title}\n${e.description}\n${e.authorName}`.toLowerCase();
  return words.every((w) => text.includes(w));
}

// A short readable form of an author's key: the first characters, like a git hash.
export const shortKey = (author: string) => author.slice(0, 8);
