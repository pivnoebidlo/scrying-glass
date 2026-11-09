// The players' sheets in a browser: links and the server live in the core (main/players.ts); here — what the characters
// have spent at the table (shared/players.ts), by card. The GM's window and a phone both change it through these actions.
import { afterReset, type PlayerUsage } from '../../shared/players';
import { defineModule } from '../../shared/module';

export interface PlayersState {
  used: Record<string, PlayerUsage>;
  // The party's QR codes on the players' screen (before the game: everyone opens their sheet at once).
  codes?: boolean;
  // The network the GM chose for the links; none — the likely one.
  address?: string;
}

const initialState: PlayersState = { used: {} };

export default defineModule({
  id: 'players',
  persist: true,
  initialState,
  // The server is off after a launch: the codes would wait for it on the screen.
  init: (s) => (s.codes ? { ...s, codes: false } : s),
  actions: {
    showCodes(s, { on }: { on: boolean }) {
      return { ...s, codes: on };
    },
    setAddress(s, { address }: { address: string }) {
      return { ...s, address };
    },
    setUsed(s, { card, key, used }: { card: string; key: string; used: number }) {
      return { ...s, used: { ...s.used, [card]: { ...s.used[card], [key]: used } } };
    },
    reset(s, { card, keys }: { card: string; keys: string[] }) {
      return { ...s, used: { ...s.used, [card]: afterReset(s.used[card] ?? {}, keys) } };
    },
  },
});
