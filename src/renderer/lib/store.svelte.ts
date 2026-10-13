// Состояние окна: копия состояния ядра, которая обновляется при каждом изменении.
import type { DisplayInfo } from '../../shared/api';
import type { AppState } from '../../shared/types';
import { setRoleNames } from '../../shared/vault';

class Store {
  // Снимок состояния ядра. Целиком заменяется при каждом изменении, поэтому без глубокой реактивности.
  state = $state.raw<AppState>(null!);
  displays = $state.raw<DisplayInfo[]>([]);
  displayOpen = $state(false);
}

export const store = new Store();

export const dispatch = window.api.dispatch;


// Загружает начальное состояние и подписывается на изменения. Вызывается до монтирования интерфейса.
export async function connect(opts: { displays?: boolean } = {}) {
  // Названия папок ролей нужны folderRole() и прочим функциям shared/vault.ts — ставим их до нового состояния.
  const apply = (s: AppState) => {
    setRoleNames(s.vault.roles);
    store.state = s;
  };
  window.api.onState(apply);
  apply(await window.api.getState());

  if (opts.displays) {
    const refresh = async () => (store.displays = await window.api.listDisplays());
    window.api.onDisplaysChanged(refresh);
    window.api.onDisplayStatus((open) => (store.displayOpen = open));
    await refresh();
    store.displayOpen = await window.api.getDisplayStatus();
  }
}
