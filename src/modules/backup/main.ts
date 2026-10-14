// Резервные копии: снимки данных приложения делает ядро (main/backups.ts), здесь — только раздел настроек.
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'backup',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
