<!-- Settings → Adventure sources: «Browse» opens the catalog; the sources (the official repository — can be turned
     off; the GM's own repositories — added by address, turned off, removed); the author's name and key (save it to a
     file, load one). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { closeSettings } from '../../../renderer/lib/nav';
  import { shortKey, type SourceInfo } from '../../../shared/repo';
  import { errorText, loadInfo, openRepo, repo, sourceName } from './repo.svelte';

  // Standard module props; nothing here uses them.
  let {}: ModuleProps<'repo'> = $props();

  let name = $state('');
  let newName = $state('');
  let newUrl = $state('');
  let adding = $state(false);
  let error = $state('');
  let saved = $state('');
  onMount(async () => {
    await loadInfo();
    name = repo.info?.name ?? '';
  });

  function flash(text: string) {
    saved = text;
    setTimeout(() => saved === text && (saved = ''), 4000);
  }

  async function run(fn: () => Promise<unknown>) {
    error = '';
    try {
      await fn();
    } catch (e) {
      error = errorText(e);
    }
  }

  const browse = () => (closeSettings(), openRepo());
  const toggle = (s: SourceInfo, on: boolean) => run(async () => (repo.info = await window.api.repoSetSourceOff(s.id, !on)));
  const remove = (s: SourceInfo) => confirm(t('repo.set.removeAsk', { name: sourceName(s) })) && run(async () => (repo.info = await window.api.repoRemoveSource(s.id)));
  const add = () =>
    run(async () => {
      adding = true;
      try {
        repo.info = await window.api.repoAddSource(newName, newUrl);
        newName = newUrl = '';
        flash(t('repo.set.added'));
      } finally {
        adding = false;
      }
    });
  const saveName = () => run(async () => ((repo.info = await window.api.setRepoName(name)), flash(t('repo.set.saved'))));
  const exportKey = () => run(async () => (await window.api.repoExportKey()) && ((repo.info = await window.api.repoInfo()), flash(t('repo.set.keySaved'))));
  const importKey = () =>
    run(async () => {
      const info = await window.api.repoImportKey();
      if (info) (repo.info = info), flash(t('repo.set.keyLoaded'));
    });
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.browse')}</div>
    <div class="desc">{t('repo.set.browseAbout')}</div>
  </div>
  <button class="btn primary" onclick={browse}><Globe size={14} /> {t('repo.set.browseBtn')}</button>
</div>

<h4>{t('repo.set.sources')}</h4>
{#each repo.info?.sources ?? [] as s (s.id)}
  <label class="setting">
    <div class="info">
      <div class="name">{sourceName(s)}</div>
      <div class="desc">{s.official ? t('repo.set.officialAbout') : t('repo.set.repoAbout')} <code>{s.url}</code></div>
    </div>
    {#if !s.official}
      <button class="icon-btn" title={t('repo.set.remove')} onclick={(e) => (e.preventDefault(), remove(s))}><Trash2 size={14} /></button>
    {/if}
    <input type="checkbox" checked={!s.off} onchange={(e) => toggle(s, e.currentTarget.checked)} />
  </label>
{/each}

<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.add')}</div>
    <div class="desc">{t('repo.set.addAbout')}</div>
  </div>
</div>
<form class="row" onsubmit={(e) => (e.preventDefault(), newUrl.trim() && add())}>
  <input class="short" type="text" bind:value={newName} placeholder={t('repo.set.addName')} />
  <input type="text" bind:value={newUrl} placeholder="https://…" />
  <button class="btn" type="submit" disabled={!newUrl.trim() || adding}>{adding ? t('repo.set.checking') : t('repo.set.addBtn')}</button>
</form>

<h4>{t('repo.set.authorTitle')}</h4>
<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.name')}</div>
    <div class="desc">{t('repo.set.nameAbout')}</div>
  </div>
</div>
<form class="row" onsubmit={(e) => (e.preventDefault(), saveName())}>
  <input type="text" bind:value={name} placeholder={t('repo.anonymous')} />
  <button class="btn" type="submit">{t('repo.set.save')}</button>
</form>

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
</div>
{#if error}<p class="err">{error}</p>{:else if saved}<p class="faint">{saved}</p>{/if}

<style>
  h4 {
    margin: 18px 0 4px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  label.setting {
    cursor: pointer;
  }
  .row {
    display: flex;
    gap: 8px;
    margin: 4px 0 16px;
  }
  .row input {
    flex: 1;
    min-width: 0;
  }
  .row input.short {
    flex: 0 1 180px;
  }
  code {
    font-size: 11px;
    word-break: break-all;
  }
  .err {
    color: var(--danger);
  }
</style>
