// Фон экрана игроков: картинка на весь экран. Лежит под портретами.
import { defineModule, type ModuleContext } from '../../shared/module';
import { allFiles } from '../../shared/vault';
import type { Fit, SceneState } from './types';

// Если файл фона удалили из хранилища, убираем фон.
function prune(s: SceneState, ctx: ModuleContext): SceneState {
  const tree = ctx.vault.tree;
  if (!tree || !s.background) return s;
  return allFiles(tree, 'image').some((f) => f.path === s.background) ? s : { ...s, background: null };
}

const initialState: SceneState = { background: null, fit: 'contain', dim: true };

export default defineModule({
  id: 'scene',
  persist: true,
  initialState,

  init: prune,
  onTreeChange: prune,

  actions: {
    show(s, { path }: { path: string }) {
      return { ...s, background: path };
    },

    clear(s) {
      return { ...s, background: null };
    },

    setFit(s, { fit }: { fit: Fit }) {
      return { ...s, fit };
    },

    setDim(s, { value }: { value: boolean }) {
      return { ...s, dim: value };
    },
  },
});
