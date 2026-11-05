// Players' sheets in a browser: the GM's app serves a page on the local network, each player has a link (a QR code)
// to their own character. Only what is built here leaves the GM's computer — never the shared state.
import { sameRef, type Card, type CardRef } from './cards';
import type { Lang } from './i18n/core';
import type { SystemPack } from './syspack';
import { down } from '../modules/initiative/order';
import type { InitiativeState } from '../modules/initiative/types';

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
