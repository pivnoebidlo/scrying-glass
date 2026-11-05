// The players' sheets in a browser: no state of its own — links and the server live in the core (main/players.ts).
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'players',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
