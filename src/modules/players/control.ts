// Players' sheets in the control window: a block of the right panel, the QR window (always there).
import { Smartphone } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import OnScreen from './ui/OnScreen.svelte';
import Background from './ui/Background.svelte';
import { players } from './ui/players.svelte';

export default defineControl({
  id: 'players',
  optional: true,
  get title() {
    return t('pl.title');
  },
  icon: Smartphone,
  order: 90,
  screen: OnScreen,
  screenEmpty: () => (players.status.party.length ? null : t('pl.noParty')),
  background: Background,
});
