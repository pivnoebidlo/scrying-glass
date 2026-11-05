// What a sheet tracks at the table (shared/players.ts), kept apart from it. A sheet asks the host of its window
// and does not know whose it is: the GM's window (modules/players) or a player's phone (renderer/player).
import type { Card } from '../../shared/cards';
import type { PlayerUsage } from '../../shared/players';

export interface SheetUsage {
  // A player's page: what only the GM changes is not offered.
  player?: boolean;
  used(card: Card): PlayerUsage;
  set(card: Card, key: string, used: number): void;
  reset(card: Card, id: string): void;
}

class Host {
  // None — the sheet only shows.
  host = $state.raw<SheetUsage | null>(null);
}

export const sheetUsage = new Host();
