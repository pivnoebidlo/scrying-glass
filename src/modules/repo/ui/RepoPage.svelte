<!-- Tools → Repository: adventures other GMs published — search, system and language, download or update; the
     GM's own ones — take them off. Publishing is in the adventure menu (Switcher) and here, from the current one. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { CloudUpload, Download, ImageOff, RefreshCw, Settings, Trash2 } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { store } from '../../../renderer/lib/store.svelte';
  import { openSettings } from '../../../renderer/lib/nav';
  import { enabledSystems, systems } from '../../../systems';
  import { LANGS } from '../../../shared/i18n/core';
  import { matchesQuery, shortKey, type RepoEntry } from '../../../shared/repo';
  import { coverOf, install, installedFolder, loadCatalog, mb, repo, unpublish } from './repo.svelte';

  onMount(() => void loadCatalog());

  let query = $state('');
  let system = $state('');
  let lang = $state('');
  let show = $state<'all' | 'installed' | 'mine'>('all');
  let opened = $state<string | null>(null);

  const app = $derived(store.state);
  const enabled = $derived((app.vault.systemsOff, enabledSystems()));
  const current = $derived(app.adventures.current);
  const me = $derived(repo.info?.author ?? null);

  const entries = $derived(
    (repo.catalog?.entries ?? [])
      // Adventures of systems turned off are nowhere to be seen (but the GM's own are).
      .filter((e) => e.author === me || enabled.some((s) => s.id === e.system) || !systems.some((s) => s.id === e.system))
      .filter((e) => !system || e.system === system)
      .filter((e) => !lang || e.lang === lang)
      .filter((e) => show !== 'mine' || e.author === me)
      .filter((e) => show !== 'installed' || installedFolder(e) !== null)
      .filter((e) => matchesQuery(e, query))
      .sort((a, b) => b.updated - a.updated),
  );

  const key = (e: RepoEntry) => `${e.author}/${e.id}`;
  const systemTitle = (id: string) => systems.find((s) => s.id === id)?.title ?? id;
  const date = (ms: number) => new Date(ms).toLocaleDateString(getLang(), { day: 'numeric', month: 'short', year: 'numeric' });
  const installedVersion = (e: RepoEntry) => {
    const f = installedFolder(e);
    return f ? (app.repo.installed[f]?.version ?? 0) : 0;
  };
</script>

