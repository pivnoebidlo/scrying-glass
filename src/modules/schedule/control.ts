// The schedule in the control window: the page itself is in Tools (with «Start game»); no block in the right panel —
// during a game the GM doesn't need the next one.
import { CalendarClock } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Load from './ui/Load.svelte';

export default defineControl({
  id: 'schedule',
  get title() {
    return t('sched.next');
  },
  icon: CalendarClock,
  background: Load,
});
