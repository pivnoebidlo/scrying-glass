// The players' sheets: the links (one token for a character, kept in <userData>/players.json so a saved link works
// from game to game), the party of the current adventure and the server (on only when the GM turns it on).
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { visibleIn } from '../shared/adventures';
import { refKey, type CardRef, type CardScope } from '../shared/cards';
import { lanAddresses, playerCard, playerLive, type PlayerStatus, type PlayerView } from '../shared/players';
import type { AppState } from '../shared/types';
import { getCard, listCards, resolveInLibrary } from './cards';
import { PlayerServer } from './playerserver';

export const PLAYER_PORT = 47820;
const PORTRAIT = 320;

interface Link {
  // The vault it belongs to: ids of cards are only unique inside one.
  vault: string;
  scope: CardScope;
  id: string;
}

interface Deps {
  file: string;
  // The built pages.
  root: string;
  state(): AppState;
  vaultRoot(): string | null;
  resolveInVault(rel: string): string | null;
  thumbnail(file: string, width: number): Promise<string | null>;
  // The status changed: to the windows.
  notify(status: PlayerStatus): void;
}

let deps: Deps;
let links: Record<string, Link> = {};
let server: PlayerServer | null = null;
let error: string | undefined;
let sent = '';
let timer: ReturnType<typeof setTimeout> | null = null;

export function initPlayers(d: Deps) {
  deps = d;
  try {
    if (existsSync(d.file)) links = JSON.parse(readFileSync(d.file, 'utf8')).links ?? {};
  } catch {
    links = {}; // A broken file: new links, nothing worse.
  }
}

const saveLinks = () => writeFileSync(deps.file, JSON.stringify({ links }, null, 2));
const cardOf = (l: Link) => l.vault === deps.vaultRoot() ? getCard({ scope: l.scope, id: l.id }) : null;

function tokenOf(ref: CardRef): string {
  const vault = deps.vaultRoot() ?? '';
  const found = Object.entries(links).find(([, l]) => l.vault === vault && l.scope === ref.scope && l.id === ref.id);
  if (found) return found[0];
  const token = randomBytes(24).toString('base64url');
  links[token] = { vault, scope: ref.scope, id: ref.id };
  saveLinks();
  return token;
}

function viewOf(token: string): PlayerView | null {
  const link = Object.hasOwn(links, token) ? links[token] : undefined;
  const card = link && cardOf(link);
  if (!link || !card) return null;
  const state = deps.state();
  const pack = state.vault.systems.find((p) => p.id === card.system);
  return {
    lang: state.vault.lang,
    card: playerCard(card),
    ...(pack ? { pack } : {}),
    // Not the path: the name of a folder can say more than the GM wants.
    portrait: card.portraits[0] ? createHash('sha1').update(card.portraits[0]).digest('hex').slice(0, 10) : null,
    live: playerLive(state.initiative, { scope: link.scope, id: link.id }),
  };
}

async function portraitOf(token: string): Promise<string | null> {
  const link = Object.hasOwn(links, token) ? links[token] : undefined;
  const card = link && cardOf(link);
  const rel = card ? card.portraits[0] : undefined;
  if (!link || !rel) return null;
  const file = link.scope === 'vault' ? deps.resolveInVault(rel) : resolveInLibrary(rel);
  if (!file) return null;
  return (await deps.thumbnail(file, PORTRAIT).catch(() => null)) ?? file;
}

export function playerStatus(): PlayerStatus {
  const state = deps.state();
  const party = deps.vaultRoot()
    ? listCards()
        .filter((c) => c.kind === 'character' && c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(state.adventures, c.folder))
        .map((c) => {
          const token = tokenOf(c.ref);
          return { ref: c.ref, name: c.name, token, clients: server?.connected(token) ?? 0 };
        })
    : [];
  return { on: !!server, port: server?.port ?? PLAYER_PORT, addresses: lanAddresses(networkInterfaces()), party, ...(error ? { error } : {}) };
}

function tell() {
  const status = playerStatus();
  const text = JSON.stringify(status);
  if (text === sent) return;
  sent = text;
  deps.notify(status);
}

// After every action and every change of cards. Several at once are one update.
export function playersChanged() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    server?.refresh();
    tell();
  }, 100);
}

export async function setPlayersOn(on: boolean): Promise<PlayerStatus> {
  error = undefined;
  if (on && !server) {
    const s = new PlayerServer({ view: viewOf, portrait: portraitOf }, deps.root);
    s.onClients = tell;
    try {
      await s.listen(PLAYER_PORT);
      server = s;
    } catch (e) {
      error = (e as Error).message;
    }
  } else if (!on && server) {
    const s = server;
    server = null;
    await s.close();
  }
  tell();
  return playerStatus();
}

// A new link for the character: the old one stops working at once.
export function renewPlayer(ref: CardRef): PlayerStatus {
  const vault = deps.vaultRoot() ?? '';
  for (const [token, l] of Object.entries(links)) if (l.vault === vault && refKey(l) === refKey(ref)) delete links[token];
  saveLinks();
  server?.refresh();
  tell();
  return playerStatus();
}

export const stopPlayers = () => server?.close();

