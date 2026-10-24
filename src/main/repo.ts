// The adventure repository from the app's side (shared/repo.ts — the protocol, server/ — the service): the author's
// key, the catalog and covers, publishing a pack (ask → upload straight to S3 → commit), downloading one.
// - The key (Ed25519) is made on the first publish and kept in settings.json, the private part encrypted with the
//   system keychain (safeStorage) when it is available; the GM can save it to a file and load it on another computer.
// - Errors go to the window as `repo:<code>` (the service's code or network / no-url / key), the window words them.
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';
import * as https from 'node:https';
import { Readable } from 'node:stream';
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { nativeImage, safeStorage } from 'electron';
import { AUTHOR_RE, DEFAULT_REPO_URL, ID_RE, LIMITS, signedText, type PublishRequest, type PublishTicket, type RepoCatalog, type RepoEntry, type RepoInfo, type RepoProgress } from '../shared/repo';

export interface RepoSettings {
  // Another repository than the app's own (empty — DEFAULT_REPO_URL).
  url?: string;
  // The author's name shown in the catalog.
  name?: string;
  key?: { x: string; d: string; enc: boolean };
}

interface Deps {
  get(): RepoSettings;
  save(next: RepoSettings): void;
  progress(p: RepoProgress): void;
  // Where covers are cached and downloads wait for the import.
  dir: string;
}

let deps: Deps | null = null;

export function initRepo(d: Deps) {
  deps = d;
  fs.rmSync(downloadsDir(), { recursive: true, force: true });
}

const fail = (code: string) => new Error(`repo:${code}`);
const downloadsDir = () => path.join(deps!.dir, 'downloads');

function base(): string {
  const url = (deps?.get().url || DEFAULT_REPO_URL).trim().replace(/\/+$/, '');
  if (!url) throw fail('no-url');
  return url;
}

export function repoInfo(): RepoInfo {
  const s = deps?.get() ?? {};
  return { url: s.url || DEFAULT_REPO_URL, custom: !!s.url, name: s.name ?? '', author: s.key?.x ?? null };
}

export function setRepoSettings(next: { url?: string; name?: string }) {
  if (!deps) return repoInfo();
  const s = deps.get();
  const url = next.url === undefined ? s.url : next.url.trim().replace(/\/+$/, '');
  if (url && !/^https?:\/\/[^\s/]+/.test(url)) throw fail('bad-url');
  deps.save({ ...s, ...(next.name !== undefined ? { name: next.name.trim().slice(0, LIMITS.authorName) } : {}), url: url || undefined });
  return repoInfo();
}

// ---- The author's key ----
function privateKey(make: boolean) {
  const s = deps!.get();
  if (!s.key) {
    if (!make) throw fail('key');
    const pair = generateKeyPairSync('ed25519');
    const jwk = pair.privateKey.export({ format: 'jwk' });
    saveKey(jwk.x!, jwk.d!);
    return { x: jwk.x!, key: pair.privateKey };
  }
  let d: string;
  try {
    d = s.key.enc ? safeStorage.decryptString(Buffer.from(s.key.d, 'base64')) : s.key.d;
  } catch {
    throw fail('key');
  }
  return { x: s.key.x, key: createPrivateKey({ key: { kty: 'OKP', crv: 'Ed25519', x: s.key.x, d }, format: 'jwk' }) };
}

function saveKey(x: string, d: string) {
  const s = deps!.get();
  const enc = safeStorage.isEncryptionAvailable();
  deps!.save({ ...s, key: { x, d: enc ? safeStorage.encryptString(d).toString('base64') : d, enc } });
}

// The key as a file (to keep it or move it to another computer) and back.
export function keyFile(): string {
  const { x, key } = privateKey(true);
  return JSON.stringify({ scryingGlass: 'author-key', x, d: key.export({ format: 'jwk' }).d }, null, 2);
}

export function loadKeyFile(text: string) {
  const o = JSON.parse(text) as { scryingGlass?: string; x?: string; d?: string };
  if (o.scryingGlass !== 'author-key' || typeof o.x !== 'string' || !AUTHOR_RE.test(o.x) || typeof o.d !== 'string') throw fail('key-file');
  // The private part must give this very public key.
  const priv = createPrivateKey({ key: { kty: 'OKP', crv: 'Ed25519', x: o.x, d: o.d }, format: 'jwk' });
  if (createPublicKey(priv).export({ format: 'jwk' }).x !== o.x) throw fail('key-file');
  saveKey(o.x, o.d);
  return repoInfo();
}

// ---- Calls ----
async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(30_000), ...init });
  } catch {
    throw fail('network');
  }
}

async function errorOf(res: Response) {
  const code = await res.json().then((b: { error?: string }) => b.error, () => undefined);
  return fail(code && /^[a-z-]+$/.test(code) ? code : `http-${res.status}`);
}

