// A hero's values marked at the table (modules/players, shared/players.ts) in the tracker. The table is the truth: it
// outlives a fight and a phone changes it. A combatant keeps a copy, for what reads it everywhere (who is down, how
// wounded, the players' strip): `syncTable` brings it up to date after any change of either side, so a marked value
// survives a new fight. Only a hero: two goblins of one card share no table.
import { sameRef, type Card, type CardRef } from '../../shared/cards';
import type { PlayerUsage } from '../../shared/players';
import { evalFormula, fieldMap, packResources, trackerCells, type PackStats, type SystemPack } from '../../shared/syspack';
import type { Combatant, InitiativeState } from './types';

export interface TableKeys {
  // The health field, if it is marked at the table (a number: boxes of a track count damage, not health).
  hp?: string;
  cells: { key: string; track: boolean }[];
  // Cells worked out by a formula from what is marked (the Nineties: debuffs of five): counted again from the card.
  derived?: { key: string; formula: string }[];
}

// The core hands its cards in (main/cards.ts: the module stays free of Electron, tests give their own).
let cardOf: (ref: CardRef) => Card | null = () => null;
export const setTableCards = (f: (ref: CardRef) => Card | null) => (cardOf = f);

// A card's stats with the table's values in them, as the sheet sees them (pack/Sheet.svelte).
export function statsAtTable(pack: SystemPack, card: Pick<Card, 'stats' | 'kind'>, used: PlayerUsage = {}): PackStats {
  const stats = { ...((card.stats ?? {}) as PackStats) };
  for (const [k, limit] of Object.entries(packResources(pack, stats, card.kind).limits)) if (used[k] !== undefined) stats[k] = Math.min(used[k]!, limit);
  return stats;
}

// What of the tracker is marked at the table in this system.
export function tableKeys(pack: SystemPack): TableKeys {
  const fields = fieldMap(pack);
  const hp = pack.tracker.hp ? fields.get(pack.tracker.hp) : undefined;
  const cells = trackerCells(pack).filter((f) => !!f.live && f.key !== pack.tracker.hp);
  const derived = trackerCells(pack).filter((f) => !f.live && f.type === 'formula' && f.formula && f.key !== pack.tracker.hp);
  return {
    ...(hp?.live && hp.type !== 'track' ? { hp: hp.key } : {}),
    cells: cells.map((f) => ({ key: f!.key, track: f!.type === 'track' })),
    ...(derived.length ? { derived: derived.map((f) => ({ key: f.key, formula: f.formula! })) } : {}),
  };
}

export const atTable = (c: Combatant, all: Combatant[]) =>
  !!c.card && c.side === 'party' && all.filter((x) => x.card && sameRef(x.card, c.card!)).length === 1;

// A value not marked is the sheet's own: a full number, a track as the card marks it (empty, if it doesn't).
// derived — the values of the worked-out cells (none — they stay as they are).
export function withTable(c: Combatant, keys: TableKeys, used: PlayerUsage = {}, derived?: Record<string, number>): Combatant {
  let out = c;
  for (const [key, n] of Object.entries(derived ?? {})) {
    const a = out.attrs?.find((x) => x.id === key);
    if (a && a.value !== n) out = { ...out, attrs: out.attrs!.map((x) => (x.id === key ? { ...x, value: n } : x)) };
  }
  if (keys.hp && c.maxHp !== null) {
    const hp = Math.min(c.maxHp, used[keys.hp] ?? c.maxHp);
    if (hp !== c.hp) out = { ...out, hp };
  }
  for (const { key, track } of keys.cells) {
    if (track) {
      const line = out.stress?.find((s) => s.id === key);
      const n = used[key] ?? line?.base ?? 0;
      if (line && line.boxes.filter(Boolean).length !== n) out = { ...out, stress: out.stress!.map((s) => (s.id === key ? { ...s, boxes: s.boxes.map((_, i) => i < n) } : s)) };
    } else {
      const a = out.attrs?.find((x) => x.id === key);
      const n = used[key] ?? a?.max;
      if (a && a.value !== n) out = { ...out, attrs: out.attrs!.map((x) => (x.id === key ? { ...x, value: n! } : x)) };
    }
  }
  return out;
}

// The same state when nothing differs.
export function syncTable(s: InitiativeState, pack: SystemPack | undefined, used: Record<string, PlayerUsage> | undefined): InitiativeState {
  if (!pack) return s;
  const keys = tableKeys(pack);
  if (!keys.hp && !keys.cells.length && !keys.derived) return s;
  let changed = false;
  const combatants = s.combatants.map((c) => {
    if (!atTable(c, s.combatants)) return c;
    const mine = used?.[c.card!.id];
    const card = keys.derived ? cardOf(c.card!) : null;
    const stats = card ? statsAtTable(pack, card, mine) : null;
    const derived = stats ? Object.fromEntries(keys.derived!.map((d) => [d.key, evalFormula(pack, stats, d.formula)])) : undefined;
    const next = withTable(c, keys, mine, derived);
    if (next !== c) changed = true;
    return next;
  });
  return changed ? { ...s, combatants } : s;
}
