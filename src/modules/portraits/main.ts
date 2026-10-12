// Портреты на экране игроков. Сами картинки лежат в хранилище, здесь только то, что на экране, и подписи.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles, isLibraryAsset } from '../../shared/vault';
import type { PortraitsState } from './types';

// Убирает с экрана картинки, которых больше нет в хранилище. Картинки библиотеки не проверяются: она не
// часть хранилища, а пропавший файл просто не покажется.
function prune(s: PortraitsState, ctx: ModuleContext): PortraitsState {
  const tree = ctx.vault.tree;
  if (!tree) return s;
  const exists = new Set(allFiles(tree, 'image').map((f) => f.path));
  const onScreen = s.onScreen.filter((p) => exists.has(p) || isLibraryAsset(p));
  return onScreen.length === s.onScreen.length ? s : { ...s, onScreen };
}

const initialState: PortraitsState = { onScreen: [], names: {}, showNames: true };

export default defineModule({
  id: 'portraits',
  persist: true,
  initialState,

  init: prune,
  onTreeChange: prune,

  actions: {
    toggle(s, { path }: { path: string }) {
      const on = s.onScreen.includes(path);
      return { ...s, onScreen: on ? s.onScreen.filter((x) => x !== path) : [...s.onScreen, path] };
    },

    // Задать, кто на экране, целиком (например, при включении сцены).
    setOnScreen(s, { paths }: { paths: string[] }) {
      return { ...s, onScreen: [...new Set(paths)] };
    },

    clearScreen(s) {
      return { ...s, onScreen: [] };
    },

    // Подпись вручную. Пустая — убрать: подпись снова возьмётся из карточки или имени файла.
    rename(s, { path, name }: { path: string; name: string }) {
      const names = { ...s.names };
      if (name.trim()) names[path] = name.trim();
      else delete names[path];
      return { ...s, names };
    },

    setShowNames(s, { value }: { value: boolean }) {
      return { ...s, showNames: value };
    },
  },
});
