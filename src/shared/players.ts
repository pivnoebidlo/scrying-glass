// Players' sheets in a browser: the GM's app serves a page on the local network, each player has a link (a QR code)
// to their own character. Only what is built here leaves the GM's computer — never the shared state.
import { sameRef, type Card, type CardRef } from './cards';
import type { Lang } from './i18n/core';
import type { SystemPack } from './syspack';
import { down } from '../modules/initiative/order';
import type { InitiativeState } from '../modules/initiative/types';

// What a sheet tracks at the table, in terms any game can use: a resource is a number between 0 and its limit (spent
// spell slots, Hunger, Sanity), a reset is a named event that returns some of them to the sheet's own value (a long
// rest); a game may have neither. What they mean and how they look is the system's. Not in the card: a sheet read
// again from a service must not meet them.
export interface SheetResources {
  // A key → how many there are.
  limits: Record<string, number>;
  // A reset's id → the keys it clears.
  resets: Record<string, string[]>;
  // Keys only the GM changes: a phone can't, nor a reset with one of them.
  gmOnly?: string[];
}
export const NO_RESOURCES: SheetResources = { limits: {}, resets: {} };

// A key → the value now; none — the sheet's own.
export type PlayerUsage = Record<string, number>;

export type PlayerAction = { type: 'use'; key: string; used: number } | { type: 'reset'; id: string };

// What came from a phone, checked: only what this sheet has, only whole numbers within the limit. Anything else — null.
export function checkAction(raw: unknown, sheet: SheetResources): PlayerAction | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const gm = sheet.gmOnly ?? [];
  if (a['type'] === 'reset') {
    if (typeof a['id'] !== 'string' || !Object.hasOwn(sheet.resets, a['id']) || sheet.resets[a['id']]!.some((k) => gm.includes(k))) return null;
    return { type: 'reset', id: a['id'] };
  }
  if (a['type'] !== 'use' || typeof a['key'] !== 'string' || !Object.hasOwn(sheet.limits, a['key']) || gm.includes(a['key'])) return null;
  const used = a['used'];
  if (typeof used !== 'number' || !Number.isInteger(used) || used < 0 || used > sheet.limits[a['key']]!) return null;
  return { type: 'use', key: a['key'], used };
}

// A reset applied: the keys it names go, the others stay.
export function afterReset(usage: PlayerUsage, keys: string[]): PlayerUsage {
  return Object.fromEntries(Object.entries(usage).filter(([k]) => !keys.includes(k)));
}

// A box of a track pressed: it and those before it are spent, the last spent one pressed again gives it back.
export const usedAfter = (used: number, box: number) => (used === box + 1 ? box : box + 1);

// The character in the running fight: what the GM changes in the tracker.
export interface PlayerLive {
  hp: number | null;
  maxHp: number | null;
  conditions: string[];
  down: boolean;
  // 0 — the fight has not begun.
  round: number;
  turn: boolean;
}

export interface PlayerView {
  lang: Lang;
  card: Card;
  // The system pack of the card (a pack system's sheet needs it).
  pack?: SystemPack;
  // A key of the picture (it changes with the picture); null — no portrait.
  portrait: string | null;
  live: PlayerLive | null;
  usage: PlayerUsage;
  // The names of the sheet with a description to open (shared/playerbook.ts).
  entries: string[];
  // The conditions on the character that have one.
  conditions: string[];
}

// The card as a player may see it. A list of what goes, not of what is removed: a new field of a card stays home
// until someone decides otherwise (the GM's notes, tags, links to accounts).
export const playerCard = (c: Card): Card => ({
  format: c.format,
  id: '',
  kind: c.kind,
  system: c.system,
  lang: c.lang,
  name: c.name,
  portraits: [],
  tags: [],
  ...(c.description ? { description: c.description } : {}),
  notes: '',
  stats: c.stats,
});

// One character of the running fight: nothing about the others.
export function playerLive(fight: Pick<InitiativeState, 'combatants' | 'turn' | 'round'>, ref: CardRef): PlayerLive | null {
  const c = fight.combatants.find((x) => sameRef(x.card, ref));
  if (!c) return null;
  return {
    hp: c.hp,
    maxHp: c.maxHp,
    conditions: c.conditions,
    down: down(c),
    round: fight.turn ? fight.round : 0,
    turn: fight.turn === c.id,
  };
}

// A stretch of the bar of hit points, 0…1.
export const hpShare = (hp: number | null, maxHp: number | null) => (hp === null || !maxHp ? 0 : Math.min(1, Math.max(0, hp / maxHp)));

// Interfaces that are not the table's network: tunnels and virtual machines. bridge* is here too, but stays on the
// list — that is how macOS shares Wi-Fi from the GM's laptop.
const VIRTUAL = /^(utun|tun|tap|ppp|ipsec|docker|br-|veth|vmnet|vnic|vboxnet|bridge|awdl|llw|zt|tailscale|wg)|vEthernet|VirtualBox|VMware|Hyper-V|WSL|Loopback/i;
const isPrivate = (ip: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);

interface NetAddress {
  address: string;
  family: string | number;
  internal: boolean;
}

// The addresses players can reach, the likely one first.
export function lanAddresses(nets: Record<string, NetAddress[] | undefined>): string[] {
  const found: { ip: string; virtual: boolean }[] = [];
  for (const [name, list] of Object.entries(nets)) {
    for (const a of list ?? []) {
      if (a.internal || (a.family !== 'IPv4' && a.family !== 4) || !isPrivate(a.address)) continue;
      found.push({ ip: a.address, virtual: VIRTUAL.test(name) });
    }
  }
  return [...found.filter((a) => !a.virtual), ...found.filter((a) => a.virtual)].map((a) => a.ip);
}

export const playerUrl = (address: string, port: number, token: string) => `http://${address}:${port}/p/${token}`;

export interface PlayerRow {
  ref: CardRef;
  name: string;
  token: string;
  // Phones with the sheet open now.
  clients: number;
}

export interface PlayerStatus {
  on: boolean;
  port: number;
  addresses: string[];
  // The party of the current adventure.
  party: PlayerRow[];
  error?: string;
}
