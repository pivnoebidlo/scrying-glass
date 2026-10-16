// Звуки в окне управления: блок в правой панели, проигрыватель и кнопка «сыграть звуком» у аудиофайлов.
import { AudioLines } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import { inTray } from '../scenes/tray';
import OnScreen from './ui/OnScreen.svelte';
import Sfx from './ui/Sfx.svelte';
import { sfx } from './ui/playing.svelte';

export default defineControl({
  id: 'sounds',
  get title() {
    return t('module.sounds');
  },
  icon: AudioLines,
  // В правой панели — сразу после музыки.
  order: 21,
  screen: OnScreen,
  screenEmpty: (app) => (inTray(app, 'sounds') ? null : t('empty.none')),
  background: Sfx,
  audioActions: [
    {
      id: 'sound',
      get title() {
        return t('action.sound');
      },
      badge: () => t('badge.sounding'),
      icon: AudioLines,
      active: (_app, path) => sfx.playing.includes(path),
      toggle: (_app, path) => dispatch('sounds', 'play', { path }),
    },
  ],
});
