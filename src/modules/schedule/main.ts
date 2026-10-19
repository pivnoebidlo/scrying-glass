// The game schedule: kept by the core in <userData>/schedule.json, common to all vaults (main/schedule.ts); this
// module has no state of its own — the Tools page and the right panel's next game (control.ts).
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'schedule',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
