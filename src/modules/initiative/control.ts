// Инициатива в окне управления: таблица боя, блок «чей ход» и кнопка «в инициативу» на картинках.
import { Swords, UserPlus } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import { prettyName } from '../../shared/vault';
import View from './ui/View.svelte';
import OnScreen from './ui/OnScreen.svelte';

export default defineControl({
  id: 'initiative',
  title: 'Инициатива',
  icon: Swords,
  order: 25,
  view: View,
  screen: OnScreen,
  imageActions: [
    {
      id: 'initiative',
      title: 'Добавить в инициативу',
      badge: 'в бою',
      icon: UserPlus,
      active: (app, path) => app.initiative.combatants.some((c) => c.portrait === path),
      toggle: (app, path) => {
        const c = app.initiative.combatants.find((x) => x.portrait === path);
        if (c) return dispatch('initiative', 'remove', { id: c.id });
        // Персонажи из папок партии (party / партия / игроки) — сторона «партия», остальные — противники.
        const party = path.split('/').some((p) => ['party', 'партия', 'игроки', 'pc'].includes(p.toLowerCase()));
        return dispatch('initiative', 'add', {
          c: { name: app.portraits.names[path] ?? prettyName(path), portrait: path, side: party ? 'party' : 'enemy' },
        });
      },
    },
  ],
});
