// Инструменты в окне управления: список инструментов слева, открытый инструмент во вкладке.
import { Brush, Hammer } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';
import Settings from './ui/Settings.svelte';
import { createSketch, imageAspect } from '../../renderer/lib/sketch/sketches.svelte';
import { editNote } from './ui/ui.svelte';
import { newSketch } from '../../shared/sketch';
import { assetUrl, prettyName } from '../../shared/vault';
import { store } from '../../renderer/lib/store.svelte';

export default defineControl({
  id: 'tools',
  get title() {
    return t('module.tools');
  },
  icon: Hammer,
  // В полосе модулей — последним: это подготовка к игре, а не то, что нажимают во время неё.
  order: 40,
  view: View,
  sidebar: Sidebar,
  settings: Settings,
  // «Draw over it»: a new canvas over this picture (in the handouts of the current adventure), opened in the editor.
  imageActions: [
    {
      id: 'sketch',
      get title() {
        return t('sketch.drawOver');
      },
      get tip() {
        return { off: t('sketch.drawOverShort'), on: t('sketch.drawOverShort') };
      },
      badge: '',
      icon: Brush,
      active: () => false,
      toggle: async (_app, path) => {
        const app = store.state;
        const sketch = newSketch({ kind: 'image', path }, await imageAspect(assetUrl(path)));
        const made = await createSketch(app.vault.tree, app.adventures, prettyName(path), sketch);
        if (made) editNote(made);
      },
    },
  ],
});