async function post<T>(p: string, data: object, makeKey = false): Promise<T> {
  const { x, key } = privateKey(makeKey);
  const body = JSON.stringify({ ts: Date.now(), ...data });
  const sig = sign(null, Buffer.from(signedText('POST', p, body)), key).toString('base64url');
  const res = await request(base() + p, { method: 'POST', body, headers: { 'content-type': 'application/json', 'x-sg-key': x, 'x-sg-sig': sig } });
  if (!res.ok) throw await errorOf(res);
  return (await res.json()) as T;
}

export async function catalog(): Promise<RepoCatalog> {
  const res = await request(`${base()}/api/v1/catalog`);
  if (!res.ok) throw await errorOf(res);
  return (await res.json()) as RepoCatalog;
}

// A cover as a data: URL (the windows show data: pictures), cached by version.
export async function cover(author: string, id: string, version: number): Promise<string | null> {
  if (!AUTHOR_RE.test(author) || !ID_RE.test(id)) return null;
  const file = path.join(deps!.dir, 'covers', `${author}-${id}-${Math.floor(version)}.jpg`);
  if (!fs.existsSync(file)) {
    const res = await request(`${base()}/api/v1/covers/${author}/${id}`).catch(() => null);
    if (!res?.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > LIMITS.cover) return null;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
  }
  return `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;
}

// A picture of the vault as a cover: at most 640 px wide, JPEG under the service's limit.
export function coverFrom(abs: string): Buffer | null {
  let img = nativeImage.createFromPath(abs);
  if (img.isEmpty()) return null;
  if (img.getSize().width > 640) img = img.resize({ width: 640, quality: 'best' });
  for (const q of [85, 75, 60, 45]) {
    const jpg = img.toJPEG(q);
    if (jpg.length <= LIMITS.cover) return jpg;
  }
  return null;
}

// PUT a file or bytes to a presigned link, with the length set (S3 doesn't take chunked uploads).
function put(url: string, body: { file: string } | { bytes: Buffer }, onProgress?: (done: number, total: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const total = 'file' in body ? fs.statSync(body.file).size : body.bytes.length;
    const u = new URL(url);
    const req = (u.protocol === 'https:' ? https : http).request(u, { method: 'PUT', headers: { 'content-length': total, 'content-type': 'application/octet-stream' } }, (res) => {
      res.resume();
      res.on('end', () => (res.statusCode && res.statusCode < 300 ? resolve() : reject(fail(`upload-${res.statusCode}`))));
    });
    req.on('error', () => reject(fail('network')));
    if ('bytes' in body) return req.end(body.bytes);
    let done = 0;
    const rs = fs.createReadStream(body.file, { highWaterMark: 1 << 20 });
    rs.on('data', (chunk) => {
      done += chunk.length;
      onProgress?.(done, total);
    });
    rs.on('error', reject);
    rs.pipe(req);
  });
}

export const newAdventureId = () => randomBytes(12).toString('base64url');

export type PublishMeta = Omit<PublishRequest, 'ts' | 'size' | 'cover' | 'authorName'>;

export async function publish(pack: string, meta: PublishMeta, coverJpeg: Buffer | null): Promise<RepoEntry> {
  const size = fs.statSync(pack).size;
  const ticket = await post<PublishTicket>('/api/v1/publish', { ...meta, size, authorName: deps!.get().name ?? '', ...(coverJpeg ? { cover: coverJpeg.length } : {}) }, true);
  await put(ticket.pack, { file: pack }, (done, total) => deps!.progress({ phase: 'upload', done, total }));
  if (coverJpeg && ticket.cover) await put(ticket.cover, { bytes: coverJpeg }).catch(() => undefined);
  return post<RepoEntry>('/api/v1/commit', { upload: ticket.upload });
}

export async function unpublish(id: string) {
  await post('/api/v1/unpublish', { id });
}

// Download the current version into a temporary file (the import takes it from there).
export async function download(author: string, id: string): Promise<string> {
  if (!AUTHOR_RE.test(author) || !ID_RE.test(id)) throw fail('not-found');
  const res = await fetch(`${base()}/api/v1/packs/${author}/${id}`).catch(() => {
    throw fail('network');
  });
  if (!res.ok || !res.body) throw await errorOf(res);
  const total = Number(res.headers.get('content-length') ?? 0);
  fs.mkdirSync(downloadsDir(), { recursive: true });
  const file = path.join(downloadsDir(), `${newAdventureId()}.sgpack`);
  const ws = fs.createWriteStream(file);
  let done = 0;
  try {
    for await (const chunk of Readable.fromWeb(res.body as never)) {
      done += (chunk as Buffer).length;
      deps!.progress({ phase: 'download', done, total });
      if (!ws.write(chunk)) await new Promise((r) => ws.once('drain', r));
    }
    await new Promise<void>((resolve, reject) => ws.end((e?: Error | null) => (e ? reject(e) : resolve())));
  } catch {
    ws.destroy();
    fs.rmSync(file, { force: true });
    throw fail('network');
  }
  return file;
}

// A downloaded file that is only ours to remove.
export function discardDownload(file: string) {
  if (path.dirname(path.resolve(file)) === path.resolve(downloadsDir())) fs.rmSync(file, { force: true });
}
