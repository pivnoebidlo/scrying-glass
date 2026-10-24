// The service's HTTP API (v1). Reads are open; writes are signed by the author's key (headers x-sg-key and
// x-sg-sig: Ed25519 over signedText(method, path, body)); the admin's calls carry `Authorization: Bearer <token>`.
//
//   GET  /api/v1/catalog                      the catalog of adventures (?kinds=adventure,system,bestiary — those
//                                             kinds; ?kinds=all — adventures and systems, as the app 0.59 asks)
//   GET  /api/v1/packs/<author>/<id>          302 → the current version's .sgpack (counts a download)
//   GET  /api/v1/covers/<author>/<id>         302 → its cover
//   POST /api/v1/publish     (signed)         PublishRequest → PublishTicket
//   POST /api/v1/commit      (signed)         { ts, upload } → RepoEntry
//   POST /api/v1/unpublish   (signed)         { ts, id }
//   POST /api/v1/report                       { author, id, reason, text } — a complaint (anyone, one per address)
//   GET  /api/v1/admin/reports (admin)        ReportedEntry[] (also the check of the token)
//   POST /api/v1/admin/remove (admin)         { author, id, block? }
//   POST /api/v1/admin/dismiss (admin)        { author, id } — the complaints go
//   GET  /api/v1/admin/blocked (admin)        BlockedEntry[]
//   POST /api/v1/admin/unblock (admin)        { author, id } — the author may publish it again
//   GET  /healthz
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { AUTHOR_RE, checkPublish, ID_RE, MAX_SKEW, signedText } from '../../src/shared/repo.ts';
import { RepoError, type Repo } from './repo.ts';

export interface HttpOptions {
  admin: string;
  // Signed requests a minute from one address.
  ratePerMinute: number;
  // Take the client's address from X-Forwarded-For (behind an ingress).
  trustProxy: boolean;
  now?: () => number;
  log?: (line: string) => void;
}

const MAX_BODY = 16 * 1024;

function json(res: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const parts: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new RepoError(413, 'body');
    parts.push(chunk as Buffer);
  }
  return Buffer.concat(parts).toString('utf8');
}

// The author's key if the signature is right and fresh.
export function verifySigned(req: IncomingMessage, path: string, body: string, now: number): string {
  const key = req.headers['x-sg-key'];
  const sig = req.headers['x-sg-sig'];
  if (typeof key !== 'string' || !AUTHOR_RE.test(key) || typeof sig !== 'string') throw new RepoError(401, 'signature');
  let ok = false;
  try {
    const pub = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: key }, format: 'jwk' });
    ok = verify(null, Buffer.from(signedText(req.method ?? '', path, body)), pub, Buffer.from(sig, 'base64url'));
  } catch {
    ok = false;
  }
  if (!ok) throw new RepoError(401, 'signature');
  const ts = (JSON.parse(body) as { ts?: unknown }).ts;
  if (typeof ts !== 'number' || Math.abs(now - ts) > MAX_SKEW) throw new RepoError(401, 'clock');
  return key;
}

