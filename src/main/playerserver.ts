// The players' sheets over HTTP: a page and one character's data by its token. No Electron here, so tests run it
// as it is. Without a token nothing but the page's code can be fetched; the token is the whole key, as with a link
// to a shared document. Read only: the server takes nothing from a browser.
import { createReadStream, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { Entry } from '../shared/compendium';
import type { PlayerView } from '../shared/players';

export interface PlayerSource {
  view(token: string): PlayerView | null;
  // The picture's file.
  portrait(token: string): Promise<string | null>;
  // An entry named on the sheet: nothing else of the compendium can be asked for.
  entry(token: string, name: string): Entry | null;
}

const TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
const PICTURE = /^image\//;
const HEARTBEAT = 25_000;
const TRIES = 10;

const SECURITY = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};

interface Client {
  res: ServerResponse;
  last: string;
}

export class PlayerServer {
  private server: Server | null = null;
  private clients = new Map<string, Set<Client>>();
  private beat: ReturnType<typeof setInterval> | null = null;
  // Told when phones connect or leave.
  onClients: () => void = () => {};

  // root — the built pages (out/renderer).
  constructor(
    private source: PlayerSource,
    private root: string
  ) {}

  get port() {
    return (this.server?.address() as AddressInfo | null)?.port ?? 0;
  }

  // The port stays the same from game to game, so a saved link keeps working; taken — the next one.
  async listen(port: number): Promise<number> {
    for (let i = 0; ; i++) {
      try {
        await this.tryListen(port === 0 ? 0 : port + i);
        break;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EADDRINUSE' || i + 1 >= TRIES) throw e;
      }
    }
    this.beat = setInterval(() => this.each((c) => c.res.write(': beat\n\n')), HEARTBEAT);
    return this.port;
  }

  private tryListen(port: number) {
    return new Promise<void>((resolve, reject) => {
      const server = createServer((req, res) => void this.handle(req, res).catch(() => this.fail(res, 500)));
      server.once('error', reject);
      server.listen(port, '0.0.0.0', () => {
        server.off('error', reject);
        this.server = server;
        resolve();
      });
    });
  }

  async close() {
    if (this.beat) clearInterval(this.beat);
    this.beat = null;
    const server = this.server;
    this.server = null;
    this.each((c) => c.res.end());
    this.clients.clear();
    if (!server) return;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  }

  connected = (token: string) => this.clients.get(token)?.size ?? 0;

  // Something changed: everyone gets their sheet if it is not the same; a token no longer known ends its streams.
  refresh() {
    for (const [token, group] of this.clients) {
      const view = this.source.view(token);
      for (const c of group) {
        if (!view) {
          c.res.end('event: gone\ndata: {}\n\n');
          continue;
        }
        const text = JSON.stringify(view);
        if (text === c.last) continue;
        c.last = text;
        c.res.write(`data: ${text}\n\n`);
      }
    }
  }

  private each(f: (c: Client) => void) {
    for (const group of this.clients.values()) for (const c of group) f(c);
  }

  private fail(res: ServerResponse, code: number) {
    if (res.headersSent) return void res.destroy();
    res.writeHead(code, { ...SECURITY, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(code));
  }

  private file(req: IncomingMessage, res: ServerResponse, file: string, type: string, cache?: string) {
    const size = statSync(file, { throwIfNoEntry: false });
    if (!size?.isFile()) return this.fail(res, 404);
    res.writeHead(200, { ...SECURITY, 'Content-Type': type, 'Content-Length': size.size, ...(cache ? { 'Cache-Control': cache } : {}) });
    if (req.method === 'HEAD') return void res.end();
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return this.fail(res, 405);
    const [url = '/', query = ''] = (req.url ?? '/').split('?');
    if (url.startsWith('/p/')) return this.file(req, res, path.join(this.root, 'player/index.html'), 'text/html; charset=utf-8');
    if (url.startsWith('/assets/')) return this.asset(req, res, url);
    const api = /^\/api\/([\w-]+)\/(view|portrait|events|entry)$/.exec(url);
    if (!api) return this.fail(res, 404);
    const token = api[1]!;
    const view = this.source.view(token);
    if (!view) return this.fail(res, 404);
    if (api[2] === 'view') {
      res.writeHead(200, { ...SECURITY, 'Content-Type': 'application/json; charset=utf-8' });
      return void res.end(JSON.stringify(view));
    }
    if (api[2] === 'events') return this.stream(res, token, view);
    if (api[2] === 'entry') {
      const entry = this.source.entry(token, new URLSearchParams(query).get('name') ?? '');
      if (!entry) return this.fail(res, 404);
      res.writeHead(200, { ...SECURITY, 'Content-Type': 'application/json; charset=utf-8' });
      return void res.end(JSON.stringify(entry));
    }
    const file = await this.source.portrait(token);
    const type = file ? TYPES[path.extname(file).toLowerCase()] : undefined;
    if (!file || !type || !PICTURE.test(type)) return this.fail(res, 404);
    this.file(req, res, file, type);
  }

  private asset(req: IncomingMessage, res: ServerResponse, url: string) {
    let name: string;
    try {
      name = decodeURIComponent(url);
    } catch {
      return this.fail(res, 400);
    }
    const dir = path.join(this.root, 'assets');
    const file = path.join(this.root, name);
    const type = TYPES[path.extname(file).toLowerCase()];
    if (!file.startsWith(dir + path.sep) || !type) return this.fail(res, 404);
    this.file(req, res, file, type, 'public, max-age=31536000, immutable');
  }

  private stream(res: ServerResponse, token: string, view: PlayerView) {
    res.writeHead(200, { ...SECURITY, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive' });
    const client: Client = { res, last: JSON.stringify(view) };
    res.write(`data: ${client.last}\n\n`);
    let group = this.clients.get(token);
    if (!group) this.clients.set(token, (group = new Set()));
    group.add(client);
    res.on('close', () => {
      group.delete(client);
      if (!group.size && this.clients.get(token) === group) this.clients.delete(token);
      this.onClients();
    });
    this.onClients();
  }
}
