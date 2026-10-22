// Forged in the Dark in the control window: the crew in the right panel (FitD adventures only); the full sheet is
// a page in Tools.
import { Swords } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Panel from './ui/Panel.svelte';
import { fitdHere } from './here';

export default defineControl({
  id: 'crew',
  get title() {
    return t('module.crew');
  },
  icon: Swords,
  order: 29,
  screen: Panel,
  screenWhen: fitdHere,
});
