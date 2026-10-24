<!-- New versions of what this vault downloaded from the Community, found on launch: a small plate in the corner —
     look (the catalog on «Updates») or close; either way these versions aren't announced again. -->
<script lang="ts">
  import { Download, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { checkUpdates, openRepo, repo, updatesSeen } from './repo.svelte';

  // A while after launch: the vault and its state are there, the start isn't slowed down.
  onMount(() => {
    const timer = setTimeout(() => void checkUpdates().catch(() => undefined), 6000);
    return () => clearTimeout(timer);
  });

  const shown = $derived(repo.updates.slice(0, 3));
  const look = () => (updatesSeen(), openRepo('updates'));
</script>

{#if repo.updates.length && !repo.browsing}
  <div class="notice" role="status">
    <div class="head">
      <b>{t('repo.updates.title')}</b>
      <button class="icon-btn" title={t('repo.close')} onclick={updatesSeen}><X size={14} /></button>
    </div>
    <ul>
      {#each shown as u (u.folder)}
        <li>{t('repo.updates.item', { name: u.entry.title, n: u.entry.version })}</li>
      {/each}
      {#if repo.updates.length > shown.length}<li class="faint">{t('repo.updates.more', { count: repo.updates.length - shown.length })}</li>{/if}
    </ul>
    <button class="btn primary" onclick={look}><Download size={14} /> {t('repo.updates.look')}</button>
  </div>
{/if}

<style>
  .notice {
    position: fixed;
    -webkit-app-region: no-drag;
    right: 16px;
    bottom: 16px;
    z-index: 90;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(340px, calc(100vw - 32px));
    padding: 10px 12px 12px 14px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  ul {
    margin: 0;
    padding-left: 18px;
  }
  .btn {
    align-self: flex-start;
  }
</style>
