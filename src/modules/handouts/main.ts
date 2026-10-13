// Раздатка на экране игроков: картинка поверх карты и портретов, пока мастер её не уберёт.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles } from '../../shared/vault';
import type { HandoutsState } from './types';

// Если файл удалили из хранилища, убираем его с экрана.
function prune(s: HandoutsState, ctx: ModuleContext): HandoutsState {
  const tree = ctx.vault.tree;
  if (!tree || !s.current) return s;
  return allFiles(tree, 'image').some((f) => f.path === s.current) ? s : { ...s, current: null };
}

const initialState: HandoutsState = { current: null };

export default defineModule({
  id: 'handouts',
  persist: true,
  initialState,

  init: prune,
  onTreeChange: prune,

  actions: {
    // Показать раздатку; та же самая — убрать.
    toggle(s, { path }: { path: string }) {
      return { ...s, current: s.current === path ? null : path };
    },

    clear(s) {
      return { ...s, current: null };
    },
  },
});
