// The adventure repository in the control window: the settings section and the publish / download dialogs (always
// there). The page itself is in Tools (tools/ui/registry), «Publish…» — in the adventure menu.
import { Globe } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Settings from './ui/Settings.svelte';
import Background from './ui/Background.svelte';

export default defineControl({
  id: 'repo',
  get title() {
    return t('repo.title');
  },
  icon: Globe,
  order: 96,
  settings: Settings,
  background: Background,
});
