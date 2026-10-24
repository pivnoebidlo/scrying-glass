<!-- «Find adventures» — the catalog window, as Obsidian's community plugins: the entries of every source turned on on
     the left (search, source, system, language, downloaded / mine), the chosen one on the right — cover,
     description, download or update; the GM's own — take down. Opens on repo.browsing (openRepo). -->
<script lang="ts">
  import { CloudUpload, Download, ImageOff, RefreshCw, Settings, Trash2, TriangleAlert, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { store } from '../../../renderer/lib/store.svelte';
  import { openSettings } from '../../../renderer/lib/nav';
  import { enabledSystems, systems } from '../../../systems';
  import { LANGS } from '../../../shared/i18n/core';
  import { matchesQuery, shortKey } from '../../../shared/repo';
  import { allFound, coverOf, install, installedFolder, loadCatalogs, mb, repo, sourceName, sourcesOn, unpublish, type Found } from './repo.svelte';

  let query = $state('');
  let source = $state('');
  let system = $state('');
  let lang = $state('');
  let show = $state<'all' | 'installed' | 'mine'>('all');
  let chosen = $state<string | null>(null);

  const app = $derived(store.state);
  const enabled = $derived((app.vault.systemsOff, enabledSystems()));
  const current = $derived(app.adventures.current);
  const me = $derived(repo.info?.author ?? null);
  const on = $derived(repo.info ? sourcesOn() : []);
  const loading = $derived(on.some((s) => repo.catalogs[s.id]?.loading));
  const failed = $derived(on.filter((s) => repo.catalogs[s.id]?.error));

  const found = $derived(repo.info ? allFound() : []);
  const entries = $derived(
    found
      // Adventures of systems turned off are nowhere to be seen (but the GM's own are).
      .filter((e) => e.author === me || enabled.some((s) => s.id === e.system) || !systems.some((s) => s.id === e.system))
      .filter((e) => !source || e.source === source)
      .filter((e) => !system || e.system === system)
      .filter((e) => !lang || e.lang === lang)
      .filter((e) => show !== 'mine' || e.author === me)
      .filter((e) => show !== 'installed' || installedFolder(e) !== null)
      .filter((e) => matchesQuery(e, query))
      .sort((a, b) => b.updated - a.updated),
  );

  const key = (e: Found) => `${e.source}/${e.author}/${e.id}`;
  const picked = $derived(entries.find((e) => key(e) === chosen) ?? entries[0]);
  const systemTitle = (id: string) => systems.find((s) => s.id === id)?.title ?? id;
  const langTitle = (id: string) => LANGS[id as keyof typeof LANGS] ?? id;
  const sourceTitle = (id: string) => {
    const s = repo.info?.sources.find((x) => x.id === id);
    return s ? sourceName(s) : id;
  };
  const date = (ms: number) => new Date(ms).toLocaleDateString(getLang(), { day: 'numeric', month: 'short', year: 'numeric' });
  const installedVersion = (e: Found) => {
    const f = installedFolder(e);
    return f ? (app.repo.installed[f]?.version ?? 0) : 0;
  };

  const close = () => (repo.browsing = false);
  const settings = () => (close(), openSettings('repo'));
  // Esc closes the window, unless a dialog above it is open.
  const onkey = (e: KeyboardEvent) => e.key === 'Escape' && !repo.publish && !repo.naming && close();
</script>

<svelte:window onkeydown={onkey} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
  <div class="window" role="dialog" aria-modal="true" aria-label={t('repo.browse')}>
    <header>
      <h2>{t('repo.browse')}</h2>
      <div class="spacer"></div>
      {#if current}
        <button class="btn" onclick={() => (repo.publish = current)} disabled={!!repo.busy || !on.length}>
          <CloudUpload size={14} />
          {app.repo.published[current] ? t('repo.updateMine', { name: current }) : t('repo.publishThis', { name: current })}
        </button>
      {/if}
      <button class="icon-btn" title={t('repo.refresh')} onclick={() => loadCatalogs()} disabled={loading}><RefreshCw size={15} /></button>
      <button class="icon-btn" title={t('repo.settings')} onclick={settings}><Settings size={15} /></button>
      <button class="icon-btn" title={t('repo.close')} onclick={close}><X size={16} /></button>
    </header>

    <div class="filters">
      <!-- svelte-ignore a11y_autofocus -->
      <input type="text" placeholder={t('repo.search')} bind:value={query} autofocus />
      {#if on.length > 1}
        <select bind:value={source}>
          <option value="">{t('repo.allSources')}</option>
          {#each on as s (s.id)}<option value={s.id}>{sourceName(s)}</option>{/each}
        </select>
      {/if}
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

    {#each failed as s (s.id)}
      <div class="problem">
        <TriangleAlert size={14} />
        <span><b>{sourceName(s)}:</b> {repo.catalogs[s.id]?.error}</span>
        <button class="btn small" onclick={() => loadCatalogs(s.id)}>{t('repo.retry')}</button>
      </div>
    {/each}

    {#if !on.length}
      <div class="empty">
        <p class="faint">{t('repo.noSources')}</p>
        <button class="btn" onclick={settings}>{t('repo.openSettings')}</button>
      </div>
    {:else if !entries.length}
      <div class="empty">
        <p class="faint">{loading ? t('repo.loading') : found.length ? t('repo.nothingFound') : failed.length < on.length ? t('repo.emptyCatalog') : ''}</p>
      </div>
    {:else}
      <div class="body">
        <div class="list">
          {#each entries as e (key(e))}
            {@const cover = e.cover ? coverOf(e) : null}
            {@const have = installedVersion(e)}
            <button class="item" class:on={picked && key(picked) === key(e)} onclick={() => (chosen = key(e))}>
              <span class="thumb">{#if cover}<img src={cover} alt="" />{:else}<ImageOff size={16} />{/if}</span>
              <span class="text">
                <span class="title">{e.title}</span>
                <span class="meta faint">{systemTitle(e.system)} · {langTitle(e.lang)} · {mb(e.size)}</span>
              </span>
              {#if have && have < e.version}<span class="badge new">{t('repo.newVersion')}</span>
              {:else if have}<span class="badge">{t('repo.haveIt')}</span>
              {:else if e.author === me}<span class="badge">{t('repo.you')}</span>{/if}
            </button>
          {/each}
        </div>

        {#if picked}
          {@const e = picked}
          {@const cover = e.cover ? coverOf(e) : null}
          {@const have = installedVersion(e)}
          <section class="details">
            {#if cover}<img class="cover" src={cover} alt="" />{/if}
            <h3>{e.title}</h3>
            <div class="author faint" title={e.author}>
              {t('repo.by', { name: e.authorName || t('repo.anonymous') })} <code>{shortKey(e.author)}</code>
              {#if e.author === me}<span class="mine">{t('repo.you')}</span>{/if}
            </div>
            <div class="meta faint">
              <span>{systemTitle(e.system)}</span>
              <span>{langTitle(e.lang)}</span>
              <span>{t('repo.version', { n: e.version })}</span>
              <span>{mb(e.size)}{e.music ? ` · ${t('repo.withMusic')}` : ''}</span>
              <span>{date(e.updated)}</span>
              <span>{t('repo.downloads', { count: e.downloads })}</span>
              {#if on.length > 1}<span>{sourceTitle(e.source)}</span>{/if}
            </div>
            <div class="actions">
              {#if have && have >= e.version}
                <span class="faint">{t('repo.haveIt')}</span>
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
            {#if e.description}<p class="desc">{e.description}</p>{/if}
          </section>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 105;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .window {
    display: flex;
    flex-direction: column;
    width: min(1100px, 94vw);
    height: min(780px, 90vh);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 14px 8px 18px;
  }
  h2 {
    margin: 0;
    font-size: 17px;
  }
  .spacer {
    flex: 1;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 0 18px 12px;
    border-bottom: 1px solid var(--border);
  }
  .filters input {
    flex: 1;
    min-width: 200px;
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
  .problem {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 18px;
    border-bottom: 1px solid var(--border);
    color: var(--warning);
    font-size: 13px;
  }
  .problem span {
    flex: 1;
  }
  .btn.small {
    padding: 2px 8px;
    font-size: 12px;
  }
  .empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .empty p {
    margin: 0;
  }
  .body {
    display: grid;
    flex: 1;
    grid-template-columns: minmax(260px, 340px) 1fr;
    min-height: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--bg-active);
  }
  .thumb {
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 42px;
    overflow: hidden;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-faint);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .title,
  .text .meta {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title {
    font-weight: 600;
  }
  .text .meta {
    font-size: 12px;
  }
  .badge {
    flex: none;
    padding: 0 6px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 11px;
  }
  .badge.new {
    background: var(--accent);
    color: var(--on-accent);
  }
  .details {
    padding: 18px 22px;
    overflow-y: auto;
  }
  .cover {
    display: block;
    max-width: 100%;
    max-height: 280px;
    margin-bottom: 14px;
    border-radius: var(--radius-m);
    object-fit: contain;
  }
  h3 {
    margin: 0 0 4px;
    font-size: 20px;
  }
  .author {
    font-size: 13px;
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
  .details .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 6px;
    font-size: 12px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 14px 0;
  }
  .desc {
    margin: 0;
    white-space: pre-line;
    line-height: 1.5;
  }
</style>
