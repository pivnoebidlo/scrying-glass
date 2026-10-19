// Telegram in the control window: the settings section, the send dialog and the toast of new messages (always there)
// and the "Telegram" button on pictures — only once a bot is set up and a chat is on.
import { Send } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import { prettyName } from '../../shared/vault';
import Settings from './ui/Settings.svelte';
import Background from './ui/Background.svelte';
import { sendToTelegram, tgReady } from './ui/tg.svelte';

export default defineControl({
  id: 'telegram',
  get title() {
    return t('tg.title');
  },
  icon: Send,
  order: 95,
  settings: Settings,
  background: Background,
  imageActions: [
    {
      id: 'telegram',
      get title() {
        return t('tg.send');
      },
      get tip() {
        return { off: t('tg.sendShort'), on: t('tg.sendShort') };
      },
      badge: '',
      icon: Send,
      active: () => false,
      visible: () => tgReady(),
      toggle: (_app, path) => sendToTelegram({ kind: 'file', path, title: prettyName(path) }),
    },
  ],
});
