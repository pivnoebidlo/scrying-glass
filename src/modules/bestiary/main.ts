// Бестиарий: монстры и NPC из встроенного SRD, библиотеки и хранилища. Сами карточки хранит ядро отдельно
// от общего состояния (src/main/cards.ts), окна запрашивают их через window.api. Своё состояние модулю пока не нужно.
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'bestiary',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
