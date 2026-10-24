// Adventure sources in the control window: the settings section («Adventure sources») and, always there, the catalog
// window, the publish and download dialogs. «Find adventures…» and «Publish…» are in the adventure menu.
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
  get settingsTitle() {
    return t('repo.sources');
  },
  order: 96,
  settings: Settings,
  background: Background,
});
