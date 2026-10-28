<!-- Settings → Community: «Browse» opens the catalog; the sources (the official repository — can be turned
     off; the GM's own repositories — added by address, turned off, removed); the author's name and key (save it to a
     file, load one); the admin's token of a repository the GM keeps. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { closeSettings } from '../../../renderer/lib/nav';
  import { shortKey, type SourceInfo } from '../../../shared/repo';
  import { checkOnLaunch, errorText, loadInfo, openRepo, repo, setCheckOnLaunch, sourceName } from './repo.svelte';

  // Standard module props; nothing here uses them.
  let {}: ModuleProps<'repo'> = $props();

  let name = $state('');
  let newName = $state('');
  let newUrl = $state('');
  let adding = $state(false);
  let adminSource = $state('');
  let adminToken = $state('');
  let error = $state('');
  let saved = $state('');
  // Which part the message is about: it shows right under it, not at the bottom of a long page.
  type Part = 'sources' | 'add' | 'name' | 'key' | 'admin';
  let at = $state<Part>('sources');
  onMount(async () => {
    await loadInfo();
    name = repo.info?.name ?? '';
  });

  function flash(text: string) {
    saved = text;
    setTimeout(() => saved === text && (saved = ''), 4000);
  }

  async function run(part: Part, fn: () => Promise<unknown>) {
    at = part;
    error = '';
    saved = '';
    try {
      await fn();
    } catch (e) {
      error = errorText(e);
    }
  }

  const browse = () => (closeSettings(), openRepo());
  const toggle = (s: SourceInfo, on: boolean) => run('sources', async () => (repo.info = await window.api.repoSetSourceOff(s.id, !on)));
  const remove = (s: SourceInfo) => confirm(t('repo.set.removeAsk', { name: sourceName(s) })) && run('sources', async () => (repo.info = await window.api.repoRemoveSource(s.id)));
  const add = () =>
    run('add', async () => {
      adding = true;
      try {
        repo.info = await window.api.repoAddSource(newName, newUrl);
        newName = newUrl = '';
        flash(t('repo.set.added'));
      } finally {
        adding = false;
      }
    });
  const repos = $derived((repo.info?.sources ?? []).filter((s) => s.kind === 'repo'));
  const admins = $derived(repos.filter((s) => s.admin));
  // The list starts on the first repository the GM isn't the admin of yet.
  $effect(() => {
    if (!repos.some((s) => s.id === adminSource)) adminSource = (repos.find((s) => !s.admin) ?? repos[0])?.id ?? '';
  });
  const becomeAdmin = () =>
    run('admin', async () => {
      repo.info = await window.api.repoSetAdmin(adminSource, adminToken);
      adminToken = '';
      flash(t('repo.set.adminSaved'));
    });
  const stopAdmin = (s: SourceInfo) => run('admin', async () => (repo.info = await window.api.repoSetAdmin(s.id, '')));
  const saveName = () => run('name', async () => ((repo.info = await window.api.setRepoName(name)), flash(t('repo.set.saved'))));
  const exportKey = () => run('key', async () => (await window.api.repoExportKey()) && ((repo.info = await window.api.repoInfo()), flash(t('repo.set.keySaved'))));
  const importKey = () =>
    run('key', async () => {
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

<label class="setting">
  <div class="info">
    <div class="name">{t('repo.set.checkUpdates')}</div>
    <div class="desc">{t('repo.set.checkUpdatesAbout')}</div>
  </div>
  <input type="checkbox" checked={checkOnLaunch()} onchange={(e) => setCheckOnLaunch(e.currentTarget.checked)} />
</label>

<h4>{t('repo.set.sources')}</h4>
{#each repo.info?.sources ?? [] as s (s.id)}
  <label class="setting">
    <div class="info">
      <div class="name">{sourceName(s)}</div>
      <!-- The official one goes without its address. -->
      <div class="desc">{#if s.official}{t('repo.set.officialAbout')}{:else}{t('repo.set.repoAbout')} <code>{s.url}</code>{/if}</div>
    </div>
    {#if !s.official}
      <button class="icon-btn" title={t('repo.set.remove')} onclick={(e) => (e.preventDefault(), remove(s))}><Trash2 size={14} /></button>
    {/if}
    <input type="checkbox" checked={!s.off} onchange={(e) => toggle(s, e.currentTarget.checked)} />
  </label>
{/each}

{@render status('sources')}

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
{@render status('add')}

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
{@render status('name')}

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
{@render status('key')}

<h4>{t('repo.set.adminTitle')}</h4>
<div class="setting">
  <div class="info">
    <div class="name">{t('repo.set.admin')}</div>
    <div class="desc">{t('repo.set.adminAbout')}</div>
  </div>
</div>
{#each admins as s (s.id)}
  <div class="row admin-on">
    <span>{t('repo.set.adminOn', { name: sourceName(s) })}</span>
    <button class="btn" onclick={() => stopAdmin(s)}>{t('repo.set.adminOff')}</button>
  </div>
{/each}
<form class="row" onsubmit={(e) => (e.preventDefault(), adminToken.trim() && becomeAdmin())}>
  {#if repos.length > 1}
    <select class="short" bind:value={adminSource}>{#each repos as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}</select>
  {/if}
  <input type="password" bind:value={adminToken} placeholder={t('repo.set.adminToken')} autocomplete="off" />
  <button class="btn" type="submit" disabled={!adminToken.trim()}>{t('repo.set.adminBtn')}</button>
</form>
{@render status('admin')}

{#snippet status(part: Part)}
  {#if at === part}{#if error}<p class="err">{error}</p>{:else if saved}<p class="faint">{saved}</p>{/if}{/if}
{/snippet}

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
  .row input.short,
  .row select.short {
    flex: 0 1 180px;
  }
  .admin-on {
    align-items: center;
    justify-content: space-between;
  }
  code {
    font-size: 11px;
    word-break: break-all;
  }
  .err {
    color: var(--danger);
  }
</style>
