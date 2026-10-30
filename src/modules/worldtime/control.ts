// Time in the game world: a block in the right panel. Not in Mausritter adventures — they have their own exploration
// clock (turns, watches, days).
import { Hourglass } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import { mausHere } from '../mausritter/here';

export default defineControl({
  id: 'worldtime',
  get title() {
    return t('module.worldtime');
  },
  icon: Hourglass,
  order: 27,
  screen: OnScreen,
  screenWhen: (app) => !mausHere(app),
  // Not started yet — folded into one line; once it runs, the block stays open (the GM moves time all game long).
  screenEmpty: (app) => (app.worldtime.byAdventure[app.adventures.current ?? ''] ? null : t('worldtime.notStarted')),
});
