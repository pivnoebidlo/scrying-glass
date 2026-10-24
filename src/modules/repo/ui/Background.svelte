<!-- Always there while a vault is open: the catalog window, the publish dialog, what the repository is doing (wherever it was started) and the question of a name for a downloaded adventure whose
     name is taken (an update offers to replace the old copy before that, see install()). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Catalog from './Catalog.svelte';
  import PublishDialog from './PublishDialog.svelte';
  import ReportDialog from './ReportDialog.svelte';
  import Busy from './Busy.svelte';
  import { cancelNaming, finishInstall, repo } from './repo.svelte';

  // Standard module props; nothing here uses them.
  let {}: ModuleProps<'repo'> = $props();

  let name = $state('');
  let free = $state(true);
  $effect(() => {
    if (repo.naming) name = repo.naming.suggestion;
  });
  $effect(() => {
    const n = name;
    if (!repo.naming) return;
    let stale = false;
    window.api.adventureNameFree(n).then((ok) => !stale && (free = ok));
    return () => (stale = true);
  });
</script>

{#if repo.browsing}<Catalog />{/if}
<PublishDialog />
<ReportDialog />
<Busy />

{#if repo.naming}
  {@const a = repo.naming}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && cancelNaming()}>
    <form class="modal" onsubmit={(e) => (e.preventDefault(), free && name.trim() && finishInstall(a.file, name, a.entry))}>
      <h3>{t('adv.exists', { name: a.name })}</h3>
      <p class="faint">{t('adv.renameAsk')}</p>
      <!-- svelte-ignore a11y_autofocus -->
      <input type="text" bind:value={name} autofocus />
      {#if !free && name.trim()}<p class="warn">{t('adv.taken')}</p>{/if}
      <div class="row">
        <button class="btn" type="button" onclick={cancelNaming}>{t('repo.cancel')}</button>
        <button class="btn primary" type="submit" disabled={!free || !name.trim()}>{t('adv.doImport')}</button>
      </div>
    </form>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(400px, 92vw);
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  h3,
  p {
    margin: 0;
  }
  h3 {
    font-size: 15px;
  }
  .warn {
    color: var(--warning);
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
