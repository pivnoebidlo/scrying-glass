// The adventure repository: the protocol (shared/repo.ts), the service (server/) with an in-memory bucket and real
// HTTP, and the pack checks that matter once packs come from strangers.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkPublish, matchesQuery, signedText, updateFor, type PublishTicket, type RepoCatalog, type RepoEntry, type ReportedEntry, type BlockedEntry } from '../src/shared/repo';
import { Repo } from '../server/src/repo';
import { handler } from '../server/src/http';
import { sign as sigv4 } from '../server/src/s3';
import type { Storage } from '../server/src/s3';
import { packManifest, writePack } from '../src/main/packs';
import repoModule from '../src/modules/repo/main';
import { ctx } from './helpers';

// A bucket in memory: presigned links are «mem://METHOD/key», the test plays the client's part with them.
class MemoryBucket implements Storage {
  files = new Map<string, Uint8Array>();
  async get(key: string) {
    return this.files.get(key) ?? null;
  }
  async put(key: string, body: Uint8Array) {
    this.files.set(key, body);
  }
  async head(key: string) {
    const f = this.files.get(key);
    return f ? { size: f.length } : null;
  }
  async del(key: string) {
    this.files.delete(key);
  }
  presign(method: 'GET' | 'PUT', key: string) {
    return `mem://${method}/${key}`;
  }
  // What a client does with a presigned PUT link.
  upload(link: string, size: number) {
    this.files.set(link.replace('mem://PUT/', ''), new Uint8Array(size));
  }
}

describe('repository protocol', () => {
  const ok = { ts: 1, id: 'abcdefgh', title: ' Lost Mine ', description: 'd', system: 'dnd5e-2024', lang: 'en', music: true, size: 10, app: '0.57.0', authorName: 'Dima' };

  it('accepts a good publish request and trims it', () => {
    expect(checkPublish(ok)).toEqual({ ...ok, title: 'Lost Mine' });
  });

  it('refuses bad ids, systems, sizes and covers', () => {
    expect(checkPublish({ ...ok, id: '../etc' })).toBe('id');
    expect(checkPublish({ ...ok, id: 'short' })).toBe('id');
    expect(checkPublish({ ...ok, title: '  ' })).toBe('title');
    expect(checkPublish({ ...ok, system: 'D&D' })).toBe('system');
    expect(checkPublish({ ...ok, size: 0 })).toBe('size');
    expect(checkPublish({ ...ok, cover: 10 * 1024 * 1024 })).toBe('cover');
    expect(checkPublish(null)).toBe('body');
  });

  it('finds updates of downloaded adventures and searches every word', () => {
    const e = { author: 'a', id: 'x', version: 3, title: 'Шахты Фанделвера', description: 'Для 1–5 уровней', authorName: 'Дима' } as RepoEntry;
    expect(updateFor([e], { author: 'a', id: 'x', version: 2 })).toBe(e);
    expect(updateFor([e], { author: 'a', id: 'x', version: 3 })).toBeUndefined();
    expect(updateFor([e], { author: 'b', id: 'x', version: 1 })).toBeUndefined();
    expect(matchesQuery(e, 'шахты дима')).toBe(true);
    expect(matchesQuery(e, 'шахты страд')).toBe(false);
  });
});

