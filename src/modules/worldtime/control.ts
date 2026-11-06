// Time in the game world: a block in the right panel, for the systems that use it.
import { Hourglass } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import { usesHere } from '../../shared/adventures';

export default defineControl({
  id: 'worldtime',
  get title() {
    return t('module.worldtime');
  },
  icon: Hourglass,
  order: 27,
  screen: OnScreen,
  screenWhen: (app) => usesHere(app.adventures, 'worldtime'),
  // Not started yet — folded into one line; once it runs, the block stays open (the GM moves time all game long).
  screenEmpty: (app) => (app.worldtime.byAdventure[app.adventures.current ?? ''] ? null : t('worldtime.notStarted')),
});
