import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PlayerServer } from '../src/main/playerserver';
import type { Card } from '../src/shared/cards';
import { bookIndex, entryNamesOf, namesInText, publicEntry, sheetText, type BookEntry } from '../src/shared/playerbook';
import type { Entry } from '../src/shared/compendium';
import { afterReset, checkAction, usedAfter, hpShare, lanAddresses, playerCard, playerLive, playerUrl, type PlayerView } from '../src/shared/players';
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

describe('the compendium on a phone', () => {
  const entry = (title: string, fields: Entry['fields'] = {}): Entry => ({ title, type: 'spell', fields, body: title });
  const item = (e: Entry, rank = 2, more: string[] = []): BookEntry => ({ entry: e, names: entryNamesOf(e, more), rank });

  it('the names of a sheet: whole words, any shape, ё like е', () => {
    const index = bookIndex([item(entry('Shield')), item(entry('Огненный шар')), item(entry('Fly')), item(entry('Ёж'))]);
    const text = sheetText({ spellcasting: { spells: { 1: ['shield', 'огненный ШАР'] } }, text: { notes: 'A butterfly' }, level: 5 });
    expect(namesInText(index, text).sort()).toEqual(['Shield', 'Огненный шар']);
    expect(namesInText(index, 'еж')).toEqual([]); // too short to be a name
  });

  it('own entries before the book, by rank', () => {
    const mine = entry('Shield', { homebrew: true });
    const index = bookIndex([item(entry('Shield'), 2), item(mine, 0)]);
    expect(index.get('shield')?.entry).toBe(mine);
  });

  it('another translation finds the entry by the English name, and never hides a real name', () => {
    const hands = entry('Огненные руки', { aliases: ['Опаляющие руки'] });
    const real = entry('Щит');
    const index = bookIndex([item(hands, 2, ['Burning Hands']), item(real)], { 'Огненные ладони': 'Burning Hands', Щит: 'Burning Hands', Нечто: 'Unknown' });
    expect(index.get('огненные ладони')?.entry).toBe(hands);
    expect(index.get('опаляющие руки')?.entry).toBe(hands);
    expect(index.get('щит')?.entry).toBe(real);
    expect(index.has('нечто')).toBe(false);
  });

  it('what leaves with an entry', () => {
    const e = publicEntry(entry('Shield', { level: 1, image: 'secret/map.png', overrides: 'dnd/spell/Shield', tags: ['gm'], source: 'Book', aliases: ['x'] }));
    expect(e.fields).toEqual({ level: 1 });
    expect(e.body).toBe('Shield');
  });
});

describe('what a phone may do', () => {
  const limits = { limits: { 'slot:1': 4, 'slot:2': 2 }, resets: { long: ['slot:1', 'slot:2'] } };

  it('spends within the limit and rests', () => {
    expect(checkAction({ type: 'use', key: 'slot:1', used: 3 }, limits)).toEqual({ type: 'use', key: 'slot:1', used: 3 });
    expect(checkAction({ type: 'use', key: 'slot:2', used: 0 }, limits)).toEqual({ type: 'use', key: 'slot:2', used: 0 });
    expect(checkAction({ type: 'reset', id: 'long', extra: 'x' }, limits)).toEqual({ type: 'reset', id: 'long' });
  });

  it('anything else is refused', () => {
    for (const a of [
      null, 'reset', 5, {}, { type: 'hack' },
      { type: 'reset' }, { type: 'reset', id: 'short' }, { type: 'reset', id: 'constructor' }, { type: 'reset', id: 1 },
      { type: 'use', key: 'slot:1', used: 5 },
      { type: 'use', key: 'slot:1', used: -1 },
      { type: 'use', key: 'slot:1', used: 1.5 },
      { type: 'use', key: 'slot:1', used: '2' },
      { type: 'use', key: 'slot:9', used: 1 },
      { type: 'use', key: 'hp', used: 1 },
      { type: 'use', key: '__proto__', used: 0 },
      { type: 'use', key: 'constructor', used: 0 },
    ]) expect(checkAction(a, limits)).toBeNull();
  });

  it('a game without resources allows nothing', () => {
    expect(checkAction({ type: 'use', key: 'slot:1', used: 1 }, { limits: {}, resets: {} })).toBeNull();
    expect(checkAction({ type: 'reset', id: 'long' }, { limits: {}, resets: {} })).toBeNull();
  });

  it('a reset clears only its keys', () => {
    expect(afterReset({ 'slot:1': 2, hunger: 3 }, ['slot:1'])).toEqual({ hunger: 3 });
    expect(afterReset({}, ['slot:1'])).toEqual({});
  });

  it('boxes: a press spends up to it, the last spent gives one back', () => {
    expect(usedAfter(0, 0)).toBe(1);
    expect(usedAfter(1, 3)).toBe(4);
    expect(usedAfter(2, 1)).toBe(1);
    expect(usedAfter(1, 0)).toBe(0);
    expect(usedAfter(3, 0)).toBe(1);
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
  const view = (hp: number): PlayerView => ({ lang: 'en', card: playerCard(card), portrait: null, live: { hp, maxHp: 20, conditions: [], down: false, round: 0, turn: false }, usage: {}, entries: ['Shield'], conditions: [] });
  let current: PlayerView | null;
  const acted: unknown[] = [];

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
      act: async (t, a) => {
        if (t !== 'good' || (a as { ok?: boolean }).ok !== true) return false;
        acted.push(a);
        return true;
      },
      entry: (t, name) => (t === 'good' && name === 'Щит и меч' ? { title: name, type: 'spell', fields: {}, body: 'text' } : null),
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

  it('an entry: only what the source allows, the name as it was typed', async () => {
    const port = await start();
    expect(JSON.parse((await get(port, `/api/good/entry?name=${encodeURIComponent('Щит и меч')}`)).body).body).toBe('text');
    expect((await get(port, '/api/good/entry?name=Secret')).status).toBe(404);
    expect((await get(port, '/api/good/entry')).status).toBe(404);
    expect((await get(port, `/api/bad/entry?name=${encodeURIComponent('Щит и меч')}`)).status).toBe(404);
  });

  const post = (port: number, url: string, body: string, type = 'application/json') =>
    new Promise<number>((resolve, reject) => {
      const req = request({ port, path: url, method: 'POST', host: '127.0.0.1', headers: { 'Content-Type': type } }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('error', reject);
      req.end(body);
    });

  it('the way in: one address, JSON, a known token, what the source allows', async () => {
    const port = await start();
    expect(await post(port, '/api/good/action', '{"ok":true}')).toBe(204);
    expect(acted).toEqual([{ ok: true }]);
    expect(await post(port, '/api/good/action', '{"ok":false}')).toBe(400);
    expect(await post(port, '/api/bad/action', '{"ok":true}')).toBe(404);
    expect(await post(port, '/api/good/action', 'not json')).toBe(400);
    expect(await post(port, '/api/good/action', '{"ok":true}', 'text/plain')).toBe(415);
    expect(await post(port, '/api/good/action', JSON.stringify({ ok: true, pad: 'x'.repeat(2000) }))).toBe(413);
    expect(await post(port, '/api/good/view', '{"ok":true}')).toBe(405);
    expect(await post(port, '/p/good', '{"ok":true}')).toBe(405);
    expect(acted).toHaveLength(1);
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
