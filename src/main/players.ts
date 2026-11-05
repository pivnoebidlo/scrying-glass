// The players' sheets: the links (one token for a character, kept in <userData>/players.json so a saved link works
// from game to game), the party of the current adventure and the server (on only when the GM turns it on).
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { visibleIn } from '../shared/adventures';
import { refKey, type CardRef, type CardScope } from '../shared/cards';
import { entryTitle, parseEntry, searchKey, type BuiltinBook, type Entry } from '../shared/compendium';
import { bookIndex, entryNamesOf, namesInText, publicEntry, sheetText, type BookEntry, type BookIndex } from '../shared/playerbook';
import { checkAction, lanAddresses, playerCard, playerLive, type PlayerStatus, type PlayerView } from '../shared/players';
import type { AppState } from '../shared/types';
import { allFiles, dirname } from '../shared/vault';
import { familyOf, importersOf, sheetEntryTypes, sheetLimits, systemOf } from '../systems';
import { getCard, importerTableOf, libraryPath, listCards, resolveInLibrary } from './cards';
import { builtinEntries, entries } from './compendium';
import { PlayerServer } from './playerserver';
import { packBooks } from './syspacks';

export const PLAYER_PORT = 47820;
const PORTRAIT = 320;
// How long the compendium read from files stands: the GM's edits reach the phones within this time.
const BOOK_LIFE = 30_000;

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
  // An action of the module, as the GM's window does it.
  dispatch(name: string, payload: unknown): Promise<unknown>;
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

// ---------- The compendium for phones ----------
interface Source extends BookEntry {
  system?: string;
  lang?: string;
  builtin: boolean;
}
let read: { at: number; adventure: string | null; lang: string; list: Source[] } | null = null;

const own = (text: string, title: string, rank: number): Source => {
  const entry = parseEntry(text, title);
  return { entry, names: entryNamesOf(entry), rank, builtin: false };
};
const builtin = (b: BuiltinBook): Source[] =>
  b.entries.map((e) => ({ entry: e, names: entryNamesOf(e, [e.en, e.ru]), rank: 2, system: b.system, lang: b.lang, builtin: true }));

function readBook(): Source[] {
  const state = deps.state();
  const fresh = read && Date.now() - read.at < BOOK_LIFE && read.adventure === state.adventures.current && read.lang === state.vault.lang;
  if (fresh) return read!.list;
  const tree = state.vault.tree;
  const vaultFiles = tree ? allFiles(tree, 'entry').filter((f) => visibleIn(state.adventures, dirname(f.path))) : [];
  const list = [
    ...vaultFiles.flatMap((f) => {
      const text = entries.read(deps.resolveInVault, f.path);
      return text === null ? [] : [own(text, entryTitle(f.path), 0)];
    }),
    ...entries.listLibrary(libraryPath()).map((f) => own(f.text, entryTitle(f.path), 1)),
    ...[...builtinEntries(), ...packBooks()].flatMap(builtin),
  ];
  read = { at: Date.now(), adventure: state.adventures.current, lang: state.vault.lang, list };
  return list;
}

// Of the built-in books, the card's system and the GM's language come first (the other edition is a fallback).
function ranked(list: Source[], system: string, lang: string): Source[] {
  const family = familyOf(system);
  return list
    .filter((s) => !s.builtin || familyOf(s.system!) === family)
    .map((s) => (s.builtin ? { ...s, rank: 2 + (s.system === system ? 0 : 2) + (s.lang === lang ? 0 : 1) } : s));
}

interface SheetBook {
  from: Source[];
  names: string[];
  sheet: BookIndex;
  rules: BookIndex;
}
const books = new WeakMap<object, SheetBook>();

function bookOf(card: { system: string; stats: unknown }): SheetBook {
  const list = readBook();
  const known = books.get(card);
  if (known?.from === list) return known;
  const all = ranked(list, card.system, deps.state().vault.lang);
  const types = new Set(sheetEntryTypes(card.system));
  const aliases = Object.assign({}, ...importersOf(card.system).map((imp) => imp.table?.aliases?.(importerTableOf(imp.id)) ?? {})) as Record<string, string>;
  const sheet = bookIndex(all.filter((s) => types.has(s.entry.type)), aliases);
  const book = { from: list, sheet, names: namesInText(sheet, sheetText(card.stats)), rules: bookIndex(all.filter((s) => s.entry.type !== 'note')) };
  books.set(card, book);
  return book;
}

function conditionEntry(book: SheetBook, system: string, condition: string): Entry | null {
  const names = systemOf(system).tracker?.conditions.entry?.(condition) ?? [condition];
  for (const n of [...names, condition, condition.replace(/\s+\d+$/, '')]) {
    const hit = book.rules.get(searchKey(n.trim()));
    if (hit) return hit.entry;
  }
  return null;
}

function viewOf(token: string): PlayerView | null {
  const link = Object.hasOwn(links, token) ? links[token] : undefined;
  const card = link && cardOf(link);
  if (!link || !card) return null;
  const state = deps.state();
  const pack = state.vault.systems.find((p) => p.id === card.system);
  const live = playerLive(state.initiative, { scope: link.scope, id: link.id });
  const book = bookOf(card);
  return {
    lang: state.vault.lang,
    card: playerCard(card),
    ...(pack ? { pack } : {}),
    // Not the path: the name of a folder can say more than the GM wants.
    portrait: card.portraits[0] ? createHash('sha1').update(card.portraits[0]).digest('hex').slice(0, 10) : null,
    live,
    usage: state.players.used[card.id] ?? {},
    entries: book.names,
    conditions: (live?.conditions ?? []).filter((c) => conditionEntry(book, card.system, c)),
  };
}

function entryOf(token: string, name: string): Entry | null {
  const link = Object.hasOwn(links, token) ? links[token] : undefined;
  const card = link && cardOf(link);
  if (!link || !card) return null;
  const book = bookOf(card);
  const hit = book.names.some((n) => searchKey(n) === searchKey(name.trim())) ? book.sheet.get(searchKey(name.trim()))?.entry : undefined;
  const conditions = playerLive(deps.state().initiative, { scope: link.scope, id: link.id })?.conditions ?? [];
  const found = hit ?? (conditions.includes(name) ? conditionEntry(book, card.system, name) : null);
  return found ? publicEntry(found) : null;
}

// A player's own character and only what its sheet has.
async function actOn(token: string, raw: unknown): Promise<boolean> {
  const link = Object.hasOwn(links, token) ? links[token] : undefined;
  const card = link && cardOf(link);
  if (!card) return false;
  const action = checkAction(raw, sheetLimits(card.system, card.stats));
  if (!action) return false;
  if (action.type === 'rest') await deps.dispatch('rest', { card: card.id });
  else await deps.dispatch('setUsed', { card: card.id, key: action.key, used: action.used });
  return true;
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
    const s = new PlayerServer({ view: viewOf, portrait: portraitOf, entry: entryOf, act: actOn }, deps.root);
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

