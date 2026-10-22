// Progress clocks in the control window: a block in the right panel (any system).
import { CircleDashed } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';

export default defineControl({
  id: 'clocks',
  get title() {
    return t('module.clocks');
  },
  icon: CircleDashed,
  order: 29,
  screen: OnScreen,
  screenEmpty: (app) => ((app.clocks.byAdventure[app.adventures.current ?? ''] ?? []).length ? null : t('empty.none')),
});