export function handler(repo: Repo, opts: HttpOptions) {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, { minute: number; n: number }>();
  const limited = (ip: string) => {
    const minute = Math.floor(now() / 60000);
    const h = hits.get(ip);
    if (!h || h.minute !== minute) {
      if (hits.size > 10000) hits.clear();
      hits.set(ip, { minute, n: 1 });
      return false;
    }
    return ++h.n > opts.ratePerMinute;
  };
  const isAdmin = (req: IncomingMessage) => {
    const got = Buffer.from(req.headers['authorization'] ?? '');
    const want = Buffer.from(`Bearer ${opts.admin}`);
    return !!opts.admin && got.length === want.length && timingSafeEqual(got, want);
  };
  const clientIp = (req: IncomingMessage) => {
    const fwd = req.headers['x-forwarded-for'];
    return (opts.trustProxy && typeof fwd === 'string' ? fwd.split(',')[0]!.trim() : req.socket.remoteAddress) ?? '';
  };

  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const path = url.pathname;
    try {
      if (req.method === 'GET') {
        if (path === '/healthz') return json(res, 200, { ok: true });
        if (path === '/api/v1/catalog') {
          const asked = url.searchParams.get('kinds') ?? '';
          return json(res, 200, repo.catalog(asked === 'all' ? ['system'] : asked.split(',')));
        }
        if (path === '/api/v1/admin/reports') {
          if (!isAdmin(req)) throw new RepoError(401, 'admin');
          return json(res, 200, repo.reported());
        }
        if (path === '/api/v1/admin/blocked') {
          if (!isAdmin(req)) throw new RepoError(401, 'admin');
          return json(res, 200, repo.blockedList());
        }
        const m = /^\/api\/v1\/(packs|covers)\/([^/]+)\/([^/]+)$/.exec(path);
        if (m && AUTHOR_RE.test(m[2]!) && ID_RE.test(m[3]!)) {
          const link = repo.link(m[2]!, m[3]!, m[1] === 'packs' ? 'pack' : 'cover');
          if (!link) throw new RepoError(404, 'not-found');
          res.writeHead(302, { location: link, 'cache-control': 'no-store' });
          return res.end();
        }
        throw new RepoError(404, 'not-found');
      }
      if (req.method !== 'POST') throw new RepoError(405, 'method');
      if (limited(clientIp(req))) throw new RepoError(429, 'slow-down');
      const body = await readBody(req);

      if (path === '/api/v1/admin/remove') {
        if (!isAdmin(req)) throw new RepoError(401, 'admin');
        const b = JSON.parse(body) as { author?: string; id?: string; block?: boolean };
        const done = await repo.remove(String(b.author), String(b.id), b.block !== false);
        opts.log?.(`admin remove ${b.author}/${b.id}: ${done}`);
        return json(res, done ? 200 : 404, { removed: done });
      }
      if (path === '/api/v1/admin/dismiss') {
        if (!isAdmin(req)) throw new RepoError(401, 'admin');
        const b = JSON.parse(body) as { author?: string; id?: string };
        const done = await repo.dismiss(String(b.author), String(b.id));
        opts.log?.(`admin dismiss ${b.author}/${b.id}: ${done}`);
        return json(res, done ? 200 : 404, { dismissed: done });
      }
      if (path === '/api/v1/admin/unblock') {
        if (!isAdmin(req)) throw new RepoError(401, 'admin');
        const b = JSON.parse(body) as { author?: string; id?: string };
        const done = await repo.unblock(String(b.author), String(b.id));
        opts.log?.(`admin unblock ${b.author}/${b.id}: ${done}`);
        return json(res, done ? 200 : 404, { unblocked: done });
      }
      if (path === '/api/v1/report') {
        const b = JSON.parse(body) as { author?: unknown; id?: unknown; reason?: unknown; text?: unknown };
        if (typeof b.author !== 'string' || !AUTHOR_RE.test(b.author) || typeof b.id !== 'string' || !ID_RE.test(b.id)) throw new RepoError(400, 'bad-id');
        // The address is kept only as a hash: enough to count one complaint per sender.
        const from = createHash('sha256').update(`${opts.admin}:${clientIp(req)}`).digest('base64url').slice(0, 16);
        await repo.report(b.author, b.id, from, b.reason, b.text);
        opts.log?.(`report ${b.author}/${b.id}: ${String(b.reason)}`);
        return json(res, 200, { reported: true });
      }

      const author = verifySigned(req, path, body, now());
      const b = JSON.parse(body) as Record<string, unknown>;
      if (path === '/api/v1/publish') {
        const r = checkPublish(b);
        if (typeof r === 'string') throw new RepoError(400, `bad-${r}`);
        const ticket = repo.publish(author, r);
        opts.log?.(`publish ${author}/${r.id} v${ticket.version} (${r.size} B)`);
        return json(res, 200, ticket);
      }
      if (path === '/api/v1/commit') {
        const entry = await repo.commit(author, String(b['upload']));
        opts.log?.(`commit ${author}/${entry.id} v${entry.version}`);
        return json(res, 200, entry);
      }
      if (path === '/api/v1/unpublish') {
        if (typeof b['id'] !== 'string' || !ID_RE.test(b['id'])) throw new RepoError(400, 'bad-id');
        const done = await repo.remove(author, b['id']);
        opts.log?.(`unpublish ${author}/${b['id']}: ${done}`);
        return json(res, done ? 200 : 404, { removed: done });
      }
      throw new RepoError(404, 'not-found');
    } catch (e) {
      if (e instanceof RepoError) return json(res, e.status, { error: e.code });
      if (e instanceof SyntaxError) return json(res, 400, { error: 'json' });
      opts.log?.(`error ${req.method} ${path}: ${(e as Error).stack ?? e}`);
      return json(res, 500, { error: 'internal' });
    }
  };
}
