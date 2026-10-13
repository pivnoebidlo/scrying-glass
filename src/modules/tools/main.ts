// Инструменты мастера: мастерская, где готовят материалы к игре (первый инструмент — записки). Своего
// состояния нет: записки — файлы в хранилище (shared/notes.ts), готовые показываются через «Раздатку».
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'tools',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
