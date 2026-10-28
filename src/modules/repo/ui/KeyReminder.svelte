<!-- The author's key is only on this computer (no words written down, no file of it yet) and something is published
     with it: a plate in the corner — write down the recovery words, save it to a file, «it is kept already», or later (a few days; a new publish brings it back). Without the
     key, after a reinstall the GM can't update or remove what they published. -->
<script lang="ts">
  import { KeyRound, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { AppState } from '../../../shared/types';
  import { loadInfo, remindKey, repo } from './repo.svelte';

  let { app }: { app: AppState } = $props();

  onMount(() => {
    const timer = setTimeout(() => void (repo.info ? undefined : loadInfo().catch(() => undefined)), 8000);
    return () => clearTimeout(timer);
  });

  const LATER = 3 * 24 * 60 * 60 * 1000;
  const published = $derived(
    Object.keys(app.repo.published).length + Object.keys(repo.info?.systems.published ?? {}).length + Object.keys(repo.info?.bestiaries.published ?? {}).length > 0
  );
  const shown = $derived(!!repo.info?.author && !repo.info.keySaved && published && !repo.busy && !repo.browsing && !repo.words && repo.keyLater < Date.now());

  async function save() {
    if (await window.api.repoExportKey()) repo.info = await window.api.repoInfo();
  }
  async function kept() {
    repo.info = await window.api.repoKeyKept();
  }
</script>

{#if shown}
  <div class="notice" role="status">
    <div class="head">
      <KeyRound size={15} />
      <b>{t('repo.key.title')}</b>
      <button class="icon-btn" title={t('repo.key.later')} onclick={() => remindKey(Date.now() + LATER)}><X size={14} /></button>
    </div>
    <p>{t('repo.key.text')}</p>
    <div class="row">
      <button class="btn primary" onclick={() => (repo.words = 'show')}>{t('repo.set.showWords')}</button>
      <button class="btn" onclick={save}>{t('repo.set.exportKey')}</button>
      <button class="btn" onclick={kept}>{t('repo.key.kept')}</button>
      <button class="btn" onclick={() => remindKey(Date.now() + LATER)}>{t('repo.key.later')}</button>
    </div>
  </div>
{/if}

<style>
  .notice {
    position: fixed;
    -webkit-app-region: no-drag;
    /* Past the module strip: its settings button is in that corner. */
    left: 84px;
    bottom: 16px;
    z-index: 90;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(420px, calc(100vw - 100px));
    padding: 10px 12px 12px 14px;
    border: 1px solid var(--warning);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--warning);
  }
  .head b {
    flex: 1;
    color: var(--text-normal);
  }
  p {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
