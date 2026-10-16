// Резервные копии в окне управления: раздел настроек со снимками.
import { ArchiveRestore } from '@lucide/svelte';
import { t } from '../../renderer/lib/i18n.svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'backup',
  get title() {
    return t('module.backup');
  },
  icon: ArchiveRestore,
  order: 90,
  settings: Settings,
});
