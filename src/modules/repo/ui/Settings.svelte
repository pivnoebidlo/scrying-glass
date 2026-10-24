<!-- Settings → Repository: which repository, the author's name, the author key (save it to a file, load one). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { DEFAULT_REPO_URL, shortKey } from '../../../shared/repo';
  import { errorText, loadCatalog, loadInfo, openRepo, repo } from './repo.svelte';

  // Standard module props; nothing here uses them.
  let {}: ModuleProps<'repo'> = $props();

  let url = $state('');
  let name = $state('');
  let error = $state('');
  let saved = $state('');
  onMount(async () => {
    await loadInfo();
    url = repo.info?.custom ? repo.info.url : '';
    name = repo.info?.name ?? '';
  });

  function flash(text: string) {
    saved = text;
    setTimeout(() => saved === text && (saved = ''), 4000);
  }

  async function save() {
    error = '';
    try {
      repo.info = await window.api.setRepoSettings({ url, name });
      repo.catalog = null;
      void loadCatalog();
      flash(t('repo.set.saved'));
    } catch (e) {
      error = errorText(e);
    }
  }

  async function exportKey() {
    error = '';
    try {
      if (await window.api.repoExportKey()) {
        repo.info = await window.api.repoInfo();
        flash(t('repo.set.keySaved'));
      }
    } catch (e) {
      error = errorText(e);
    }
  }

  async function importKey() {
    error = '';
    try {
      const info = await window.api.repoImportKey();
      if (info) {
        repo.info = info;
        flash(t('repo.set.keyLoaded'));
      }
    } catch (e) {
      error = errorText(e);
    }
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.url')}</div>
    <div class="desc">{DEFAULT_REPO_URL ? t('repo.set.urlAbout', { url: DEFAULT_REPO_URL }) : t('repo.set.urlAboutNone')}</div>
  </div>
</div>
<div class="row">
  <input type="text" bind:value={url} placeholder={DEFAULT_REPO_URL || 'https://…'} />
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.name')}</div>
    <div class="desc">{t('repo.set.nameAbout')}</div>
  </div>
</div>
<div class="row">
  <input type="text" bind:value={name} placeholder={t('repo.anonymous')} />
  <button class="btn primary" onclick={save}>{t('repo.set.save')}</button>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.key')}</div>
    <div class="desc">{t('repo.set.keyAbout')}</div>
    <div class="desc">
      {#if repo.info?.author}{t('repo.set.keyIs')} <code title={repo.info.author}>{shortKey(repo.info.author)}</code>{:else}{t('repo.set.noKey')}{/if}
    </div>
  </div>
</div>
<div class="row">
  <button class="btn" onclick={exportKey}>{t('repo.set.exportKey')}</button>
  <button class="btn" onclick={importKey}>{t('repo.set.importKey')}</button>
  <div class="spacer"></div>
  <button class="btn" onclick={openRepo}>{t('repo.set.open')}</button>
</div>
{#if error}<p class="err">{error}</p>{:else if saved}<p class="faint">{saved}</p>{/if}

<style>
  .row {
    display: flex;
    gap: 8px;
    margin: 4px 0 16px;
  }
  .row input {
    flex: 1;
    min-width: 0;
  }
  .spacer {
    flex: 1;
  }
  .err {
    color: var(--danger);
  }
</style>
