// Справочник: записи — файлы в хранилище и библиотеке (shared/compendium.ts), своего состояния нет.
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'compendium',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
