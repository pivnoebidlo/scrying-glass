// Портреты на экране игроков. Сами картинки лежат в хранилище, здесь только то, что на экране, и подписи.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles, isLibraryAsset } from '../../shared/vault';
import { DEFAULT_PLATE, PLATE_STYLES, type NamePlate, type PortraitsState } from './types';
import { NOTE_FONTS } from '../../shared/notes';

// Убирает с экрана картинки, которых больше нет в хранилище. Картинки библиотеки не проверяются: она не
// часть хранилища, а пропавший файл просто не покажется.
function prune(s: PortraitsState, ctx: ModuleContext): PortraitsState {
  const tree = ctx.vault.tree;
  if (!tree) return s;
  const exists = new Set(allFiles(tree, 'image').map((f) => f.path));
  const onScreen = s.onScreen.filter((p) => exists.has(p) || isLibraryAsset(p));
  return onScreen.length === s.onScreen.length ? s : { ...s, onScreen };
}

const initialState: PortraitsState = { onScreen: [], names: {}, showNames: true, unknown: [], plate: DEFAULT_PLATE };

export default defineModule({
  id: 'portraits',
  persist: true,
  initialState,

  // Older saves have no «unknown».
  init: (s, ctx) => prune(s.unknown ? s : { ...s, unknown: [] }, ctx),
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

    // The players don't know this character's name (or now they do).
    toggleUnknown(s, { path }: { path: string }) {
      const list = s.unknown ?? [];
      return { ...s, unknown: list.includes(path) ? list.filter((x) => x !== path) : [...list, path] };
    },

    setShowNames(s, { value }: { value: boolean }) {
      return { ...s, showNames: value };
    },

    // Вид подписи у игроков; неизвестные значения не принимаются.
    setPlate(s, plate: Partial<NamePlate>) {
      const next = { ...s.plate, ...plate };
      if (!(next.style in PLATE_STYLES)) next.style = s.plate.style;
      if (!/^#[0-9a-f]{6}$/i.test(next.color)) next.color = s.plate.color;
      if (next.font && !(next.font in NOTE_FONTS)) next.font = s.plate.font;
      return { ...s, plate: next };
    },
  },
});
