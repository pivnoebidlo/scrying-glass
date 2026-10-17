<!-- A newer version on GitHub (found on launch, if the check is on): a small banner at the top of the window —
     download (the release page), skip this version, or close until the next launch. -->
<script lang="ts">
  import { Download, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { UpdateInfo } from '../../shared/updates';
  import { t } from '../lib/i18n.svelte';

  let info = $state<UpdateInfo | null>(null);
  onMount(() => window.api.onUpdateAvailable((i) => (info = i)));

  async function skip() {
    if (info?.latest) await window.api.setUpdateSettings({ skip: info.latest });
    info = null;
  }
</script>

{#if info?.latest}
  <div class="banner" role="status">
    <span>{t('updates.available', { version: info.latest, current: info.current })}</span>
    <button class="btn primary" onclick={() => info && window.api.openRelease(info.url)}><Download size={14} /> {t('updates.download')}</button>
    <button class="btn" onclick={skip}>{t('updates.skip')}</button>
    <button class="icon-btn" title={t('updates.later')} onclick={() => (info = null)}><X size={14} /></button>
  </div>
{/if}

<style>
  .banner {
    position: fixed;
    top: 10px;
    left: 50%;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px 8px 14px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
    transform: translateX(-50%);
    white-space: nowrap;
  }
</style>
