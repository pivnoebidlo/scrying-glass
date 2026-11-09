import { hasContext, setContext } from 'svelte';
// What a sheet tracks at the table (shared/players.ts), kept apart from it. A sheet asks the host of its window
// and does not know whose it is: the GM's window (modules/players) or a player's phone (renderer/player).
import type { Card } from '../../shared/cards';
import type { PlayerUsage } from '../../shared/players';

export interface SheetUsage {
  // A player's page: what only the GM changes is not offered.
  player?: boolean;
  // The players' screen: the table's values without anything to press.
  view?: boolean;
  used(card: Card): PlayerUsage;
  set(card: Card, key: string, used: number): void;
  reset(card: Card, id: string): void;
}

class Host {
  // None — the sheet only shows.
  host = $state.raw<SheetUsage | null>(null);
}

export const sheetUsage = new Host();

// A sheet inside the players' screen (and its preview in the GM's window) only shows: the layer sets this context,
// a sheet asks for its host through sheetHost() while it is created.
const VIEW_ONLY = Symbol('sheet-view-only');
export const showOnly = () => setContext(VIEW_ONLY, true);
export function sheetHost(): () => SheetUsage | null {
  const view = hasContext(VIEW_ONLY);
  return () => (view && sheetUsage.host ? { ...sheetUsage.host, view: true } : sheetUsage.host);
}
