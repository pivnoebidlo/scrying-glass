// Состояние окна: копия состояния ядра, которая обновляется при каждом изменении.
import type { DisplayInfo } from '../../shared/api';
import type { AppState } from '../../shared/types';
import { setRoleNames } from '../../shared/vault';
import { setSystemsOff } from '../../systems';
import { applyLang } from './i18n.svelte';

class Store {
  // Снимок состояния ядра. Целиком заменяется при каждом изменении, поэтому без глубокой реактивности.
  state = $state.raw<AppState>(null!);
  displays = $state.raw<DisplayInfo[]>([]);
  displayOpen = $state(false);
}

export const store = new Store();

export const dispatch = window.api.dispatch;


// The control window's theme: <html data-theme>, read by renderer/lib/theme.css; remembered by the window so the
// next launch starts in it before the state arrives (control/main.ts).
export function applyTheme(theme: string) {
  document.documentElement.dataset['theme'] = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* not remembered — the state sets it a moment later */
  }
  titleBarColors();
}

// The system buttons over the corner of the window (Windows, Linux: window.api.frame 'overlay') take the colours of
// the theme — sent when they change (the state comes after every action), and when the system theme does («auto»).
let sentColors = '';
function titleBarColors() {
  if (window.api.frame !== 'overlay') return;
  const css = getComputedStyle(document.documentElement);
  const colors = { color: css.getPropertyValue('--bg-secondary').trim(), symbolColor: css.getPropertyValue('--text-normal').trim() };
  const key = `${colors.color} ${colors.symbolColor}`;
  if (key === sentColors || !colors.color) return;
  sentColors = key;
  window.api.setTitleBarColors(colors);
}
if (typeof window !== 'undefined' && window.matchMedia)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => titleBarColors());

// Загружает начальное состояние и подписывается на изменения. Вызывается до монтирования интерфейса.
export async function connect(opts: { displays?: boolean } = {}) {
  // Названия папок ролей нужны folderRole() и прочим функциям shared/vault.ts — ставим их до нового состояния.
  const apply = (s: AppState) => {
    setRoleNames(s.vault.roles);
    setSystemsOff(s.vault.systemsOff);
    applyLang(s.vault.lang);
    applyTheme(s.vault.theme);
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
