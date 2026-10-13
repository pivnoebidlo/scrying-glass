// Инициатива в окне управления: таблица боя, блок «чей ход» и кнопка «в инициативу» на картинках.
import { Swords, UserPlus } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import { caption } from '../portraits/library';
import { folderRole } from '../../shared/vault';
import { bestiary, connectCards } from '../bestiary/ui/cards.svelte';
import { addToInitiative } from '../bestiary/ui/combat';
import View from './ui/View.svelte';
import OnScreen from './ui/OnScreen.svelte';

export default defineControl({
  id: 'initiative',
  title: 'Инициатива',
  icon: Swords,
  order: 25,
  view: View,
  screen: OnScreen,
  screenEmpty: (app) =>
    app.initiative.combatants.some((c) => c.id === app.initiative.turn)
      ? null
      : app.initiative.combatants.length
        ? `бой не идёт (${app.initiative.combatants.length})`
        : 'бой не идёт',
  imageActions: [
    {
      id: 'initiative',
      title: 'Добавить в инициативу',
      badge: 'в бою',
      icon: UserPlus,
      active: (app, path) => app.initiative.combatants.some((c) => c.portrait === path),
      toggle: async (app, path) => {
        const c = app.initiative.combatants.find((x) => x.portrait === path);
        if (c) return dispatch('initiative', 'remove', { id: c.id });
        // У портрета есть карточка NPC — берём хиты, КД, инициативу и сторону из неё.
        await connectCards();
        const card = bestiary.cardFor(path);
        if (card) return addToInitiative(card);
        // Персонажи из папок партии (party / партия / игроки) — сторона «партия», остальные — противники.
        const party = path.split('/').some((p) => folderRole(p) === 'party');
        return dispatch('initiative', 'add', {
          c: { name: caption(app.portraits, path), portrait: path, side: party ? 'party' : 'enemy' },
        });
      },
    },
  ],
});
