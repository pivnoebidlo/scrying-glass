// Резервные копии в окне управления: раздел настроек со снимками.
import { ArchiveRestore } from '@lucide/svelte';
import { defineControl } from '../../renderer/lib/contrib';
import Settings from './ui/Settings.svelte';

export default defineControl({
  id: 'backup',
  title: 'Резервные копии',
  icon: ArchiveRestore,
  order: 90,
  settings: Settings,
});
