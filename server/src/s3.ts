// A tiny S3 client: the four calls the service needs (get, put, head, delete) and presigned links, signed with
// AWS Signature Version 4. Path-style addresses (endpoint/bucket/key) — every S3-compatible server takes them.
import { createHash, createHmac } from 'node:crypto';

export interface Storage {
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, body: Uint8Array<ArrayBuffer>, type: string): Promise<void>;
  head(key: string): Promise<{ size: number } | null>;
  del(key: string): Promise<void>;
  // A link anyone can use for a while: GET to download, PUT to upload.
  presign(method: 'GET' | 'PUT', key: string, seconds: number): string;
}

export interface S3Config {
  // Where the service reaches S3 and where clients do (often the same; inside a cluster — not).
  endpoint: string;
  publicEndpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  // Keys of the repository live under this prefix (the bucket may hold other things).
  prefix: string;
}

const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest();

// RFC 3986 encoding as S3 wants it (encodeURIComponent leaves !'()* alone).
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

export function amzDate(now: Date) {
  const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return { stamp: iso, day: iso.slice(0, 8) };
}

interface Signable {
  method: string;
  url: URL;
  // Lower-case names; host is added.
  headers: Record<string, string>;
  payload: string;
}

// The signature of a request and what went into it.
export function sign(cfg: Pick<S3Config, 'region' | 'secretKey'>, r: Signable, now: Date) {
  const { stamp, day } = amzDate(now);
  const headers: Record<string, string> = { ...r.headers, host: r.url.host };
  const names = Object.keys(headers).sort();
  const query = [...r.url.searchParams.entries()]
    .map(([k, v]) => [enc(k), enc(v)] as const)
    .sort(([a, x], [b, y]) => (a < b ? -1 : a > b ? 1 : x < y ? -1 : x > y ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const canonical = [
    r.method,
    r.url.pathname.split('/').map((p) => enc(decodeURIComponent(p))).join('/'),
    query,
    names.map((n) => `${n}:${headers[n]!.trim()}\n`).join(''),
    names.join(';'),
    r.payload,
  ].join('\n');
  const scope = `${day}/${cfg.region}/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', stamp, scope, sha256(canonical)].join('\n');
  const key = hmac(hmac(hmac(hmac('AWS4' + cfg.secretKey, day), cfg.region), 's3'), 'aws4_request');
  return { signature: createHmac('sha256', key).update(toSign).digest('hex'), scope, stamp, signed: names.join(';') };
}

export class S3 implements Storage {
  private cfg: S3Config;
  private now: () => Date;
  constructor(cfg: S3Config, now: () => Date = () => new Date()) {
    this.cfg = cfg;
    this.now = now;
  }

  private url(base: string, key: string) {
    return new URL(`${base.replace(/\/+$/, '')}/${enc(this.cfg.bucket)}/${(this.cfg.prefix + key).split('/').map(enc).join('/')}`);
  }

  private async call(method: string, key: string, body?: Uint8Array<ArrayBuffer>, type?: string): Promise<Response> {
    const url = this.url(this.cfg.endpoint, key);
    const payload = sha256(body ?? '');
    const now = this.now();
    const headers: Record<string, string> = { 'x-amz-content-sha256': payload, 'x-amz-date': amzDate(now).stamp };
    if (type) headers['content-type'] = type;
    const s = sign(this.cfg, { method, url, headers, payload }, now);
    const auth = `AWS4-HMAC-SHA256 Credential=${this.cfg.accessKey}/${s.scope}, SignedHeaders=${s.signed}, Signature=${s.signature}`;
    return fetch(url, { method, headers: { ...headers, authorization: auth }, ...(body ? { body } : {}) });
  }

  async get(key: string) {
    const res = await this.call('GET', key);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`S3 GET ${key}: ${res.status} ${await res.text()}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  async put(key: string, body: Uint8Array<ArrayBuffer>, type: string) {
    const res = await this.call('PUT', key, body, type);
    if (!res.ok) throw new Error(`S3 PUT ${key}: ${res.status} ${await res.text()}`);
  }

  async head(key: string) {
    const res = await this.call('HEAD', key);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`S3 HEAD ${key}: ${res.status}`);
    return { size: Number(res.headers.get('content-length') ?? 0) };
  }

  async del(key: string) {
    const res = await this.call('DELETE', key);
    if (!res.ok && res.status !== 404) throw new Error(`S3 DELETE ${key}: ${res.status} ${await res.text()}`);
  }

  presign(method: 'GET' | 'PUT', key: string, seconds: number) {
    const url = this.url(this.cfg.publicEndpoint, key);
    const now = this.now();
    const { day, stamp } = amzDate(now);
    url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    url.searchParams.set('X-Amz-Credential', `${this.cfg.accessKey}/${day}/${this.cfg.region}/s3/aws4_request`);
    url.searchParams.set('X-Amz-Date', stamp);
    url.searchParams.set('X-Amz-Expires', String(seconds));
    url.searchParams.set('X-Amz-SignedHeaders', 'host');
    const s = sign(this.cfg, { method, url, headers: {}, payload: 'UNSIGNED-PAYLOAD' }, now);
    url.searchParams.set('X-Amz-Signature', s.signature);
    return url.toString();
  }
}
