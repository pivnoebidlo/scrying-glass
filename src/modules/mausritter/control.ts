// The exploration clock in the right panel, for the systems that use it;
// factions are a page in Tools.
import { Compass } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Clock from './ui/Clock.svelte';
import { usesHere } from '../../shared/adventures';

export default defineControl({
  id: 'mausritter',
  get title() {
    return t('module.mausClock');
  },
  icon: Compass,
  order: 28,
  screen: Clock,
  screenWhen: (app) => usesHere(app.adventures, 'exploration'),
});
