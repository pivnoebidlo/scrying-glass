// Progress clocks in the control window: a block in the right panel — in Forged in the Dark adventures only (the
// system they come from; D&D, Fate and Mausritter have none).
import { CircleDashed } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import { fitdHere } from '../crew/here';

export default defineControl({
  id: 'clocks',
  get title() {
    return t('module.clocks');
  },
  icon: CircleDashed,
  order: 29,
  screen: OnScreen,
  screenWhen: fitdHere,
  screenEmpty: (app) => ((app.clocks.byAdventure[app.adventures.current ?? ''] ?? []).length ? null : t('empty.none')),
});
