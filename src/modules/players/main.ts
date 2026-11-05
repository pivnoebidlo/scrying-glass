// The players' sheets in a browser: links and the server live in the core (main/players.ts); here — what the characters
// have spent at the table (shared/players.ts), by card. The GM's window and a phone both change it through these actions.
import { afterReset, type PlayerUsage } from '../../shared/players';
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
    reset(s, { card, keys }: { card: string; keys: string[] }) {
      return { ...s, used: { ...s.used, [card]: afterReset(s.used[card] ?? {}, keys) } };
    },
  },
});
