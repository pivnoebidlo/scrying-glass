// Музыка в окне управления: плейлисты, проигрыватель, кнопки у треков.
import { Music, Play, Wind } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { dispatch } from '../../renderer/lib/store.svelte';
import { dirname } from '../../shared/vault';
import Player from './ui/Player.svelte';
import MiniPlayer from './ui/MiniPlayer.svelte';
import Sidebar from './ui/Sidebar.svelte';
import View from './ui/View.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'music',
  title: 'Музыка',
  icon: Music,
  order: 20,
  view: View,
  sidebar: Sidebar,
  screen: MiniPlayer,
  screenEmpty: (app) => (app.music.queue[app.music.index] || app.music.ambience.length ? null : 'тишина'),
  settings: Settings,
  background: Player,
  audioActions: [
    {
      id: 'play',
      title: 'Играть (вместе с остальными треками папки)',
      badge: 'играет',
      icon: Play,
      active: (app, path) => app.music.playing && app.music.queue[app.music.index] === path,
      toggle: (app, path) =>
        app.music.queue[app.music.index] === path
          ? dispatch('music', 'playPause')
          : dispatch('music', 'playFolder', { folder: dirname(path), start: path }),
    },
    {
      id: 'ambient',
      title: 'Атмосфера: зациклить поверх музыки',
      badge: 'атмосфера',
      icon: Wind,
      active: (app, path) => app.music.ambience.some((a) => a.path === path),
      toggle: (_app, path) => dispatch('music', 'toggleAmbient', { path }),
    },
  ],
});
