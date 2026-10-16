// Fate в окне управления: аспекты сцены и жетоны судьбы — блоком в правой панели, только в приключениях Fate.
import { Sparkles } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import { fateHere } from './here';

export default defineControl({
  id: 'fate',
  get title() {
    return t('module.fate');
  },
  icon: Sparkles,
  order: 27,
  screen: OnScreen,
  screenWhen: fateHere,
  screenEmpty: (app) => (app.fate.aspects.length || app.fate.holders.length ? null : t('empty.none')),
});
