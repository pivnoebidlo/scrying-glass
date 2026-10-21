// Mausritter in the control window: the exploration clock in the right panel (Mausritter adventures only);
// factions are a page in Tools.
import { Compass } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Clock from './ui/Clock.svelte';
import { mausHere } from './here';

export default defineControl({
  id: 'mausritter',
  get title() {
    return t('module.mausClock');
  },
  icon: Compass,
  order: 28,
  screen: Clock,
  screenWhen: mausHere,
});