<div class="view">
  <header class="head">
    <h2>{t('repo.title')}</h2>
    <div class="spacer"></div>
    {#if current}
      <button class="btn" onclick={() => (repo.publish = current)} disabled={!!repo.busy}>
        <CloudUpload size={14} />
        {app.repo.published[current] ? t('repo.updateMine', { name: current }) : t('repo.publishThis', { name: current })}
      </button>
    {/if}
    <button class="icon-btn" title={t('repo.refresh')} onclick={() => loadCatalog()} disabled={repo.loading}><RefreshCw size={14} /></button>
    <button class="icon-btn" title={t('repo.settings')} onclick={() => openSettings('repo')}><Settings size={14} /></button>
  </header>
  <p class="faint intro">{t('repo.about')}</p>

  {#if repo.error}
    <div class="problem">
      <p>{repo.error}</p>
      <button class="btn" onclick={() => openSettings('repo')}>{t('repo.openSettings')}</button>
      <button class="btn" onclick={() => loadCatalog()}>{t('repo.retry')}</button>
    </div>
  {:else if repo.catalog}
    <div class="filters">
      <input type="text" placeholder={t('repo.search')} bind:value={query} />
      <select bind:value={system}>
        <option value="">{t('repo.allSystems')}</option>
        {#each enabled as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
      </select>
      <select bind:value={lang}>
        <option value="">{t('repo.allLangs')}</option>
        {#each Object.entries(LANGS) as [id, title] (id)}<option value={id}>{title}</option>{/each}
      </select>
      <div class="seg">
        <button class:on={show === 'all'} onclick={() => (show = 'all')}>{t('repo.showAll')}</button>
        <button class:on={show === 'installed'} onclick={() => (show = 'installed')}>{t('repo.showInstalled')}</button>
        <button class:on={show === 'mine'} onclick={() => (show = 'mine')}>{t('repo.showMine')}</button>
      </div>
    </div>

    {#if !entries.length}
      <p class="faint empty">{repo.catalog.entries.length ? t('repo.nothingFound') : t('repo.emptyCatalog')}</p>
    {/if}

    <div class="list">
      {#each entries as e (key(e))}
        {@const cover = e.cover ? coverOf(e) : null}
        {@const have = installedVersion(e)}
        <article class="entry">
          <div class="cover">
            {#if cover}<img src={cover} alt="" />{:else}<ImageOff size={22} />{/if}
          </div>
          <div class="body">
            <h3>{e.title}</h3>
            <div class="meta faint">
              <span>{systemTitle(e.system)}</span>
              <span>{LANGS[e.lang as keyof typeof LANGS] ?? e.lang}</span>
              <span>{t('repo.version', { n: e.version })}</span>
              <span>{mb(e.size)}{e.music ? ` · ${t('repo.withMusic')}` : ''}</span>
              <span>{date(e.updated)}</span>
              <span>{t('repo.downloads', { count: e.downloads })}</span>
            </div>
            <div class="author faint" title={e.author}>
              {t('repo.by', { name: e.authorName || t('repo.anonymous') })} <code>{shortKey(e.author)}</code>
              {#if e.author === me}<span class="mine">{t('repo.you')}</span>{/if}
            </div>
            {#if e.description}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
              <p class="desc" class:open={opened === key(e)} onclick={() => (opened = opened === key(e) ? null : key(e))}>{e.description}</p>
            {/if}
          </div>
          <div class="actions">
            {#if have && have >= e.version}
              <span class="faint have">{t('repo.haveIt')}</span>
              <button class="btn" disabled={!!repo.busy} onclick={() => install(e)}><Download size={14} /> {t('repo.again')}</button>
            {:else if have}
              <button class="btn primary" disabled={!!repo.busy} onclick={() => install(e)}><Download size={14} /> {t('repo.update', { n: e.version })}</button>
            {:else}
              <button class="btn primary" disabled={!!repo.busy} onclick={() => install(e)}><Download size={14} /> {t('repo.download')}</button>
            {/if}
            {#if e.author === me}
              <button class="btn danger" disabled={!!repo.busy} onclick={() => unpublish(e)}><Trash2 size={14} /> {t('repo.unpublish')}</button>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {:else if repo.loading}
    <p class="faint">{t('repo.loading')}</p>
  {/if}
</div>

<style>
  .view {
    max-width: 900px;
    padding: 16px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .intro {
    margin: 8px 0 14px;
  }
  .problem {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .problem p {
    flex: 1 1 100%;
    margin: 0;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
  }
  .filters input {
    flex: 1;
    min-width: 180px;
  }
  .seg {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    padding: 3px 10px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
  }
  .seg button.on {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .empty {
    margin: 24px 0;
    text-align: center;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .entry {
    display: flex;
    gap: 14px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .cover {
    display: grid;
    flex: none;
    place-items: center;
    width: 120px;
    height: 90px;
    overflow: hidden;
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    color: var(--text-faint);
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  h3 {
    margin: 0 0 4px;
    font-size: 15px;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
  }
  .author {
    margin-top: 2px;
    font-size: 12px;
  }
  code {
    font-size: 11px;
  }
  .mine {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: var(--radius-s);
    background: var(--accent);
    color: var(--on-accent);
  }
  .desc {
    display: -webkit-box;
    margin: 8px 0 0;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    white-space: pre-line;
    cursor: pointer;
  }
  .desc.open {
    display: block;
  }
  .actions {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .have {
    font-size: 12px;
    text-align: center;
  }
</style>
