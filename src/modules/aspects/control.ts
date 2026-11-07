// Fate в окне управления: аспекты сцены и жетоны судьбы — блоком в правой панели, только в приключениях Fate.
import { Sparkles } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import { usesHere } from '../../shared/adventures';

export default defineControl({
  id: 'aspects',
  get title() {
    return t('module.aspects');
  },
  icon: Sparkles,
  order: 27,
  screen: OnScreen,
  screenWhen: (app) => usesHere(app.adventures, 'aspects'),
  screenEmpty: (app) => (app.aspects.aspects.length || app.aspects.holders.length ? null : t('empty.none')),
});
