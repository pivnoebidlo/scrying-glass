// Integrations in the control window: the settings section.
import { Cable } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'integrations',
  get title() {
    return t('module.integrations');
  },
  icon: Cable,
  order: 94,
  settings: Settings,
});