describe('S3 signature (SigV4)', () => {
  // The example of the AWS documentation: GET /test.txt with a range, «Signature Calculations … (AWS Signature Version 4)».
  it('matches the AWS example', () => {
    const s = sigv4(
      { region: 'us-east-1', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
      {
        method: 'GET',
        url: new URL('https://examplebucket.s3.amazonaws.com/test.txt'),
        headers: { range: 'bytes=0-9', 'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'x-amz-date': '20130524T000000Z' },
        payload: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      new Date('2013-05-24T00:00:00Z'),
    );
    expect(s.signed).toBe('host;range;x-amz-content-sha256;x-amz-date');
    expect(s.signature).toBe('f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
  });
});

describe('repository service', () => {
  const bucket = new MemoryBucket();
  let now = Date.now();
  const repo = new Repo(bucket, { maxSize: 1000, maxPerAuthor: 2, now: () => now });
  let server: Server;
  let base = '';
  const author = () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    return { key: privateKey, x: publicKey.export({ format: 'jwk' }).x! };
  };
  const me = author();
  const other = author();

  async function call<T>(p: string, data: object, who: { key: KeyObject; x: string } = me): Promise<{ status: number; body: T }> {
    const body = JSON.stringify({ ts: now, ...data });
    const sig = sign(null, Buffer.from(signedText('POST', p, body)), who.key).toString('base64url');
    const res = await fetch(base + p, { method: 'POST', body, headers: { 'x-sg-key': who.x, 'x-sg-sig': sig } });
    return { status: res.status, body: (await res.json()) as T };
  }
  const meta = { id: 'mine-adventure', title: 'Mine', description: '', system: 'dnd5e-2024', lang: 'ru', music: false, app: 'test', authorName: 'Me' };
  async function publish(size: number, who = me, extra: object = {}) {
    const t = await call<PublishTicket>('/api/v1/publish', { ...meta, size, ...extra }, who);
    expect(t.status).toBe(200);
    bucket.upload(t.body.pack, size);
    if (t.body.cover) bucket.upload(t.body.cover, 100);
    return call<RepoEntry>('/api/v1/commit', { upload: t.body.upload }, who);
  }
  const catalog = async () => (await (await fetch(base + '/api/v1/catalog')).json()) as RepoCatalog;

  beforeAll(async () => {
    await repo.load();
    server = createServer(handler(repo, { admin: 'secret', ratePerMinute: 1000, trustProxy: false, now: () => now }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => server.close());

  it('publishes, and a new version replaces the old one; the version before stays a while', async () => {
    const v1 = await publish(100, me, { cover: 100 });
    expect(v1.body).toMatchObject({ version: 1, size: 100, cover: true, author: me.x, downloads: 0 });
    await publish(200);
    const v3 = await publish(300);
    expect(v3.body).toMatchObject({ version: 3, size: 300, cover: true });
    const keys = [...bucket.files.keys()].filter((k) => k.startsWith('packs/')).sort();
    // Versions 2 and 3 of the pack and the cover of version 1 (no new cover since).
    expect(keys).toEqual([`packs/${me.x}/mine-adventure/1.jpg`, `packs/${me.x}/mine-adventure/2.sgpack`, `packs/${me.x}/mine-adventure/3.sgpack`]);
    const c = await catalog();
    expect(c.entries).toHaveLength(1);
    expect(c.entries[0]).not.toHaveProperty('files');
    expect(c.maxSize).toBe(1000);
  });

  it('the same adventure by another author is an entry of its own', async () => {
    const r = await publish(50, other);
    expect(r.body.version).toBe(1);
    expect((await catalog()).entries.map((e) => e.author).sort()).toEqual([me.x, other.x].sort());
  });

  it('downloads go to the current version and are counted', async () => {
    const res = await fetch(`${base}/api/v1/packs/${me.x}/mine-adventure`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(`mem://GET/packs/${me.x}/mine-adventure/3.sgpack`);
    expect((await fetch(`${base}/api/v1/covers/${me.x}/mine-adventure`, { redirect: 'manual' })).headers.get('location')).toContain('1.jpg');
    expect((await catalog()).entries.find((e) => e.author === me.x)?.downloads).toBe(1);
  });

  it('refuses forged, stale, too big and too many', async () => {
    const forged = await call('/api/v1/unpublish', { id: 'mine-adventure' }, { key: other.key, x: me.x });
    expect(forged).toEqual({ status: 401, body: { error: 'signature' } });
    const old = await call('/api/v1/publish', { ...meta, size: 10, ts: now - 60 * 60 * 1000 });
    expect(old).toEqual({ status: 401, body: { error: 'clock' } });
    expect((await call('/api/v1/publish', { ...meta, size: 5000 })).body).toEqual({ error: 'too-big' });
    // Said 10 bytes, uploaded more than the limit: refused at commit, the file is gone.
    const t = await call<PublishTicket>('/api/v1/publish', { ...meta, size: 10 });
    bucket.upload(t.body.pack, 5000);
    expect((await call('/api/v1/commit', { upload: t.body.upload })).body).toEqual({ error: 'too-big' });
    expect(bucket.files.has(t.body.pack.replace('mem://PUT/', ''))).toBe(false);
    await publish(10, me, { id: 'second-adventure' });
    expect((await call('/api/v1/publish', { ...meta, id: 'third-adventure', size: 10 })).body).toEqual({ error: 'too-many' });
    expect((await call('/api/v1/commit', { upload: 'nope' })).body).toEqual({ error: 'no-upload' });
  });

  it('anyone complains, once per address; only the admin sees complaints and dismisses them', async () => {
    const report = (data: object) => fetch(`${base}/api/v1/report`, { method: 'POST', body: JSON.stringify(data) });
    const reports = (auth: string) => fetch(`${base}/api/v1/admin/reports`, { headers: { authorization: auth } });
    expect((await report({ author: me.x, id: 'mine-adventure', reason: 'rights', text: 'a book scan' })).status).toBe(200);
    expect((await report({ author: me.x, id: 'mine-adventure', reason: 'content', text: 'changed my mind' })).status).toBe(200);
    expect((await (await report({ author: me.x, id: 'mine-adventure', reason: 'spam' })).json())).toEqual({ error: 'bad-reason' });
    expect((await report({ author: me.x, id: 'no-such-adventure', reason: 'other' })).status).toBe(404);
    expect((await reports('Bearer wrong')).status).toBe(401);
    const list = (await (await reports('Bearer secret')).json()) as ReportedEntry[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ author: me.x, id: 'mine-adventure', title: 'Mine', reports: [{ reason: 'content', text: 'changed my mind' }] });
    expect(list[0]!.reports[0]).not.toHaveProperty('from');
    expect(JSON.stringify(await catalog())).not.toContain('reports');
    // A new version keeps them, and the author doesn't see them.
    const v = await publish(100);
    expect(v.body).not.toHaveProperty('reports');
    expect(((await (await reports('Bearer secret')).json()) as ReportedEntry[])[0]!.reports).toHaveLength(1);
    const dismiss = await fetch(`${base}/api/v1/admin/dismiss`, { method: 'POST', body: JSON.stringify({ author: me.x, id: 'mine-adventure' }), headers: { authorization: 'Bearer secret' } });
    expect(dismiss.status).toBe(200);
    expect(await (await reports('Bearer secret')).json()).toEqual([]);
  });

  it('the author takes an adventure down; the admin removes and blocks', async () => {
    expect((await call('/api/v1/unpublish', { id: 'second-adventure' })).status).toBe(200);
    expect([...bucket.files.keys()].some((k) => k.includes('second-adventure'))).toBe(false);
    const admin = (auth: string) => fetch(`${base}/api/v1/admin/remove`, { method: 'POST', body: JSON.stringify({ author: other.x, id: 'mine-adventure' }), headers: { authorization: auth } });
    expect((await admin('Bearer wrong')).status).toBe(401);
    expect((await admin('Bearer secret')).status).toBe(200);
    expect((await catalog()).entries.map((e) => e.author)).toEqual([me.x]);
    const again = await call('/api/v1/publish', { ...meta, size: 10 }, other);
    expect(again.body).toEqual({ error: 'blocked' });
    // The admin lifts the block: the author may publish it again.
    const admin2 = (p: string, data?: object) => fetch(base + p, { method: data ? 'POST' : 'GET', ...(data ? { body: JSON.stringify(data) } : {}), headers: { authorization: 'Bearer secret' } });
    expect((await fetch(`${base}/api/v1/admin/blocked`)).status).toBe(401);
    const blocked = (await (await admin2('/api/v1/admin/blocked')).json()) as BlockedEntry[];
    expect(blocked).toEqual([{ author: other.x, id: 'mine-adventure', title: 'Mine', authorName: 'Me', blocked: now }]);
    expect(JSON.stringify(await catalog())).not.toContain('blocked');
    expect((await admin2('/api/v1/admin/unblock', { author: other.x, id: 'mine-adventure' })).status).toBe(200);
    expect(await (await admin2('/api/v1/admin/blocked')).json()).toEqual([]);
    expect((await call('/api/v1/publish', { ...meta, size: 10 }, other)).status).toBe(200);
  });

  it('keeps the catalog in the bucket', async () => {
    await repo.flush();
    const copy = new Repo(bucket, { maxSize: 1000, maxPerAuthor: 2 });
    await copy.load();
    expect(copy.catalog().entries).toEqual((await catalog()).entries);
  });
});

describe('packs from strangers', () => {
  it('a manifest name that would leave the folder is refused', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-evil-'));
    try {
      fs.mkdirSync(path.join(tmp, 'adv'));
      for (const name of ['../../etc', '.hidden', 'a/b']) {
        const out = path.join(tmp, 'x.sgpack');
        await writePack(out, { folder: path.join(tmp, 'adv'), manifest: { scryingGlass: 'adventure', version: 1, name, exported: 1, app: 't', music: false }, slices: { scenes: [], maps: {}, encounters: [], order: {}, names: {} }, library: [] });
        await expect(packManifest(out)).rejects.toThrow();
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('a pack leaves PDFs behind when asked', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-pdf-'));
    try {
      const adv = path.join(tmp, 'Страд');
      fs.mkdirSync(path.join(adv, 'journal'), { recursive: true });
      fs.writeFileSync(path.join(adv, 'journal/book.pdf'), 'pdf');
      fs.writeFileSync(path.join(adv, 'journal/notes.md'), 'notes');
      const out = path.join(tmp, 'x.sgpack');
      await writePack(out, { folder: adv, manifest: { scryingGlass: 'adventure', version: 1, name: 'Страд', exported: 1, app: 't', music: false }, slices: { scenes: [], maps: {}, encounters: [], order: {}, names: {} }, library: [], pdf: false });
      const text = fs.readFileSync(out).toString('latin1');
      expect(text).toContain('notes.md');
      expect(text).not.toContain('book.pdf');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('repo module', () => {
  it('remembers published and downloaded adventures by folder', () => {
    const a = repoModule.actions;
    let s = repoModule.initialState;
    s = a.published(s, { folder: 'Страд', mark: { id: 'x1', version: 2 } });
    s = a.published(s, { folder: 'Шахты', mark: { id: 'x2', version: 1 } });
    s = a.installed(s, { folder: 'Чужое', mark: { author: 'a', id: 'y', version: 4 } });
    s = a.unpublished(s, { id: 'x1' });
    expect(s.published).toEqual({ Шахты: { id: 'x2', version: 1 } });
    s = a.installed(s, { folder: 'Чужое', mark: null });
    expect(s.installed).toEqual({});
  });
  it('takes an adventure down only from the source it was taken down from', () => {
    const a = repoModule.actions;
    let s = repoModule.initialState;
    s = a.published(s, { folder: 'Страд', mark: { id: 'x1', version: 2 } });
    s = a.published(s, { folder: 'Шахты', mark: { id: 'x2', version: 1, source: 'club' } });
    s = a.unpublished(s, { id: 'x2' });
    s = a.unpublished(s, { id: 'x1', source: 'club' });
    expect(Object.keys(s.published)).toEqual(['Страд', 'Шахты']);
    s = a.unpublished(s, { id: 'x2', source: 'club' });
    s = a.unpublished(s, { id: 'x1', source: 'official' });
    expect(s.published).toEqual({});
  });
});
