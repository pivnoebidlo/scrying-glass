// Сцена, открытая в редакторе.
import { currentTray } from '../tray';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { capture, suggestName } from '../apply';

export const ui = $state({ selected: null as string | null });

// Название новой сцены по тому, что на экране и в подборке.
export function suggestCurrent(): string {
  const app = store.state;
  return suggestName(capture(app), app.scenes.scenes.length, currentTray(app.scenes, app.adventures));
}

// Сохранить то, что сейчас на экране, и подборку новой сценой. edit — открыть её в редакторе (из правой панели — нет:
// там идёт игра).
export async function saveCurrent(name?: string, edit = true) {
  const app = store.state;
  const content = capture(app);
  // Что накидано в правую панель — тоже в сцену.
  const tray = $state.snapshot(currentTray(app.scenes, app.adventures));
  const s = await dispatch('scenes', 'create', {
    name: name?.trim() || suggestName(content, app.scenes.scenes.length, tray),
    content,
    adventure: app.adventures.current,
    tray,
  });
  if (edit) ui.selected = s.scenes.scenes.at(-1)?.id ?? null;
}
