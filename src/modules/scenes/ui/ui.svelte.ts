// Сцена, открытая в редакторе.
import { t } from '../../../renderer/lib/i18n.svelte';
import { currentTray } from '../tray';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { capture, suggestName } from '../apply';

export const ui = $state({ selected: null as string | null });

// Новая пустая сцена: ничего не меняет на экране (все части выключены), подборка пустая. Включается сразу —
// в правой панели её подборка, можно накидывать. Открывается в редакторе.
export async function createEmpty() {
  const app = store.state;
  const none = { path: null };
  const s = await dispatch('scenes', 'create', {
    name: t('scenes.defaultName', { n: app.scenes.scenes.length + 1 }),
    content: {
      background: { path: null, fit: app.scene.fit },
      map: none,
      portraits: { paths: [] },
      handout: none,
      music: { playlist: null, shuffle: app.music.shuffle },
      ambience: { loops: [] },
    },
    adventure: app.adventures.current,
    include: { background: false, map: false, portraits: false, handout: false, music: false, ambience: false },
  });
  ui.selected = s.scenes.scenes.at(-1)?.id ?? null;
}

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
