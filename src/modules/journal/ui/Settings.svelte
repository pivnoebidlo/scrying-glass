<!-- Settings → Journal: the formatting toolbar over the Markdown editors (journal notes and compendium entries). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { editorPrefs, setToolbar } from '../../../renderer/lib/editorPrefs.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

  let {}: ModuleProps<'journal'> = $props();
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('journal.toolbarTitle')}</div>
    <div class="desc"><Lead text={t('journal.toolbarDesc')} /></div>
  </div>
  <input type="checkbox" checked={editorPrefs.toolbar} onchange={(e) => setToolbar(e.currentTarget.checked)} />
</div>
