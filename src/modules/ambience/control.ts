// Ambience in the control window: a block in the right panel between Music and Sounds.
import { Wind } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import OnScreen from './ui/OnScreen.svelte';

export default defineControl({
  id: 'ambience',
  get title() {
    return t('module.ambience');
  },
  icon: Wind,
  order: 20.5,
  screen: OnScreen,
  screenEmpty: (app) => (app.music.ambience.length || inTray(app, 'ambience') ? null : t('empty.none')),
});
