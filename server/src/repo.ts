// The repository's rules: the catalog (one JSON in the bucket), publishing in two steps (ask → upload straight to S3
// → commit), versions, downloads. Who is asking is already checked (http.ts): `author` is a verified key.
import { randomUUID } from 'node:crypto';
import { LIMITS, REPO_API, type PublishRequest, type PublishTicket, type RepoCatalog, type RepoEntry } from '../../src/shared/repo.ts';
import type { Storage } from './s3.ts';

// What the catalog keeps beyond what everyone sees: the files of the versions still in the bucket.
interface Stored extends RepoEntry {
  files: { version: number; key: string }[];
  // Removed by the admin: hidden, the author can't publish it again.
  blocked?: boolean;
}

interface Pending {
  author: string;
  req: PublishRequest;
  version: number;
  pack: string;
  cover?: string;
  expires: number;
}

export interface RepoOptions {
  maxSize: number;
  // How many adventures one author may have.
  maxPerAuthor: number;
  now?: () => number;
}

export class RepoError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const CATALOG = 'catalog.json';

// The cover in use: the newest picture among the entry's files.
const coverFile = (e: Stored) => (e.cover ? e.files.filter((f) => f.key.endsWith('.jpg')).sort((a, b) => b.version - a.version)[0]?.key : undefined);
const LINK_SECONDS = 3600;
const PENDING_MS = 3 * 3600 * 1000;

export class Repo {
  private entries: Stored[] = [];
  private pending = new Map<string, Pending>();
  private queue: Promise<unknown> = Promise.resolve();
  private dirty = false;
  private now: () => number;
  private store: Storage;
  private opts: RepoOptions;

  constructor(store: Storage, opts: RepoOptions) {
    this.store = store;
    this.opts = opts;
    this.now = opts.now ?? Date.now;
  }

  async load() {
    const raw = await this.store.get(CATALOG);
    this.entries = raw ? ((JSON.parse(new TextDecoder().decode(raw)) as { entries?: Stored[] }).entries ?? []) : [];
  }

  // Changes of the catalog go one by one; each ends with the catalog written.
  private change<T>(fn: () => Promise<T> | T): Promise<T> {
    const run = this.queue.then(async () => {
      const r = await fn();
      await this.save();
      return r;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async save() {
    this.dirty = false;
    const body = new TextEncoder().encode(JSON.stringify({ api: REPO_API, entries: this.entries }));
    await this.store.put(CATALOG, body, 'application/json');
  }

  // Download counters are written now and then, not on every download.
  async flush() {
    if (this.dirty) await this.change(() => undefined);
  }

  catalog(): RepoCatalog {
    const entries = this.entries.filter((e) => !e.blocked).map(({ files: _f, blocked: _b, ...e }) => e);
    return { api: REPO_API, maxSize: this.opts.maxSize, entries };
  }

  private find(author: string, id: string) {
    return this.entries.find((e) => e.author === author && e.id === id);
  }

  publish(author: string, req: PublishRequest): PublishTicket {
    const old = this.find(author, req.id);
    if (old?.blocked) throw new RepoError(403, 'blocked');
    if (req.size > this.opts.maxSize) throw new RepoError(413, 'too-big');
    if (!old && this.entries.filter((e) => e.author === author).length >= this.opts.maxPerAuthor) throw new RepoError(429, 'too-many');
    this.prune();
    // A version number nobody has taken: the catalog's and the ones being uploaded right now.
    const taken = [old?.version ?? 0, ...[...this.pending.values()].filter((p) => p.author === author && p.req.id === req.id).map((p) => p.version)];
    const version = Math.max(...taken) + 1;
    const base = `packs/${author}/${req.id}/${version}`;
    const p: Pending = { author, req, version, pack: `${base}.sgpack`, expires: this.now() + PENDING_MS, ...(req.cover ? { cover: `${base}.jpg` } : {}) };
    const upload = randomUUID();
    this.pending.set(upload, p);
    return {
      upload,
      version,
      pack: this.store.presign('PUT', p.pack, LINK_SECONDS),
      ...(p.cover ? { cover: this.store.presign('PUT', p.cover, LINK_SECONDS) } : {}),
    };
  }

  private prune() {
    const now = this.now();
    for (const [k, p] of this.pending) if (p.expires < now) this.pending.delete(k);
  }

  // The files are in the bucket: check them and put the version into the catalog. The version before stays a while
  // (someone may be downloading it right now), older ones go.
  commit(author: string, upload: string): Promise<RepoEntry> {
    return this.change(async () => {
      const p = this.pending.get(upload);
      if (!p || p.author !== author) throw new RepoError(404, 'no-upload');
      const pack = await this.store.head(p.pack);
      if (!pack) throw new RepoError(409, 'not-uploaded');
      if (pack.size > this.opts.maxSize) {
        await this.store.del(p.pack);
        throw new RepoError(413, 'too-big');
      }
      let coverKey: string | undefined;
      if (p.cover) {
        const c = await this.store.head(p.cover);
        if (c && c.size <= LIMITS.cover) coverKey = p.cover;
        else if (c) await this.store.del(p.cover);
      }
      this.pending.delete(upload);
      const old = this.find(author, p.req.id);
      if (old && old.version >= p.version) throw new RepoError(409, 'stale');
      // No new cover: the one the adventure has stays.
      coverKey ??= old && coverFile(old);
      const now = this.now();
      const { ts: _ts, size: _size, cover: _cover, ...meta } = p.req;
      const files = [{ version: p.version, key: p.pack }, ...(coverKey === p.cover && coverKey ? [{ version: p.version, key: coverKey }] : []), ...(old?.files ?? [])];
      const keep = files.filter((f) => f.version >= p.version - 1 || f.key === coverKey);
      const cover = !!coverKey;
      for (const f of files) if (!keep.includes(f)) await this.store.del(f.key).catch(() => undefined);
      const entry: Stored = {
        ...meta,
        author,
        version: p.version,
        size: pack.size,
        cover,
        published: old?.published ?? now,
        updated: now,
        downloads: old?.downloads ?? 0,
        files: keep,
      };
      this.entries = [...this.entries.filter((e) => e !== old), entry];
      const { files: _f, ...pub } = entry;
      return pub;
    });
  }

  // The author takes the adventure away; the admin too (it stays blocked).
  remove(author: string, id: string, block = false): Promise<boolean> {
    return this.change(async () => {
      const e = this.find(author, id);
      if (!e) return false;
      for (const f of e.files) await this.store.del(f.key).catch(() => undefined);
      this.entries = this.entries.filter((x) => x !== e);
      if (block) this.entries.push({ ...e, files: [], blocked: true });
      return true;
    });
  }

  // Where to download the current version (or its cover) from; null — no such entry.
  link(author: string, id: string, what: 'pack' | 'cover'): string | null {
    const e = this.find(author, id);
    if (!e || e.blocked || (what === 'cover' && !e.cover)) return null;
    const key = what === 'pack' ? e.files.find((x) => x.version === e.version && x.key.endsWith('.sgpack'))?.key : coverFile(e);
    if (!key) return null;
    if (what === 'pack') {
      e.downloads++;
      this.dirty = true;
    }
    return this.store.presign('GET', key, LINK_SECONDS);
  }
}
