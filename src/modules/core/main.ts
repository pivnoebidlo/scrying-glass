// Общие настройки экрана игроков.
import { defineModule } from '../../shared/module';

export interface CoreState {
  blackout: boolean;
}

const initialState: CoreState = { blackout: false };

export default defineModule({
  id: 'core',
  persist: false,
  initialState,
  actions: {
    toggleBlackout: (s) => ({ ...s, blackout: !s.blackout }),
  },
});
