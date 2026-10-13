// Раздатка на экране игроков: картинка или записка поверх карты и портретов, пока мастер её не уберёт.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles } from '../../shared/vault';
import { isNotePath } from '../../shared/notes';
import { readNoteFile } from '../../main/notes';
import type { HandoutsState } from './types';

// Записка у игроков — её содержимое с диска (перечитывается при каждом изменении файлов хранилища).
function withNote(s: HandoutsState, ctx: ModuleContext): HandoutsState {
  const abs = s.current && isNotePath(s.current) ? ctx.vault.resolve(s.current) : null;
  const note = abs ? readNoteFile(abs) : null;
  return note === null && s.note === null ? s : { ...s, note };
}

// Если файл удалили из хранилища, убираем его с экрана.
function prune(s: HandoutsState, ctx: ModuleContext): HandoutsState {
  const tree = ctx.vault.tree;
  if (!tree || !s.current) return withNote(s, ctx);
  const exists = allFiles(tree).some((f) => f.path === s.current && (f.kind === 'image' || f.kind === 'note'));
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
      return withNote({ ...s, current: s.current === path ? null : path }, ctx);
    },

    // Показать именно эту раздатку (null — убрать): так включаются сцены.
    set(s, { path }: { path: string | null }, ctx) {
      return withNote({ ...s, current: path }, ctx);
    },

    clear(s) {
      return { ...s, current: null, note: null };
    },
  },
});
