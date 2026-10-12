// Сцена, открытая в редакторе.
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { capture, suggestName } from '../apply';

export const ui = $state({ selected: null as string | null });

// Сохранить то, что сейчас на экране, новой сценой и открыть её в редакторе.
export async function saveCurrent() {
  const app = store.state;
  const content = capture(app);
  const s = await dispatch('scenes', 'create', {
    name: suggestName(content, app.scenes.scenes.length),
    content,
    adventure: app.adventures.current,
  });
  ui.selected = s.scenes.scenes.at(-1)?.id ?? null;
}
