<!-- D&D in the Cards settings: the spell table of Long Story Short (number → name) for characters whose spellbook in
     LSS is kept as cards. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import { lssImporter } from './importer';

  const id = lssImporter.id;
  let count = $state(0);
  let status = $state('');
  const refresh = async () => (count = await window.api.importerTableSize(id));
  onMount(refresh);

  async function load() {
    const r = await window.api.fillImporterTable(id);
    if (!r) return;
    status = [t('best.lssAdded', { added: r.total - r.before, total: r.total }), ...r.errors].join(' ');
    await refresh();
  }

  async function clear() {
    if (!confirm(t('best.lssClear'))) return;
    await window.api.clearImporterTable(id);
    status = '';
    await refresh();
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('best.lssSpells')}</div>
    <div class="desc">
      {count ? t('best.lssLoaded', { count }) : t('best.lssNone')} {t('best.lssAbout')}
    </div>
    {#if status}<div class="desc status">{status}</div>{/if}
  </div>
  {#if count}<button class="btn" onclick={clear}>{t('best.clear')}</button>{/if}
  <button class="btn primary" onclick={load}>{t('best.loadFiles')}</button>
</div>

<style>
  .status {
    color: var(--accent);
  }
</style>
