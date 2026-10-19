// The schedule in the control window: the next game in the right panel (with «Start»); the page itself is in Tools.
import { CalendarClock } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Load from './ui/Load.svelte';
import NextGame from './ui/NextGame.svelte';
import { next } from './ui/store.svelte';

export default defineControl({
  id: 'schedule',
  get title() {
    return t('sched.next');
  },
  icon: CalendarClock,
  // Below the journal's pinned note: preparation, not what the players see.
  order: 29,
  screen: NextGame,
  background: Load,
  screenEmpty: () => (next() ? null : t('sched.empty')),
});
