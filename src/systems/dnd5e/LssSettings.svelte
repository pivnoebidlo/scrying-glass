<!-- D&D in the Integrations settings: the GM's Long Story Short account and the spell table (number → name) for
     characters whose spellbook in LSS is kept as cards. Signed in, the import asks LSS for the numbers the table
     lacks itself (main/accounts.ts). -->
<script lang="ts">
  import HelpTip from '../../renderer/lib/HelpTip.svelte';
  import Lead from '../../renderer/lib/Lead.svelte';
  import { t, locale } from '../../renderer/lib/i18n.svelte';
  import { onMount } from 'svelte';
  import type { AccountStatus } from '../importer';
  import { lssImporter } from './importer';

  const id = lssImporter.id;
  let count = $state(0);
  let status = $state('');
  let account = $state<AccountStatus | null>(null);
  let busy = $state<'signIn' | 'fetch' | null>(null);
  const refresh = async () => (count = await window.api.importerTableSize(id));
  onMount(async () => {
    await refresh();
    account = await window.api.importerAccount(id);
  });

  const until = $derived(account?.until ? new Date(account.until).toLocaleDateString(locale.lang, { day: 'numeric', month: 'long' }) : '');
  const who = $derived(
    account?.signedIn
      ? [account.name ? t('best.lssAs', { name: account.name }) : t('best.lssIn'), until ? t('best.lssUntil', { date: until }) : ''].filter(Boolean).join(' ')
      : ''
  );

  const added = (r: { before: number; total: number; errors: string[] }) =>
    [t('best.lssAdded', { added: r.total - r.before, total: r.total }), ...r.errors].join(' ');

  async function signIn() {
    busy = 'signIn';
    try {
      account = await window.api.signInImporter(id);
    } finally {
      busy = null;
    }
  }
  async function signOut() {
    await window.api.signOutImporter(id);
    account = await window.api.importerAccount(id);
  }

  async function fetchAll() {
    busy = 'fetch';
    status = '';
    try {
      const r = await window.api.fetchImporterTable(id);
      if (r) status = added(r);
      await refresh();
    } finally {
      busy = null;
    }
  }

  async function clear() {
    if (!confirm(t('best.lssClear'))) return;
    await window.api.clearImporterTable(id);
    status = '';
    await refresh();
  }
</script>

<h3>Long Story Short</h3>
<div class="setting">
  <div class="info">
    <div class="name">{t('best.lssAccount')}</div>
    <div class="desc">
      {#if account?.signedIn}{who}{:else}<Lead text={t('best.lssAccountAbout')} />{/if}
    </div>
  </div>
  {#if account?.signedIn}
    <button class="btn" onclick={signOut}>{t('best.lssSignOut')}</button>
  {:else}
    <button class="btn primary" disabled={busy === 'signIn'} onclick={signIn}>{busy === 'signIn' ? t('best.lssSigningIn') : t('best.lssSignIn')}</button>
  {/if}
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('best.lssSpells')}</div>
    <div class="desc">
      {count ? t('best.lssLoaded', { count }) : t('best.lssNone')} <HelpTip text={t('best.lssAbout')} size={13} />
    </div>
    {#if status}<div class="desc status">{status}</div>{/if}
  </div>
  {#if count}<button class="btn" onclick={clear}>{t('best.clear')}</button>{/if}
  {#if account?.signedIn}
    <button class="btn primary" disabled={busy === 'fetch'} onclick={fetchAll}>{busy === 'fetch' ? t('best.lssFetching') : t('best.lssFetchAll')}</button>
  {/if}
</div>

<style>
  .status {
    color: var(--accent);
  }
</style>
