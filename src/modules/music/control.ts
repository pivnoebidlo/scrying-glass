// Музыка в окне управления: плейлисты, проигрыватель, кнопки у треков.
import { Music, Play, Wind } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import { dirname } from '../../shared/vault';
import Player from './ui/Player.svelte';
import MiniPlayer from './ui/MiniPlayer.svelte';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'music',
  get title() {
    return t('module.music');
  },
  icon: Music,
  order: 20,
  view: View,
  sidebar: Sidebar,
  screen: MiniPlayer,
  screenEmpty: (app) => (app.music.queue[app.music.index] || app.music.ambience.length || inTray(app, 'music') || inTray(app, 'ambience') ? null : t('empty.silence')),
  settings: Settings,
  background: Player,
  audioActions: [
    {
      id: 'play',
      get title() {
        return t('action.play');
      },
      badge: () => t('badge.playing'),
      icon: Play,
      active: (app, path) => app.music.playing && app.music.queue[app.music.index] === path,
      toggle: (app, path) =>
        app.music.queue[app.music.index] === path
          ? dispatch('music', 'playPause')
          : dispatch('music', 'playFolder', { folder: dirname(path), start: path }),
    },
    {
      id: 'ambient',
      get title() {
        return t('action.ambience');
      },
      badge: () => t('badge.ambience'),
      icon: Wind,
      active: (app, path) => app.music.ambience.some((a) => a.path === path),
      toggle: (_app, path) => dispatch('music', 'toggleAmbient', { path }),
    },
  ],
});
