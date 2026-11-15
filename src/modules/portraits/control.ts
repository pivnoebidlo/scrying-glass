// Персонажи (портреты) в окне управления.
import { QrCode, User, Users } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { inTray } from '../scenes/tray';
import { dispatch } from '../../renderer/lib/store.svelte';
import { refKey, sameRef } from '../../shared/cards';
import { bestiary } from '../bestiary/ui/cards.svelte';
import { players } from '../players/ui/players.svelte';
import View from './ui/View.svelte';
import Sidebar from './ui/Sidebar.svelte';
import OnScreen from './ui/OnScreen.svelte';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'portraits',
  optional: true,
  get title() {
    return t('module.portraits');
  },
  icon: Users,
  order: 10,
  view: View,
  sidebar: Sidebar,
  screen: OnScreen,
  screenEmpty: (app) => (app.portraits.onScreen.length || inTray(app, 'portraits') ? null : t('empty.nobody')),
  settings: Settings,
  imageActions: [
    {
      id: 'portrait',
      get title() {
        return t('action.portrait');
      },
      get tip() {
        return { off: t('action.portrait.off'), on: t('action.portrait.on') };
      },
      badge: () => t('badge.portrait'),
      icon: User,
      active: (app, path) => app.portraits.onScreen.includes(path),
      toggle: (_app, path) => dispatch('portraits', 'toggle', { path }),
    },
    {
      id: 'player-qr',
      get title() {
        return t('pl.showQr');
      },
      badge: () => '',
      icon: QrCode,
      visible(_app, path) {
        const card = bestiary.cardFor(path);
        if (!card || card.kind !== 'character') return false;
        return players.status.party.some((r) => sameRef(r.ref, card.ref));
      },
      active(_app, path) {
        const card = bestiary.cardFor(path);
        if (!card) return false;
        return players.qr === refKey(card.ref);
      },
      toggle(_app, path) {
        const card = bestiary.cardFor(path);
        if (!card) return;
        const row = players.status.party.find((r) => sameRef(r.ref, card.ref));
        if (row) void players.show(row);
      },
    },
  ],
});
