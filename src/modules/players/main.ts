// The players' sheets in a browser: links and the server live in the core (main/players.ts); here — what the characters
// have spent at the table (shared/players.ts), by card. The GM's window and a phone both change it through these actions.
import type { PlayerUsage } from '../../shared/players';
import { defineModule } from '../../shared/module';

export interface PlayersState {
  used: Record<string, PlayerUsage>;
}

const initialState: PlayersState = { used: {} };

export default defineModule({
  id: 'players',
  persist: true,
  initialState,
  actions: {
    setUsed(s, { card, key, used }: { card: string; key: string; used: number }) {
      const next = { ...s.used[card] };
      if (used > 0) next[key] = used;
      else delete next[key];
      return { ...s, used: { ...s.used, [card]: next } };
    },
    rest(s, { card }: { card: string }) {
      const { [card]: _gone, ...rest } = s.used;
      return { ...s, used: rest };
    },
  },
});
