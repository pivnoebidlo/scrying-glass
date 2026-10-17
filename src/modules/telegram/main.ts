// Telegram: the core talks to the GM's bot (main/telegram.ts); this module has no state of its own — only the settings
// section, the send dialog and the "Telegram" button on pictures (control.ts).
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'telegram',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
