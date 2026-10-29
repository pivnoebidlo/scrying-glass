<!-- A line where the built-in content of the adventure's system is missing (D&D without its SRD): download it here.
     The plugin names its official content (SystemPlugin.content); the entry is found in the official catalog. -->
<script lang="ts">
  import { Download, Package } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { familyOf } from '../../../systems';
  import { PLUGINS } from '../../../systems/plugins';
  import { installContent, loadCatalogs, officialContent, repo } from './repo.svelte';

  const family = $derived(familyOf(currentSystem(store.state.adventures)));
  const wanted = $derived(PLUGINS.find((p) => p.family === family)?.content ?? []);
  const missing = $derived(wanted.filter((id) => !store.state.vault.content.some((c) => c.id === id)));
  let failed = $state(false);

  async function get() {
    failed = false;
    await loadCatalogs();
    const list = officialContent(family);
    if (!list.length) return void (failed = true);
    for (const e of list) await installContent(e);
  }
</script>

{#if missing.length}
  <div class="hint">
    <Package size={13} />
    <span>{failed ? t('repo.contentNowhere') : t('repo.contentMissingHere')}</span>
    <button class="btn" disabled={!!repo.busy} onclick={get}><Download size={13} /> {t('repo.installContent')}</button>
  </div>
{/if}

<style>
  .hint {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0;
    padding: 6px 8px;
    border: 1px dashed var(--border);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .hint span {
    flex: 1;
    min-width: 120px;
  }
</style>
