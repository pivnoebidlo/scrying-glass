import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PlayerServer } from '../src/main/playerserver';
import type { Card } from '../src/shared/cards';
import { hpShare, lanAddresses, playerCard, playerLive, playerUrl, type PlayerView } from '../src/shared/players';
import type { Combatant } from '../src/modules/initiative/types';

const card: Card = {
  format: 1, id: 'secret-id', kind: 'character', system: 'dnd5e-2024', lang: 'en', name: 'Mira', portraits: ['spoilers/mira.png'],
  tags: ['traitor'], description: 'Tall.', side: 'party', notes: 'Betrays the party in act 3', stats: { hp: 10 },
  links: { lss: 'account-id' }, source: { title: 'x' }, origin: { id: 'o', relation: 'variant' },
};
const ref = { scope: 'vault', id: 'secret-id' } as const;
const fighter = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'c1', name: 'Mira', init: 12, bonus: 2, hp: 7, maxHp: 20, ac: 15, side: 'party', portrait: null, hidden: false, conditions: ['Prone'], card: ref, ...over,
});

describe('what a player gets', () => {
  it('the GM\'s notes, tags, links and paths stay home', () => {
    const text = JSON.stringify(playerCard(card));
    for (const secret of ['Betrays', 'traitor', 'account-id', 'spoilers', 'secret-id']) expect(text).not.toContain(secret);
    expect(playerCard(card)).toMatchObject({ name: 'Mira', description: 'Tall.', stats: { hp: 10 } });
  });

  it('only their own character of the fight', () => {
    const enemy = fighter({ id: 'c2', name: 'Ogre', hp: 1, side: 'enemy', card: { scope: 'srd', id: 'ogre' } });
    const live = playerLive({ combatants: [enemy, fighter()], turn: 'c2', round: 3 }, ref);
    expect(live).toEqual({ hp: 7, maxHp: 20, conditions: ['Prone'], down: false, round: 3, turn: false });
    expect(JSON.stringify(live)).not.toContain('Ogre');
    expect(playerLive({ combatants: [enemy], turn: null, round: 1 }, ref)).toBeNull();
  });

  it('their turn, down, a fight not begun', () => {
    expect(playerLive({ combatants: [fighter({ hp: 0 })], turn: 'c1', round: 2 }, ref)).toMatchObject({ turn: true, down: true });
    expect(playerLive({ combatants: [fighter()], turn: null, round: 1 }, ref)?.round).toBe(0);
    expect(hpShare(30, 20)).toBe(1);
    expect(hpShare(-3, 20)).toBe(0);
    expect(hpShare(null, null)).toBe(0);
  });
});

describe('addresses on the table\'s network', () => {
  const a = (address: string, family: string | number = 'IPv4', internal = false) => ({ address, family, internal });

  it('the network first, tunnels and sharing after, the rest not at all', () => {
    expect(
      lanAddresses({
        lo0: [a('127.0.0.1', 'IPv4', true)],
        utun3: [a('10.8.0.2')],
        bridge100: [a('192.168.2.1')],
        en0: [a('fe80::1', 'IPv6'), a('192.168.1.34')],
        tailscale0: [a('100.64.0.1')],
        en5: [a('169.254.10.1')],
        Ethernet: [a('172.16.0.9', 4)],
      })
    ).toEqual(['192.168.1.34', '172.16.0.9', '10.8.0.2', '192.168.2.1']);
    expect(lanAddresses({})).toEqual([]);
  });

  it('the link', () => expect(playerUrl('192.168.1.34', 47820, 'abc')).toBe('http://192.168.1.34:47820/p/abc'));
});

describe('the server', () => {
  let server: PlayerServer;
  const view = (hp: number): PlayerView => ({ lang: 'en', card: playerCard(card), portrait: null, live: { hp, maxHp: 20, conditions: [], down: false, round: 0, turn: false } });
  let current: PlayerView | null;

  function start() {
    const root = mkdtempSync(path.join(tmpdir(), 'sg-players-'));
    mkdirSync(path.join(root, 'player'));
    mkdirSync(path.join(root, 'assets'));
    writeFileSync(path.join(root, 'player/index.html'), '<html>');
    writeFileSync(path.join(root, 'assets/app.js'), 'ok');
    writeFileSync(path.join(root, 'secret.js'), 'no');
    writeFileSync(path.join(root, 'portrait.png'), 'png');
    writeFileSync(path.join(root, 'notes.txt'), 'no');
    current = view(10);
    server = new PlayerServer({
      view: (t) => (t === 'good' ? current : null),
      portrait: async (t) => (t === 'good' ? path.join(root, 'portrait.png') : t === 'text' ? path.join(root, 'notes.txt') : null),
    }, root);
    return server.listen(0);
  }

  // Raw paths: fetch would tidy «..» away before sending.
  const get = (port: number, url: string, method = 'GET') =>
    new Promise<{ status: number; body: string; headers: Record<string, unknown> }>((resolve, reject) => {
      const req = request({ port, path: url, method, host: '127.0.0.1' }, (res) => {
        let body = '';
        res.on('data', (c: Buffer) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body, headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    });

  afterEach(() => server.close());

  it('the token opens one sheet, anything else — nothing', async () => {
    const port = await start();
    expect(JSON.parse((await get(port, '/api/good/view')).body).live.hp).toBe(10);
    expect((await get(port, '/api/bad/view')).status).toBe(404);
    expect((await get(port, '/api/__proto__/view')).status).toBe(404);
    expect((await get(port, '/api/bad/events')).status).toBe(404);
    expect((await get(port, '/api/bad/portrait')).status).toBe(404);
    expect((await get(port, '/')).status).toBe(404);
    expect((await get(port, '/api/good/view', 'POST')).status).toBe(405);
  });

  it('files: the page and its code, and not a step aside', async () => {
    const port = await start();
    const page = await get(port, '/p/whatever');
    expect(page.status).toBe(200);
    expect(page.headers['content-security-policy']).toContain("default-src 'self'");
    expect((await get(port, '/assets/app.js')).body).toBe('ok');
    expect((await get(port, '/assets/../secret.js')).status).toBe(404);
    expect((await get(port, '/assets/..%2Fsecret.js')).status).toBe(404);
    expect((await get(port, '/assets/%2e%2e/secret.js')).status).toBe(404);
    expect((await get(port, '/assets/%E0%A4%A')).status).toBe(400);
    expect((await get(port, '/secret.js')).status).toBe(404);
  });

  it('a portrait is a picture', async () => {
    const port = await start();
    const res = await get(port, '/api/good/portrait');
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.body).toBe('png');
  });

  it('changes reach the phone, repeats do not; a dead link ends the stream', async () => {
    const port = await start();
    const chunks: string[] = [];
    const ended = new Promise<void>((resolve) => {
      request({ port, path: '/api/good/events', host: '127.0.0.1' }, (res) => {
        res.setEncoding('utf8');
        res.on('data', (c: string) => chunks.push(c));
        res.on('end', resolve);
      }).end();
    });
    await expect.poll(() => chunks.length).toBe(1);
    expect(server.connected('good')).toBe(1);
    server.refresh();
    current = view(3);
    server.refresh();
    await expect.poll(() => chunks.length).toBe(2);
    expect(chunks[1]).toContain('"hp":3');
    current = null;
    server.refresh();
    await ended;
    expect(chunks.join('')).toContain('event: gone');
    await expect.poll(() => server.connected('good')).toBe(0);
  });
});
