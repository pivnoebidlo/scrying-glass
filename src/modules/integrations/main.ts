// Integrations with other services: only a settings section; what is in it — the systems' (SystemUi.integrations;
// D&D: the Long Story Short account and spell table).
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'integrations',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
