// Раздатка на экране игроков: картинка или записка поверх карты и портретов, пока мастер её не уберёт.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles } from '../../shared/vault';
import { isNotePath } from '../../shared/notes';
import { BUILTIN, type Entry } from '../../shared/compendium';
import { LIBRARY } from '../../shared/vault';
import { readNoteFile } from '../../main/notes';
import { isSketchPath } from '../../shared/sketch';
import { readSketchFile } from '../../main/sketches';
import type { HandoutsState } from './types';

// Записка у игроков — её содержимое с диска (перечитывается при каждом изменении файлов хранилища).
function withNote(s: HandoutsState, ctx: ModuleContext): HandoutsState {
  // Запись справочника у игроков — только пока показана именно она.
  if (s.entry && !s.current) s = { ...s, entry: null };
  const abs = s.current && isNotePath(s.current) ? ctx.vault.resolve(s.current) : null;
  const note = abs ? readNoteFile(abs) : null;
  // A canvas: the same (it changes while the GM draws — the file is reread after every line).
  const sAbs = s.current && isSketchPath(s.current) ? ctx.vault.resolve(s.current) : null;
  const sketch = sAbs ? readSketchFile(sAbs) : null;
  if (note === null && s.note === null && sketch === null && !s.sketch) return s;
  return { ...s, note, sketch };
}

// Если файл удалили из хранилища, убираем его с экрана.
function prune(s: HandoutsState, ctx: ModuleContext): HandoutsState {
  const tree = ctx.vault.tree;
  if (!tree || !s.current) return withNote(s, ctx);
  // Запись справочника из библиотеки — вне хранилища, её не проверяем.
  if ((s.current.startsWith(LIBRARY) || s.current.startsWith(BUILTIN)) && s.entry) return s;
  const exists = allFiles(tree).some((f) => f.path === s.current && (f.kind === 'image' || f.kind === 'note' || f.kind === 'sketch' || f.kind === 'entry'));
  return withNote(exists ? s : { ...s, current: null }, ctx);
}

const initialState: HandoutsState = { current: null, note: null };

export default defineModule({
  id: 'handouts',
  persist: true,
  initialState,

  init: prune,
  onTreeChange: prune,

  actions: {
    // Показать раздатку; та же самая — убрать.
    toggle(s, { path }: { path: string }, ctx) {
      return withNote({ ...s, current: s.current === path ? null : path, entry: null }, ctx);
    },

    // Запись справочника: показать (та же — убрать). Окно передаёт запись целиком.
    toggleEntry(s, { path, entry }: { path: string; entry: Entry }) {
      return s.current === path ? { ...s, current: null, entry: null, note: null, sketch: null } : { ...s, current: path, entry, note: null, sketch: null };
    },

    // Файл раздатки переименовали: показ остаётся (с той же запиской или записью).
    move(s, { from, to }: { from: string; to: string }) {
      return s.current === from ? { ...s, current: to } : s;
    },

    // Запись поправили, пока она у игроков, — обновить у них.
    updateEntry(s, { path, entry }: { path: string; entry: Entry }) {
      return s.current === path ? { ...s, entry } : s;
    },

    // Показать именно эту раздатку (null — убрать): так включаются сцены.
    set(s, { path }: { path: string | null }, ctx) {
      return withNote({ ...s, current: path, entry: path && path === s.current ? s.entry : null }, ctx);
    },

    clear(s) {
      return { ...s, current: null, note: null, sketch: null, entry: null };
    },
  },
});
